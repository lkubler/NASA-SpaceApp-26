# Decisions

Per entry: topic, status (PROPOSED / DECIDED), decision, reason, rejected alternatives.

## Challenge
DECIDED: Interplanetary Survival Guide: Martian Map

## Idea
DECIDED (Sat 13:16, human in chat; confirm at 14:00): EVA route planner at Murray Buttes (plus the other Access Mars sites from notes.md) with the signature set comms shadow + return reserve, a first-person 3D walk with strong visuals (lighting, day/night, dust/weather), and as many extra features as time allows.
Reason: jury's strongest configuration (`research/jury-idea.md`), the humans' own priority list in notes.md.
Open: Live Site in or out; demo format (video vs slides) decided later; story/pitch .md files must exist either way.

## Constraints (Sat 13:16, human in chat)
- Deadline: work to the local 15:45 (global 23:59 is not ours).
- Walkback: 2–3.5 km (NASA suit sizing / xEVA ConOps 2 km), not 10 km. Reserve buffer: 20 % (Apollo, see notes.md references).
- Desktop first: judges view on PC. No QR code, no phone fallback.

## Stack
PROPOSED by orchestrator (13:16), human agreed in principle: static web app, Three.js/WebGL for 3D and visual effects, data preprocessed offline in Python (slope, line of sight, heightmaps), routing in browser JS. No WebAssembly: GPU effects come from WebGL shaders; CPU work is precomputed or small. Revisit only if in-browser routing is measurably slow.
Hosting: GitHub Pages from a public repo (human OK to make public), mirrored on Cloudflare Pages as backup against outages; offline demo video as last fallback.

## Visual theme
DECIDED direction (human, 13:16): Mars red + white UI. `designer` turns it into `docs/design.md`.

## Agent setup (2026-11-14)
DECIDED during the agent-system port (revise freely)

- Input: `notes.md` replaces `inbox/`. Humans write there freely; agents read but never edit it. `triage` writes its evaluations to `research/triage.md`.
  Reason: the team already uses `notes.md`; a second inbox would split ideas.
- Language: humans may write in German; agents write everything in English; the product, demo, and submission are English only.
  Reason: submission must be English; translating late is risky, so we stay in English from the start.
- Design: new `designer` agent owns visual direction, the design system (`docs/design.md`), and the demo's signature moments. `ux-tester` only finds problems and hands visual ones to `designer`. The humans pick the overall theme once; all later design decisions are the designer's, with no human review.
  Reason: a tester alone makes the product usable, not memorable; Presentation is 1/5 of the score.
- Time tracking: `now.py` and `watchdog.sh` now read from the main checkout and scan all worktrees. Before, worktrees had their own copy of `deadlines.json` and their heartbeats were invisible to the watchdog. `loop_guard` ignores harmless repeats (`now.py`, `git status`, …).
- Git: agents commit their own work (`<agent>: <what>`, only their own files). Research/docs go to `main`; code goes on branches and is merged runnable. The orchestrator pulls and pushes `main` every round. Heartbeats (`status/`) and raw data (`data/raw/`) are not committed.
