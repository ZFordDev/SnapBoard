// main.js — SnapBoard MVP
const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");
const pkg = require("./package.json");

// Updater (SnapDock-style)
const setupUpdater = require("./src/utils/updater");
// Disable sandbox only for AppImage builds
if (process.env.APPIMAGE) {
  app.commandLine.appendSwitch("no-sandbox");
}

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "src", "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Remove menus (SnapDock style)
  //mainWindow.setMenu(null);
  //mainWindow.setMenuBarVisibility(false);
  //mainWindow.setAutoHideMenuBar(true);
//
  //// Block DevTools shortcuts
  //mainWindow.webContents.on("before-input-event", (event, input) => {
  //  if (
  //    (input.key === "I" && input.control && input.shift) ||
  //    input.key === "F12"
  //  ) {
  //    event.preventDefault();
  //  }
  //});

  // Load UI
  mainWindow.loadFile("index.html");

  // Initialize updater AFTER window exists
  setupUpdater(mainWindow);
}

app.whenReady().then(createWindow);

// macOS behaviour
app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Quit on all windows closed (except macOS)
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
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

// -----------------------------
// STORAGE (JSON FILES)
// -----------------------------
ipcMain.handle("storage:load", async (_, key) => {
  try {
    const dir = path.join(app.getPath("userData"), "snapboard");
    const filePath = path.join(dir, `${key}.json`);

    if (!fs.existsSync(filePath)) return null;

    const raw = fs.readFileSync(filePath, "utf8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Storage load error:", err);
    return null;
  }
});

ipcMain.handle("storage:save", async (_, key, data) => {
  try {
    const dir = path.join(app.getPath("userData"), "snapboard");
    const filePath = path.join(dir, `${key}.json`);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (err) {
    console.error("Storage save error:", err);
    return false;
  }
});