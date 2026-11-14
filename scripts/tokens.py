#!/usr/bin/env python3
"""Token usage and budget mode for the agent system. --short prints one line.

Reads all Claude Code transcripts (~/.claude/projects/**/*.jsonl; the plan limit is account-wide),
sums usage in a rolling window, weights it by model price, and prints a mode:
  normal | save | critical
The budget is learned: when a usage-limit error shows up in a transcript, the usage in the
window at that moment becomes the observed limit (stored in status/budget_state.json).
Until then, config/budget.json's window_budget is used (null = no limit known yet).
"""
import json
import re
import subprocess
import sys
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS = Path.home() / ".claude" / "projects"
RESET_RE = re.compile(r"resets ([0-9:apm]+)", re.I)


def main_checkout():
    try:
        common = subprocess.run(
            ["git", "-C", str(ROOT), "rev-parse", "--path-format=absolute", "--git-common-dir"],
            capture_output=True, text=True, timeout=5, check=True,
        ).stdout.strip()
        return Path(common).parent
    except Exception:  # noqa: BLE001
        return ROOT


MAIN = main_checkout()
CFG = MAIN / "config" / "budget.json"
STATE = MAIN / "status" / "budget_state.json"


def weight_for(model, weights):
    model = (model or "").lower()
    for key, w in weights.items():
        if key in model:
            return w
    return weights.get("default", 1.0)


def load_json(path, default):
    try:
        return json.loads(path.read_text())
    except Exception:  # noqa: BLE001
        return default


def main():
    short = "--short" in sys.argv
    cfg = load_json(CFG, {})
    state = load_json(STATE, {})
    window = timedelta(hours=cfg.get("window_hours", 5))
    weights = cfg.get("model_weights", {"default": 1.0})
    now = datetime.now(timezone.utc)
    since = now - window

    seen = set()
    used, per_model, oldest, limit_hits, reset_txt = 0.0, {}, None, [], None
    for d in [PROJECTS]:
        for f in d.rglob("*.jsonl"):
            if datetime.fromtimestamp(f.stat().st_mtime, timezone.utc) < since:
                continue
            for line in f.open(errors="ignore"):
                if '"timestamp"' not in line:
                    continue
                try:
                    o = json.loads(line)
                    ts = datetime.fromisoformat(o["timestamp"].replace("Z", "+00:00"))
                except Exception:  # noqa: BLE001
                    continue
                if ts < since:
                    continue
                msg = o.get("message") if isinstance(o.get("message"), dict) else {}
                # Only API errors count as limit hits, not text that mentions limits.
                if o.get("isApiErrorMessage") and o.get("error") == "rate_limit":
                    limit_hits.append(ts)
                    m = RESET_RE.search(line)
                    reset_txt = m.group(1) if m else reset_txt
                u = msg.get("usage")
                if not u:
                    continue
                rid = o.get("requestId") or o.get("uuid")
                if rid in seen:
                    continue
                seen.add(rid)
                tokens = (u.get("input_tokens", 0) + 1.25 * u.get("cache_creation_input_tokens", 0)
                          + 0.1 * u.get("cache_read_input_tokens", 0) + 5 * u.get("output_tokens", 0))
                w = tokens * weight_for(msg.get("model"), weights)
                used += w
                m = msg.get("model", "?")
                per_model[m] = per_model.get(m, 0) + w
                oldest = ts if oldest is None or ts < oldest else oldest

    # Learn the limit from the most recent usage-limit hit.
    if limit_hits:
        last_hit = max(limit_hits).isoformat()
        if state.get("last_hit") != last_hit:
            state.update(last_hit=last_hit, observed_budget=round(used), resets=reset_txt)
            STATE.parent.mkdir(parents=True, exist_ok=True)
            STATE.write_text(json.dumps(state, indent=2))

    budget = state.get("observed_budget") or cfg.get("window_budget")
    recent_hit = state.get("last_hit") and (
        now - datetime.fromisoformat(state["last_hit"]) < timedelta(minutes=30))
    pct = used / budget * 100 if budget else None
    if recent_hit or (pct is not None and pct >= cfg.get("critical_pct", 90)):
        mode = "critical"
    elif pct is not None and pct >= cfg.get("save_pct", 70):
        mode = "save"
    else:
        mode = "normal"
    reset = (oldest + window).astimezone() if oldest else None

    pct_txt = f"{pct:.0f}% of {budget / 1e6:.1f}M" if pct is not None else "limit not learned yet"
    if short:
        r = f" | window frees up from {reset:%H:%M}" if mode != "normal" and reset else ""
        if recent_hit and state.get("resets"):
            r = f" | LIMIT HIT, resets {state['resets']}"
        print(f"[TOKENS] mode: {mode} | {used / 1e6:.1f}M weighted in last {window.seconds // 3600 or window.days * 24}h ({pct_txt}){r}")
        return
    print(f"Mode:    {mode}")
    print(f"Window:  last {window}, {used / 1e6:.2f}M weighted tokens ({pct_txt})")
    for m, w in sorted(per_model.items(), key=lambda x: -x[1]):
        print(f"  - {m:<28} {w / 1e6:.2f}M")
    if state.get("last_hit"):
        print(f"Last usage-limit hit: {state['last_hit']}")
    if reset:
        print(f"Oldest usage in window expires: {reset:%a %H:%M}")


if __name__ == "__main__":
    main()
