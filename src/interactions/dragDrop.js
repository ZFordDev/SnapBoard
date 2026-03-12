// src/interactions/dragDrop.js
import * as state from "../state/boardState.js";
import { byId, delegate } from "../utils/dom.js";
import { renderBoard } from "../ui/board.js";

let draggedCardId = null;
let fromColumnId = null;

// -----------------------------
// INIT
// -----------------------------
export function initDragAndDrop() {
  const boardEl = byId("board");

  // Start dragging
  delegate(boardEl, ".card", "dragstart", (e, cardEl) => {
    draggedCardId = cardEl.id;

    const colEl = cardEl.closest(".drop-zone");
    fromColumnId = colEl?.getAttribute("data-col-id");

    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", draggedCardId);

    // Add dragging class for visual feedback
    cardEl.classList.add("opacity-50");
  });

  // End dragging
  delegate(boardEl, ".card", "dragend", (e, cardEl) => {
    cardEl.classList.remove("opacity-50");
    draggedCardId = null;
    fromColumnId = null;
  });

  // Allow drop
  delegate(boardEl, ".drop-zone", "dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  });

  // Handle drop
  delegate(boardEl, ".drop-zone", "drop", async (e, dropZone) => {
    e.preventDefault();

    const toColumnId = dropZone.getAttribute("data-col-id");
    if (!draggedCardId || !fromColumnId || !toColumnId) return;

    // Determine new index based on drop position
    const cards = [...dropZone.querySelectorAll(".card")];
    let newIndex = cards.length;

    for (let i = 0; i < cards.length; i++) {
      const rect = cards[i].getBoundingClientRect();
      if (e.clientY < rect.top + rect.height / 2) {
        newIndex = i;
        break;
      }
    }

    await state.moveCard(draggedCardId, fromColumnId, toColumnId, newIndex);
    renderBoard();
  });
}