# NASA Space Apps 2026

Challenge: "Interplanetary Survival Guide: Martian Map" (`docs/challenge.md`, links in `docs/resources.md`).
Humans own the story and make decisions. Agents research, build, and test it, in short steps a human looks at.

**Hard rule (2026 rules):** AI must not be used to come up with the idea for solving the challenge. Agents never invent the core idea. They research, evaluate, and implement the humans' story in `PLAN.md` (source: `notes.md`), and may suggest features, fixes, and improvements to it. Log what AI did in `docs/ai-use.md` for the submission.

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

## Start here
Version 1 of this project was archived on Sat 14.11. 16:00 (git tag `archive-v1`) because it did not tell the humans' story. Read these four files before doing anything:

| Path | Purpose |
|---|---|
| `PLAN.md` | The story (humans own it), how we build, and the route to submission. Every task names a beat from it. |
| `KNOWLEDGE.md` | What the research found: data, numbers with sources, prior art, what not to claim. Read before researching. |
| `SALVAGE.md` | Working data, models, and code from version 1 and how to get them from `archive-v1`. Reuse, do not rebuild. |
| `LESSONS.md` | Why version 1 failed and the rules that follow. |

Other files:
| Path | Purpose |
|---|---|
| `notes.md` | Humans' raw input (often German). Agents read it and never rewrite it. |
| `docs/challenge.md`, `docs/rules-2026.md`, `docs/timeline.md`, `docs/resources.md` | Official facts and links |
| `docs/ai-use.md` | Log of what AI did, for the submission |
| `config/deadlines.json` | Deadlines read by `now.py` |

## Rules
- **Story first.** Build only what is a beat in `PLAN.md` part 1. Never reframe the story, drop a beat, or decide a line marked OPEN (humans). If the story seems wrong or impossible, say so and stop.
- **Show, do not report.** After every change a user can see, show the human a screenshot or recording and how to open it, then wait for their reaction before the next visible change. Tests and a clean console mean "not broken", not "good".
- **One screen, one message.** Evidence, caveats, and sources go on a Sources page. If you add an element to a screen, say which one it replaces.
- **Walking skeleton first**, then depth, and depth goes to the first-person walk first.
- **The planned terrain is the walked terrain.** No plan the 3D view cannot show.
- **Reuse.** Check `SALVAGE.md` before writing a model, a data step, or a loader. Check `KNOWLEDGE.md` before researching.
- **Honest claims.** Label measured, modelled, simulated. Use only facts marked verified in `KNOWLEDGE.md`, or verify first and add the result there with its source.
- **No autonomous loop and no simulated jury score.** Work in short steps with the human in the room. Start an agent only for a concrete task.
- **Small and removable.** Prefer the smallest thing that tells the beat. No tiles, folds, or numbers for an imagined expert.
- After 3 failed attempts at the same problem, stop and tell the human what you tried.
- Verify your own work in a real browser before showing it. Say what you could not verify (for example real-GPU frame rate).
- Do not create planning or report files. The state lives in `PLAN.md`, the code, and git. New findings go into `KNOWLEDGE.md`.
- Don't edit `notes.md`.

## Git: agents commit their own work
- Commit when a unit of work is finished: a research file, a task, a fix. Don't save it all for the end.
- Stage only the files you changed: `git add <paths>`. Never `git add -A` or `git add .`; other agents share this checkout.
- Message format: `<agent>: <what>`, e.g. `data-scout: HiRISE DTM access for Jezero`.
- If `.git/index.lock` exists, wait a few seconds and retry; don't delete it.
- Docs and knowledge: commit on `main`.
- Code: commit on your branch or worktree (`git worktree add ../wt-<name> -b <name>`). It reaches `main` only through a merge that keeps `main` runnable.
- Pushing: only when a human says so. On `main` use `git fetch && git merge origin/main`, not `git pull --rebase` (it flattens merge commits).
- Never force-push, rewrite history, or commit secrets or large raw datasets (use `data/raw/`, which is ignored).
