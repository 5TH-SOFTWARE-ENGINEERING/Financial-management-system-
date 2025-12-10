"""Lightweight smoke test to execute the comprehensive hierarchy script."""

import importlib.util
import sys
from pathlib import Path


def test_hierarchy_smoke():
    # Import the existing script (lives alongside this runner) and run main()
    script_path = Path(__file__).resolve().parent / "test_hierarchy.py"
    spec = importlib.util.spec_from_file_location("test_hierarchy_module", script_path)
    module = importlib.util.module_from_spec(spec)
    sys.modules["test_hierarchy_module"] = module
    assert spec.loader is not None
    spec.loader.exec_module(module)

    # Run the script's main routine; it returns True on success
    assert module.main() is True


