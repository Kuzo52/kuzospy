"""Точка входа для Bothost: запускает backend/main.py из корня репозитория."""

from __future__ import annotations

import os
import runpy
import sys
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent / "backend"
sys.path.insert(0, str(BACKEND_DIR))
os.chdir(BACKEND_DIR)

runpy.run_path(str(BACKEND_DIR / "main.py"), run_name="__main__")
