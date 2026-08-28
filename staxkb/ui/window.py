"""StaxKB window — Kanri-inspired kanban board with multi-board support."""

from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtGui import QKeySequence, QShortcut
from PySide6.QtWidgets import (
    QFileDialog,
    QMessageBox,
    QSplitter,
    QVBoxLayout,
    QWidget,
)

from .board import KanbanBoard
from .carddialog import CardEditDialog
from .footer import StaxKBFooter
from .manager import BoardManager
from .menubar import StaxKBMenuBar
from .searchbar import SearchBar
from .sidebar import BoardSidebar


class StaxKBWindow(QWidget):
    def __init__(self, version: str = "0.1.0") -> None:
        super().__init__()
        self.setWindowTitle("StaxKB - Kanban Board")
        self.resize(1200, 700)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Menu bar
        self.menu_bar = StaxKBMenuBar()
        layout.addWidget(self.menu_bar)

        # Board manager
        self.manager = BoardManager()

        # Search bar (hidden by default)
        self.search_bar = SearchBar()
        self.search_bar.hide()
        self.search_bar.search_changed.connect(self._on_search)
        self.search_bar.filter_tag_changed.connect(self._on_search)
        self.search_bar.close_requested.connect(self._close_search)
        layout.addWidget(self.search_bar)

        # Main splitter: sidebar + board
        self._splitter = QSplitter(Qt.Horizontal)
        self._splitter.setObjectName("AppContainer")
        self._splitter.setHandleWidth(1)

        # Sidebar
        self.sidebar = BoardSidebar()
        self._splitter.addWidget(self.sidebar)

        # Board area
        self.board = KanbanBoard()
        self._splitter.addWidget(self.board)

        self._splitter.setStretchFactor(0, 0)
        self._splitter.setStretchFactor(1, 1)
        self._splitter.setSizes([200, 1000])

        layout.addWidget(self._splitter, 1)

        # Footer
        self.footer = StaxKBFooter(version)
        layout.addWidget(self.footer)

        # Default theme
        self.apply_theme("light")

        # Wire signals
        self._wire_signals()

        # Keyboard shortcuts
        self._wire_shortcuts()

        # Load initial state
        self._refresh_sidebar()
        self._load_active_board()
        self._update_footer()

    # ---------------------------------------------------------
    # Signal wiring
    # ---------------------------------------------------------

    def _wire_signals(self) -> None:
        # Sidebar
        self.sidebar.board_selected.connect(self._on_board_selected)
        self.sidebar.board_add_requested.connect(self._on_add_board)
        self.sidebar.board_rename_requested.connect(self._on_rename_board)
        self.sidebar.board_delete_requested.connect(self._on_delete_board)
        self.sidebar.board_duplicate_requested.connect(self._on_duplicate_board)

        # Board
        self.board.board_changed.connect(self._on_board_changed)
        self.board.card_edit_requested.connect(self._on_card_edit)

        # Manager
        self.manager.boards_changed.connect(self._refresh_footer)

        # Menu
        self.menu_bar.action_open.triggered.connect(self._on_open)
        self.menu_bar.action_save.triggered.connect(self._on_save)
        self.menu_bar.action_save_as.triggered.connect(self._on_save_as)
        self.menu_bar.action_theme_light.triggered.connect(lambda: self.apply_theme("light"))
        self.menu_bar.action_theme_dark.triggered.connect(lambda: self.apply_theme("dark"))
        self.menu_bar.action_add_column.triggered.connect(self._on_add_column)
        self.menu_bar.action_search.triggered.connect(self._open_search)

    def _wire_shortcuts(self) -> None:
        """Global keyboard shortcuts."""
        # Ctrl+N — add card to first column
        shortcut_new = QShortcut(QKeySequence("Ctrl+N"), self)
        shortcut_new.activated.connect(self._shortcut_add_card)

        # Ctrl+F — open search
        shortcut_search = QShortcut(QKeySequence("Ctrl+F"), self)
        shortcut_search.activated.connect(self._open_search)

        # Escape — close search
        shortcut_esc = QShortcut(QKeySequence("Escape"), self)
        shortcut_esc.activated.connect(self._close_search)

        # Ctrl+Shift+N — new board
        shortcut_new_board = QShortcut(QKeySequence("Ctrl+Shift+N"), self)
        shortcut_new_board.activated.connect(self._on_add_board)

        # Ctrl+Shift+C — add column
        shortcut_new_col = QShortcut(QKeySequence("Ctrl+Shift+C"), self)
        shortcut_new_col.activated.connect(self._on_add_column)

    # ---------------------------------------------------------
    # Search / Filter
    # ---------------------------------------------------------

    def _open_search(self) -> None:
        self.search_bar.show()
        self.search_bar.focus_search()

    def _close_search(self) -> None:
        self.search_bar.hide()
        self.board.clear_filter()

    def _on_search(self) -> None:
        query = self.search_bar.get_query()
        tag = self.search_bar.get_tag_filter()
        self.board.filter_cards(query, tag)

    # ---------------------------------------------------------
    # Keyboard shortcuts handlers
    # ---------------------------------------------------------

    def _shortcut_add_card(self) -> None:
        """Add a new card to the first column."""
        cols = self.board.columns()
        if cols:
            cols[0].card_input.setFocus()

    # ---------------------------------------------------------
    # Sidebar ↔ Board
    # ---------------------------------------------------------

    def _refresh_sidebar(self) -> None:
        names = [b.name for b in self.manager.boards()]
        self.sidebar.populate(names, self.manager.active_index())

    def _load_active_board(self) -> None:
        board = self.manager.active_board()
        if board:
            self.board.load_board(board)

    def _on_board_selected(self, index: int) -> None:
        active = self.manager.active_board()
        if active:
            self.board.sync_from_board(active)
        self.manager.set_active(index)
        self._load_active_board()
        self._update_title()

    def _on_add_board(self) -> None:
        self.manager.add_board("New Board")
        self._refresh_sidebar()

    def _on_rename_board(self, index: int, name: str) -> None:
        self.manager.rename_board(index, name)
        self._update_title()

    def _on_delete_board(self, index: int) -> None:
        if self.manager.board_count() <= 1:
            QMessageBox.information(self, "Cannot Delete", "You must have at least one board.")
            return
        reply = QMessageBox.question(
            self,
            "Delete Board",
            f"Delete \"{self.manager.boards()[index].name}\"?",
            QMessageBox.Yes | QMessageBox.No,
        )
        if reply == QMessageBox.Yes:
            self.manager.remove_board(index)
            self._refresh_sidebar()
            self._load_active_board()
            self._update_title()

    def _on_duplicate_board(self, index: int) -> None:
        self.manager.duplicate_board(index)
        self._refresh_sidebar()

    # ---------------------------------------------------------
    # Board events
    # ---------------------------------------------------------

    def _on_board_changed(self) -> None:
        self.manager.mark_dirty()
        self._update_title()
        self._update_footer()

    def _on_card_edit(self, col_index: int, card_index: int) -> None:
        board = self.manager.active_board()
        if not board or col_index < 0 or col_index >= len(board.columns):
            return
        col = board.columns[col_index]
        if card_index < 0 or card_index >= len(col.cards):
            return
        card = col.cards[card_index]

        dialog = CardEditDialog(card, self)
        if dialog.exec() == CardEditDialog.Accepted:
            self.board.sync_from_board(board)
            self._load_active_board()
            self.manager.mark_dirty()
            self._update_title()

    def _on_add_column(self) -> None:
        self.board.add_new_column("New Column")
        self.manager.mark_dirty()
        self._update_title()

    # ---------------------------------------------------------
    # File operations
    # ---------------------------------------------------------

    def _on_open(self) -> None:
        path, _ = QFileDialog.getOpenFileName(
            self, "Open Board", "",
            "StaxKB Files (*.json);;All Files (*)",
        )
        if path and self.manager.load(path):
            self._refresh_sidebar()
            self._load_active_board()
            self._update_title()
            self._update_footer()

    def _on_save(self) -> None:
        if self.manager.current_path():
            board = self.manager.active_board()
            if board:
                self.board.sync_from_board(board)
            self.manager.save()
            self._update_title()
        else:
            self._on_save_as()

    def _on_save_as(self) -> None:
        path, _ = QFileDialog.getSaveFileName(
            self, "Save Board", "",
            "StaxKB Files (*.json);;All Files (*)",
        )
        if path:
            board = self.manager.active_board()
            if board:
                self.board.sync_from_board(board)
            self.manager.save(path)
            self._update_title()

    # ---------------------------------------------------------
    # Theme
    # ---------------------------------------------------------

    def apply_theme(self, theme_name: str) -> None:
        theme_dir = Path(__file__).resolve().parents[1] / "themes"
        qss_path = theme_dir / f"{theme_name}.qss"
        if qss_path.exists():
            self.setStyleSheet(qss_path.read_text(encoding="utf-8"))
        else:
            self.setStyleSheet("")

    # ---------------------------------------------------------
    # Title / dirty state
    # ---------------------------------------------------------

    def _update_title(self) -> None:
        title = "StaxKB - Kanban Board"
        board = self.manager.active_board()
        if board and board.name:
            title = f"StaxKB — {board.name}"
        if self.manager.current_path():
            title += f" — {self.manager.current_path()}"
        if self.manager.is_dirty():
            title += " *"
        self.setWindowTitle(title)

    def _update_footer(self) -> None:
        board = self.manager.active_board()
        if board:
            cols = len(board.columns)
            cards = board.total_cards()
        else:
            cols, cards = 0, 0
        self.footer.update_stats(cols, cards)

    def _refresh_footer(self) -> None:
        self._update_footer()

    # ---------------------------------------------------------
    # Close confirmation
    # ---------------------------------------------------------

    def closeEvent(self, event) -> None:  # noqa: N802
        if not self.manager.is_dirty():
            event.accept()
            return

        reply = QMessageBox.question(
            self,
            "Unsaved Changes",
            "This board has unsaved changes. Save before closing?",
            QMessageBox.Save | QMessageBox.Discard | QMessageBox.Cancel,
            QMessageBox.Save,
        )

        if reply == QMessageBox.Save:
            self._on_save()
            if self.manager.is_dirty():
                event.ignore()
            else:
                event.accept()
        elif reply == QMessageBox.Discard:
            event.accept()
        else:
            event.ignore()
