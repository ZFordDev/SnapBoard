// src/interactions/boardInteractions.js
import * as state from "../state/boardState.js";
import { byId, delegate } from "../utils/dom.js";
import { renderBoard } from "../ui/board.js";

// -----------------------------
// COLUMN INTERACTIONS
// -----------------------------
export function setupColumnInteractions() {
  const boardEl = byId("board");

  // Delete column
  delegate(boardEl, ".delete-column", "click", async (e, btn) => {
    const colHeader = btn.closest(".flex").querySelector("[data-col-id]");
    const colId = colHeader?.getAttribute("data-col-id");
    if (!colId) return;

    const confirmDelete = confirm("Delete this column?");
    if (!confirmDelete) return;

    await state.deleteColumn(colId);
    renderBoard();
  });

  // Rename column
  delegate(boardEl, ".column-header", "dblclick", async (e, header) => {
    const colId = header.getAttribute("data-col-id");
    const newName = prompt("Rename column:", header.textContent.trim());
    if (!newName) return;

    await state.renameColumn(colId, newName);
    renderBoard();
  });
}

// -----------------------------
// CARD INTERACTIONS
// -----------------------------
export function setupCardInteractions() {
  const boardEl = byId("board");

  // Delete card
  delegate(boardEl, ".delete-card", "click", async (e, btn) => {
    const cardEl = btn.closest(".card");
    const cardId = cardEl?.id;
    if (!cardId) return;

    const colEl = btn.closest(".drop-zone");
    const colId = colEl?.getAttribute("data-col-id");
    if (!colId) return;

    const confirmDelete = confirm("Delete this card?");
    if (!confirmDelete) return;

    await state.deleteCard(colId, cardId);
    renderBoard();
  });

  // Edit card (MVP: simple prompt)
  delegate(boardEl, ".card", "dblclick", async (e, cardEl) => {
    const cardId = cardEl.id;
    const colEl = cardEl.closest(".drop-zone");
    const colId = colEl?.getAttribute("data-col-id");

    const board = state.getCurrentBoard();
    const col = board.columns.find(c => c.id === colId);
    const card = col.cards.find(c => c.id === cardId);

    const newText = prompt("Edit card text:", card.text);
    if (!newText) return;

    // Replace card text
    card.text = newText;
    await state.save(); // direct save call inside state module
    renderBoard();
  });
}

// -----------------------------
// BOARD HEADER INTERACTIONS
// -----------------------------
export function setupBoardControls() {
  const boardNameEl = byId("board-name");

  // Rename board
  if (boardNameEl) {
    boardNameEl.addEventListener("dblclick", async () => {
      const board = state.getCurrentBoard();
      const newName = prompt("Rename board:", board.name);
      if (!newName) return;

      await state.renameBoard(board.id, newName);
      renderBoard();
    });
  }
}