# NASA Space Apps 2026

Challenge: "Interplanetary Survival Guide: Martian Map" (`docs/challenge.md`, links in `docs/resources.md`).
The team decides what gets built and writes it into specs. Agents decide how. The system is described in `AGENT-SYSTEM.md`; what we build and why is in `PROPOSAL.md`.

**Hard rule (2026 rules):** AI must not be used to come up with the idea for solving the challenge. Agents never invent the core idea. They research and implement what `PROPOSAL.md` and `specs/` say. Log what AI did in `docs/ai-use.md` for the submission.

## Time
You don't know the current time. Run `python3 scripts/now.py` at the start of every task. It prints the phase and countdowns. It always reads deadlines from the main checkout, so worktrees see the same values.

- BUILD: build the specs, keep `main` runnable
- FREEZE: no new specs; fixes only
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
| `notes.md` | The team's input (often German). Agents read it and never edit it. |
| `PROPOSAL.md` | What we build and why. Agents never edit it. |
| `AGENT-SYSTEM.md` | Roles, order of work, how feedback is handled |
| `specs/` | What each step must do. Agents never edit a spec. |
| `research/` | Findings with sources. Read before researching. |
| `reviews/` | Spec check and first visitor reports |
| `app/` | The product. `app/public` holds the prepared data. |
| `docs/` | Challenge, rules, resources, timeline, `ai-use.md` |
| `config/deadlines.json` | Deadlines read by `now.py` |

## Rules
- Not in the spec: not built.
- A spec line is unclear or cannot be built: stop on that line and report it.
- After 3 failed attempts at the same problem, stop and report.
- Verify your own work before calling it done: run the app, open the links, check the sources. Report what you verified and what you could not.
- Write results to files with sources; return a short summary.
- Label every value in the app as real, model, simulated or assumption.

## Git: agents commit their own work
- Commit when a unit of work is finished: a research file, a task, a fix. Don't save it all for the end.
- Stage only the files you changed: `git add <paths>`. Never `git add -A` or `git add .`; other agents share this checkout.
- Message format: `<role>: <what>`, e.g. `builder: 2-plan candidate list`.
- If `.git/index.lock` exists, wait a few seconds and retry; don't delete it.
- Research and reviews: commit on `main`.
- Code: commit on your branch or worktree. It reaches `main` only through a merge by the main session, after the spec check.
- Pushing: only the main session pushes.
- Never force-push, rewrite history, or commit secrets or large raw datasets (use `data/raw/`, which is ignored).
