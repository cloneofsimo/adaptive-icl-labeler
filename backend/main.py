from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import pandas as pd
from typing import List
from typing import Optional
import lmql
from fastapi.middleware.cors import CORSMiddleware
import os


MODEL_ID = "meta-llama/Llama-2-13b-chat-hf"

if os.environ.get("MODEL_ID") is not None:
    MODEL_ID = os.environ.get("MODEL_ID")

ENDPOINT = "localhost:8010"
if os.environ.get("ENDPOINT") is not None:
    ENDPOINT = os.environ.get("ENDPOINT")


app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)


# Define your data model
class Item(BaseModel):
    item_id: int
    text: str
    processed_value: Optional[str] = None
    is_processed: bool = False
    detailed_answer: Optional[str] = None

    
class ItemProcessingQuery(BaseModel):
    item_id: int
    history: Optional[List[str]] = None
    regex_rules: Optional[str] = None
    task_description: Optional[str] = None

try:
    df = pd.read_csv('data.csv')
except FileNotFoundError:
    print("No existing data")
    
def save_to_csv():
    df.to_csv('data.csv', index=False)

@app.get("/api/get_query")
async def get_query():
    
    unprocessed_item = df[df['is_processed'] == False].head(1)
    
    if unprocessed_item.empty:
        return {"detail": "No unprocessed items found"}
        
    rec = unprocessed_item.to_dict(orient='records')[0]
    
    return rec


@app.post("/api/do_process_on_query") # item_id : int as json
async def do_process_on_query(ipq: ItemProcessingQuery):
    item_id = ipq.item_id
    regexRule = ipq.regex_rules
    history = ipq.history
    task_description = ipq.task_description

    item = df.loc[df['item_id'] == item_id]
    query = str(item['text'].values[0])
    print(f"QUERY IN DO_PROCESS_ON_QUERY: {query}")

    if regexRule is None or len(regexRule) < 1:
        regexRule = "\"[ANSWER]\""
    
    history_str = ""
    if history is None:
        history_str = ""
    else:
        for h in history:
       
            h = "\nExample :\n" + h
            history_str += f'''\"\"\"{h}\"\"\"\n'''    
    
    icl_query = f'''
\"\"\"{task_description}\"\"\"
{history_str}
\"\"\"{query}\"\"\"
'''
    regex_rules = f'''
{regexRule}
'''
    final_q = icl_query + regex_rules
    print(f"FINAL QUERY: {final_q}")
    
    retrs = await lmql.run(final_q, model = lmql.model(MODEL_ID, endpoint = ENDPOINT))
    
    prompt = retrs.prompt
    response = prompt.split(query)[1]

    return {"detailed_answer": retrs.prompt, "processed_value": response}

@app.post("/api/save_current_setting")
async def save_current_setting(item: Item):
    # Update the DataFrame
    df.loc[df['item_id'] == item.item_id, ['processed_value', 'is_processed']] = item.processed_value, True
    print(df.loc[df['item_id'] == item.item_id])
    save_to_csv()  # Save changes
    return {"detail": "Item saved successfully"}

# Run the API with Uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
