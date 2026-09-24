# SnapBoard (Manta)

A local-first kanban board in the **SnapBoard** family.
Runs entirely on your own machine — no cloud account, no telemetry.

This is the **Manta** line — a Python/Qt reboot of SnapBoard built with
PySide6, companion to **SnapDock**. The original Electron SnapBoard was
archived at v0.2.5 alpha; Manta continues it as the plans say: it lives on the
`manta` branch of the SnapBoard repository.

## Requirements

- Python 3.10 or later
- A desktop environment with a display server (or run headless with
  QT_QPA_PLATFORM=offscreen)

## Installation

`
python -m venv .venv
.\.venv\Scripts\Activate.ps1   # Windows
python -m pip install -e .
`

## Running

`
snapboard-manta                 # open the board
snapboard-manta board.json      # open a board file directly
snapboard-manta --version       # print version
`

## Features

- **Local-first, no account** — everything runs on your machine.
- **Multi-board kanban** — multiple boards, dynamic columns, drag-and-drop cards.
- **Rich cards** — title, description, tags, due date, and subtasks.
- **Search & tag filtering** — Ctrl+F filters cards across every column.
- **Light/dark themes** — remembered between runs.
- **Last board memory** — reopens the board file you were working on.
- **Portable board files** — boards are plain JSON you can open, save, and share.
- **Close confirmation** — never lose unsaved board changes by accident.

Settings live in the SnapBoard family config directory
(`%LOCALAPPDATA%\ZFordDev\SnapBoard` on Windows,
`~/Library/Application Support/ZFordDev/SnapBoard` on macOS,
`~/.config/ZFordDev/SnapBoard` on Linux) inside `settings.json`.
The `SNAPBOARD_CONFIG_DIR` environment variable overrides this location.

## Packaging

A standalone binary is produced with PyInstaller and published as a GitHub Release asset on tagged builds:

`
python -m pip install -e ".[dev]" pyinstaller
pyinstaller --onefile --name snapboard-manta --add-data "snapboard/themes/*:snapboard/themes" snapboard/main.py
`

## Development & tests

`
python -m pip install -e ".[dev]"
python -m unittest discover -s tests -v
`

## Licence

MIT — see [LICENSE](LICENSE).