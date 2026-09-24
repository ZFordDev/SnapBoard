"""Local-first settings for SnapBoard.

SnapBoard remembers a few things between runs — theme, window geometry, and the
last board file — in a single JSON settings file inside a platform-appropriate
ZFordDev config directory. No cloud, no accounts.
"""

from __future__ import annotations

import contextlib
import json
import os
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

SETTINGS_FILENAME = "settings.json"
DEFAULT_THEME = "light"


def _default_config_dir() -> Path:
    if sys.platform.startswith("win"):
        base = os.environ.get("LOCALAPPDATA") or os.path.expanduser("~")
        return Path(base) / "ZFordDev" / "SnapBoard"
    if sys.platform == "darwin":
        return Path.home() / "Library" / "Application Support" / "ZFordDev" / "SnapBoard"
    return Path.home() / ".config" / "ZFordDev" / "SnapBoard"


def app_config_dir() -> Path:
    override = os.environ.get("SNAPBOARD_CONFIG_DIR")
    base = Path(override) if override else _default_config_dir()
    base.mkdir(parents=True, exist_ok=True)
    return base


def settings_path() -> Path:
    return app_config_dir() / SETTINGS_FILENAME


@dataclass
class Settings:
    theme: str = DEFAULT_THEME
    geometry: list[int] | None = None
    last_board: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "theme": self.theme,
            "geometry": self.geometry,
            "last_board": self.last_board,
        }


def load_settings() -> Settings:
    path = settings_path()
    if not path.exists():
        return Settings()
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return Settings()
    return Settings(
        theme=str(data.get("theme", DEFAULT_THEME)),
        geometry=data.get("geometry"),
        last_board=data.get("last_board"),
    )


def save_settings(settings: Settings) -> None:
    path = settings_path()
    # Persistence is best-effort; never crash the app over a write failure.
    with contextlib.suppress(Exception):
        path.write_text(json.dumps(settings.to_dict(), indent=2), encoding="utf-8")