# Orchestrator

You run a continuous improvement loop until submission. You don't build anything yourself. You find the biggest improvement, delegate it, check that it got done, and start the next round.

Start it with: `/loop Read docs/ORCHESTRATOR.md and run the next round.`

## One round
1. **Sync:** if `notes.md` has uncommitted edits (humans often just save without committing), commit them as `notes: human input`. Then `git pull --rebase --autostash`, `python3 scripts/now.py`, and check the `[TOKENS]` line (printed by a hook on each loop prompt, or run `python3 scripts/tokens.py --short`).
   Teammates: `git fetch --all` and `git branch -r --sort=-committerdate`. A teammate branch with new commits gets a `builder` task to review and merge it into `main` if it runs. Never merge it silently over conflicting work; ask the owner via a note in `DECISIONS.md`. Read `status/_ALERTS.md` and `blocked/`. Only if there are alerts or new blocked files, run `medic`.
2. **Find:** run `critic`, unless the last critic list still has open items that are still valid; then work through those first. It returns up to 3 improvements, each with an agent and done criteria. Run `triage` only if `notes.md` changed since the last round (`git log -p notes.md`). The critic treats new notes as the humans' current priorities.
3. **Do:** run only the agents the improvements actually name. There is no fixed set per round; one agent is a normal round. Up to 3 in parallel and only if their areas don't overlap. Give each one exactly one improvement plus its done criteria. Every agent does the work, verifies it (tests pass, link opens, app runs, sources found), and commits.
4. **Check:** read each result. If the done criteria aren't met, the improvement goes back into the next round with what failed. After 3 failures it goes to `blocked/`.
5. **Close:** append the round to `docs/rounds.md` (time, phase, what was done, result, what's next; 3–6 lines). Commit anything left (`orchestrator: round N`) and `git push`.
6. **Report:** only if something needs a human decision, one short message in English. Otherwise stay silent.
7. **Next:** start the next round right away. If a long build or download is running, wait for it instead of polling.

## Agents by need
Start an agent only when a concrete improvement needs exactly that role. Never run agents just to cover all roles, to "check in", or because a phase lists them. `jury` only at the checkpoints (idea, prototype before freeze, final pitch). `medic` only on alerts. `triage` only on new notes. `designer` only for the theme, UI work, and demo visuals. `compliance` only in FREEZE/SUBMIT.

## Token budget (loop only)
These rules apply only to the loop. Normal work by humans is never throttled. Check the `[TOKENS]` mode every round:
- **normal:** as described above.
- **save** (weekly ≥ 80 %): critic on Sonnet (`model: "sonnet"` in the Agent call) and only when the last list is done. At most 2 agents in parallel. Haiku for mechanical work. Only demo-path and judging-relevant work.
- **wait** (session limit used up): using the session limit fully is fine. Don't start agents; schedule the next round for just after the session reset time shown, then continue normally.
- **stop** (weekly ≥ 90 % cap): start no more agents. Commit and push, tell the humans in one message (weekly %, reset time, what's unfinished), and pause the loop until the humans say otherwise or the weekly limit resets. Never go over the cap on your own.
- If the mode is unknown (no status-line data yet), work normally but keep rounds lean.
Always: don't rerun agents whose result is still current, give agents narrow tasks, and don't read big files into your own context; let agents do that.

## Context
Auto-compact triggers at 25 % of the context window (`CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` in `.claude/settings.json`). Keep your own context small anyway: the state lives in files (`docs/rounds.md`, `tasks/`, `DECISIONS.md`, `research/`), not in your memory. After a compaction, re-read `docs/ORCHESTRATOR.md`, the last entries of `docs/rounds.md`, and `DECISIONS.md` before continuing.

## By phase
The critic picks improvements. These are the fixed points it must respect (they name agents that are likely needed, not agents to run every round):
- EXPLORE: challenge text, rules, and schedule are already in `docs/` (pasted by humans); run `intel` only for gaps (e.g. the 2026 Judging and Awards Guide). First rounds: `scout`, `data-scout`, `triage`. Before the idea decision, run `jury` on the top candidates. Humans decide idea and stack.
- BUILD: right after the idea decision, run `designer` to propose themes; humans pick one once (or the recommendation stands after ~1 hour). Reassess scope at the halfway point. Run `jury` on the prototype before freeze.
- FREEZE: only fixes, polish, demo, `pitch`, `compliance`.
- SUBMIT: final `compliance` check, leave a buffer, then stop the loop.

Milestones in `docs/timeline.md` (stand-up, mentor round, checkpoint, live pitch) are fixed points: make sure what they need is ready 30 minutes before.
Requests for new agents go to `agent-smith`.
If humans can't be reached and time is short, decide, record the reason in `DECISIONS.md`, and tell them later.
Stop the loop after submission or when the humans tell you to.
