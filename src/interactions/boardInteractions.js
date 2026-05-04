import * as state from "../state/boardState.js";
import { byId, delegate } from "../utils/dom.js";
import { renderBoard } from "../ui/board.js";
import * as cardEditor from "../ui/cardEditor.js";

// -----------------------------
// COLUMN INTERACTIONS
// -----------------------------
export function setupColumnInteractions() {
  const boardEl = byId("board");

  delegate(boardEl, ".delete-column", "click", async (e, btn) => {
    const colHeader = btn.closest(".flex").querySelector("[data-col-id]");
    const colId = colHeader?.getAttribute("data-col-id");
    if (!colId) return;

    const confirmDelete = confirm("Delete this column?");
    if (!confirmDelete) return;

    await state.deleteColumn(colId);
    renderBoard();
  });

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

  delegate(boardEl, ".delete-card", "click", async (e, btn) => {
    e.stopPropagation();
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

  delegate(boardEl, ".card", "dblclick", async (e, cardEl) => {
    const cardId = cardEl.id;
    const colEl = cardEl.closest(".drop-zone");
    const colId = colEl?.getAttribute("data-col-id");
    if (!colId || !cardId) return;

    const card = state.getCard(colId, cardId);
    if (!card) return;

    cardEditor.openExistingCardEditor(colId, card);
  });

  delegate(boardEl, ".card", "dragover", (e, cardEl) => {
    if (!e.dataTransfer.types.includes("Files")) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  });

  delegate(boardEl, ".card", "drop", async (e, cardEl) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files || []);
    if (!files.length) return;

    const file = files[0];
    if (!file?.path) return;

    const colEl = cardEl.closest(".drop-zone");
    const colId = colEl?.getAttribute("data-col-id");
    if (!colId) return;

    await state.attachFileToCard(colId, cardEl.id, {
      path: file.path,
      name: file.name || file.path.split(/[/\\]/).pop() || "attached-file"
    });

    renderBoard();
  });
}

// -----------------------------
// BOARD HEADER INTERACTIONS
// -----------------------------
export function setupBoardControls() {
  const boardNameEl = byId("board-name");

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
