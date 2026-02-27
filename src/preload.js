const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  send: (channel, data) => ipcRenderer.send(channel, data),
  on: (channel, callback) => ipcRenderer.on(channel, (_, data) => callback(data)),
  installUpdate: () => ipcRenderer.send('install-update'),
  downloadUpdate: () => ipcRenderer.send('download-update'),

    // Version info
  getVersion: () =>
    ipcRenderer.invoke("get-version"),
});
