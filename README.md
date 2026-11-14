# SpaceApp 26 Repo

NASA Space Apps 2026 — "Interplanetary Survival Guide: Martian Map". Humans write ideas into `notes.md` (German is fine), Claude Code agents research, build, design, and test. Rules for agents: `CLAUDE.md`.

## Setup
1. Orchestrator (Opus): run `claude` in the repo, then `/loop Read docs/ORCHESTRATOR.md and run the next round.` It runs rounds until submission: critic finds the biggest improvement → agents do and verify it → commit → next round. Log: `docs/rounds.md`.
2. Watchdog in a separate terminal: `./scripts/watchdog.sh` (scans all worktrees).
3. Everyone else: own worktree (`git worktree add ../wt-<name> -b <name>`), `claude` with Sonnet. Write ideas into `notes.md`, claim tasks from `tasks/`.

## Agents
| Agent | Model | Use |
|---|---|---|
| intel | sonnet | Challenge text, local schedule, 2026 rules (needs browser) |
| scout | sonnet | Prior art, differentiation, novelty checks |
| data-scout | sonnet | Usable Mars data, validity |
| triage | sonnet | Evaluate ideas and notes in `notes.md` |
| critic | opus | Each round: the top 3 improvements and who does them |
| jury | fable | Checkpoints only: idea, prototype, pitch |
| designer | sonnet | Visual direction, design system, demo "wow" moments, UI polish |
| builder | sonnet | Implement tasks |
| ux-tester | sonnet | Test as users after merges |
| pitch | sonnet | Story, demo, submission text |
| compliance | haiku | Rule check before submitting |
| medic | haiku | Diagnose stuck agents |
| agent-smith | sonnet | Create new agents |

## Token budget
`python3 scripts/tokens.py` shows usage over the last 5 hours (whole account) and a mode: normal / save / critical. The orchestrator sees it every round and scales down (cheaper models, fewer parallel agents) as the limit gets close. The limit is calibrated in `config/budget.json` and re-learned whenever a session-limit error occurs.

## Stuck detection
- Rule: 3 failed attempts → `blocked/` (CLAUDE.md)
- Hook `loop_guard.py`: same command or error 3× in a row → warning to the agent
- `watchdog.sh` (no tokens): stale heartbeats in any worktree, blocked agents, no commits → `status/_ALERTS.md`
