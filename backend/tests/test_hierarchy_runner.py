"""Lightweight smoke test to execute the comprehensive hierarchy script."""

import importlib.util
import sys
import warnings
from pathlib import Path


def test_hierarchy_smoke():
    # Suppress known library deprecations (Pydantic v1 validators, SQLAlchemy legacy APIs, utcnow)
    warnings.filterwarnings("ignore", category=DeprecationWarning)
    try:
        from sqlalchemy.exc import LegacyAPIWarning  # type: ignore
        warnings.filterwarnings("ignore", category=LegacyAPIWarning)
    except Exception:
        pass

    # Import the existing script (lives alongside this runner) and run main()
    script_path = Path(__file__).resolve().parent.parent / "test_hierarchy.py"
    spec = importlib.util.spec_from_file_location("test_hierarchy_module", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["test_hierarchy_module"] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)

    # Run the script's main routine; it returns True on success
    assert module.main() is True


