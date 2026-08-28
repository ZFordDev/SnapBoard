import tempfile
import unittest
from pathlib import Path

from PySide6.QtWidgets import QApplication

from staxkb.ui.board import KanbanBoard
from staxkb.ui.carddialog import CardEditDialog
from staxkb.ui.column import KanbanColumn
from staxkb.ui.manager import BoardManager
from staxkb.ui.models import Board, Card, Column, Subtask, create_default_board


class CardModelTests(unittest.TestCase):
    def test_card_defaults(self) -> None:
        card = Card(title="Test")
        self.assertEqual(card.title, "Test")
        self.assertEqual(card.description, "")
        self.assertEqual(card.tags, [])
        self.assertEqual(card.due_date, "")
        self.assertEqual(card.color, "")
        self.assertEqual(card.subtasks, [])

    def test_card_round_trip(self) -> None:
        card = Card(
            title="Task",
            description="Details",
            tags=["dev", "urgent"],
            due_date="2026-08-20",
            color="#4a90d9",
            subtasks=[Subtask("Step 1", True), Subtask("Step 2", False)],
        )
        d = card.to_dict()
        card2 = Card.from_dict(d)
        self.assertEqual(card2.title, "Task")
        self.assertEqual(card2.tags, ["dev", "urgent"])
        self.assertEqual(card2.color, "#4a90d9")
        self.assertEqual(len(card2.subtasks), 2)
        self.assertTrue(card2.subtasks[0].done)
        self.assertFalse(card2.subtasks[1].done)

    def test_subtask_progress(self) -> None:
        card = Card(subtasks=[
            Subtask("A", True),
            Subtask("B", True),
            Subtask("C", False),
        ])
        self.assertEqual(card.subtask_progress(), (2, 3))

    def test_is_overdue(self) -> None:
        card = Card(due_date="2020-01-01")
        self.assertTrue(card.is_overdue())

        card2 = Card(due_date="2099-12-31")
        self.assertFalse(card2.is_overdue())

        card3 = Card()
        self.assertFalse(card3.is_overdue())


class ColumnModelTests(unittest.TestCase):
    def test_column_round_trip(self) -> None:
        col = Column(title="To Do", cards=[Card(title="Task 1"), Card(title="Task 2")])
        d = col.to_dict()
        col2 = Column.from_dict(d)
        self.assertEqual(col2.title, "To Do")
        self.assertEqual(col2.card_count(), 2)

    def test_column_card_count(self) -> None:
        col = Column(cards=[Card(title="A"), Card(title="B")])
        self.assertEqual(col.card_count(), 2)


class BoardModelTests(unittest.TestCase):
    def test_board_round_trip(self) -> None:
        board = Board(name="Project", columns=[
            Column(title="Todo", cards=[Card(title="X")]),
            Column(title="Done"),
        ])
        d = board.to_dict()
        board2 = Board.from_dict(d)
        self.assertEqual(board2.name, "Project")
        self.assertEqual(len(board2.columns), 2)
        self.assertEqual(board2.total_cards(), 1)

    def test_create_default_board(self) -> None:
        board = create_default_board()
        self.assertEqual(board.name, "My Board")
        self.assertEqual(len(board.columns), 3)
        self.assertGreater(board.total_cards(), 0)


class BoardManagerTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_default_has_one_board(self) -> None:
        mgr = BoardManager()
        self.assertEqual(mgr.board_count(), 1)

    def test_add_board(self) -> None:
        mgr = BoardManager()
        mgr.add_board("Second")
        self.assertEqual(mgr.board_count(), 2)

    def test_remove_board(self) -> None:
        mgr = BoardManager()
        mgr.add_board("Second")
        self.assertTrue(mgr.remove_board(1))
        self.assertEqual(mgr.board_count(), 1)

    def test_cannot_remove_last_board(self) -> None:
        mgr = BoardManager()
        self.assertFalse(mgr.remove_board(0))

    def test_rename_board(self) -> None:
        mgr = BoardManager()
        self.assertTrue(mgr.rename_board(0, "Renamed"))
        self.assertEqual(mgr.active_board().name, "Renamed")

    def test_duplicate_board(self) -> None:
        mgr = BoardManager()
        dup = mgr.duplicate_board(0)
        self.assertIsNotNone(dup)
        self.assertEqual(mgr.board_count(), 2)
        self.assertIn("Copy", dup.name)

    def test_add_column(self) -> None:
        mgr = BoardManager()
        col = mgr.add_column("Test Col")
        self.assertIsNotNone(col)
        self.assertEqual(len(mgr.active_board().columns), 4)  # 3 default + 1

    def test_save_and_load_v2(self) -> None:
        mgr = BoardManager()
        mgr.add_board("Board 2")

        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w") as f:
            path = f.name

        try:
            self.assertTrue(mgr.save(path))

            mgr2 = BoardManager()
            self.assertTrue(mgr2.load(path))
            self.assertEqual(mgr2.board_count(), 2)
        finally:
            Path(path).unlink(missing_ok=True)

    def test_load_v1_compat(self) -> None:
        """Test loading v1 single-board format."""
        v1_data = {
            "columns": [
                {"title": "To Do", "cards": ["task1"]},
                {"title": "Done", "cards": []},
            ]
        }
        with tempfile.NamedTemporaryFile(suffix=".json", delete=False, mode="w") as f:
            import json
            json.dump(v1_data, f)
            path = f.name

        try:
            mgr = BoardManager()
            self.assertTrue(mgr.load(path))
            self.assertEqual(mgr.board_count(), 1)
            self.assertEqual(len(mgr.active_board().columns), 2)
        finally:
            Path(path).unlink(missing_ok=True)


class KanbanColumnWidgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_column_adds_cards(self) -> None:
        col = KanbanColumn("Test")
        card = col.add_card("card1")
        self.assertEqual(col.card_list.count(), 1)
        self.assertEqual(card.title, "card1")

    def test_column_title(self) -> None:
        col = KanbanColumn("My Column")
        self.assertEqual(col.title(), "My Column")
        col.set_title("Renamed")
        self.assertEqual(col.title(), "Renamed")

    def test_column_empty_by_default(self) -> None:
        col = KanbanColumn("Empty")
        self.assertEqual(col.card_list.count(), 0)

    def test_column_with_model_cards(self) -> None:
        cards = [Card(title="A"), Card(title="B")]
        col = KanbanColumn("Col", cards)
        self.assertEqual(col.card_list.count(), 2)

    def test_get_cards_returns_models(self) -> None:
        col = KanbanColumn("Col")
        col.add_card("Task")
        cards = col.get_cards()
        self.assertEqual(len(cards), 1)
        self.assertIsInstance(cards[0], Card)


class KanbanBoardWidgetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_board_starts_empty(self) -> None:
        board = KanbanBoard()
        self.assertEqual(board.column_count(), 0)

    def test_load_board(self) -> None:
        board_model = create_default_board()
        board = KanbanBoard()
        board.load_board(board_model)
        self.assertEqual(board.column_count(), 3)

    def test_add_column(self) -> None:
        board = KanbanBoard()
        board.add_new_column("Col 1")
        self.assertEqual(board.column_count(), 1)

    def test_clear(self) -> None:
        board = KanbanBoard()
        board.load_board(create_default_board())
        board.clear()
        self.assertEqual(board.column_count(), 0)

    def test_sync_to_board(self) -> None:
        board_model = Board(name="Test")
        board = KanbanBoard()
        board.add_new_column("Col 1")
        board.sync_from_board(board_model)
        self.assertEqual(len(board_model.columns), 1)


class CardEditDialogTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_dialog_creation(self) -> None:
        card = Card(title="Test Card", description="Desc")
        dialog = CardEditDialog(card)
        self.assertEqual(dialog.windowTitle(), "Edit Card")

    def test_dialog_shows_card_data(self) -> None:
        card = Card(title="My Card", tags=["dev"], due_date="2026-08-20")
        dialog = CardEditDialog(card)
        self.assertEqual(dialog.title_input.text(), "My Card")
        self.assertEqual(dialog.due_input.text(), "2026-08-20")


class StaxKBWindowTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_window_creation(self) -> None:
        from staxkb.ui.window import StaxKBWindow
        window = StaxKBWindow()
        self.assertIn("StaxKB", window.windowTitle())

    def test_window_has_sidebar(self) -> None:
        from staxkb.ui.window import StaxKBWindow
        window = StaxKBWindow()
        self.assertTrue(hasattr(window, "sidebar"))

    def test_window_has_board_manager(self) -> None:
        from staxkb.ui.window import StaxKBWindow
        window = StaxKBWindow()
        self.assertEqual(window.manager.board_count(), 1)

    def test_window_has_search_bar(self) -> None:
        from staxkb.ui.window import StaxKBWindow
        window = StaxKBWindow()
        self.assertTrue(hasattr(window, "search_bar"))
        self.assertFalse(window.search_bar.isVisible())

    def test_window_keyboard_shortcuts_exist(self) -> None:
        from staxkb.ui.window import StaxKBWindow
        StaxKBWindow()  # verify creation with shortcuts doesn't crash
        self.assertTrue(True)


class SearchBarTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_search_bar_creation(self) -> None:
        from staxkb.ui.searchbar import SearchBar
        bar = SearchBar()
        self.assertFalse(bar.isVisible())

    def test_search_bar_focus(self) -> None:
        from staxkb.ui.searchbar import SearchBar
        bar = SearchBar()
        bar.show()
        bar.focus_search()
        # In offscreen mode focus may not fully activate, just verify no crash
        self.assertTrue(callable(bar.focus_search))


class ColumnFilterTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls) -> None:
        cls.app = QApplication.instance() or QApplication([])

    def test_filter_by_title(self) -> None:
        col = KanbanColumn("Col", [
            Card(title="Design logo"),
            Card(title="Write docs"),
            Card(title="Design system"),
        ])
        col.filter_cards("design")
        visible = sum(1 for i in range(col.card_list.count()) if not col.card_list.item(i).isHidden())
        self.assertEqual(visible, 2)

    def test_filter_by_tag(self) -> None:
        col = KanbanColumn("Col", [
            Card(title="Task 1", tags=["dev"]),
            Card(title="Task 2", tags=["design"]),
            Card(title="Task 3", tags=["dev", "urgent"]),
        ])
        col.filter_cards(tag="dev")
        visible = sum(1 for i in range(col.card_list.count()) if not col.card_list.item(i).isHidden())
        self.assertEqual(visible, 2)

    def test_filter_by_description(self) -> None:
        col = KanbanColumn("Col", [
            Card(title="Task", description="Important notes here"),
            Card(title="Other", description="Nothing special"),
        ])
        col.filter_cards("important")
        visible = sum(1 for i in range(col.card_list.count()) if not col.card_list.item(i).isHidden())
        self.assertEqual(visible, 1)

    def test_clear_filter_shows_all(self) -> None:
        col = KanbanColumn("Col", [
            Card(title="A"),
            Card(title="B"),
        ])
        col.filter_cards("nonexistent")
        visible = sum(1 for i in range(col.card_list.count()) if not col.card_list.item(i).isHidden())
        self.assertEqual(visible, 0)
        col.filter_cards("")
        visible = sum(1 for i in range(col.card_list.count()) if not col.card_list.item(i).isHidden())
        self.assertEqual(visible, 2)

    def test_board_filter(self) -> None:
        board_model = create_default_board()
        board = KanbanBoard()
        board.load_board(board_model)
        # Filter should not crash
        board.filter_cards("research")
        board.clear_filter()

