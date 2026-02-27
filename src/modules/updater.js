const { autoUpdater } = require('electron');
const { app, ipcMain } = require('electron');

function initUpdater(mainWindow) {
  const feedURL = `https://github.com/ZFordDev/SnapBoard/releases/latest/download/`;

  autoUpdater.setFeedURL({ url: feedURL });
  // avoid automatic download; we'll trigger it from the renderer
  autoUpdater.autoDownload = false;

  // Check for updates on startup (cross-platform safe)
  setTimeout(() => {
    try {
      autoUpdater.checkForUpdates();
    } catch (_) {
      // Linux: checkForUpdates() is not a Promise
    }
  }, 1500);

  autoUpdater.on('update-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-available');
    }
  });

  autoUpdater.on('update-not-available', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available');
    }
  });

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-ready');
    }
  });

  autoUpdater.on('error', (err) => {
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err == null ? '' : err.message || err.toString());
    }
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });

  ipcMain.on('download-update', () => {
    autoUpdater.downloadUpdate();
  });
}

module.exports = { initUpdater };
