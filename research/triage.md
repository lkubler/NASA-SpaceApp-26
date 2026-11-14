# Triage of notes.md (round 1, Sat 14.11. ~12:40)

Scores 1-5. Impact / Creativity / Validity / Relevance / Presentation, then Feasibility in the ~22 h of build time left (freeze Sun 10:30, submit Sun 15:45). Nothing here is a new core idea; every item comes from notes.md. Improvements are marked "Suggest".
Unverified so far: all data availability and licence claims (no scout or data-scout run yet). Scores are judgement, not measured.

## Ranking (what to do first)
1. **Science-first route planner on real Murray Buttes terrain (the core, notes 1, 2, 4, 7, data table)**
2. **Comms shadow plus return-reserve constraint (the "unique highlight")**
3. **First-person 3D EVA walk with helmet HUD (the demo highlight)**
4. **Story flow, mission-briefing cutscene, route summary (Presentation layer)**
5. Live rerouting on deviation
6. Rover segment and rover sizing cutscene
7. Launch and landing scroll animations
8. HUD customizer
Pitch framing "layer below Mars Trek" is not a feature; adopt it as the one-sentence pitch.

## Sections (one per note)

### "Die Wissenschaft gehört ins Zentrum..." (science-centred route)
- Summary: route links science targets (CRISM-suggested or hand-picked, e.g. three boxwork outcrops) instead of A to B.
- Scores: Impact 3, Creativity 4, Validity 4, Relevance 5, Presentation 4. Feasibility 4 if targets are hand-picked POIs; 2 if CRISM-derived suggestions are required.
- Verdict: **pursue**. It matches the challenge text almost word for word ("conducting new science along the way").
- Suggest: ship manual or pre-curated POIs first (from published Curiosity science results at Murray Buttes), CRISM auto-suggestion only as a stretch. Order POIs with a small solver (shortest safe tour, e.g. brute force or greedy for under 10 POIs).
- Missing checks: `data-scout`: is CRISM coverage at Murray Buttes usable (MTRDR/summary products, effort to project)?

### "Die Lücke ist hyperlokal..." (pitch: layer below Mars Trek)
- Summary: positioning statement quoted from the challenge text.
- Verdict: **pursue as the pitch line**; no build cost. Strong for Relevance.
- Check: `scout` to confirm no existing tool already does single-EVA planning (quick novelty check).

### "Rover und Arbeit in Zweierteams..." (rover, pairs)
- Summary: open question whether to include rover and two-person teams.
- Answer: both are only "consider" items in the challenge. Rover is already covered by the user story (rover segment). Pairs: skip, or one cheap line in the HUD (buddy position) only if time remains. Not needed for score.

### "für Demo: 1. Planung im Dashboard..." (3-step demo)
- Summary: planning dashboard, then rover cutscene using fuel, gear, instruments to size the rover, then first-person EVA.
- Scores: Impact 3, Creativity 4, Validity 3, Relevance 4, Presentation 5. Feasibility 3.
- Verdict: **rework**. Steps 1 and 3 are the product. Step 2 (rover sizing from fuel, equipment, research plan) is a large modelling job with weak data basis; cut to a visual-only cutscene carrying the mission briefing.
- Hard constraint: demo is a video of 30 s or at most 7 slides. A 3-step story must fit 30 s. Plan the demo storyboard now; the full flow is the live-pitch and project page, not the 30 s cut.

