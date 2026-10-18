#!/usr/bin/env python3
"""Olympus write-scope guard for Claude Code (PreToolUse hook).

Usage inside an agent's frontmatter:
    python3 .claude/hooks/olympus_guard.py --role aegis --allow knowledge/security/

Blocks Write/Edit/MultiEdit/NotebookEdit calls whose target path falls outside
the allowed repository prefixes (exit code 2 = block, reason on stderr).

This narrows accidental writes by file-editing tools only. It is NOT a sandbox:
shell commands can still write files, so the runtime permission/sandbox settings
remain the real security boundary.
"""
import argparse
import json
import os
import sys
from pathlib import Path

WRITE_TOOLS = {"Write", "Edit", "MultiEdit", "NotebookEdit"}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--role", required=True)
    ap.add_argument("--allow", action="append", default=[], help="repo-relative prefix (dir/ or exact file)")
    args = ap.parse_args()

    try:
        payload = json.load(sys.stdin)
    except Exception:
        return 0  # malformed input: do not interfere

    if payload.get("tool_name") not in WRITE_TOOLS:
        return 0
    tin = payload.get("tool_input") or {}
    target = tin.get("file_path") or tin.get("notebook_path") or tin.get("path")
    if not target:
        return 0

    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or payload.get("cwd") or os.getcwd()).resolve()
    p = Path(target)
    p = (p if p.is_absolute() else root / p).resolve()
    try:
        rel = p.relative_to(root).as_posix()
    except ValueError:
        print(f"Olympus guard: {args.role} may not write outside the repository ({target}).", file=sys.stderr)
        return 2

    for prefix in args.allow:
        if prefix.endswith("/"):
            if rel.startswith(prefix):
                return 0
        elif rel == prefix:
            return 0

    allowed = ", ".join(args.allow) or "nothing"
    print(
        f"Olympus guard: role '{args.role}' may only write to {allowed}; blocked '{rel}'. "
        "Return a handoff to the coordinator instead of editing this file.",
        file=sys.stderr,
    )
    return 2


if __name__ == "__main__":
    sys.exit(main())
