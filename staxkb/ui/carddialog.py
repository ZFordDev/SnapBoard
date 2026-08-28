"""Card edit dialog — Kanri-style rich card editing with description, tags, due date, subtasks, color."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QCheckBox,
    QColorDialog,
    QDialog,
    QDialogButtonBox,
    QFrame,
    QHBoxLayout,
    QHeaderView,
    QLabel,
    QLineEdit,
    QPlainTextEdit,
    QPushButton,
    QScrollArea,
    QTableWidget,
    QTableWidgetItem,
    QVBoxLayout,
    QWidget,
)

from .models import Card, Subtask

# Preset card colors
CARD_COLORS = [
    ("", "Default"),
    ("#4a90d9", "Blue"),
    ("#5cb85c", "Green"),
    ("#f0ad4e", "Yellow"),
    ("#d9534f", "Red"),
    ("#9b59b6", "Purple"),
    ("#1abc9c", "Teal"),
    ("#e67e22", "Orange"),
    ("#95a5a6", "Gray"),
]


class CardEditDialog(QDialog):
    """Kanri-inspired card editing dialog with all card properties."""

    card_updated = Signal(object)  # Card

    def __init__(self, card: Card, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.card = card
        self.setWindowTitle("Edit Card")
        self.setMinimumSize(520, 560)

        root = QVBoxLayout(self)

        # Scroll area for long content
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll_widget = QWidget()
        scroll_layout = QVBoxLayout(scroll_widget)
        scroll_layout.setContentsMargins(16, 16, 16, 16)
        scroll_layout.setSpacing(12)

        # --- Title ---
        self.title_input = QLineEdit(card.title)
        self.title_input.setPlaceholderText("Card title...")
        self.title_input.setStyleSheet("font-size: 16px; font-weight: bold; padding: 6px;")
        scroll_layout.addWidget(self.title_input)

        # --- Color picker row ---
        color_row = QHBoxLayout()
        color_row.addWidget(QLabel("Color:"))
        self._color = card.color
        self._color_btn = QPushButton()
        self._color_btn.setFixedSize(28, 28)
        self._color_btn.setCursor(Qt.PointingHandCursor)
        self._color_btn.clicked.connect(self._pick_color)
        self._update_color_btn()
        color_row.addWidget(self._color_btn)

        for hex_color, name in CARD_COLORS:
            btn = QPushButton()
            btn.setFixedSize(22, 22)
            btn.setToolTip(name)
            btn.setCursor(Qt.PointingHandCursor)
            if hex_color:
                btn.setStyleSheet(
                    f"QPushButton {{ background-color: {hex_color}; border: 1px solid #999; border-radius: 4px; }}"
                    "QPushButton:hover { border: 2px solid #333; }"
                )
            else:
                btn.setStyleSheet(
                    "QPushButton { background-color: #fff; border: 1px solid #ccc; border-radius: 4px; }"
                    "QPushButton:hover { border: 2px solid #333; }"
                )
            btn.clicked.connect(lambda checked, c=hex_color: self._set_color(c))
            color_row.addWidget(btn)

        color_row.addStretch()
        scroll_layout.addLayout(color_row)

        # --- Separator ---
        scroll_layout.addWidget(self._separator())

        # --- Description ---
        desc_label = QLabel("Description")
        desc_label.setStyleSheet("font-weight: bold; font-size: 13px;")
        scroll_layout.addWidget(desc_label)

        self.desc_input = QPlainTextEdit()
        self.desc_input.setPlaceholderText("Add a more detailed description...")
        self.desc_input.setPlainText(card.description)
        self.desc_input.setMinimumHeight(100)
        self.desc_input.setMaximumHeight(200)
        scroll_layout.addWidget(self.desc_input)

        # --- Separator ---
        scroll_layout.addWidget(self._separator())

        # --- Tags ---
        tags_label = QLabel("Tags")
        tags_label.setStyleSheet("font-weight: bold; font-size: 13px;")
        scroll_layout.addWidget(tags_label)

        tags_row = QHBoxLayout()
        self.tags_input = QLineEdit()
        self.tags_input.setPlaceholderText("Add tag and press Enter")
        self.tags_input.returnPressed.connect(self._add_tag)
        tags_row.addWidget(self.tags_input)

        add_tag_btn = QPushButton("Add")
        add_tag_btn.setFixedWidth(50)
        add_tag_btn.clicked.connect(self._add_tag)
        tags_row.addWidget(add_tag_btn)
        scroll_layout.addLayout(tags_row)

        self._tags_container = QWidget()
        self._tags_layout = QHBoxLayout(self._tags_container)
        self._tags_layout.setContentsMargins(0, 0, 0, 0)
        self._tags_layout.setSpacing(4)
        self._tags_layout.addStretch()
        scroll_layout.addWidget(self._tags_container)
        self._refresh_tags()

        # --- Separator ---
        scroll_layout.addWidget(self._separator())

        # --- Due Date ---
        due_row = QHBoxLayout()
        due_label = QLabel("Due Date:")
        due_label.setStyleSheet("font-weight: bold; font-size: 13px;")
        due_row.addWidget(due_label)

        self.due_input = QLineEdit()
        self.due_input.setPlaceholderText("YYYY-MM-DD")
        self.due_input.setText(card.due_date)
        self.due_input.setMaximumWidth(150)
        due_row.addWidget(self.due_input)
        due_row.addStretch()
        scroll_layout.addLayout(due_row)

        if card.is_overdue():
            overdue_label = QLabel("⚠ Overdue")
            overdue_label.setStyleSheet("color: #d9534f; font-weight: bold;")
            scroll_layout.addWidget(overdue_label)

        # --- Separator ---
        scroll_layout.addWidget(self._separator())

        # --- Subtasks ---
        subtasks_header = QHBoxLayout()
        subtasks_label = QLabel("Subtasks")
        subtasks_label.setStyleSheet("font-weight: bold; font-size: 13px;")
        subtasks_header.addWidget(subtasks_label)

        self._subtask_progress = QLabel()
        subtasks_header.addWidget(self._subtask_progress)
        subtasks_header.addStretch()
        scroll_layout.addLayout(subtasks_header)

        self._subtasks_table = QTableWidget()
        self._subtasks_table.setColumnCount(2)
        self._subtasks_table.setHorizontalHeaderLabels(["Task", "Done"])
        self._subtasks_table.horizontalHeader().setSectionResizeMode(0, QHeaderView.Stretch)
        self._subtasks_table.horizontalHeader().setSectionResizeMode(1, QHeaderView.ResizeToContents)
        self._subtasks_table.verticalHeader().setVisible(False)
        self._subtasks_table.setSelectionBehavior(QTableWidget.SelectRows)
        self._subtasks_table.setMinimumHeight(120)
        self._subtasks_table.setMaximumHeight(250)
        scroll_layout.addWidget(self._subtasks_table)
        self._load_subtasks()

        # Add subtask row
        add_sub_row = QHBoxLayout()
        self._subtask_input = QLineEdit()
        self._subtask_input.setPlaceholderText("New subtask...")
        self._subtask_input.returnPressed.connect(self._add_subtask)
        add_sub_row.addWidget(self._subtask_input)

        add_sub_btn = QPushButton("+")
        add_sub_btn.setFixedWidth(32)
        add_sub_btn.clicked.connect(self._add_subtask)
        add_sub_row.addWidget(add_sub_btn)

        del_sub_btn = QPushButton("−")
        del_sub_btn.setFixedWidth(32)
        del_sub_btn.setToolTip("Remove selected subtask")
        del_sub_btn.clicked.connect(self._remove_subtask)
        add_sub_row.addWidget(del_sub_btn)
        scroll_layout.addLayout(add_sub_row)

        scroll_layout.addStretch()
        scroll.setWidget(scroll_widget)
        root.addWidget(scroll, 1)

        # --- Dialog buttons ---
        buttons = QDialogButtonBox(QDialogButtonBox.Save | QDialogButtonBox.Cancel)
        buttons.accepted.connect(self._on_save)
        buttons.rejected.connect(self.reject)
        root.addWidget(buttons)

    def _separator(self) -> QFrame:
        line = QFrame()
        line.setFrameShape(QFrame.HLine)
        line.setFrameShadow(QFrame.Sunken)
        return line

    # ---------------------------------------------------------
    # Color
    # ---------------------------------------------------------

    def _set_color(self, color: str) -> None:
        self._color = color
        self._update_color_btn()

    def _update_color_btn(self) -> None:
        if self._color:
            self._color_btn.setStyleSheet(
                f"QPushButton {{ background-color: {self._color}; border: 1px solid #999; border-radius: 4px; }}"
            )
        else:
            self._color_btn.setStyleSheet(
                "QPushButton { background-color: #fff; border: 1px solid #ccc; border-radius: 4px; }"
            )

    def _pick_color(self) -> None:
        from PySide6.QtGui import QColor

        color = QColorDialog.getColor(QColor(self._color or "#ffffff"), self, "Card Color")
        if color.isValid():
            self._set_color(color.name())

    # ---------------------------------------------------------
    # Tags
    # ---------------------------------------------------------

    def _add_tag(self) -> None:
        text = self.tags_input.text().strip()
        if text and text not in self.card.tags:
            self.card.tags.append(text)
            self._refresh_tags()
        self.tags_input.clear()

    def _remove_tag(self, tag: str) -> None:
        if tag in self.card.tags:
            self.card.tags.remove(tag)
            self._refresh_tags()

    def _refresh_tags(self) -> None:
        # Clear existing tag widgets
        while self._tags_layout.count():
            item = self._tags_layout.takeAt(0)
            w = item.widget()
            if w:
                w.deleteLater()

        for tag in self.card.tags:
            tag_widget = self._make_tag_widget(tag)
            self._tags_layout.addWidget(tag_widget)

        self._tags_layout.addStretch()

    def _make_tag_widget(self, tag: str) -> QWidget:
        container = QWidget()
        layout = QHBoxLayout(container)
        layout.setContentsMargins(6, 2, 4, 2)
        layout.setSpacing(2)
        container.setStyleSheet(
            "QWidget { background-color: #e1e4e8; border-radius: 10px; }"
        )

        label = QLabel(tag)
        label.setStyleSheet("font-size: 11px; color: #24292e; background: transparent;")
        layout.addWidget(label)

        close_btn = QPushButton("×")
        close_btn.setFixedSize(16, 16)
        close_btn.setStyleSheet(
            "QPushButton { border: none; font-size: 12px; color: #666; background: transparent; }"
            "QPushButton:hover { color: #d9534f; }"
        )
        close_btn.clicked.connect(lambda: self._remove_tag(tag))
        layout.addWidget(close_btn)

        return container

    # ---------------------------------------------------------
    # Subtasks
    # ---------------------------------------------------------

    def _load_subtasks(self) -> None:
        self._subtasks_table.setRowCount(len(self.card.subtasks))
        for i, sub in enumerate(self.card.subtasks):
            title_item = QTableWidgetItem(sub.title)
            self._subtasks_table.setItem(i, 0, title_item)

            done_cb = QCheckBox()
            done_cb.setChecked(sub.done)
            done_cb.stateChanged.connect(lambda state, idx=i: self._on_subtask_toggled(idx, state))
            cell_widget = QWidget()
            cb_layout = QHBoxLayout(cell_widget)
            cb_layout.addWidget(done_cb)
            cb_layout.setAlignment(Qt.AlignCenter)
            cb_layout.setContentsMargins(0, 0, 0, 0)
            self._subtasks_table.setCellWidget(i, 1, cell_widget)

        self._update_progress()

    def _on_subtask_toggled(self, index: int, state: int) -> None:
        if 0 <= index < len(self.card.subtasks):
            self.card.subtasks[index].done = state == Qt.Checked.value
            self._update_progress()

    def _update_progress(self) -> None:
        done, total = self.card.subtask_progress()
        self._subtask_progress.setText(f"{done}/{total}")

    def _add_subtask(self) -> None:
        text = self._subtask_input.text().strip()
        if text:
            self.card.subtasks.append(Subtask(title=text))
            self._load_subtasks()
            self._subtask_input.clear()

    def _remove_subtask(self) -> None:
        row = self._subtasks_table.currentRow()
        if 0 <= row < len(self.card.subtasks):
            self.card.subtasks.pop(row)
            self._load_subtasks()

    # ---------------------------------------------------------
    # Save
    # ---------------------------------------------------------

    def _on_save(self) -> None:
        self.card.title = self.title_input.text().strip() or "Untitled"
        self.card.description = self.desc_input.toPlainText()
        self.card.due_date = self.due_input.text().strip()
        self.card.color = self._color

        # Sync subtask titles from table
        for i, sub in enumerate(self.card.subtasks):
            item = self._subtasks_table.item(i, 0)
            if item:
                sub.title = item.text()

        self.card_updated.emit(self.card)
        self.accept()