### Data layer table (HiRISE DTM, orthoimage, THEMIS, CRISM, RAD, REMS)
- Summary: six layers, each tied to a route consequence.
- Scores: Impact 3, Creativity 3, Validity 4, Relevance 5, Presentation 3. Feasibility: see per layer.
  - Topography (HiRISE DTM to slope, roughness): **core, feasible**. 833 MB DTM; crop a tile around the route. Risk: DTM artefacts, 1 m/px vs rocks smaller than that (be honest in the pitch).
  - Orthoimage and rover photos: feasible (60 MB ortho; Analyst's Notebook photos at POIs for the POV the challenge asks for).
  - Radiation (Curiosity RAD): feasible as a per-EVA dose budget from published daily dose (about 0.2-0.7 mSv/day surface); a solar-particle-event scenario is a nice story beat. TODO from notes still open.
  - REMS (temp, wind, UV): feasible as a time-window chart; low effort.
  - CRISM (spectral): medium risk, see above.
  - THEMIS thermal inertia: coarse (100 m/px), so it does not resolve a single EVA. Verdict: weak; use only as a regional context layer or drop. Challenge needs only three kinds, so topo + optical + radiation + atmospheric already meets it.
- Verdict: **pursue**, with THEMIS demoted.
- Missing checks: `data-scout` for DTM size and tile cropping, PDS access to RAD and REMS for sols Aug-Sep 2016, CRISM and THEMIS coverage, licences.

### Route logic (hard limits, soft costs, direction, return constraint, rover segments)
- Summary: slope and boulder bans (limit falls with carried load), costs for energy, dose, comms shadow; asymmetric uphill/downhill; return-feasibility; optional rover segments.
- Scores: Impact 3, Creativity 4, Validity 5 if limits are sourced, Relevance 5, Presentation 3. Feasibility 4 (grid A* on a slope raster is a one-day job).
- Verdict: **pursue**. This is the Validity backbone.
- Suggest: use a Tobler-like or metabolic walking cost with explicit slope and load terms, and state every assumption on screen. Keep return-constraint as a check on the final route (turn-back time per waypoint), not a joint optimiser.
- Missing checks: `scout` (research task): suit slope and load limits, EVA duration, reserve rules, with citations (notes say "müsst ihr recherchieren und begründen"); this must be done before the cost model is coded.

### "vor allem Funklöcher / Blocker, Reserve..." (comms shadow, reserve = unique highlight)
- Summary: line-of-sight radio blackout map from the DTM, plus a reserve that guarantees the way back.
- Scores: Impact 4, Creativity 5, Validity 4, Relevance 5, Presentation 5. Feasibility 4: viewshed from the base or rover on a DTM raster is a standard algorithm, cheap.
- Verdict: **pursue, make it the signature feature**. It is visual (red shadow on the map and HUD), safety-first, and uses topography only, so it has no external data risk.
- Suggest: show "time to safe return vs remaining reserve" as one HUD number; dramatic demo moment when the astronaut enters a shadow.

### "Missionbriefing während der Fahrt Cutscene"
- Summary: briefing with goals, hazards, Curiosity history, a few images during the drive.
- Scores: Impact 2, Creativity 3, Validity 3, Relevance 3, Presentation 5. Feasibility 4 (static text and images).
- Verdict: **pursue, cheap**. Good Storytelling award fit. Use NASA public images with credits.

### "Potentielles live rerouting..."
- Summary: if the user leaves the path, warn and recompute or show hazard view.
- Scores: Impact 3, Creativity 4, Validity 4, Relevance 4, Presentation 4. Feasibility 3 (needs the same solver in the browser at runtime).
- Verdict: **pursue as stretch, after the core walk works**. If the planner runs client-side, it is cheap; if it is a server job, drop it. Warning-only is a fallback (just flag slope or shadow at current position).

### User story (scroll launch, site choice, landing, rover route, walk route, summary, 3D, next site)
- Summary: end-to-end story website; all routes from real NASA data.
- Scores: Impact 4, Creativity 4, Validity 3, Relevance 4, Presentation 5. Feasibility 2 for the full flow in 22 h.
- Verdict: **rework (scope cut)**. Keep steps 2/5/6/7 (site, EVA route, summary, 3D). Cut steps 1 and 3 to a short hero animation or still sequence (not a scroll-driven rocket). Keep exactly one site, Murray Buttes; "next site" only as a disabled picker or slide. Rover route (step 4) as a simple 2D path with its own slope limit is optional.
- Risks: scope; breadth over polish; Validity suffers if the 3D walk shows terrain not matching the planned data (see 3D base).
- Open decision for humans: how many of the 8 steps (recommendation: 5, 6, 7 mandatory, 2 as picker, rest as polish).

### 3D base (Access Mars terrain, Murray Buttes)
- Summary: use terrain.glb and tiles from Access Mars for the first-person scene.
- Scores: Impact 3, Creativity 4, Validity 3, Relevance 4, Presentation 5. Feasibility 3.
- Verdict: **pursue, with a spike first**. Biggest technical risk: the Access Mars mesh (derived from HiRISE) must be georeferenced to the same DTM as the routing raster, or the HUD warnings will not match what the user sees.
- Suggest: alternatively build the 3D mesh directly from the same cropped DTM (heightmap to Three.js terrain, ortho as texture); this guarantees consistency and removes dependence on the repo. Decide after the spike.
- Missing checks: `data-scout`: licence of Access Mars assets (repo reported as open source, not verified), coordinates and scale of terrain.glb, whether one site is enough. `builder` spike: load glb in Three.js, walk at eye height 1.7 m, 60 fps on a laptop.
- Note: Murray Buttes is a good choice (buttes make strong slope hazards and comms shadows, plenty of Curiosity data for Aug-Sep 2016).

### HUD customizer (optional)
- Verdict: **drop** for now. Low impact on the criteria; revisit only if everything else is finished.

### Open items at the end of notes
- Sun position (Mars24 algorithm, NASA GISS): `data-scout` to find the reference (Allison and McEwen, Mars24); small formula, about 1 h to implement. Value: shadows and the EVA time window. Pursue only if time remains.
- RAD solar particle event in Aug-Sep 2016: `data-scout` to check whether one exists in that window; if not, use a generic scenario labelled clearly as such (no invented data).
- PDS Analyst's Notebook for positions, photos, RAD, REMS: `data-scout`.

## Open questions for the humans at 14:00
1. Scope: confirm one site (Murray Buttes) and the cut list above (launch/landing scroll, rover sizing, HUD customizer cut or reduced).
2. Platform and stack: web app (recommended: browser, Three.js plus a 2D map; the routing runs client-side).
3. Demo format: 30 s video or 7 slides; who owns the storyboard (the 30 s cut must show planning, comms shadow, and the first-person walk).
4. Signature feature: confirm comms shadow plus return reserve.
5. 3D source: Access Mars mesh vs own mesh from the DTM (decided after the spike, by agents).
6. Overall visual theme (the one human decision on design).

## Next dispatches (suggested)
- `data-scout`: DTM crop, PDS RAD/REMS, CRISM/THEMIS coverage, Access Mars licence, Mars24 reference.
- `scout`: suit limits and EVA reserve sources; novelty check against Mars Trek and earlier Space Apps entries.
- `builder`: 3D terrain spike.
- `pitch` and `designer`: after 14:00.
