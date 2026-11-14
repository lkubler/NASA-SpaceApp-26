# Decisions

Per entry: topic, status (PROPOSED / DECIDED), decision, reason, rejected alternatives.

## Challenge
DECIDED: Interplanetary Survival Guide: Martian Map

## Idea
DECIDED (Sat 13:16, human in chat; CONFIRMED by human Sat 13:42): EVA route planner at Murray Buttes (plus the other Access Mars sites from notes.md) with the signature set comms shadow + return reserve, a first-person 3D walk with strong visuals (lighting, day/night, dust/weather), and as many extra features as time allows.
Reason: jury's strongest configuration (`research/jury-idea.md`), the humans' own priority list in notes.md.
Live Site: OUT (agents, 13:42). Its position is undocumented (notes.md storyline item already says drop it); the four documented sites are enough.
Quela: kept as a Murray Buttes research target; if it falls outside the 3D detail area, the 3D walk targets the nearest in-area outcrop and the map marks Quela itself (agents decide placement).
Demo format: humans decide later; `pitch` provides story/pitch .md files when started.

## Constraints (Sat 13:16, human in chat)
- Deadline: work to the local 15:45 (global 23:59 is not ours).
- Walkback: 2–3.5 km (NASA suit sizing / xEVA ConOps 2 km), not 10 km. Reserve buffer: 20 % (Apollo, see notes.md references).
- Desktop first: judges view on PC. No QR code, no phone fallback.

## Stack
DECIDED (human confirmed Sat 13:42; proposed by orchestrator 13:16): static web app, Three.js/WebGL for 3D and visual effects, data preprocessed offline in Python (slope, line of sight, heightmaps), routing in browser JS. No WebAssembly: GPU effects come from WebGL shaders; CPU work is precomputed or small. Revisit only if in-browser routing is measurably slow.
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

## AI feature in the product
DECIDED (human, Sat 13:30): the product gets an AI part (humans' idea in notes.md "AI USECASE": ask the HUD about what you see, answer from measurement + suit specs).
PROPOSED approach (all three together; no API key, no hosted backend):
1. Pre-generated answers: during the hackathon, generate answers with `claude -p` on the team's plan for a fixed question set (per POI, rock/terrain type, "can my suit make this step?" across slope/load bins). Ship as JSON. In the HUD the user looks at a target and picks from 3–4 suggested questions; the live measurement (slope, distance, reserve) is computed in the browser and combined with the pre-written text. Labelled as AI-generated.
2. In-browser retrieval: small embedding model (transformers.js, ~25 MB) over a prepared corpus of suit specs and NASA documents (sources in `research/sources-validity.md`). Shows the most relevant passage as a cited source next to the answer. Runs on the viewer's machine.
3. Live mode for the pitch only: a local toggle sends free-text questions to `claude -p` on the presenter's own laptop (a tiny localhost bridge). Off or unreachable → silently falls back to 1+2. Never used by the public link.
Reason: public link must work for judges weeks later without a running laptop or secrets; a subscription plan is for personal use, not for serving other users; 1+2 are instant and free, 3 adds the live wow moment.
Disclosure: AI-generated answer text noted in the UI, `docs/ai-use.md`, and the submission description.
Hosting consequence: site stays fully static (GitHub Pages; Cloudflare Pages mirror).
