// src/ui/board.js
import * as state from "../state/boardState.js";
import { byId, el, clear, delegate } from "../utils/dom.js";
import { setupColumnInteractions, setupCardInteractions } from "../interactions/boardInteractions.js";
import { initDragAndDrop } from "../interactions/dragDrop.js";

let boardEl;
let boardNameEl;

// -----------------------------
// INIT
// -----------------------------
export async function initBoard() {
  boardEl = byId("board");
  boardNameEl = byId("board-name");

  await state.initState();
  renderBoard();

  // Wire interactions
  initDragAndDrop();
  setupColumnInteractions();
  setupCardInteractions();

  // Add column button
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

  // Add card buttons (delegated)
  delegate(boardEl, "[data-add-card]", "click", async (e, btn) => {
    const colId = btn.getAttribute("data-add-card");
    const text = prompt("Card text?"); // MVP prompt — replaced later with modal
    if (text) {
      await state.addCard(colId, { type: "note", text });
      renderBoard();
      initDragAndDrop();
      setupColumnInteractions();
      setupCardInteractions();
    }
  });
}

// -----------------------------
// RENDER BOARD
// -----------------------------
export function renderBoard() {
  const board = state.getCurrentBoard();
  if (!board) return;

  // Update header name
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
        <button class="delete-column text-red-500 hover:text-red-700" title="Delete column">×</button>
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
    dropZone.appendChild(renderCard(card));
  });

  // Add card button
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
function renderCard(card) {
  const cardEl = el("div", {
    class: "card glass p-4 rounded-xl cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-300/40 hover:-translate-y-0.5 hover:shadow-md transition-all group",
    attrs: { draggable: "true", id: card.id }
  });

  cardEl.innerHTML = `
    <div class="flex items-start justify-between mb-2">
      <span class="text-[10px] uppercase tracking-wider ${
        card.type === "file" ? "text-emerald-600" : "text-blue-600"
      } font-bold">${card.type}</span>
      <button class="delete-card opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all" title="Delete card">×</button>
    </div>
    <div class="text-sm text-slate-700 leading-relaxed prose prose-sm max-w-none">
      ${window.marked.parse(card.text)}
    </div>
  `;

  return cardEl;
}