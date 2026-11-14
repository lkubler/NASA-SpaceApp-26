# NASA Space Apps 2026

Challenge: "Interplanetary Survival Guide: Martian Map" (`docs/challenge.md`, links in `docs/resources.md`).
Humans generate ideas and make decisions. Agents research, build, design, test, and pre-sort.

**Hard rule (2026 rules):** AI must not be used to come up with the idea for solving the challenge. Agents never invent the core idea. They research, evaluate, and implement the humans' ideas from `notes.md`, and may suggest features, fixes, and improvements to it. Log what AI did in `docs/ai-use.md` for the submission.

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

## Judging (equal weight, each 1–5; details in `docs/rules-2026.md`)
- Impact: size of the problem, how many it helps or inspires
- Creativity: novel concept or meaningful improvement on existing tools
- Validity: scientifically sound, feasible, complete, usable and user-friendly
- Relevance: answers the challenge directly; NASA data is a core component, not decoration
- Presentation: problem, solution, and why it matters told as an engaging story; judged from the demo and the full project. The guide warns teams neglect this one.
Most fitting Global Awards for this challenge: Best Use of Data, Best Use of Science, Best Mission Concept, Best Storytelling, Art & Technology.

## Submission rules
Summary of `docs/rules-2026.md` (full text there; it wins if they differ).
- Deadline: "Submit for Judging" clicked before **Sun 15.11. 15:45** (Heilbronn local deadline; global is 23:59). Resubmitting is allowed until then.
- Demo: video ≤ 30 s (English subtitles if spoken in another language) or ≤ 7 slides including title and intro. Longer is ineligible.
- Public links, no login, password, or permission. Test in a private window. The project page takes no video or document uploads, only images ≤ 10 MB.
- Everything in English.
- Must use at least one NASA dataset or resource and explain how. Space agency partner data (e.g. ESA) is encouraged.
- List all external data, code, images, text, and tools.
- AI ("Super Intelligence") use must be disclosed: images and video need a visible watermark; audio, code, and data need a note in descriptive text and metadata. No NASA branding (logos, flags, mission identifiers) in generated content.
- No images, video, audio, or likeness of persons under 18.
- All team members must be confirmed at the same local event (Heilbronn).

## Shared files
| Path | Purpose |
|---|---|
| `notes.md` | Humans' input: ideas, thoughts, direction (often German). Agents read it and never rewrite it. |
| `docs/resources.md` | Resource links (humans and agents add here) |
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
