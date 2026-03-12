console.log("SnapBoard preload loaded!");

const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // -----------------------------
  // Generic IPC
  // -----------------------------
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) =>
    ipcRenderer.on(channel, (_, data) => callback(data)),

  // -----------------------------
  // Storage
  // -----------------------------
  loadJSON: (key) => ipcRenderer.invoke("storage:load", key),
  saveJSON: (key, data) => ipcRenderer.invoke("storage:save", key, data),

  // -----------------------------
  // Version
  // -----------------------------
  getVersion: () => ipcRenderer.invoke("get-version"),

  // -----------------------------
  // Updater
  // -----------------------------
  checkForUpdates: () => ipcRenderer.invoke("update:check"),
  downloadUpdate: () => ipcRenderer.invoke("update:download"),
  installUpdate: () => ipcRenderer.invoke("update:install"),

  onUpdateAvailable: (cb) =>
    ipcRenderer.on("update:available", (_, info) => cb(info)),
  onUpdateNone: (cb) =>
    ipcRenderer.on("update:none", () => cb()),
  onUpdateProgress: (cb) =>
    ipcRenderer.on("update:progress", (_, p) => cb(p)),
  onUpdateReady: (cb) =>
    ipcRenderer.on("update:ready", (_, info) => cb(info)),
  onUpdateError: (cb) =>
    ipcRenderer.on("update:error", (_, err) => cb(err)),
});