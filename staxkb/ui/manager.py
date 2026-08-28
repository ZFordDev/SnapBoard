"""Board manager — handles multiple boards and persistence."""

from __future__ import annotations

import json
from pathlib import Path

from PySide6.QtCore import QObject, Signal

from .models import Board, Column, create_default_board


class BoardManager(QObject):
    """Manages multiple boards with save/load to a single JSON file."""

    boards_changed = Signal()
    active_board_changed = Signal(int)  # index

    def __init__(self) -> None:
        super().__init__()
        self._boards: list[Board] = []
        self._active_index: int = -1
        self._current_path: str | None = None
        self._dirty: bool = False

        # Start with one default board
        self._boards.append(create_default_board())
        self._active_index = 0

    # ---------------------------------------------------------
    # Board access
    # ---------------------------------------------------------

    def boards(self) -> list[Board]:
        return list(self._boards)

    def active_board(self) -> Board | None:
        if 0 <= self._active_index < len(self._boards):
            return self._boards[self._active_index]
        return None

    def active_index(self) -> int:
        return self._active_index

    def board_count(self) -> int:
        return len(self._boards)

    # ---------------------------------------------------------
    # Board operations
    # ---------------------------------------------------------

    def add_board(self, name: str = "Untitled Board") -> Board:
        board = Board(name=name)
        self._boards.append(board)
        self._dirty = True
        self.boards_changed.emit()
        return board

    def remove_board(self, index: int) -> bool:
        if index < 0 or index >= len(self._boards):
            return False
        if len(self._boards) <= 1:
            return False  # Don't remove last board
        self._boards.pop(index)
        if self._active_index >= len(self._boards):
            self._active_index = len(self._boards) - 1
        self._dirty = True
        self.boards_changed.emit()
        self.active_board_changed.emit(self._active_index)
        return True

    def rename_board(self, index: int, name: str) -> bool:
        if index < 0 or index >= len(self._boards):
            return False
        self._boards[index].name = name
        self._dirty = True
        self.boards_changed.emit()
        return True

    def duplicate_board(self, index: int) -> Board | None:
        if index < 0 or index >= len(self._boards):
            return None
        import copy
        board = copy.deepcopy(self._boards[index])
        board.name += " (Copy)"
        # Generate new IDs
        from .models import _uuid
        board.id = _uuid()
        for col in board.columns:
            col.id = _uuid()
            for card in col.cards:
                card.id = _uuid()
        self._boards.append(board)
        self._dirty = True
        self.boards_changed.emit()
        return board

    def set_active(self, index: int) -> None:
        if index < 0 or index >= len(self._boards):
            return
        self._active_index = index
        self.active_board_changed.emit(index)

    def move_board(self, from_idx: int, to_idx: int) -> None:
        if from_idx == to_idx:
            return
        if from_idx < 0 or from_idx >= len(self._boards):
            return
        if to_idx < 0 or to_idx >= len(self._boards):
            return
        board = self._boards.pop(from_idx)
        self._boards.insert(to_idx, board)
        if self._active_index == from_idx:
            self._active_index = to_idx
        self._dirty = True
        self.boards_changed.emit()

    # ---------------------------------------------------------
    # Column operations (on active board)
    # ---------------------------------------------------------

    def add_column(self, title: str = "New Column") -> Column | None:
        board = self.active_board()
        if board is None:
            return None
        col = Column(title=title)
        board.columns.append(col)
        self._dirty = True
        self.boards_changed.emit()
        return col

    def remove_column(self, col_index: int) -> bool:
        board = self.active_board()
        if board is None or col_index < 0 or col_index >= len(board.columns):
            return False
        board.columns.pop(col_index)
        self._dirty = True
        self.boards_changed.emit()
        return True

    def rename_column(self, col_index: int, title: str) -> bool:
        board = self.active_board()
        if board is None or col_index < 0 or col_index >= len(board.columns):
            return False
        board.columns[col_index].title = title
        self._dirty = True
        self.boards_changed.emit()
        return True

    # ---------------------------------------------------------
    # Persistence
    # ---------------------------------------------------------

    def save(self, path: str | None = None) -> bool:
        if path is None:
            path = self._current_path
        if path is None:
            return False
        try:
            data = {
                "version": 2,
                "active_board": self._active_index,
                "boards": [b.to_dict() for b in self._boards],
            }
            Path(path).write_text(json.dumps(data, indent=2), encoding="utf-8")
            self._current_path = path
            self._dirty = False
            self.boards_changed.emit()
            return True
        except Exception as e:
            print(f"[StaxKB] Failed to save: {e}")
            return False

    def load(self, path: str) -> bool:
        try:
            data = json.loads(Path(path).read_text(encoding="utf-8"))
            # Support v1 (single board) and v2 (multi-board)
            if "boards" in data:
                self._boards = [Board.from_dict(b) for b in data["boards"]]
                self._active_index = data.get("active_board", 0)
            elif "columns" in data:
                # v1 format — single board
                self._boards = [Board.from_dict(data)]
                self._active_index = 0
            else:
                return False

            if self._active_index >= len(self._boards):
                self._active_index = 0

            self._current_path = path
            self._dirty = False
            self.boards_changed.emit()
            self.active_board_changed.emit(self._active_index)
            return True
        except Exception as e:
            print(f"[StaxKB] Failed to load: {e}")
            return False

    def current_path(self) -> str | None:
        return self._current_path

    def is_dirty(self) -> bool:
        return self._dirty

    def mark_dirty(self) -> None:
        self._dirty = True
