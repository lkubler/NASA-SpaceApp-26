#!/usr/bin/env python3
"""Plan-usage mode for the orchestrator loop. Only relevant for /loop rounds.

Sources:
  1. status/limits.json: real session (5 h) and weekly usage %, written by scripts/statusline.py
     from the data Claude Code passes to the status line.
  2. Fallback: session-limit errors in ~/.claude/projects transcripts (weekly then unknown).

Modes (thresholds in config/budget.json):
  normal   all fine
  save     weekly >= weekly_save_pct: cheaper models, fewer agents
  wait     session limit (nearly) used up: next round after the session reset
  stop     weekly >= weekly_max_pct: start no more agents until the weekly reset

Usage: tokens.py [--short] | tokens.py --hook  (UserPromptSubmit: prints only for loop prompts)
"""
import json
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = Path.home() / ".claude" / "projects"
LOOP_MARKERS = ("ORCHESTRATOR.md", "/loop", "autonomous-loop")


def load(path, default):
    try:
        return json.loads(Path(path).read_text())
    except Exception:  # noqa: BLE001
        return default


def iso(v):
    try:
        return datetime.fromisoformat(str(v).replace("Z", "+00:00"))
    except Exception:  # noqa: BLE001
        return None


def last_session_hit(since):
    """Most recent 'session limit' API error in transcripts after `since`, with its reset text."""
    hit = None
    for f in PROJECTS.rglob("*.jsonl"):
        try:
            if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < since:
                continue
            for line in f.open(errors="ignore"):
                if '"rate_limit"' not in line or "isApiErrorMessage" not in line:
                    continue
                o = json.loads(line)
                ts = iso(o.get("timestamp"))
                if o.get("error") == "rate_limit" and ts and ts >= since and (not hit or ts > hit[0]):
                    text = json.dumps(o.get("message", {}).get("content", ""))
                    hit = (ts, text.split("resets")[-1].strip(' "]}').split("(")[0].strip() if "resets" in text else "?")
        except Exception:  # noqa: BLE001
            continue
    return hit


def main():
    if "--hook" in sys.argv:
        try:
            prompt = json.load(sys.stdin).get("prompt", "")
        except Exception:  # noqa: BLE001
            prompt = ""
        if not any(m in prompt for m in LOOP_MARKERS):
            return
    short = "--short" in sys.argv or "--hook" in sys.argv

    cfg = load(ROOT / "config" / "budget.json", {})
    max_pct = cfg.get("weekly_max_pct", 90)
    save_pct = cfg.get("weekly_save_pct", 80)
    now = datetime.now(timezone.utc)

    lim = load(ROOT / "status" / "limits.json", {})
    fresh = iso(lim.get("updated")) and now - iso(lim["updated"]) < timedelta(minutes=30)
    s = (lim.get("five_hour") or {}).get("pct") if fresh else None
    w = (lim.get("seven_day") or {}).get("pct") if fresh else None
    s_reset = iso((lim.get("five_hour") or {}).get("resets_at"))
    w_reset = iso((lim.get("seven_day") or {}).get("resets_at"))

    hit = last_session_hit(now - timedelta(hours=5))
    hit_active = hit and (s_reset is None or hit[0] > now - timedelta(minutes=30))

    if w is not None and w >= max_pct:
        mode, why = "stop", f"weekly {w:.0f}% >= {max_pct}% cap"
    elif (s is not None and s >= 98) or (s is None and hit_active):
        mode, why = "wait", "session limit used up"
    elif w is not None and w >= save_pct:
        mode, why = "save", f"weekly {w:.0f}% >= {save_pct}%"
    else:
        mode, why = "normal", ""

    def t(d):
        return d.astimezone().strftime("%a %H:%M") if d else "?"

    parts = [f"mode: {mode}" + (f" ({why})" if why else "")]
    parts.append(f"session {s:.0f}% (resets {t(s_reset)})" if s is not None else
                 ("session limit hit, resets " + hit[1] if hit_active else "session: unknown"))
    parts.append(f"week {w:.0f}% of {max_pct}% cap (resets {t(w_reset)})" if w is not None else
                 "week: unknown (no status-line data yet)")
    line = " | ".join(parts)
    print(f"[TOKENS] {line}" if short else line.replace(" | ", "\n"))


if __name__ == "__main__":
    main()
