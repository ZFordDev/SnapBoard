"""Kanban column — Kanri-style with rich cards, drag-drop, and column management."""

from __future__ import annotations

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import (
    QAbstractItemView,
    QHBoxLayout,
    QLabel,
    QLineEdit,
    QListWidget,
    QListWidgetItem,
    QMenu,
    QPushButton,
    QVBoxLayout,
    QWidget,
)

from .models import Card


class KanbanCardList(QListWidget):
    """Drag-drop enabled card list."""

    card_dropped = Signal(object, int, object)  # source_list, drop_index, target_list
    card_double_clicked = Signal(int)  # card index

    def __init__(self, parent: QWidget | None = None) -> None:
        super().__init__(parent)
        self.setDragEnabled(True)
        self.setAcceptDrops(True)
        self.setDropIndicatorShown(True)
        self.setDragDropMode(QAbstractItemView.DragDrop)
        self.setDefaultDropAction(Qt.MoveAction)
        self.setSelectionMode(QAbstractItemView.SingleSelection)
        self.setSpacing(4)
        self.setMinimumHeight(80)
        self.setUniformItemSizes(False)

    def dragEnterEvent(self, event) -> None:
        if event.mimeData().hasText():
            event.acceptProposedAction()
        else:
            super().dragEnterEvent(event)

    def dragMoveEvent(self, event) -> None:
        if event.mimeData().hasText():
            event.acceptProposedAction()
        else:
            super().dragMoveEvent(event)

    def dropEvent(self, event) -> None:
        source = event.source()
        if isinstance(source, KanbanCardList) and source is not self:
            row = self.row(self.itemAt(event.position().toPoint()))
            if row < 0:
                row = self.count()
            event.acceptProposedAction()
            self.card_dropped.emit(source, row, self)
        else:
            super().dropEvent(event)

    def mouseDoubleClickEvent(self, event) -> None:
        item = self.itemAt(event.pos())
        if item:
            row = self.row(item)
            self.card_double_clicked.emit(row)
        super().mouseDoubleClickEvent(event)

    def contextMenuEvent(self, event) -> None:
        item = self.itemAt(event.pos())
        if item is None:
            return
        menu = QMenu(self)
        edit_action = menu.addAction("Edit card")
        menu.addSeparator()
        delete_action = menu.addAction("Delete card")
        action = menu.exec(event.globalPos())
        if action == edit_action:
            self.card_double_clicked.emit(self.row(item))
        elif action == delete_action:
            self.takeItem(self.row(item))


