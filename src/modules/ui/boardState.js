// boardState.js
// manage board data and persistence
import { loadBoard, saveBoard } from '../file/operations.js';

// board collection structure
let boards = [];                     // array of {id,name,columns:[...]} 
let currentBoardId = null;
let nextBoardId = 1;
let nextColId = 1;
let nextCardId = 1;

export async function initState() {
  const stored = await loadBoard();
  if (stored && stored.boards && stored.boards.length) {
    boards = stored.boards;
    currentBoardId = stored.currentBoardId || boards[0].id;
    boards.forEach(b => {
      nextBoardId = Math.max(nextBoardId, b.id + 1);
      b.columns.forEach(col => {
        nextColId = Math.max(nextColId, col.id + 1);
        col.cards.forEach(card => {
          const num = parseInt(card.id.slice(1));
          nextCardId = Math.max(nextCardId, num + 1);
        });
      });
    });
  } else {
    // create default board
    const defaultCols = [
      { id: nextColId++, title: 'Ideas', cards: [{id: 'c1', type:'note', text:'Explore SnapBoard API hooks'}, {id:'c2', type:'file', text:'/home/user/projects/sb-logo.svg'}] },
      { id: nextColId++, title: 'To-Do', cards: [{id:'c3', type:'note', text:'Fix slide-out jitter on Windows'}, {id:'c4', type:'note', text:'Implement LocalDB sync'}] },
      { id: nextColId++, title: 'In Progress', cards: [{id:'c5', type:'note', text:'Tailwind v4 Standalone config'}] },
      { id: nextColId++, title: 'Testing', cards: [] },
      { id: nextColId++, title: 'Done', cards: [{id:'c6', type:'file', text:'v1.0.0-beta.deb'}] },
      { id: nextColId++, title: 'Backlog', cards: [] },
      { id: nextColId++, title: 'Archives', cards: [] }
    ];
    const board = { id: nextBoardId++, name: 'Board 1', columns: defaultCols };
    boards = [board];
    currentBoardId = board.id;
    await save();
  }
}


export function getData() {
  const board = boards.find(b => b.id === currentBoardId);
  return board ? board.columns : [];
}

export function getBoardList() {
  return boards.map(b => ({ id: b.id, name: b.name }));
}

export function getCurrentBoard() {
  return boards.find(b => b.id === currentBoardId);
}

export async function renameCurrentBoard(newName) {
  const b = boards.find(b => b.id === currentBoardId);
  if (b) {
    b.name = newName;
    await save();
  }
}

export async function createBoard(name) {
  const b = { id: nextBoardId++, name: name || `Board ${nextBoardId}`, columns: [] };
  boards.push(b);
  currentBoardId = b.id;
  await save();
}

export async function deleteCurrentBoard() {
  boards = boards.filter(b => b.id !== currentBoardId);
  if (boards.length) {
    currentBoardId = boards[0].id;
  } else {
    // create empty board
    const b = { id: nextBoardId++, name: 'Board 1', columns: [] };
    boards = [b];
    currentBoardId = b.id;
  }
  await save();
}

export async function switchBoard(id) {
  if (boards.find(b => b.id === id)) {
    currentBoardId = id;
    await save();
  }
}

export async function addColumn(title = 'New Column') {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  board.columns.push({ id: nextColId++, title, cards: [] });
  await save();
}

export async function renameColumn(colId, newTitle) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  const col = board.columns.find(c => c.id === colId);
  if (col) {
    col.title = newTitle;
    await save();
  }
}

export async function deleteColumn(colId) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  board.columns = board.columns.filter(c => c.id !== colId);
  await save();
}

export async function addCard(colId, card) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  const col = board.columns.find(c => c.id === colId);
  if (!col) return;
  card.id = 'c' + nextCardId++;
  col.cards.push(card);
  await save();
}

export async function renameCard(cardId, newText) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  board.columns.forEach(col => {
    const card = col.cards.find(c => c.id === cardId);
    if (card) {
      card.text = newText;
    }
  });
  await save();
}

export async function deleteCard(cardId) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  board.columns.forEach(col => {
    col.cards = col.cards.filter(c => c.id !== cardId);
  });
  await save();
}

export async function moveCard(cardId, toColId, positionIndex) {
  const board = boards.find(b => b.id === currentBoardId);
  if (!board) return;
  // remove card from old col
  let moving;
  board.columns.forEach(col => {
    const idx = col.cards.findIndex(c => c.id === cardId);
    if (idx !== -1) {
      moving = col.cards.splice(idx, 1)[0];
    }
  });
  if (!moving) return;
  const dest = board.columns.find(c => c.id === toColId);
  if (!dest) return;
  if (positionIndex == null || positionIndex >= dest.cards.length) {
    dest.cards.push(moving);
  } else {
    dest.cards.splice(positionIndex, 0, moving);
  }
  await save();
}

async function save() {
  await saveBoard({ boards, currentBoardId });
}
