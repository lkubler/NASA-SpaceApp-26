# NASA Space Apps 2026

Challenge: "Interplanetary Survival Guide: Martian Map" (`docs/challenge.md`, links in `links.md`).
Humans generate ideas and make decisions. Agents research, build, design, test, and pre-sort.

## Time
You don't know the current time. Run `python3 scripts/now.py` at the start of every task. It prints the phase and countdowns. It always reads deadlines from the main checkout, so worktrees see the same values.

- EXPLORE: research, evaluate ideas, spikes only
- BUILD: implement tasks, keep `main` demoable
- FREEZE: no new features; fixes, polish, demo, pitch
- SUBMIT: submission only

## Language
- Humans may write notes in German (`notes.md`, comments, chat). Read them as they are.
- Everything agents write is English: research, tasks, decisions, commits, code, UI text.
- The product, demo, and submission are English only. No German strings in the app.

## Judging (equal weight)
- Influence: size of the problem, how many it helps
- Creativity: new vs. incremental
- Validity: scientifically sound, works in the real world
- Relevance: answers the challenge, complete, feasible, usable
- Presentation: how well the problem, solution, and why it matters are communicated

## Submission rules
From the 2025 guide; `docs/rules-2026.md` overrides if present.
- Demo: video ≤ 30 s with English subtitles, or ≤ 7 slides including title. Longer is ineligible.
- Public links, no login. Everything in English.
- Must use NASA data and explain how.
- List all external data, code, images, text.
- Disclose AI use (tools and purpose). AI images/video need a visible watermark; label AI-generated code and data.
- No NASA branding in AI-generated content.

## Shared files
| Path | Purpose |
|---|---|
| `notes.md` | Humans' input: ideas, thoughts, direction (often German). Agents read it and never rewrite it. |
| `links.md` | Resource links collected by humans |
| `research/` | Findings. Read before researching. |
| `DECISIONS.md` | Decisions and reasons |
| `tasks/` | One file per task |
| `docs/design.md` | Visual direction and design system (owned by `designer`) |
| `status/<agent>.md` | Heartbeat (local, not committed) |
| `blocked/` | Problems an agent couldn't solve |
| `config/deadlines.json` | Deadlines read by `now.py` |

## Rules
- Heartbeat: keep `status/<agent>.md` current with `state: working|blocked|done`, `task:`, `attempts:` (on the current problem), `updated:`.
- After 3 failed attempts at the same problem, stop. Write `blocked/<agent>-<topic>.md`, set `state: blocked`.
- Verify your own work before calling it done: run the tests or the app, open the links, check the sources. Report what you verified and what you couldn't.
- Write results to files with sources; return a short summary.
- Humans decide only the big things: idea, stack, major scope cuts, and the overall visual theme (once). Propose them in `DECISIONS.md` as PROPOSED, with a recommendation.
- Everything else (implementation, UI details, data choices within the stack, task breakdown) is decided by agents. Record notable choices in `DECISIONS.md` or `docs/design.md` instead of asking. The humans don't want to review routine work.
- Don't edit `notes.md`. To respond to a note, write in `research/` or `DECISIONS.md` and reference it.

## Git: agents commit their own work
- Commit when a unit of work is finished: a research file, a task, a fix. Don't save it all for the end.
- Stage only the files you changed: `git add <paths>`. Never `git add -A` or `git add .`; other agents share this checkout.
- Message format: `<agent>: <what>`, e.g. `data-scout: HiRISE DTM access for Jezero`.
- If `.git/index.lock` exists, wait a few seconds and retry; don't delete it.
- Research, docs, tasks, and decisions: commit on `main`.
- Code: commit on your branch or worktree (`git worktree add ../wt-<name> -b <name>`). It reaches `main` only through a merge that keeps `main` runnable.
- Pushing: `git pull --rebase` then `git push`. The orchestrator pushes `main` every round. Subagents commit but don't push, unless they work alone in their own worktree.
- Never force-push, rewrite history, or commit secrets or large raw datasets (use `data/raw/`, which is ignored).
