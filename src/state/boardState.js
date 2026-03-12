// src/state/boardState.js
import { nanoid } from "../utils/id.js"; 
import { loadJSON, saveJSON } from "../utils/storage.js";

const STORAGE_KEY = "snapboard-data";

// Internal state
let boards = [];
let currentBoardId = null;

// -----------------------------
// INIT
// -----------------------------
export async function initState() {
  const data = await loadJSON(STORAGE_KEY);

  if (!data || !Array.isArray(data.boards)) {
    // First‑run default board
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
    await save();
    return;
  }

  boards = data.boards;
  currentBoardId = data.currentBoardId || boards[0].id;
}

// -----------------------------
// GETTERS
// -----------------------------
export function getBoards() {
  return boards;
}

export function getCurrentBoard() {
  return boards.find(b => b.id === currentBoardId);
}

export function getData() {
  const board = getCurrentBoard();
  return board ? board.columns : [];
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
  await save();
}

export async function renameBoard(id, newName) {
  const board = boards.find(b => b.id === id);
  if (board) {
    board.name = newName;
    await save();
  }
}

export async function deleteBoard(id) {
  boards = boards.filter(b => b.id !== id);

  if (currentBoardId === id) {
    currentBoardId = boards.length ? boards[0].id : null;
  }

  await save();
}

export async function setCurrentBoard(id) {
  currentBoardId = id;
  await save();
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

  await save();
}

export async function renameColumn(colId, newTitle) {
  const board = getCurrentBoard();
  if (!board) return;

  const col = board.columns.find(c => c.id === colId);
  if (col) {
    col.title = newTitle;
    await save();
  }
}

export async function deleteColumn(colId) {
  const board = getCurrentBoard();
  if (!board) return;

  board.columns = board.columns.filter(c => c.id !== colId);
  await save();
}

// -----------------------------
// CARD MANAGEMENT
// -----------------------------
export async function addCard(colId, card) {
  const board = getCurrentBoard();
  if (!board) return;

  const col = board.columns.find(c => c.id === colId);
  if (!col) return;

  col.cards.push({
    id: nanoid(),
    ...card
  });

  await save();
}

export async function deleteCard(colId, cardId) {
  const board = getCurrentBoard();
  if (!board) return;

  const col = board.columns.find(c => c.id === colId);
  if (!col) return;

  col.cards = col.cards.filter(c => c.id !== cardId);
  await save();
}

export async function moveCard(cardId, fromColId, toColId, newIndex) {
  const board = getCurrentBoard();
  if (!board) return;

  const fromCol = board.columns.find(c => c.id === fromColId);
  const toCol = board.columns.find(c => c.id === toColId);
  if (!fromCol || !toCol) return;

  const card = fromCol.cards.find(c => c.id === cardId);
  if (!card) return;

  // Remove from old column
  fromCol.cards = fromCol.cards.filter(c => c.id !== cardId);

  // Insert into new column
  toCol.cards.splice(newIndex, 0, card);

  await save();
}

// -----------------------------
// SAVE
// -----------------------------
async function save() {
  await saveJSON(STORAGE_KEY, {
    boards,
    currentBoardId
  });
}