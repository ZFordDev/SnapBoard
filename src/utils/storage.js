// src/utils/storage.js

export async function loadJSON(key) {
  return await window.electronAPI.loadJSON(key);
}

export async function saveJSON(key, data) {
  return await window.electronAPI.saveJSON(key, data);
}