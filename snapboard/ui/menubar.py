from __future__ import annotations

from PySide6.QtGui import QAction, QKeySequence
from PySide6.QtWidgets import QMenuBar, QWidget


class SnapBoardMenuBar(QMenuBar):
    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        action_parent = parent if parent is not None else self

        # --- File Menu ---
        file_menu = self.addMenu("File")
        self.action_open = QAction("Open", action_parent)
        self.action_save = QAction("Save", action_parent)
        self.action_save_as = QAction("Save As", action_parent)

        self.action_open.setShortcut(QKeySequence.StandardKey.Open)
        self.action_save.setShortcut(QKeySequence.StandardKey.Save)
        self.action_save_as.setShortcut(QKeySequence("Ctrl+Shift+S"))

        file_menu.addAction(self.action_open)
        file_menu.addAction(self.action_save)
        file_menu.addAction(self.action_save_as)

        # --- Board Menu ---
        board_menu = self.addMenu("Board")
        self.action_add_column = QAction("Add Column", action_parent)
        self.action_add_column.setShortcut(QKeySequence("Ctrl+Shift+C"))
        board_menu.addAction(self.action_add_column)

        self.action_search = QAction("Search Cards", action_parent)
        self.action_search.setShortcut(QKeySequence("Ctrl+F"))
        board_menu.addAction(self.action_search)

        # --- Theme Menu ---
        theme_menu = self.addMenu("Theme")
        self.action_theme_light = QAction("Light", action_parent)
        self.action_theme_dark = QAction("Dark", action_parent)

        theme_menu.addAction(self.action_theme_light)
        theme_menu.addAction(self.action_theme_dark)
