#!/usr/bin/env python3
"""Status line: shows time/phase and plan usage, and saves the plan's rate limits
(Claude Code passes them on stdin) to status/limits.json for scripts/tokens.py."""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def pct(window):
    if not isinstance(window, dict):
        return None
    for key in ("used_percentage", "utilization", "used_pct"):
        if isinstance(window.get(key), (int, float)):
            return float(window[key])
    return None


def reset(window):
    if not isinstance(window, dict):
        return None
    v = window.get("resets_at")
    if isinstance(v, (int, float)):
        return datetime.fromtimestamp(v, timezone.utc).isoformat()
    return v if isinstance(v, str) else None


def main():
    try:
        data = json.load(sys.stdin)
    except Exception:  # noqa: BLE001
        data = {}
    rl = data.get("rate_limits") or {}
    snap = {
        "updated": datetime.now(timezone.utc).isoformat(),
        "five_hour": {"pct": pct(rl.get("five_hour")), "resets_at": reset(rl.get("five_hour"))},
        "seven_day": {"pct": pct(rl.get("seven_day")), "resets_at": reset(rl.get("seven_day"))},
    }
    if snap["five_hour"]["pct"] is not None or snap["seven_day"]["pct"] is not None:
        try:
            out = ROOT / "status" / "limits.json"
            out.parent.mkdir(exist_ok=True)
            out.write_text(json.dumps(snap, indent=2))
        except Exception:  # noqa: BLE001
            pass

    try:
        t = subprocess.run([sys.executable, str(ROOT / "scripts" / "now.py"), "--short"],
                           capture_output=True, text=True, timeout=5).stdout.strip()
        t = t.replace("[TIME] ", "").split(" | ")[:3]
        t = " | ".join(t)
    except Exception:  # noqa: BLE001
        t = ""
    s, w = snap["five_hour"]["pct"], snap["seven_day"]["pct"]
    usage = f"session {s:.0f}% · week {w:.0f}%" if s is not None and w is not None else ""
    print(" | ".join(x for x in (t, usage) if x))


if __name__ == "__main__":
    main()
