// src/ui/updaterUI.js
import { byId } from "../utils/dom.js";

// -----------------------------
// INIT
// -----------------------------
export function initUpdaterUI() {
  const updateBtn = byId("update-btn");
  const versionEl = byId("version-info");

  if (!updateBtn) return;

  // Load version info
  loadVersionInfo(versionEl);

  // Check for updates on launch
  checkForUpdatesOnLaunch(updateBtn);

  // Manual update check
  updateBtn.addEventListener("click", async () => {
    updateBtn.disabled = true;
    updateBtn.textContent = "Checking...";

    const result = await window.electronAPI.checkForUpdates();

    if (!result || !result.updateAvailable) {
      updateBtn.textContent = "No Updates";
      setTimeout(() => {
        updateBtn.textContent = "Update";
        updateBtn.disabled = false;
      }, 1500);
      return;
    }

    updateBtn.textContent = "Downloading...";
    await window.electronAPI.downloadUpdate();
  });

  // -----------------------------
  // EVENT LISTENERS
  // -----------------------------
  window.electronAPI.onUpdateProgress((progress) => {
    updateBtn.textContent = `Downloading ${Math.floor(progress.percent)}%`;
  });

  window.electronAPI.onUpdateReady(() => {
    updateBtn.textContent = "Restart to Update";
    updateBtn.disabled = false;
    updateBtn.onclick = () => window.electronAPI.installUpdate();
  });

  window.electronAPI.onUpdateError((err) => {
    updateBtn.textContent = "Update Failed";
    console.error("Update error:", err);
  });
}

// -----------------------------
// CHECK ON LAUNCH
// -----------------------------
async function checkForUpdatesOnLaunch(updateBtn) {
  const result = await window.electronAPI.checkForUpdates();
  if (result?.updateAvailable) {
    updateBtn.classList.add("update-available");
    updateBtn.textContent = "Update Available";
  }
}

// -----------------------------
// VERSION INFO
// -----------------------------
async function loadVersionInfo(versionEl) {
  if (!versionEl) return;

  const info = await window.electronAPI.getVersion();
  if (!info) return;

  versionEl.textContent = `v${info.version} • ${info.stage} • ${info.date}`;
}