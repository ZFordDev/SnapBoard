// src/scripts.js

import { initState } from "./state/boardState.js";
import { initBoard } from "./ui/board.js";
import { initSidebar } from "./ui/sidebar.js";
import { initUpdaterUI } from "./ui/updaterUI.js";

document.addEventListener("DOMContentLoaded", async () => {
  await initState(); 
  initSidebar();
  initBoard();
  initUpdaterUI();
});