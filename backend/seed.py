# wget https://huggingface.co/api/datasets/Anthropic/hh-rlhf/parquet/default/train/0.parquet
# save as 0.parquet

import pandas as pd
import numpy as np

import requests

url = 'https://huggingface.co/api/datasets/Anthropic/hh-rlhf/parquet/default/train/0.parquet'
r = requests.get(url, allow_redirects=True)
open('0.parquet', 'wb').write(r.content)


df = pd.read_parquet('0.parquet')
df = df[['chosen']]


df['item_id'] = np.arange(len(df))
df['text'] = df['chosen'].str.split('Assistant:', expand=True)[0].str.strip()
df['processed_value'] = 'Not Processed'
df['is_processed'] = False

# drop chosen column
df = df.drop(columns=['chosen'])
df = df.head(100)
df.to_csv('data.csv', index=False)

print(df.head(1))