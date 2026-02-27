// board.js
// encapsulates DOM logic for rendering and interacting with the kanban board

const sidebar = document.getElementById('snap-sidebar');
const triggerZone = document.getElementById('trigger-zone');
const menuBtn = document.getElementById('menu-btn');
const closeBtn = document.getElementById('close-btn');
const board = document.getElementById('board');
const versionTag = byId('versionTag');

import * as state from './boardState.js';
import { setupColumnInteractions, setupCardInteractions, showPrompt } from './boardInteractions.js';

// board data will be loaded via state module

export async function initBoard() {
  setupSidebar();
  await state.initState();
  renderBoard();
  renderBoardList();
  initDragAndDrop();
  setupColumnInteractions();
  setupCardInteractions();
  document.addEventListener('click', handleClickOutside);
  setupAddButtons();
  setupBoardControls();
  setupUpdaterUI();
}

function setupAddButtons() {
  // add column button in header
  const addColBtn = document.getElementById('add-column-btn');
  if (addColBtn) {
    addColBtn.addEventListener('click', async () => {
      await state.addColumn();
      renderBoard();
      initDragAndDrop();
      setupAddButtons();
      setupColumnInteractions();
      setupCardInteractions();
    });
  }
  // each column's add card button
  board.querySelectorAll('[data-add-card]').forEach(btn => {
    btn.addEventListener('click', async e => {
      const colId = parseInt(e.currentTarget.getAttribute('data-add-card'));
      const text = await showPrompt('Card text?');
      if (text) {
        await state.addCard(colId, { type: 'note', text });
        renderBoard();
        initDragAndDrop();
        setupAddButtons();
        setupColumnInteractions();
        setupCardInteractions();
      }
    });
  });
}

function setupSidebar() {
  const openSidebar = () => sidebar.classList.add('open');
  const closeSidebar = () => sidebar.classList.remove('open');
  triggerZone.addEventListener('mouseenter', openSidebar);
  menuBtn.addEventListener('click', openSidebar);
  closeBtn.addEventListener('click', closeSidebar);
}

function renderBoard() {
  // update header name
  const current = state.getCurrentBoard();
  const nameElem = document.getElementById('board-name');
  if (nameElem && current) nameElem.textContent = current.name;

  board.innerHTML = '';
  const data = state.getData();
  data.forEach(col => {
    const colEl = document.createElement('div');
    colEl.className = 'column-width flex flex-col h-full bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl p-4 shadow-sm';
    colEl.innerHTML = `
      <div class="flex items-center justify-between mb-4 px-1">
          <div class="flex items-center gap-2">
            <h3 class="column-header font-semibold text-slate-800 text-sm" data-col-id="${col.id}">${col.title}</h3>
            <button class="delete-column text-red-500 hover:text-red-700" title="Delete column">×</button>
          </div>
          <span class="text-[10px] font-bold bg-black/5 px-2 py-0.5 rounded text-slate-500">${col.cards.length}</span>
      </div>
      <div class="flex-1 space-y-3 drop-zone rounded-2xl p-1 transition-colors border border-transparent" data-col-id="${col.id}">
          ${col.cards.map(card => `
              <div class="card glass p-4 rounded-xl cursor-grab active:cursor-grabbing border border-transparent hover:border-blue-300/40 hover:-translate-y-0.5 hover:shadow-md transition-all group" draggable="true" id="${card.id}">
                  <div class="flex items-start justify-between mb-2">
                      <span class="text-[10px] uppercase tracking-wider ${card.type === 'file' ? 'text-emerald-600' : 'text-blue-600'} font-bold">${card.type}</span>
                      <button class="delete-card opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 transition-all" title="Delete card">×</button>
                  </div>
                  <p class="text-sm text-slate-700 leading-relaxed font-medium">${card.text}</p>
              </div>
          `).join('')}
          <button class="w-full py-3 border border-dashed border-slate-300 rounded-xl text-slate-400 hover:text-blue-600 hover:border-blue-300 hover:bg-white/50 transition-all text-sm mt-2 font-medium" data-add-card="${col.id}">+ Add Card</button>
      </div>
    `;
    board.appendChild(colEl);
  });
}

