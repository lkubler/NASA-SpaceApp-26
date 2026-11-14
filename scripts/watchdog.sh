#!/usr/bin/env bash
# Stuck detection without an LLM. Writes status/_ALERTS.md.
# Usage: ./scripts/watchdog.sh [--once]   (env: STALE_MIN, COMMIT_MIN, INTERVAL)

cd "$(dirname "$0")/.." || exit 1
# Run from the main checkout so alerts land in one place
MAIN="$(git rev-parse --path-format=absolute --git-common-dir 2>/dev/null)"
[[ -n "$MAIN" ]] && cd "$(dirname "$MAIN")" || true
mkdir -p status
STALE_MIN="${STALE_MIN:-15}"
COMMIT_MIN="${COMMIT_MIN:-60}"
INTERVAL="${INTERVAL:-300}"

check() {
  local alerts=() now f state age last_commit phase
  now=$(date +%s)
  shopt -s nullglob
  local wts=()
  mapfile -t wts < <(git worktree list --porcelain 2>/dev/null | sed -n 's/^worktree //p')
  ((${#wts[@]})) || wts=("$PWD")
  local files=()
  for wt in "${wts[@]}"; do files+=("$wt"/status/*.md); done
  for f in "${files[@]}"; do
    [[ "$(basename "$f")" == _* ]] && continue
    state=$(grep -m1 '^state:' "$f" | awk '{print $2}')
    age=$(( (now - $(stat -c %Y "$f")) / 60 ))
    if [[ "$state" == "working" && $age -ge $STALE_MIN ]]; then
      alerts+=("STALE  $(basename "$f" .md): no heartbeat for ${age} min")
    fi
    if [[ "$state" == "blocked" ]]; then
      alerts+=("BLOCKED $(basename "$f" .md): $(grep -m1 '^task:' "$f")")
    fi
    attempts=$(grep -m1 '^attempts:' "$f" | awk '{print $2}')
    if [[ "${attempts:-0}" =~ ^[0-9]+$ && ${attempts:-0} -ge 3 && "$state" == "working" ]]; then
      alerts+=("LOOP?  $(basename "$f" .md): ${attempts} attempts but not blocked")
    fi
  done
  for f in blocked/*.md; do
    grep -q '^## Medic' "$f" || alerts+=("NEW BLOCKED: $f")
  done
  phase=$(python3 scripts/now.py --short 2>/dev/null | sed -n 's/.*Phase: \([A-Z]*\).*/\1/p')
  if [[ "$phase" == "BUILD" ]] && git rev-parse >/dev/null 2>&1; then
    last_commit=$(git log --all -1 --format=%ct 2>/dev/null || echo "$now")
    if (( (now - last_commit) / 60 >= COMMIT_MIN )); then
      alerts+=("IDLE   no commit on any branch for $(( (now - last_commit) / 60 )) min")
    fi
  fi

  {
    echo "# Watchdog $(date '+%a %H:%M')"
    if ((${#alerts[@]})); then printf -- '- %s\n' "${alerts[@]}"; else echo "- ok"; fi
  } > status/_ALERTS.md

  if ((${#alerts[@]})); then
    printf '\a'; echo "[$(date +%H:%M)] ${#alerts[@]} alert(s):"; printf '  %s\n' "${alerts[@]}"
  else
    echo "[$(date +%H:%M)] ok"
  fi
}

if [[ "$1" == "--once" ]]; then check; exit 0; fi
while true; do check; sleep "$INTERVAL"; done
