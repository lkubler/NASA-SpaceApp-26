#!/usr/bin/env python3
"""PostToolUse hook: warns the agent after the same Bash command or error 3 times in a row."""
import hashlib
import json
import os
import re
import sys
from pathlib import Path

LIMIT = 3
# Read-only commands that are fine to repeat (polling time, status, logs)
HARMLESS = re.compile(r"^(python3 \S*now\.py|git (status|log|diff|fetch|pull)|ls|cat|pwd|date)\b")


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:  # noqa: BLE001
        return 0
    if data.get("tool_name") != "Bash":
        return 0

    cmd = str((data.get("tool_input") or {}).get("command", "")).strip()
    resp = data.get("tool_response") or {}
    resp_text = json.dumps(resp) if not isinstance(resp, str) else resp
    err = ""
    if isinstance(resp, dict):
        err = str(resp.get("stderr", ""))[-300:]
    looks_failed = any(w in resp_text.lower() for w in ("error", "failed", "not found", "exception", "traceback"))

    root = Path(os.environ.get("CLAUDE_PROJECT_DIR") or data.get("cwd") or ".")
    state_dir = root / "status" / ".loopguard"
    state_dir.mkdir(parents=True, exist_ok=True)
    state_file = state_dir / f"{data.get('session_id', 'default')}.json"
    try:
        st = json.loads(state_file.read_text())
    except Exception:  # noqa: BLE001
        st = {"cmd": "", "cmd_n": 0, "err": "", "err_n": 0}

    h_cmd = hashlib.sha1(cmd.encode()).hexdigest()
    if HARMLESS.match(cmd):
        st["cmd_n"] = 0
    else:
        st["cmd_n"] = st["cmd_n"] + 1 if st["cmd"] == h_cmd else 1
    st["cmd"] = h_cmd

    if looks_failed and err:
        h_err = hashlib.sha1(err.encode()).hexdigest()
        st["err_n"] = st["err_n"] + 1 if st["err"] == h_err else 1
        st["err"] = h_err
    elif not looks_failed:
        st["err"], st["err_n"] = "", 0

    state_file.write_text(json.dumps(st))

    if st["cmd_n"] >= LIMIT or st["err_n"] >= LIMIT:
        why = (f"ran the same command {st['cmd_n']} times in a row" if st["cmd_n"] >= LIMIT
               else f"got the same error {st['err_n']} times in a row")
        print(f"loop_guard: you {why}. Change approach, or follow the 3-attempt rule in CLAUDE.md.",
              file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
