import { initBoard, setVersionTag } from './modules/ui/board.js';

// main entrypoint - no logic here, just initialization calls
window.addEventListener('DOMContentLoaded', () => {
  initBoard();
  setVersionTag(document.getElementById('versionTag'));
});
