const { autoUpdater } = require('electron');
const { app, ipcMain } = require('electron');

function initUpdater(mainWindow) {
  const feedURL = `https://github.com/ZFordDev/SnapBoard/releases/latest/download/`;

  autoUpdater.setFeedURL({ url: feedURL });

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

  autoUpdater.on('update-downloaded', () => {
    if (mainWindow) {
      mainWindow.webContents.send('update-ready');
    }
  });

  ipcMain.on('install-update', () => {
    autoUpdater.quitAndInstall();
  });
}

module.exports = { initUpdater };
