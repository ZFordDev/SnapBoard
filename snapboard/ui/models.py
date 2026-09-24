"""Data models for SnapBoard — boards, columns, cards with rich metadata."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import date


def _uuid() -> str:
    return uuid.uuid4().hex[:8]


@dataclass
class Subtask:
    title: str
    done: bool = False

    def to_dict(self) -> dict:
        return {"title": self.title, "done": self.done}

    @classmethod
    def from_dict(cls, d: dict) -> Subtask:
        return cls(title=d.get("title", ""), done=d.get("done", False))


@dataclass
class Card:
    id: str = field(default_factory=_uuid)
    title: str = ""
    description: str = ""
    tags: list[str] = field(default_factory=list)
    due_date: str = ""  # ISO format YYYY-MM-DD or empty
    color: str = ""  # hex color or empty for default
    subtasks: list[Subtask] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "description": self.description,
            "tags": list(self.tags),
            "due_date": self.due_date,
            "color": self.color,
            "subtasks": [s.to_dict() for s in self.subtasks],
        }

    @classmethod
    def from_dict(cls, d: dict) -> Card:
        # Handle v1 format where card was just a string
        if isinstance(d, str):
            return cls(title=d)
        return cls(
            id=d.get("id", _uuid()),
            title=d.get("title", ""),
            description=d.get("description", ""),
            tags=list(d.get("tags", [])),
            due_date=d.get("due_date", ""),
            color=d.get("color", ""),
            subtasks=[Subtask.from_dict(s) for s in d.get("subtasks", [])],
        )

    def subtask_progress(self) -> tuple[int, int]:
        total = len(self.subtasks)
        done = sum(1 for s in self.subtasks if s.done)
        return done, total

    def is_overdue(self) -> bool:
        if not self.due_date:
            return False
        try:
            return date.fromisoformat(self.due_date) < date.today()
        except ValueError:
            return False


@dataclass
class Column:
    id: str = field(default_factory=_uuid)
    title: str = ""
    cards: list[Card] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "title": self.title,
            "cards": [c.to_dict() for c in self.cards],
        }

    @classmethod
    def from_dict(cls, d: dict) -> Column:
        return cls(
            id=d.get("id", _uuid()),
            title=d.get("title", ""),
            cards=[Card.from_dict(c) for c in d.get("cards", [])],
        )

    def card_count(self) -> int:
        return len(self.cards)


@dataclass
class Board:
    id: str = field(default_factory=_uuid)
    name: str = "Untitled Board"
    columns: list[Column] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "name": self.name,
            "columns": [c.to_dict() for c in self.columns],
        }

    @classmethod
    def from_dict(cls, d: dict) -> Board:
        return cls(
            id=d.get("id", _uuid()),
            name=d.get("name", "Untitled Board"),
            columns=[Column.from_dict(c) for c in d.get("columns", [])],
        )

    def total_cards(self) -> int:
        return sum(c.card_count() for c in self.columns)


def create_default_board() -> Board:
    return Board(
        name="My Board",
        columns=[
            Column(title="To Do", cards=[
                Card(title="Research competitors", tags=["research"]),
                Card(title="Write project brief", tags=["planning"]),
                Card(title="Design wireframes", tags=["design"]),
            ]),
            Column(title="In Progress", cards=[
                Card(title="Build MVP", tags=["dev"], due_date="2026-08-25"),
                Card(title="Set up CI/CD", tags=["dev", "infra"]),
            ]),
            Column(title="Done", cards=[
                Card(title="Create repo", tags=["dev"]),
                Card(title="Define roadmap", tags=["planning"]),
            ]),
        ],
    )
