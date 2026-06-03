// src/state/boardState.js
import { nanoid } from "../utils/id.js";
import { loadJSON, saveJSON } from "../utils/storage.js";
import { sanitizeAttachment } from "../utils/attachment.js";

const STORAGE_KEY = "snapboard-data";
const SAVE_DEBOUNCE_MS = 250;

let boards = [];
let currentBoardId = null;
let saveTimer = null;

// -----------------------------
// INIT
// -----------------------------
export async function initState() {
  const saved = loadFromSession() || (await loadJSON(STORAGE_KEY));

  if (!saved || !Array.isArray(saved.boards)) {
    setupDefaultBoard();
    await saveNow();
    return;
  }

  boards = normalizeBoards(saved.boards);
  currentBoardId = saved.currentBoardId || boards[0]?.id;
  persistToSession();
}

function loadFromSession() {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function persistToSession() {
  try {
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ boards, currentBoardId })
    );
  } catch {
    // ignore session storage failures
  }
}

function setupDefaultBoard() {
  boards = [
    {
      id: nanoid(),
      name: "My Board",
      columns: [
        { id: nanoid(), title: "To Do", cards: [] },
        { id: nanoid(), title: "Doing", cards: [] },
        { id: nanoid(), title: "Done", cards: [] }
      ]
    }
  ];
  currentBoardId = boards[0].id;
}

function normalizeBoards(input) {
  return Array.isArray(input)
    ? input.map((board) => ({
        id: board.id || nanoid(),
        name: board.name || "Untitled Board",
        columns: Array.isArray(board.columns)
          ? board.columns.map((column) => ({
              id: column.id || nanoid(),
              title: column.title || "Untitled Column",
              cards: Array.isArray(column.cards)
                ? column.cards.map(normalizeCard)
                : []
            }))
          : []
      }))
    : [];
}

function normalizeCard(card) {
  const now = Date.now();
  const title =
    card.title ||
    (typeof card.text === "string"
      ? card.text.split("\n")[0].slice(0, 50)
      : "Untitled Card");

  const fileData = sanitizeAttachment(card.file)
    || (card.path ? sanitizeAttachment({ path: card.path, name: card.name }) : null);

  return {
    id: card.id || nanoid(),
    title,
    body: card.body ?? card.text ?? "",
    file: fileData,
    createdAt: card.createdAt || now,
    updatedAt: card.updatedAt || now
  };
}

// -----------------------------
// GETTERS
// -----------------------------
export function getBoards() {
  return boards;
}

export function getCurrentBoard() {
  return boards.find((b) => b.id === currentBoardId);
}

export function getData() {
  const board = getCurrentBoard();
  return board ? board.columns : [];
}

export function getCard(colId, cardId) {
  const board = getCurrentBoard();
  if (!board) return null;

  const column = board.columns.find((c) => c.id === colId);
  return column ? column.cards.find((card) => card.id === cardId) : null;
}

// -----------------------------
// BOARD MANAGEMENT
// -----------------------------
export async function addBoard(name = "New Board") {
  const newBoard = {
    id: nanoid(),
    name,
    columns: []
  };

  boards.push(newBoard);
  currentBoardId = newBoard.id;
  scheduleSave();
}

export async function renameBoard(id, newName) {
  const board = boards.find((b) => b.id === id);
  if (board) {
    board.name = newName;
    scheduleSave();
  }
}

export async function deleteBoard(id) {
  boards = boards.filter((b) => b.id !== id);

  if (currentBoardId === id) {
    currentBoardId = boards.length ? boards[0].id : null;
  }

  scheduleSave();
}

export async function setCurrentBoard(id) {
  currentBoardId = id;
  scheduleSave();
}

// -----------------------------
// COLUMN MANAGEMENT
// -----------------------------
export async function addColumn(title = "New Column") {
  const board = getCurrentBoard();
  if (!board) return;

  board.columns.push({
    id: nanoid(),
    title,
    cards: []
  });

  scheduleSave();
}

export async function renameColumn(colId, newTitle) {
  const board = getCurrentBoard();
  if (!board) return;

  const col = board.columns.find((c) => c.id === colId);
  if (col) {
    col.title = newTitle;
    scheduleSave();
  }
}

export async function deleteColumn(colId) {
  const board = getCurrentBoard();
  if (!board) return;

  board.columns = board.columns.filter((c) => c.id !== colId);
  scheduleSave();
}

// -----------------------------
// CARD MANAGEMENT
// -----------------------------
export async function addCard(colId, card) {
  const board = getCurrentBoard();
  if (!board) return;

  const column = board.columns.find((c) => c.id === colId);
  if (!column) return;

  const now = Date.now();
  column.cards.push({
    id: nanoid(),
    title: card.title || "Untitled Card",
    body: card.body || "",
    file: sanitizeAttachment(card.file),
    createdAt: now,
    updatedAt: now
  });

  scheduleSave();
}

export async function updateCard(colId, cardId, updates) {
  const board = getCurrentBoard();
  if (!board) return;

  const column = board.columns.find((c) => c.id === colId);
  if (!column) return;

  const card = column.cards.find((c) => c.id === cardId);
  if (!card) return;

  card.title = updates.title ?? card.title;
  card.body = updates.body ?? card.body;

  if (updates.file === null) {
    card.file = null;
  } else if (updates.file) {
    card.file = sanitizeAttachment(updates.file);
  }

  card.updatedAt = Date.now();

  scheduleSave();
}

export async function attachFileToCard(colId, cardId, file) {
  return updateCard(colId, cardId, {
    file: file ? sanitizeAttachment(file) : null
  });
}

export async function deleteCard(colId, cardId) {
  const board = getCurrentBoard();
  if (!board) return;

  const column = board.columns.find((c) => c.id === colId);
  if (!column) return;

  column.cards = column.cards.filter((c) => c.id !== cardId);
  scheduleSave();
}

export async function moveCard(cardId, fromColId, toColId, newIndex) {
  const board = getCurrentBoard();
  if (!board) return;

  const fromCol = board.columns.find((c) => c.id === fromColId);
  const toCol = board.columns.find((c) => c.id === toColId);
  if (!fromCol || !toCol) return;

  const card = fromCol.cards.find((c) => c.id === cardId);
  if (!card) return;

  fromCol.cards = fromCol.cards.filter((c) => c.id !== cardId);
  toCol.cards.splice(newIndex, 0, card);

  scheduleSave();
}

// -----------------------------
// SAVE
// -----------------------------
function scheduleSave() {
  persistToSession();

  if (saveTimer) {
    clearTimeout(saveTimer);
  }

  saveTimer = window.setTimeout(() => {
    saveNow();
  }, SAVE_DEBOUNCE_MS);
}

export async function saveNow() {
  const payload = { boards, currentBoardId };

  try {
    await saveJSON(STORAGE_KEY, payload);
  } catch (error) {
    console.error("Storage save error:", error);
  }

  persistToSession();
}
