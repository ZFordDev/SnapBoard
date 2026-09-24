# StaxKB

A local-first StaxKB desktop application from the StaxDash **StaxSuite** family.
Runs entirely on your own machine — no cloud account, no telemetry.

Part of the StaxSuite desktop suite (launched by **StaxOffice**), but also runs
standalone via its own command:

`
staxkb
`

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
staxkb                 # open the editor
staxkb file.ext        # open a file directly
`

## Development & tests

`
python -m pip install -e ".[dev]"
python -m unittest discover -s tests -v
`

## Licence

Proprietary — see [EULA.md](EULA.md). Not open-source licensed.