#!/usr/bin/env python3
"""Current time, phase, and countdowns from config/deadlines.json. --short prints one line."""
import json
import subprocess
import sys
from datetime import datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Berlin")
ROOT = Path(__file__).resolve().parent.parent


def main_checkout():
    """Main worktree root, so every worktree reads the same deadlines."""
    try:
        common = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--path-format=absolute", "--git-common-dir"],
            capture_output=True, text=True, timeout=5, check=True,
        ).stdout.strip()
        main = Path(common).parent
        if (main / "config" / "deadlines.json").exists():
            return main
    except Exception:  # noqa: BLE001
        pass
    return ROOT


CFG = main_checkout() / "config" / "deadlines.json"
FREEZE_BEFORE = timedelta(hours=6)
SUBMIT_BEFORE = timedelta(hours=2)


def parse(value):
    if not value or str(value).strip().upper() == "TODO":
        return None
    try:
        return datetime.fromisoformat(value).astimezone(TZ)
    except ValueError:
        return None


def fmt_delta(d):
    neg = d.total_seconds() < 0
    s = abs(int(d.total_seconds()))
    h, m = s // 3600, (s % 3600) // 60
    txt = f"{h}h{m:02d}m"
    return f"{txt} ago" if neg else f"in {txt}"


def main():
    short = "--short" in sys.argv
    now = datetime.now(TZ)
    try:
        cfg = json.loads(CFG.read_text())
    except Exception as e:  # noqa: BLE001
        print(f"[now.py] cannot read config/deadlines.json: {e}")
        return

    todos = [k for k, v in cfg.items() if isinstance(v, str) and v.strip().upper() == "TODO"]
    todos += [m["name"] for m in cfg.get("milestones", []) if parse(m.get("at")) is None]

    subs = [d for d in (parse(cfg.get("submission_local")), parse(cfg.get("submission_global"))) if d]
    submission = min(subs) if subs else None

    freeze = parse(cfg.get("feature_freeze"))
    freeze_est = False
    if freeze is None and submission:
        freeze, freeze_est = submission - FREEZE_BEFORE, True
    submit_start = submission - SUBMIT_BEFORE if submission else None
    idea = parse(cfg.get("idea_decision"))

    if submission and now >= submission:
        phase = "OVER"
    elif submit_start and now >= submit_start:
        phase = "SUBMIT"
    elif freeze and now >= freeze:
        phase = "FREEZE"
    elif idea and now >= idea:
        phase = "BUILD"
    else:
        phase = "EXPLORE"

    events = []
    if idea:
        events.append(("Idea decision", idea, False))
    if freeze:
        events.append(("Feature freeze" + (" (estimated)" if freeze_est else ""), freeze, freeze_est))
    for m in cfg.get("milestones", []):
        d = parse(m.get("at"))
        if d:
            events.append((m["name"], d, False))
    if submission:
        label = "SUBMISSION (local)" if parse(cfg.get("submission_local")) == submission else "SUBMISSION (global)"
        events.append((label, submission, False))
    events.sort(key=lambda e: e[1])
    upcoming = [e for e in events if e[1] > now]

    if short:
        nxt = " | ".join(f"{n} {fmt_delta(d - now)}" for n, d, _ in upcoming[:3])
        warn = " | missing deadlines -> run intel" if todos else ""
        print(f"[TIME] {now:%a %H:%M} | Phase: {phase} | {nxt}{warn}")
        return

    print(f"Now:    {now:%a %d.%m. %H:%M} (Europe/Berlin)")
    print(f"Phase:  {phase}")
    print("Next:")
    for n, d, _ in upcoming:
        print(f"  - {n:<40} {d:%a %H:%M}  ({fmt_delta(d - now)})")
    if not upcoming:
        print("  (none)")
    if todos:
        print(f"Missing: {', '.join(todos)} -> run intel")


if __name__ == "__main__":
    main()
