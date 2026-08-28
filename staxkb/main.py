from __future__ import annotations

import sys

from PySide6.QtWidgets import QApplication

from .ui.window import StaxKBWindow


def launch(file_path: str | None = None) -> int:
    app = QApplication.instance()
    if app is None:
        app = QApplication(sys.argv)

    window = StaxKBWindow()
    if file_path:
        window.manager.load(file_path)
        window._refresh_sidebar()
        window._load_active_board()
        window._update_title()
    window.show()

    return app.exec()


def main() -> int:
    return launch(sys.argv[1] if len(sys.argv) > 1 else None)


if __name__ == "__main__":
    sys.exit(main())
