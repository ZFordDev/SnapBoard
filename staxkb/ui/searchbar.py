"""Search/filter bar for StaxKB — filters cards across all columns by title, tags, description."""

from __future__ import annotations

from PySide6.QtCore import Signal
from PySide6.QtWidgets import (
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QPushButton,
    QWidget,
)


class SearchBar(QWidget):
    """Horizontal search bar with filter input, tag filter, and clear button."""

    search_changed = Signal(str)  # query text
    filter_tag_changed = Signal(str)  # tag filter or empty
    close_requested = Signal()

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setObjectName("SearchBar")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 6, 12, 6)
        layout.setSpacing(8)

        # Search icon
        icon_label = QLabel("🔍")
        icon_label.setStyleSheet("font-size: 14px; background: transparent;")
        layout.addWidget(icon_label)

        # Search input
        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("Search cards...")
        self.search_input.setClearButtonEnabled(True)
        self.search_input.textChanged.connect(self.search_changed)
        layout.addWidget(self.search_input, 1)

        # Tag filter
        tag_label = QLabel("Tag:")
        tag_label.setStyleSheet("background: transparent; font-size: 12px;")
        layout.addWidget(tag_label)

        self.tag_input = QLineEdit()
        self.tag_input.setPlaceholderText("filter by tag")
        self.tag_input.setMaximumWidth(120)
        self.tag_input.textChanged.connect(self.filter_tag_changed)
        layout.addWidget(self.tag_input)

        # Close button
        close_btn = QPushButton("✕")
        close_btn.setFixedSize(24, 24)
        close_btn.setToolTip("Close search (Esc)")
        close_btn.clicked.connect(self.close_requested.emit)
        layout.addWidget(close_btn)

    def focus_search(self) -> None:
        self.search_input.setFocus()
        self.search_input.selectAll()

    def get_query(self) -> str:
        return self.search_input.text().strip()

    def get_tag_filter(self) -> str:
        return self.tag_input.text().strip()