class KanbanColumn(QWidget):
    """Kanri-style column with header, card list, and add card input."""

    card_added = Signal(str)  # card title
    card_deleted = Signal(int)  # card index
    card_moved = Signal(object, int, object)  # source_list, drop_index, target_list
    card_edit_requested = Signal(int)  # card index
    column_renamed = Signal(str)  # new title
    column_delete_requested = Signal()

    def __init__(self, title: str, cards: list[Card] | None = None) -> None:
        super().__init__()
        self.setObjectName("KanbanColumn")
        self.setMinimumWidth(260)
        self.setMaximumWidth(380)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        # --- Column header ---
        header = QHBoxLayout()
        header.setSpacing(6)

        self.title_label = QLabel(title)
        self.title_label.setObjectName("ColumnTitle")
        header.addWidget(self.title_label, 1)

        self.card_count_label = QLabel("0")
        self.card_count_label.setObjectName("CardCount")
        self.card_count_label.setAlignment(Qt.AlignCenter)
        self.card_count_label.setFixedSize(24, 20)
        header.addWidget(self.card_count_label)

        menu_btn = QPushButton("⋯")
        menu_btn.setObjectName("ColumnMenuBtn")
        menu_btn.setFixedSize(24, 24)
        menu_btn.clicked.connect(self._show_menu)
        header.addWidget(menu_btn)

        layout.addLayout(header)

        # --- Card list ---
        self.card_list = KanbanCardList()
        self.card_list.card_dropped.connect(self.card_moved)
        self.card_list.card_double_clicked.connect(self.card_edit_requested)
        layout.addWidget(self.card_list, 1)

        # --- Add card input ---
        input_row = QHBoxLayout()
        input_row.setSpacing(4)
        self.card_input = QLineEdit()
        self.card_input.setPlaceholderText("Add a card...")
        self.card_input.returnPressed.connect(self._add_card)
        input_row.addWidget(self.card_input)

        add_btn = QPushButton("+")
        add_btn.setObjectName("AddCardBtn")
        add_btn.setFixedWidth(32)
        add_btn.clicked.connect(self._add_card)
        input_row.addWidget(add_btn)

        layout.addLayout(input_row)

        # Populate cards
        if cards:
            for card in cards:
                self.add_card_widget(card)

        self._update_count()

    # ---------------------------------------------------------
    # Card operations
    # ---------------------------------------------------------

    def add_card_widget(self, card: Card) -> None:
        """Add a card to the list with visual indicators."""
        item = QListWidgetItem()
        item.setFlags(item.flags() | Qt.ItemIsEditable)
        item.setData(Qt.UserRole, card)
        item.setData(Qt.UserRole + 1, card.title)  # For drag text

        # Build display text with indicators
        display = card.title
        indicators = []

        if card.description:
            indicators.append("📝")
        if card.subtasks:
            done, total = card.subtask_progress()
            indicators.append(f"☑ {done}/{total}")
        if card.due_date:
            if card.is_overdue():
                indicators.append(f"⚠ {card.due_date}")
            else:
                indicators.append(f"📅 {card.due_date}")
        if card.tags:
            indicators.append("🏷 " + " ".join(card.tags[:3]))

        if indicators:
            display += "\n" + "  ".join(indicators)

        item.setText(display)

        # Card color indicator (left border via foreground)
        if card.color:
            item.setForeground(Qt.transparent)  # placeholder

        self.card_list.addItem(item)
        self._update_count()

    def add_card(self, title: str) -> Card:
        """Add a new card with just a title, return the card object."""
        card = Card(title=title)
        self.add_card_widget(card)
        self.card_added.emit(title)
        return card

    def get_cards(self) -> list[Card]:
        cards = []
        for i in range(self.card_list.count()):
            item = self.card_list.item(i)
            card = item.data(Qt.UserRole)
            if card:
                cards.append(card)
        return cards

    def get_card_texts(self) -> list[str]:
        return [c.title for c in self.get_cards()]

    def set_title(self, title: str) -> None:
        self.title_label.setText(title)

    def title(self) -> str:
        return self.title_label.text()

    def _update_count(self) -> None:
        visible = sum(1 for i in range(self.card_list.count()) if not self.card_list.item(i).isHidden())
        total = self.card_list.count()
        if visible == total:
            self.card_count_label.setText(str(total))
        else:
            self.card_count_label.setText(f"{visible}/{total}")

    def filter_cards(self, query: str = "", tag: str = "") -> None:
        """Show/hide cards based on search query and tag filter."""
        query_lower = query.lower()
        for i in range(self.card_list.count()):
            item = self.card_list.item(i)
            card = item.data(Qt.UserRole)
            if not card:
                item.setHidden(False)
                continue

            match = True
            if query_lower:
                title_match = query_lower in card.title.lower()
                desc_match = query_lower in card.description.lower()
                tag_match = any(query_lower in t.lower() for t in card.tags)
                match = title_match or desc_match or tag_match

            if match and tag:
                tag_lower = tag.lower()
                match = any(tag_lower in t.lower() for t in card.tags)

            item.setHidden(not match)

        self._update_count()

    # ---------------------------------------------------------
    # Add card
    # ---------------------------------------------------------

    def _add_card(self) -> None:
        text = self.card_input.text().strip()
        if text:
            self.add_card(text)
            self.card_input.clear()

    # ---------------------------------------------------------
    # Context menu
    # ---------------------------------------------------------

    def _show_menu(self) -> None:
        menu = QMenu(self)
        rename_action = menu.addAction("Rename column")
        delete_action = menu.addAction("Delete column")

        action = menu.exec(self.mapToGlobal(self.rect().topRight()))
        if action == rename_action:
            self._start_rename()
        elif action == delete_action:
            self.column_delete_requested.emit()

    def _start_rename(self) -> None:
        """Switch title label to inline edit."""
        self.title_label.hide()
        self._rename_input = QLineEdit(self.title_label.text())
        self._rename_input.setStyleSheet("font-weight: bold; font-size: 14px; padding: 4px;")
        self._rename_input.returnPressed.connect(self._finish_rename)
        self._rename_input.editingFinished.connect(self._finish_rename)

        # Replace title in the header layout
        layout = self.layout()
        if layout:
            header_layout = layout.itemAt(0)
            if header_layout:
                header_layout.insertWidget(0, self._rename_input)
                self._rename_input.setFocus()
                self._rename_input.selectAll()

    def _finish_rename(self) -> None:
        if hasattr(self, "_rename_input"):
            new_title = self._rename_input.text().strip()
            if new_title:
                self.title_label.setText(new_title)
                self.column_renamed.emit(new_title)
            self._rename_input.deleteLater()
            del self._rename_input
            self.title_label.show()
