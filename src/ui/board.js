// src/ui/board.js
import * as state from "../state/boardState.js";
import { byId, el, clear, delegate } from "../utils/dom.js";
import * as cardEditor from "./cardEditor.js";
import { setupColumnInteractions, setupCardInteractions } from "../interactions/boardInteractions.js";
import { initDragAndDrop } from "../interactions/dragDrop.js";
import { marked } from "marked";
import { sanitizeHTML, escapeHtml } from "../utils/sanitize.js";

let boardEl;
let boardNameEl;

// -----------------------------
// INIT
// -----------------------------
export function initBoard() {
  boardEl = byId("board");
  boardNameEl = byId("board-name");

  renderBoard();
  cardEditor.initCardEditor();
  cardEditor.setOnSave(renderBoard);

  initDragAndDrop();
  setupColumnInteractions();
  setupCardInteractions();

  const addColBtn = byId("add-column-btn");
  if (addColBtn) {
    addColBtn.addEventListener("click", async () => {
      await state.addColumn();
      renderBoard();
      initDragAndDrop();
      setupColumnInteractions();
      setupCardInteractions();
    });
  }

  delegate(boardEl, "[data-add-card]", "click", async (e, btn) => {
    const colId = btn.getAttribute("data-add-card");
    cardEditor.openNewCardEditor(colId);
  });
}

// -----------------------------
// RENDER BOARD
// -----------------------------
export function renderBoard() {
  const board = state.getCurrentBoard();
  if (!board || !boardEl) return;

  if (boardNameEl) boardNameEl.textContent = board.name;

  clear(boardEl);

  const columns = state.getData();
  columns.forEach((col) => {
    boardEl.appendChild(renderColumn(col));
  });
}

// -----------------------------
// RENDER COLUMN
// -----------------------------
function renderColumn(col) {
  const colEl = el("div", {
    class: "sb-column"
  });

  colEl.innerHTML = `
    <div class="sb-column-header">
      <div class="sb-column-header-left">
        <h3 class="column-header" data-col-id="${col.id}">
          ${escapeHtml(col.title)}
        </h3>
        <button type="button" class="delete-column sb-header-btn sb-btn-secondary" title="Delete column">X</button>
      </div>

      <span class="sb-column-count">
        ${col.cards.length}
      </span>
    </div>
  `;

  const body = el("div", {
    class: "sb-column-body",
    attrs: { "data-col-id": col.id }
  });

  col.cards.forEach((card) => {
    body.appendChild(renderCard(card, col.id));
  });

  const addBtn = el("button", {
    class: "sb-add-card-btn",
    attrs: { "data-add-card": col.id },
    text: "+ Add Card"
  });

  colEl.appendChild(body);
  colEl.appendChild(addBtn);

  return colEl;
}

// -----------------------------
// RENDER CARD
// -----------------------------
function renderCard(card, colId) {
  const cardEl = el("div", {
    class: "sb-card",
    attrs: { draggable: "true", id: card.id, "data-col-id": colId }
  });

  const badgeLabel = card.file ? "File" : "Note";
  const badgeClass = card.file ? "sb-card-badge file" : "sb-card-badge note";

  cardEl.innerHTML = `
    <div class="sb-card-meta">
      <span class="${badgeClass}">${badgeLabel}</span>
      <button type="button"class="delete-card sb-header-btn sb-btn-secondary"title="Delete card">X</button>
    </div>
    <div class="sb-card-content">
      <h4 class="sb-card-title">${escapeHtml(card.title)}</h4>
      <div class="sb-card-body">
        ${sanitizeHTML(marked.parse(card.body || ""))}
      </div>
    </div>

    ${
      card.file
        ? `<div class="sb-card-file">Attached file: ${escapeHtml(card.file.name)}</div>`
        : ""
    }
  `;

  return cardEl;
}
