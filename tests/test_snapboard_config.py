import json
import os
import tempfile
import unittest
from pathlib import Path

from snapboard import config


class ConfigDirTests(unittest.TestCase):
    def setUp(self) -> None:
        self._old = os.environ.get("SNAPBOARD_CONFIG_DIR")
        self._tmp = tempfile.mkdtemp()
        os.environ["SNAPBOARD_CONFIG_DIR"] = self._tmp

    def tearDown(self) -> None:
        if self._old is None:
            os.environ.pop("SNAPBOARD_CONFIG_DIR", None)
        else:
            os.environ["SNAPBOARD_CONFIG_DIR"] = self._old

    def test_config_dir_override(self) -> None:
        self.assertEqual(config.app_config_dir(), Path(self._tmp))
        self.assertTrue(Path(self._tmp).is_dir())

    def test_settings_round_trip(self) -> None:
        settings = config.Settings(
            theme="dark",
            geometry=[100, 200, 300, 400],
            last_board="C:/boards/x.json",
        )
        config.save_settings(settings)
        path = config.settings_path()
        self.assertTrue(path.exists())
        self.assertIsInstance(json.loads(path.read_text(encoding="utf-8")), dict)

        loaded = config.load_settings()
        self.assertEqual(loaded.theme, "dark")
        self.assertEqual(loaded.geometry, [100, 200, 300, 400])
        self.assertEqual(loaded.last_board, "C:/boards/x.json")

    def test_missing_settings_returns_defaults(self) -> None:
        settings = config.load_settings()
        self.assertEqual(settings.theme, "light")
        self.assertIsNone(settings.geometry)
        self.assertIsNone(settings.last_board)


class VersionTests(unittest.TestCase):
    def test_version_reported(self) -> None:
        from snapboard.main import _get_version

        self.assertEqual(_get_version(), "0.3.0")