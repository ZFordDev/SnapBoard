from __future__ import annotations

from PySide6.QtWidgets import QHBoxLayout, QLabel, QWidget


class SnapBoardFooter(QWidget):
    def __init__(self, version: str) -> None:
        super().__init__()
        self.setObjectName("AppFooter")

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 6, 12, 6)
        layout.setSpacing(20)

        self.stats_label = QLabel("0 boards  |  0 columns  |  0 cards")
        self.stats_label.setObjectName("FooterMetrics")

        self.version_label = QLabel(f"v{version}")
        self.version_label.setObjectName("FooterVersion")

        self.status_label = QLabel("Ready")
        self.status_label.setObjectName("FooterStatus")

        layout.addWidget(self.stats_label)
        layout.addStretch(1)
        layout.addWidget(self.version_label)
        layout.addStretch(1)
        layout.addWidget(self.status_label)

    def update_stats(self, columns: int, cards: int) -> None:
        self.stats_label.setText(f"{columns} columns  |  {cards} cards")

    def update_full_stats(self, boards: int, columns: int, cards: int) -> None:
        self.stats_label.setText(f"{boards} boards  |  {columns} columns  |  {cards} cards")
