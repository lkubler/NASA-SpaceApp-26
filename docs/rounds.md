# Rounds

One entry per orchestrator round: time, phase, what was done, result, next.

## Round 1 — Sat 14.11. 12:36–12:43 (EXPLORE)
- Did: triage of notes.md ideas, prior-art scan, Mars data access check (parallel; critic skipped, first-round agents fixed by ORCHESTRATOR.md).
- Result: `research/triage.md`, `research/prior-art.md`, `research/data.md`. Top: science-first route planner at Murray Buttes; signature = comms shadow + return reserve + load-scaled slope limits (no prior tool has these). HiRISE DTM usable via offline preprocessing (no CORS); Trek tiles work in browser; Access Mars terrain is Apache-2.0 but low-poly.
- Open: RAD data files not found; CRISM untested; suit slope limits unsourced; Access Mars mesh vs DTM alignment unverified.
- Next: jury on top candidates before the 14:00 idea decision.

## Round 2 — Sat 14.11. 12:43–12:46 (EXPLORE)
- Did: jury idea checkpoint on triage's top candidates.
- Result: `research/jury-idea.md`. Strongest config = planner + signature set (comms shadow, return reserve, load-scaled slope) + capped guided 3D walk + static briefing ≈ 20/25; full 8-step story and rover sizing ≈ 14, cut. Target award: Best Mission Concept, then Best Use of Data. Name SEXTANT/pextant as prior art.
- Risks: walk terrain ≠ planner DTM (spike with go/no-go before 18:00); unsourced limits (15°/20°, reserve model, mGy/mSv mix-up); completeness.
- New human notes committed (dust storms, visual effects/day-night, loading screen, Mars environment models, web+deploy+QR, dashboard).
- Next: triage the new notes before 14:00.

## Round 3 — Sat 14.11. 12:46–12:48 (EXPLORE)
- Did: triage of new notes (minimap, dust storms, polish, loading screen, Mars env models, web+QR, dashboard).
- Result: `research/triage.md` update. Keep minimap, loading screen, dashboard tiles. Hosting: static GitHub Pages, precomputed data, QR tested on phones, mobile fallback (no pointer lock). Dust = labelled simulated warning (MCD/REMS). Three.js shaders instead of WASM. Env-model transfer cut; "place a relay" what-if as stretch (human OK).
- Next: sourcing the jury's Validity gaps (suit slope limits, reserve model, Murray Buttes POIs, SEXTANT) before 14:00.

## Round 4 — Sat 14.11. 12:48–12:52 (EXPLORE)
- Did: scout sourced jury's Validity gaps; intel checked 2026 submission guide (human TODO).
- Result: `research/sources-validity.md`: no NASA suited slope limit (20° xEMU / Apollo <15° typical); Pandolf/Santee + NASA BTU/hr numbers for reserve model ("simplified model" label); SEXTANT has no load term, comms/reserve unverified; boxwork refuted at Murray Buttes; 10 km walkback is a test distance, NASA sizes 1.8–3.5 km. `research/submission-guide.md`: deadline conflict (guide/schedule 23:59 vs CLAUDE.md 15:45, keep 15:45 until Local Lead confirms); SI form field not seen by judges.
- Next: data-scout on Access Mars sites/DTM coverage (running), then wait for 14:00 decision.

## Round 5 — Sat 14.11. 12:49–12:57 (EXPLORE)
- Did: data-scout on the humans' site TODOs (Access Mars scenes, targets in detail area, DTM coverage).
- Result: `research/data-sites.md`. All 4 sites in Access Mars (128×128 m tiles, ~82k verts; SIMPLE collision node only ~4.5 m spacing → sample tile meshes for 0.5 m grid). No georeferencing (±30 m origin estimate, rotation unknown). Inside: Buckskin (high), Pahrump targets, Goulburn; doubtful: Quela, Link, Hottah. No single DTM covers all 4: DTEEC_040770 (Murray/Marias/Pahrump) + DTEEC_018854 (Bradbury); Murray 72% valid → no-data mask.
- Next: pause until the humans' 14:00 idea/stack decision; then record in DECISIONS.md and start BUILD (designer themes, 3D spike).
