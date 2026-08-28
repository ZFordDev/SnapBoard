"""Kanban board — horizontal scrolling board with columns."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QHBoxLayout,
    QPushButton,
    QScrollArea,
    QVBoxLayout,
    QWidget,
)

from .column import KanbanColumn
from .models import Board, Column


class KanbanBoard(QWidget):
    """The board area — displays columns for the active board."""

    board_changed = Signal()
    card_edit_requested = Signal(int, int)  # col_index, card_index

    def __init__(self) -> None:
        super().__init__()
        self._columns: list[KanbanColumn] = []

        outer = QVBoxLayout(self)
        outer.setContentsMargins(0, 0, 0, 0)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarAsNeeded)
        scroll.setVerticalScrollBarPolicy(Qt.ScrollBarAlwaysOff)
        scroll.setObjectName("BoardScroll")

        container = QWidget()
        self._board_layout = QHBoxLayout(container)
        self._board_layout.setContentsMargins(12, 12, 12, 12)
        self._board_layout.setSpacing(12)

        # Add column button at the end
        self._add_col_btn = QPushButton("+")
        self._add_col_btn.setObjectName("AddColumnBtn")
        self._add_col_btn.setFixedSize(48, 48)
        self._add_col_btn.setToolTip("Add column")
        self._add_col_btn.clicked.connect(self._on_add_column)
        self._board_layout.addWidget(self._add_col_btn)
        self._board_layout.addStretch(1)

        scroll.setWidget(container)
        outer.addWidget(scroll)

    def load_board(self, board: Board) -> None:
        """Load all columns from a Board model."""
        self.clear()
        for col_model in board.columns:
            self.add_column_from_model(col_model)

    def add_column_from_model(self, col_model: Column) -> KanbanColumn:
        col = KanbanColumn(col_model.title, col_model.cards)
        col.card_added.connect(self._on_board_modified)
        col.card_deleted.connect(self._on_board_modified)
        col.card_moved.connect(self._on_card_moved)
        col.card_edit_requested.connect(
            lambda card_idx, c=col: self.card_edit_requested.emit(self._columns.index(c), card_idx)
        )
        col.column_renamed.connect(self._on_board_modified)
        col.column_delete_requested.connect(lambda c=col: self._on_delete_column(c))
        self._columns.append(col)
        # Insert before the add button
        idx = self._board_layout.count() - 2
        self._board_layout.insertWidget(idx, col)
        return col

    def add_new_column(self, title: str = "New Column") -> KanbanColumn:
        col = KanbanColumn(title)
        col.card_added.connect(self._on_board_modified)
        col.card_deleted.connect(self._on_board_modified)
        col.card_moved.connect(self._on_card_moved)
        col.card_edit_requested.connect(
            lambda card_idx, c=col: self.card_edit_requested.emit(self._columns.index(c), card_idx)
        )
        col.column_renamed.connect(self._on_board_modified)
        col.column_delete_requested.connect(lambda c=col: self._on_delete_column(c))
        self._columns.append(col)
        idx = self._board_layout.count() - 2
        self._board_layout.insertWidget(idx, col)
        self._on_board_modified()
        return col

    def clear(self) -> None:
        for col in self._columns:
            self._board_layout.removeWidget(col)
            col.deleteLater()
        self._columns.clear()

    def columns(self) -> list[KanbanColumn]:
        return list(self._columns)

    def column_count(self) -> int:
        return len(self._columns)

    def sync_from_board(self, board: Board) -> None:
        """Sync current board state back to the Board model."""
        board.columns = []
        for col in self._columns:
            board.columns.append(Column(
                title=col.title(),
                cards=col.get_cards(),
            ))

    def filter_cards(self, query: str = "", tag: str = "") -> None:
        """Apply search/filter to all columns."""
        for col in self._columns:
            col.filter_cards(query, tag)

    def clear_filter(self) -> None:
        """Show all cards."""
        for col in self._columns:
            col.filter_cards("", "")

    # ---------------------------------------------------------
    # Internal
    # ---------------------------------------------------------

    def _on_board_modified(self, *_args) -> None:
        self.board_changed.emit()

    def _on_card_moved(self, source_list, drop_index: int, target_list) -> None:
        self.board_changed.emit()

    def _on_add_column(self) -> None:
        self.add_new_column("New Column")

    def _on_delete_column(self, col: KanbanColumn) -> None:
        if col in self._columns:
            self._board_layout.removeWidget(col)
            col.deleteLater()
            self._columns.remove(col)
            self._on_board_modified()
