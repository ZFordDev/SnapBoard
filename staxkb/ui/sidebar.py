"""Board sidebar — lists boards, supports switching, adding, renaming, deleting."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QListWidget,
    QListWidgetItem,
    QMenu,
    QPushButton,
    QVBoxLayout,
    QWidget,
)


class BoardSidebar(QWidget):
    """Left sidebar listing all boards with add/rename/delete."""

    board_selected = Signal(int)  # board index
    board_add_requested = Signal()
    board_rename_requested = Signal(int, str)
    board_delete_requested = Signal(int)
    board_duplicate_requested = Signal(int)

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("BoardSidebar")
        self.setMinimumWidth(180)
        self.setMaximumWidth(260)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Header
        header = QWidget()
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(12, 10, 8, 8)

        title = QLabel("Boards")
        title.setObjectName("SidebarTitle")
        header_layout.addWidget(title)
        header_layout.addStretch()

        add_btn = QPushButton("+")
        add_btn.setObjectName("SidebarAddBtn")
        add_btn.setFixedSize(24, 24)
        add_btn.setToolTip("New board")
        add_btn.clicked.connect(self.board_add_requested.emit)
        header_layout.addWidget(add_btn)

        layout.addWidget(header)

        # Board list
        self._list = QListWidget()
        self._list.setObjectName("BoardList")
        self._list.setContextMenuPolicy(Qt.CustomContextMenu)
        self._list.customContextMenuRequested.connect(self._show_context_menu)
        self._list.currentRowChanged.connect(self._on_row_changed)
        layout.addWidget(self._list, 1)

    def populate(self, board_names: list[str], active_index: int = 0) -> None:
        self._list.blockSignals(True)
        self._list.clear()
        for name in board_names:
            item = QListWidgetItem(name)
            item.setFlags(item.flags() | Qt.ItemIsEditable)
            self._list.addItem(item)
        if 0 <= active_index < self._list.count():
            self._list.setCurrentRow(active_index)
        self._list.blockSignals(False)

    def set_board_names(self, names: list[str]) -> None:
        active = self._list.currentRow()
        self._list.clear()
        for name in names:
            item = QListWidgetItem(name)
            item.setFlags(item.flags() | Qt.ItemIsEditable)
            self._list.addItem(item)
        if 0 <= active < self._list.count():
            self._list.setCurrentRow(active)

    def _on_row_changed(self, row: int) -> None:
        if row >= 0:
            self.board_selected.emit(row)

    def _show_context_menu(self, pos) -> None:
        item = self._list.itemAt(pos)
        if item is None:
            return
        row = self._list.row(item)

        menu = QMenu(self)
        rename_action = menu.addAction("Rename")
        duplicate_action = menu.addAction("Duplicate")
        menu.addSeparator()
        delete_action = menu.addAction("Delete")

        action = menu.exec(self._list.mapToGlobal(pos))
        if action == rename_action:
            self._list.editItem(item)
            # Connect to editing finished
            item.setData(Qt.UserRole, row)
        elif action == duplicate_action:
            self.board_duplicate_requested.emit(row)
        elif action == delete_action:
            self.board_delete_requested.emit(row)

    def finish_rename(self) -> None:
        """Called after inline edit to emit the rename signal."""
        item = self._list.currentItem()
        if item:
            row = self._list.row(item)
            self.board_rename_requested.emit(row, item.text())
