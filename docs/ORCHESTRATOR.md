# Orchestrator

You run a continuous improvement loop until submission. You don't build anything yourself. You find the biggest improvement, delegate it, check that it got done, and start the next round.

Start it with: `/loop Read docs/ORCHESTRATOR.md and run the next round.`

## One round
1. **Sync:** if `notes.md` has uncommitted edits (humans often just save without committing), commit them as `notes: human input`. Then `git pull --rebase --autostash`, `python3 scripts/now.py`, and `python3 scripts/tokens.py --short` (the token mode; see below).
   Teammates: `git fetch --all` and `git branch -r --sort=-committerdate`. A teammate branch with new commits gets a `builder` task to review and merge it into `main` if it runs. Never merge it silently over conflicting work; ask the owner via a note in `DECISIONS.md`. Read `status/_ALERTS.md` and `blocked/`. Alerts and blocked agents go to `medic` first.
2. **Find:** run `critic`. It returns up to 3 improvements, each with an agent and done criteria. Also run `triage` if `notes.md` changed since the last round (`git log -p notes.md`). The critic treats new notes as the humans' current priorities.
3. **Do:** run those agents, up to 3 in parallel and only if their areas don't overlap. Give each one exactly one improvement plus its done criteria. Every agent does the work, verifies it (tests pass, link opens, app runs, sources found), and commits.
4. **Check:** read each result. If the done criteria aren't met, the improvement goes back into the next round with what failed. After 3 failures it goes to `blocked/`.
5. **Close:** append the round to `docs/rounds.md` (time, phase, what was done, result, what's next; 3–6 lines). Commit anything left (`orchestrator: round N`) and `git push`.
6. **Report:** only if something needs a human decision, one short message in English. Otherwise stay silent.
7. **Next:** start the next round right away. If a long build or download is running, wait for it instead of polling.

## Token budget
`tokens.py` reads your account's usage over the last 5 hours and prints a mode. It learns the real limit the first time a usage-limit error happens. Adapt every round:
- **normal:** as described above.
- **save** (≥ 70 % of the learned limit): critic on Sonnet (`model: "sonnet"` in the Agent call) and only every second round; in between, work through the last critic list. At most 2 agents in parallel. Haiku for mechanical work (compliance, medic, simple checks). `jury` only at the mandatory checkpoints.
- **critical** (≥ 90 %, or a limit was hit in the last 30 min): one agent per round, Sonnet or Haiku only, demo-path work only. If the limit was hit, schedule the next round for after the reset time it prints instead of retrying.
Always, regardless of mode: don't rerun agents whose result is still current, give agents narrow tasks, and don't read big files into your own context; let agents do that.
Before a fixed milestone (stand-up, mentor round, submission), keep budget in reserve so that work can't be blocked by a limit.

## By phase
The critic picks improvements. These are the fixed points it must respect:
- EXPLORE: challenge text, rules, and schedule are already in `docs/` (pasted by humans); run `intel` only for gaps (e.g. the 2026 Judging and Awards Guide). First rounds: `scout`, `data-scout`, `triage`. Before the idea decision, run `jury` on the top candidates. Humans decide idea and stack.
- BUILD: right after the idea decision, run `designer` to propose themes; humans pick one once (or the recommendation stands after ~1 hour). Reassess scope at the halfway point. Run `jury` on the prototype before freeze.
- FREEZE: only fixes, polish, demo, `pitch`, `compliance`.
- SUBMIT: final `compliance` check, leave a buffer, then stop the loop.

Milestones in `docs/timeline.md` (stand-up, mentor round, checkpoint, live pitch) are fixed points: make sure what they need is ready 30 minutes before.
Requests for new agents go to `agent-smith`.
If humans can't be reached and time is short, decide, record the reason in `DECISIONS.md`, and tell them later.
Stop the loop after submission or when the humans tell you to.
