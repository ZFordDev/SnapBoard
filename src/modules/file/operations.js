// generic file operations: read/write JSON payloads representing board

const STORAGE_KEY = 'snapboard-data';

export async function loadBoard() {
  try {
    const json = localStorage.getItem(STORAGE_KEY);
    return json ? JSON.parse(json) : null;
  } catch (err) {
    console.error('loadBoard failed', err);
    return null;
  }
}

export async function saveBoard(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('saveBoard failed', err);
  }
}
