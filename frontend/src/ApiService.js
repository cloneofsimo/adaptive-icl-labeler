const API_BASE_URL = 'http://localhost:8000/api'; // Adjust according to your backend URL

export const getLatestItem = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/get_query`);
    return await response.json();
  } catch (error) {
    console.error('Error fetching latest item:', error);
  }
};

export const pseudoLabelItem = async (itemId, historyData, regexRules, taskDescription) => {
  try {
    console.log('Processing item:', itemId, historyData, regexRules, taskDescription);
    const response = await fetch(`${API_BASE_URL}/do_process_on_query`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ item_id: itemId, history: historyData, regex_rules: regexRules, task_description: taskDescription }),
    });
    return await response.json();
  } catch (error) {
    console.error('Error processing item:', error);
    // make warning popup
    return { processed_value: '', detailed_answer: 'Error processing item' };
  }
};

export const saveItem = async (item) => {
  try {
    const response = await fetch(`${API_BASE_URL}/save_current_setting`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    return await response.json();
  } catch (error) {
    console.error('Error saving item:', error);
  }
};
