// src/ui/sidebar.js
import { byId } from "../utils/dom.js";

let sidebarEl;
let triggerZoneEl;
let menuBtnEl;
let closeBtnEl;

// -----------------------------
// INIT
// -----------------------------
export function initSidebar() {
  sidebarEl = byId("snap-sidebar");
  triggerZoneEl = byId("trigger-zone");
  menuBtnEl = byId("menu-btn");
  closeBtnEl = byId("close-btn");

  if (!sidebarEl) return;

  // Hover open
  if (triggerZoneEl) {
    triggerZoneEl.addEventListener("mouseenter", () => {
      sidebarEl.classList.add("sidebar-open");
    });
  }

  // Menu button open
  if (menuBtnEl) {
    menuBtnEl.addEventListener("click", () => {
      sidebarEl.classList.add("sidebar-open");
    });
  }

  // Close button
  if (closeBtnEl) {
    closeBtnEl.addEventListener("click", () => {
      sidebarEl.classList.remove("sidebar-open");
    });
  }

  // Click outside to close
  document.addEventListener("click", (e) => {
    if (!sidebarEl.classList.contains("sidebar-open")) return;

    const clickedInside =
      sidebarEl.contains(e.target) || menuBtnEl.contains(e.target);

    if (!clickedInside) {
      sidebarEl.classList.remove("sidebar-open");
    }
  });
}
