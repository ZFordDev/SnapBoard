const { app, BrowserWindow, ipcMain, nativeTheme } = require('electron');
const path = require('path');
const Store = require('electron-store').default;
const { initUpdater } = require('./modules/updater');
const pkg = require('../package.json');

const store = new Store({
  name: 'snapboard-data',
  defaults: {
    dockSide: 'left', // left, right, top, bottom (future)
    width: 420,
    height: 600
  }
});

let mainWindow;

function createWindow() {
  const dockSide = store.get('dockSide');
  const width = store.get('width');
  const height = store.get('height');

  mainWindow = new BrowserWindow({
    width,
    height,
    frame: true,
    transparent: true, // will turn true for production (Linux doesn't support transparent + click-through)
    hasShadow: true,
    resizable: true,
    show: false,
    backgroundColor: '#1e1e1e', // fallback for transparent
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      sandbox: false
    }
  });

  // Load UI
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Smooth show
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Initialize updater **AFTER** window exists
  initUpdater(mainWindow);

  // Position based on dockSide
  positionWindow(dockSide, width, height);

  // Save size on resize
  mainWindow.on('resize', () => {
    const [w, h] = mainWindow.getSize();
    store.set('width', w);
    store.set('height', h);
  });

  ipcMain.on('set-dock-side', (_, side) => {
    store.set('dockSide', side);
    positionWindow(side, width, height);
  });

  ipcMain.on('close-window', () => mainWindow.close());
  ipcMain.on('min-window', () => mainWindow.minimize());
}


function positionWindow(side, width, height) {
  const { screen } = require('electron');
  const display = screen.getPrimaryDisplay();
  const { width: sw, height: sh } = display.workAreaSize;

  switch (side) {
    case 'left':
      mainWindow.setPosition(0, Math.round((sh - height) / 2));
      break;

    case 'right':
      mainWindow.setPosition(sw - width, Math.round((sh - height) / 2));
      break;

    case 'top':
      mainWindow.setPosition(Math.round((sw - width) / 2), 0);
      break;

    case 'bottom':
      mainWindow.setPosition(Math.round((sw - width) / 2), sh - height);
      break;
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

// Quit on all windows closed (except macOS)
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// -----------------------------
// VERSION INFO
// -----------------------------

ipcMain.handle("get-version", async () => {
  return {
    version: pkg.version,
    stage: pkg.buildStage,
    date: pkg.releaseDate,
  };
});