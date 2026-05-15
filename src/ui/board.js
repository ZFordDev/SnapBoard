// src/ui/board.js
import * as state from "../state/boardState.js";
import { byId, el, clear, delegate } from "../utils/dom.js";
import * as cardEditor from "./cardEditor.js";
import { setupColumnInteractions, setupCardInteractions } from "../interactions/boardInteractions.js";
import { initDragAndDrop } from "../interactions/dragDrop.js";
import { marked } from "marked";

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
    class: "column-width flex flex-col h-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-sm"
  });

  colEl.innerHTML = `
    <div class="flex items-center justify-between mb-4 px-1">
      <div class="flex items-center gap-2">
        <h3 class="column-header font-semibold text-slate-800 text-sm" data-col-id="${col.id}">
          ${col.title}
        </h3>
        <button class="delete-column text-red-500 hover:text-red-700" title="Delete column">🗑️</button>
      </div>
      <span class="text-[10px] font-bold bg-black/5 px-2 py-0.5 rounded text-slate-500">
        ${col.cards.length}
      </span>
    </div>
  `;

  const dropZone = el("div", {
    class: "flex-1 space-y-3 drop-zone rounded-2xl p-1 transition-colors border border-transparent",
    attrs: { "data-col-id": col.id }
  });

  col.cards.forEach((card) => {
    dropZone.appendChild(renderCard(card, col.id));
  });

  const addBtn = el("button", {
    class: "w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-white/50 transition-all text-sm mt-2 font-medium",
    attrs: { "data-add-card": col.id },
    text: "+ Add Card"
  });

  colEl.appendChild(dropZone);
  colEl.appendChild(addBtn);

  return colEl;
}

// -----------------------------
// RENDER CARD
// -----------------------------
function renderCard(card, colId) {
  const cardEl = el("div", {
    class: "card glass p-4 rounded-xl cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-300/40 hover:-translate-y-0.5 hover:shadow-md transition-all group",
    attrs: { draggable: "true", id: card.id, "data-col-id": colId }
  });

  const badgeLabel = card.file ? "File" : "Note";
  const badgeClass = card.file ? "text-emerald-600" : "text-blue-600";

  cardEl.innerHTML = `
    <div class="flex items-start justify-between mb-3">
      <span class="text-[10px] uppercase tracking-wider ${badgeClass} font-bold">${badgeLabel}</span>
      <button class="delete-card opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all" title="Delete card">🗑️</button>
    </div>
    <div class="mb-3">
      <h4 class="text-sm font-semibold text-slate-900 mb-2">${card.title}</h4>
      <div class="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none">
        ${marked.parse(card.body || "")}
      </div>
    </div>
    ${card.file ? `<div class="mt-3 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">Attached file: ${card.file.name}</div>` : ""}
  `;

  return cardEl;
}
