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

## Update: new notes (12:50)

Scope: new items at the end of notes.md. No new core ideas; all are extensions of the chosen route planner or open questions. Scores are judgement; all data claims not backed by `research/data.md` are marked UNVERIFIED.

### Minimap (HUD bottom-left, route, auto-zoom, recompute on mission change)
- Summary: small 2D map in the HUD showing the planned route and position; fits the route extent; reroutes with mission changes.
- Scores: Impact 2, Creativity 2, Validity 4, Relevance 4, Presentation 4. Feasibility 5.
- Verdict: **pursue (keep)**. Cheap: the 2D map, route polyline and DTM raster already exist for the dashboard. Auto-zoom is a bounding-box fit (fitBounds-style) with padding. Recompute-on-change comes free if the planner runs client-side (same dependency as live rerouting). Suggest: draw the comms-shadow overlay and a "you are here" arrow on it, so it also carries the signature feature. Use the cropped ortho as backdrop, no extra data.

### Dust storms and other Mars-specific hazards
- Answer (from existing research): the data layer already covers some; the rest are labelled simulation (Platzhalter-Prinzip).
  - Dust/weather: Mars Climate Database (LMD, ESA/CNES-linked, free for research, TESTED in data.md) has a dust-scenario parameter (`dust=1`), so a modelled dust/temperature window for Gale is possible. REMS (PDS Atmospheres) gives measured temp/pressure/UV per sol; wind coverage UNVERIFIED (sensor damaged early).
  - Global dust storm context: the 2018 storm ended Opportunity; Curiosity measured an opacity (tau) spike at Gale in 2018 (UNVERIFIED, from memory; scout to cite). Aug-Sep 2016 was not a storm period (UNVERIFIED).
  - Mars-only hazards we can show with data we already have: low pressure/thermal swing (REMS), radiation incl. no magnetic field (RAD), dust on suit/solar panels and reduced sunlight (modelled tau), perchlorate dust toxicity (qualitative, briefing text), long radio delay (qualitative; our HUD has no live Earth link, so ground control would be delayed 4-24 min, UNVERIFIED exact range, well known 3-22 min), and sand ripples/traction (THEMIS too coarse; skip).
- Verdict: **keep as a simulated, labelled weather/dust warning** (one HUD element plus one briefing line). Do not build a dust physics simulation. Optional visual: reduced visibility haze in the 3D scene tied to a tau slider (see graphics).
- Cost: low (static JSON from MCD) to medium (visual haze). Missing: `data-scout` check MCD dust output for the EVA sol/season (Ls of Aug-Sep 2016, UNVERIFIED), REMS DATA file open.

### Make it look great (WebGL/WASM, lighting, day/night)
- Summary: visual polish through lighting, sun position, atmosphere, post effects.
- Clarification: WebAssembly is not needed for graphics. WebGL/WebGPU through Three.js does shaders, shadows, fog and post-processing. WASM only helps heavy compute (e.g. pathfinding or viewshed in Rust/C++); JS typed arrays on a 2-3 km raster are fast enough. Recommend: Three.js, no WASM unless the viewshed profiles slow.
- Verdict: **keep, ranked as polish (Presentation + Art & Technology award)**. Priority order by value per hour:
  1. Directional sun light with real-looking shadows plus ortho texture and dusty-orange fog/haze (1-2 h).
  2. Sun position by the Mars24 algorithm (already open item, about 1 h): ties day/night to the real EVA time window and to HUD "daylight left".
  3. Day/night slider on the dashboard (timeline scrub), sky colour gradient, stars at dusk (2-3 h, stretch).
  4. Bloom, vignette, helmet-glass overlay, dust particles (stretch, 1-2 h each).
- Risks: Access Mars mesh is coarse (data.md); a displaced-DTM mesh at 1 m looks better with lighting. 60 fps on laptops must be tested. Do not let polish displace the comms shadow and route.
- Owner: `designer` (look) plus `builder`.

### Clear loading screen
- Verdict: **keep, trivial (cost under 1 h)**. Progress bar tied to real asset loading (Three.js LoadingManager), rotating tips that double as storytelling (mission facts, "data vs simulated" legend, credits). Doubles as a place for required NASA credits. Suggest keeping total payload small (tile cache, compressed textures) so the screen is short; a loader hides slowness but judges still open the link on mixed connections.