function initDragAndDrop() {
  const cards = document.querySelectorAll('.card');
  const zones = document.querySelectorAll('.drop-zone');
  cards.forEach(card => {
    card.addEventListener('dragstart', () => card.classList.add('dragging'));
    card.addEventListener('dragend', () => card.classList.remove('dragging'));
  });
  zones.forEach(zone => {
    zone.addEventListener('dragover', e => {
      e.preventDefault();
      zone.classList.add('drop-zone-active');
      const draggingCard = document.querySelector('.dragging');
      const afterElement = getDragAfterElement(zone, e.clientY);
      if (afterElement == null) {
        zone.appendChild(draggingCard);
      } else {
        zone.insertBefore(draggingCard, afterElement);
      }
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('drop-zone-active'));
    zone.addEventListener('drop', async () => {
      zone.classList.remove('drop-zone-active');
      const draggingCard = document.querySelector('.dragging');
      if (draggingCard) {
        const cardId = draggingCard.id;
        const toColId = parseInt(zone.getAttribute('data-col-id'));
        const children = Array.from(zone.querySelectorAll('.card'));
        const position = children.findIndex(el => el.id === cardId);
        await state.moveCard(cardId, toColId, position);
      }
    });
  });
}

function getDragAfterElement(container, y) {
  const draggableElements = [...container.querySelectorAll('.card:not(.dragging)')];
  return draggableElements.reduce((closest, child) => {
    const box = child.getBoundingClientRect();
    const offset = y - box.top - box.height / 2;
    if (offset < 0 && offset > closest.offset) {
      return { offset: offset, element: child };
    } else {
      return closest;
    }
  }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function handleClickOutside(e) {
  if (!sidebar.contains(e.target) && !menuBtn.contains(e.target) && sidebar.classList.contains('open')) {
    sidebar.classList.remove('open');
  }
}

// version tag utility
export async function setVersionTag(elem) {
  if (!elem) return;
  // use the API exposed by preload (window.api)
  if (!window.api || typeof window.api.getVersion !== 'function') {
    elem.textContent = 'SnapBoard (unknown)';
    return;
  }
  try {
    const info = await window.api.getVersion();
    elem.textContent = `SnapBoard ${info.version} (${info.stage}) — ${info.date}`;
  } catch (err) {
    console.error('failed to fetch version info', err);
    elem.textContent = 'SnapBoard (error)';
  }
}

// board list in sidebar
function renderBoardList() {
  const container = document.getElementById('board-list');
  if (!container) return;
  container.innerHTML = '';
  const list = state.getBoardList();
  list.forEach(b => {
    const row = document.createElement('div');
    row.className = 'flex items-center justify-between p-2 rounded hover:bg-white/10';
    row.dataset.boardId = b.id;
    const current = state.getCurrentBoard();
    if (current && current.id === b.id) {
      row.classList.add('bg-blue-600/20');
    }
    row.innerHTML = `
      <span class="board-name cursor-pointer">${b.name}</span>
      <span class="flex items-center gap-2">
        <button class="rename-board text-xs text-slate-400 hover:text-slate-700" title="Rename">✎</button>
        <button class="delete-board text-xs text-red-500 hover:text-red-700" title="Delete">×</button>
      </span>
    `;
    container.appendChild(row);

    // switch on click of name
    row.querySelector('.board-name').addEventListener('click', async () => {
      await state.switchBoard(b.id);
      renderBoard();
      renderBoardList();
      initDragAndDrop();
      setupColumnInteractions();
      setupCardInteractions();
    });
    row.querySelector('.rename-board').addEventListener('click', async e => {
      e.stopPropagation();
      const newName = await showPrompt('New board name?', b.name);
      if (newName) {
        await state.switchBoard(b.id);
        await state.renameCurrentBoard(newName);
        renderBoardList();
        renderBoard();
      }
    });
    row.querySelector('.delete-board').addEventListener('click', async e => {
      e.stopPropagation();
      const ok = confirm('Delete board “' + b.name + '”?');
      if (ok) {
        await state.switchBoard(b.id);
        await state.deleteCurrentBoard();
        renderBoardList();
        renderBoard();
        initDragAndDrop();
        setupColumnInteractions();
        setupCardInteractions();
      }
    });
  });
}

function setupBoardControls() {
  const newBtn = document.getElementById('new-board-btn');
  if (newBtn) {
    newBtn.addEventListener('click', async () => {
      const name = await showPrompt('Board name?');
      if (name) {
        await state.createBoard(name);
        renderBoardList();
        renderBoard();
        initDragAndDrop();
        setupColumnInteractions();
        setupCardInteractions();
      }
    });
  }
}

// updater UI
function setupUpdaterUI() {
  const statusEl = document.getElementById('update-status');
  if (!statusEl) return;
  // initial text already in markup

  window.api.on('update-available', () => {
    statusEl.innerHTML = `
      <span class="mr-2">Update available</span>
      <button id="download-update" class="text-xs font-medium px-2 py-1 bg-white/40 border border-white/20 text-slate-700 rounded shadow-sm hover:bg-white/60 transition-all">Download</button>
    `;
    const btn = document.getElementById('download-update');
    if (btn) {
      btn.addEventListener('click', () => {
        statusEl.textContent = 'Downloading…';
        window.api.downloadUpdate();
      });
    }
  });

  window.api.on('update-not-available', () => {
    statusEl.textContent = 'Up to date';
  });

  window.api.on('update-error', msg => {
    statusEl.textContent = 'Update error';
    console.error('update error', msg);
  });

  window.api.on('update-ready', () => {
    statusEl.innerHTML = `
      <span class="mr-2">Update ready</span>
      <button id="install-update" class="text-xs font-medium px-2 py-1 bg-green-500 text-white rounded shadow-sm hover:bg-green-600 transition-all">Install update</button>
    `;
    const btn = document.getElementById('install-update');
    if (btn) {
      btn.addEventListener('click', () => {
        window.api.installUpdate();
      });
    }
  });
}

// helper
export function byId(id) { return document.getElementById(id); }
