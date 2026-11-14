# Decisions

Per entry: topic, status (PROPOSED / DECIDED), decision, reason, rejected alternatives.

## Challenge
DECIDED: Interplanetary Survival Guide: Martian Map

## Idea
open

## Stack
open

## Agent setup (2026-11-14)
DECIDED during the agent-system port (revise freely)

- Input: `notes.md` replaces `inbox/`. Humans write there freely; agents read but never edit it. `triage` writes its evaluations to `research/triage.md`.
  Reason: the team already uses `notes.md`; a second inbox would split ideas.
- Language: humans may write in German; agents write everything in English; the product, demo, and submission are English only.
  Reason: submission must be English; translating late is risky, so we stay in English from the start.
- Design: new `designer` agent owns visual direction, the design system (`docs/design.md`), and the demo's signature moments. `ux-tester` only finds problems and hands visual ones to `designer`. The humans pick the visual direction.
  Reason: a tester alone makes the product usable, not memorable; Presentation is 1/5 of the score.
- Time tracking: `now.py` and `watchdog.sh` now read from the main checkout and scan all worktrees. Before, worktrees had their own copy of `deadlines.json` and their heartbeats were invisible to the watchdog. `loop_guard` ignores harmless repeats (`now.py`, `git status`, …).
- Git: agents commit their own work (`<agent>: <what>`, only their own files). Research/docs go to `main`; code goes on branches and is merged runnable. The orchestrator pulls and pushes `main` every round. Heartbeats (`status/`) and raw data (`data/raw/`) are not committed.