### Earth-style environment simulation models ("plant a tree at x") for Mars
- Answer: no direct equivalent as an off-the-shelf tool for Mars surface what-ifs (UNVERIFIED, scout should confirm). What exists, from my knowledge, not checked in the project research:
  - Global/mesoscale atmospheric models: Mars Climate Database/LMD Mars GCM (in data.md), NASA Ames Mars GCM, MarsWRF (UNVERIFIED availability). They answer "what is the weather at lat/lon/Ls/time", not "what changes if I add an object".
  - Terraforming and ISRU studies (water extraction, habitat siting) are papers, not interactive models.
  - The terrain-derived analogues we can build ourselves with the DTM: viewshed (comms shadow), shadow/insolation for a given sun position, cold-air/windshadow proxies. These are "what if I stand/place a relay here" analyses and are the direct Mars equivalent.
- Verdict: **cut as a model transfer; adapt as a feature**. Suggest (feature, not core idea): "place a relay/beacon at point X and see how the comms shadow shrinks" - reuses the viewshed code, one extra click interaction (about 2-3 h, stretch). It answers the human's what-if intent and strengthens the signature feature. Needs human OK at 14:00 since it is a scope item.
- Missing: `scout` for any published Mars site-placement tools (low priority).

### Web-based, deployed, reachable by QR code
- Fits: yes, the stack is already a web app and the submission needs public links without login (CLAUDE.md rules). Keep.
- Hosting recommendation: **static site on GitHub Pages** (or Cloudflare Pages/Netlify as backup). Reasons: the app has no backend if routing and data are client-side and the data is precomputed into small committed files (data.md plan); free, HTTPS, stable URL for the project page; deploy by pushing a `gh-pages` branch or GitHub Action from `main`. Keep total assets small (limits: GitHub Pages site about 1 GB, repo files under 100 MB; keep each file well under it) and no raw DTM in the repo (it is gitignored).
  - Verify: repo must be public for free Pages (UNVERIFIED for this account), no login, test in a private window, test on a phone (QR is scanned on mobile: add responsive layout or a "best on desktop" notice, and test touch/pointer-lock behaviour; first-person walk needs pointer lock/keyboard, so provide a mobile fallback such as auto-fly walkthrough or the 2D planner only).
  - QR code: generate once from the final URL (any offline generator, e.g. a `qrcode` Python/JS library, our own code so no tracking), save as PNG, add it to the demo slides, project page and a printed sheet. Use a short stable URL; do not use a third-party shortener. Test scan with two phones before the pitch.
  - Backup: ship a local build or screen recording in case venue Wi-Fi fails at the pitch.
- Cost: low (about 1-2 h, mostly CI and testing). Needs: human to decide repo visibility and the domain/URL (small decision).

### Dashboard components beyond the route planner
- Summary: open question what else belongs on the dashboard.
- Answer: only components that already map to the data and the challenge; avoid inventing new directions. Candidates, ranked by value per cost:
  1. Mission time window panel: REMS/MCD temperature, UV, sun elevation and sunset over the EVA hours (low effort, real data).
  2. Resource budget: O2/power vs distance and slope (simplified model, Simuliert label), with the return-reserve number.
  3. Radiation dose budget per EVA with an SEP scenario toggle (published RAD numbers; RAD file access UNVERIFIED).
  4. Elevation/slope profile along the route with comms-shadow segments marked (cheap from the DTM, very readable).
  5. Science stops list (POIs) with ETA, time on site and photo.
  6. Data-vs-simulated legend panel (Platzhalter-Prinzip), also required to disclose AI and data sources.
- Verdict: take 1, 4, 5 and 6 as the dashboard; 2 and 3 as simple tiles. Limit tile count (5-6 max) to avoid a cluttered UI; Presentation judges a clear story.

### Ranking of the new items (value per cost)
1. Minimap (keep, 5 feasibility)
2. Loading screen (keep, trivial)
3. Web deploy + QR (keep, required in practice)
4. Dashboard tiles (elevation profile, time window, POI list, legend)
5. Lighting and sun/day-night polish (keep as polish, staged)
6. Dust/hazards as labelled simulated warning (keep, small)
7. Relay placement what-if (stretch, needs human OK)
8. WASM, Earth-model transfer (cut)

### New questions for the 14:00 meeting
1. Hosting: OK to make the repo public and use GitHub Pages? Who owns deploy and the QR code?
2. Mobile: QR users arrive on phones. Desktop-only EVA walk with a mobile 2D/auto-tour fallback, or full mobile support (recommend fallback)?
3. Relay-placement what-if: approve as stretch feature on the comms shadow?
4. Dust/weather: accept simulated, clearly labelled visuals (haze) with MCD/REMS-derived values, no storm physics?
5. Polish budget: how many hours for lighting/day-night versus core features (recommend core first, polish after the walk works, freeze Sun 10:30)?
6. Dispatch: `data-scout` for MCD dust/Ls, REMS DATA file, RAD; `scout` for citations on dust storms and any Mars site-what-if tools.
