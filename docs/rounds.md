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

## Round 6 — Sat 14.11. 13:16–13:22 (EXPLORE)
- Did: recorded human chat decisions in DECISIONS.md (idea, stack proposal, hosting, theme, deadline 15:45, walkback 2–3.5 km, desktop only); designer wrote `docs/design.md`; data-scout sourced Quela + dust hazards; builder 3D spike started on `spike-3d`.
- Result: design system (white paper UI + Mars red, dark glass HUD, provenance colors, magenta comms shadow). Quela "Murray Butte 12" + cross-bedding sourced only via Universe Today (secondary); Access Mars INTERFERENCE POI supports comms shadow. Dust: 2018 storm tau 8.5 at Gale, labelled tau table; winds can't blow people over.
- Next: 3D spike go/no-go; after 14:00 confirmation create BUILD tasks (designer section 16 list).

## Round 7 — Sat 14.11. 13:38 (EXPLORE)
- Did: reviewed builder 3D spike (branch `spike-3d`, bd1895c, not merged); copied `research/spike-3d.md` + screenshot to main.
- Result: GO. Vite + Three.js loads Access Mars Murray Buttes glb (64 tiles, 128k tris), WASD + pointer lock, raycast ground height, uphill slowdown, 0.5 m heightmap (256×256, ~45 ms, 2 holes) matching raycast within 3 mm. Gotchas: 2017 Draco needs the original decoder (`oldDraco.js`); root scale ×100. Median slope 7.8°, p95 34° → hazard thresholds will trigger often. FPS unmeasured on real GPU (headless software GL only) — a human should try it once.
- Next: humans confirm idea/stack at 14:00, then BUILD tasks (planner + comms shadow + reserve first, 3D walk second, visuals third).

## Round 8 — Sat 14.11. 13:42–14:02 (EXPLORE → BUILD)
- Did: humans confirmed idea + stack (13:42); Live Site out. Created tasks 001–011. Wave 1 builders 001/002/004/005 + designer 006 in worktrees, merged into main after build + tests (19 model tests pass). scout wrote `research/science.md`; data-scout answered its open questions in `research/data-science.md`.
- Result: app shell (Vite + Three, #/map #/walk, Pages workflow); HiRISE DTM crop 1 km @ 1 m, 97 % valid, Access Mars aligned to DTM (±2 m, ±1.5°; old data-scout origin estimate was ~160 m off); reserve model (Mars walking 400–700 W, matches NASA 498–674 W); comms viewshed (~0.1 s for 512²); designed walk HUD. Science: return path alone is prior art (Johnson 2009) → pitch the turn-back point + comms shadow + load-scaled combo; RAD 0.028 mSv/h; Mars24 verified; REMS sol 1440 parseable; Quela at 137.3530E −4.69520 (outside walk square, inside DTM).
- Next: 003 planner (running); then wave 2: 007 walk route in 3D, 008 sun/dust (Mars24), 009 AI, 010 briefing/minimap/sources; science extras (autonomy clock, RAD counter, Curiosity path/POIs).

## Round 9 — Sat 14.11. 14:02–14:25 (BUILD)
- Did: merged 003 planner, 010 cold open/briefing/sources, 008 + 008b sun/dust (north-axis fix), 007 route in 3D, 012 planner realism (stations, EVA clock, comms rover on high ground), 013 autonomy clock + RAD dose. Resolved merge conflicts in main.js / walkView.js. Note: `git pull --rebase` flattens merge commits and conflicts — use `git fetch && git merge origin/main` on main.
- Result: 35 tests pass, build OK, all 4 views 0 console errors. End-to-end headless: default scenario at Murray Buttes → 6 stations, 6.2 h EVA, turn-back at 14:39 before station 6, suit 22 % at end, one 122 min comms shadow; Walk shows route ribbon, magenta shadow, HUD signal NONE, light-time 7.1 min, dose.
- Found: route dose shows 0.004 mSv (should be ~0.17) and SIGNAL chip says simulated (should be modelled) → 013b; map slope layer too dominant, label collisions, Guided-walk button overlaps sky panel, dim overlay → 014 designer polish.
- Next: 013b, 014; then ux-tester + jury on the prototype; AI feature 009 waits for human OK on `claude -p` usage.
