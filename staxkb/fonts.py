"""Cross-platform font stacks for StaxOffice.

Each tuple lists families from most specific to most generic.  Qt picks the
first family available on the current platform, so the app looks native
everywhere without hardcoding a single vendor's font.
"""

from __future__ import annotations

from PySide6.QtGui import QFont

UI_HEADING: list[str] = ["Segoe UI Variable Display", "SF Pro Display", "Ubuntu", "sans-serif"]
UI_TEXT: list[str] = ["Segoe UI Variable Text", "SF Pro Text", "Ubuntu", "sans-serif"]
MONO: list[str] = ["Cascadia Code", "Fira Code", "SF Mono", "Menlo", "Consolas", "monospace"]


def make_font(families: list[str], size: int, bold: bool = False) -> QFont:
    """Create a QFont with a cross-platform fallback stack."""
    font = QFont()
    font.setFamilies(families)
    font.setPointSize(size)
    font.setBold(bold)
    return font
