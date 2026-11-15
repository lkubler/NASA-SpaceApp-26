# Minimap as data display: walk-back maps, helmet maps, position without GPS

Researcher, Sun 15.11. ~10:00 (BUILD, freeze at 10:30). Time-boxed to 12 min. Does not repeat `research/helmet-display.md` (SUITS 2D mini-map "shall", SUITS 2025-26 "predictive maximum range" and "turn around points", Joint AR walk-back narrative, Bensch et al. minimap with contours, breadcrumbs), `research/risks.md` (DRA 5.0 15 km walk-back, Moon to Mars safe haven) or `docs/data-use.md`.
Mark: **V** = I opened the source this session. **S** = second-hand (search summary or citation in another paper). Ideas (a), (b), (c) are the team's (`notes.md` 136-138, 281, 284-309).

## 1. Reserve / walk-back shown as a map

| Claim | Applies to | Source | Mark |
|---|---|---|---|
| Apollo 15 EVA analysis plotted consumables limits against EVA time and traverse length; "Any walking traverse which meets all other consumables constraints and does not exceed this return distance does not violate any walkback constraints." Assumes 50 % riding, 50 % station time | Apollo 15 planning (Bellcomm), a chart, not a map contour | https://www.nasa.gov/wp-content/uploads/static/history/alsj/19790073512_1979073512.pdf | S |
| "CONTINGENCY WALKBACK SPEED = 4.0 KM/HR" | Apollo 15 traverse planning memo | https://www.nasa.gov/wp-content/uploads/static/history/afj/ap15fj/pdf/AS15-memo-traverse-planning-19790072192.pdf | S |
| Apollo 17 walk-back limit was conservative; "During the actual EVA the walk-back distance was recalculated based on the actual consumption rates." | ICES 2018, "EVA Walk-Back Limit Calculation Using the Virtual Spacesuit" (page returned 403) | https://ttu-ir.tdl.org/handle/2346/74208 | S |
| NASA has assumed ~10 km as the maximum excursion from lander/habitat, from Apollo experience | walkback test study | https://ntrs.nasa.gov/api/citations/20130009179/downloads/20130009179.pdf | S |
| Apollo 16 surface procedures contain 1:25,000 and 1:12,500 traverse maps per EVA | Apollo 16 FLSP | https://www.nasa.gov/wp-content/uploads/static/history/alsj/a16/a16flsp.pdf | S (not opened; I could not confirm whether a walk-back circle is drawn) |

**Not found / not verified:** a NASA or NASA-funded display that draws a consumables-range *contour* (isoline of "reserve on return") over terrain. Apollo used a distance limit (a radius) and charts; SUITS 2025-26 asks for a "predictive maximum range" (see `helmet-display.md`) but I found no published figure of how it is drawn. SEXTANT / xGEO / Playbook map displays: not searched in time. Aviation glide-range rings (e.g. Garmin "glide range ring"): known analogue, not opened this session, so not citable from here. Honest wording for the pitch: "Apollo planned with a walk-back radius and recalculated it during the EVA from actual consumption; we draw the same quantity per point, over terrain, from the planner's way-home field." The "per point over terrain" part is our model, not a NASA display.

## 2. Maps in helmet or cuff displays (new beyond helmet-display.md)

Nothing new verified in time. Already covered there: SUITS "shall design a 2D mini-map", POIs, rover, breadcrumbs, best path back; Bensch et al. (minimap with shadow and contours, hazard rings, traverse history); Joint AR layers (comms coverage). Heading-up vs north-up for a helmet minimap: **not found**.

## 3. Navigation without GPS

| Claim | Applies to | Source | Mark |
|---|---|---|---|
| "In current practice on all Mars rover missions, global localization is performed manually by humans. The rover drives until its odometry solution accumulates too much uncertainty and captures a 360 panorama which human experts will manually match to an orbital map" | Mars rovers (Perseverance and earlier) | Nash et al., "Censible", JPL, ICRA 2024, Sec. II, https://www-robotics.jpl.nasa.gov/media/documents/2024_Global_Localization_ICRA.pdf | V |
| Perseverance's longest drive without human review, 699.9 m over three days, "is limited by growth in position uncertainty"; uncertainty "is reset by localizing the rover on a global map of Mars" | Perseverance | same, Sec. I | V |
| Bundle adjustment reduces odometry error "although the error still fundamentally grows with distance traveled" | rover odometry | same, Sec. II | V |
| Horizon-based matching to DEMs: "Accuracy is typically on the order of 100m, at best 10m"; "valuable for orientation estimation" | literature summary by JPL | same, Sec. II | V |
| Matching rover panoramas to the HiRISE orbital map: 0.36 m accuracy over 264 panoramas, max error 1.07 m, 30 m search window ("a conservative bound on the rover odometry position uncertainty after a long drive"); >5 m counts as outlier per a Perseverance requirement; human ground truth ~0.5 m | Perseverance data, HiRISE 0.25 m map | same, Sec. V | V |
| Goddard "Monocular Horizon Navigation": horizon as image landmark for Artemis lunar surface localisation; filtered solutions have "position errors of 50 meters or better" | Moon, simulation | Driessen, Liounis, Yew et al., https://ntrs.nasa.gov/citations/20240011910 | V (abstract page) |
| Horizon matching against synthetic panoramas located a vehicle "to within 6 m" | Mercator study | via search summary (no URL opened) | S |
| NASA lunar-horizon effort targeted "less than 30 feet (9 meters)" | Goddard, press | https://phys.org/news/2022-12-nasa-ai-lunar-surface-landmarks.html | S |
| LunarNav is crater-based, not horizon-based | arXiv 2026 | https://arxiv.org/pdf/2603.17229 | S |
| MER: wheel-slip localisation error up to 21 % in Eagle Crater, corrected by bundle adjustment; Spirit 0.2 % over 10 km after BA | MER rovers | https://WWW.ISPRS.org/proceedings/XXXVII/congress/1_pdf/165.pdf ; https://goobi.tib.eu/viewer/fulltext/85690161X/64 | S |
| Person on foot, foot-mounted IMU with zero-velocity updates: ~2 % of distance on short walks, growing beyond 2 % over minutes; step-model PDR 3-8 %; range in literature ~1-10 % | Earth pedestrians | Ojeda & Borenstein (via search); https://www.ncbi.nlm.nih.gov/pmc/articles/PMC9027260/ | S |

Citable pair for (c), with care: drift **~2-5 % of distance walked** (Earth pedestrian dead reckoning, S; label `assumption`); fix **0.36 m** by panorama-to-HiRISE matching (V, rover, not astronaut) or **10-100 m** by horizon-only matching (V, JPL literature summary) / **≤50 m** Goddard simulation (V). Important for honesty: JPL says horizon-only matching is too coarse for rover position; over our 128 m square, a 10-100 m horizon fix would barely shrink the circle. A horizon fix that shrinks to ~1 m would contradict this source.

## 4. The three ideas against existing app data

| Idea | Data it would use (existing code) | NASA data decides or shows? | Honest risk |
|---|---|---|---|
| (a) map scales to the route | route legs (`sim.route.legs`), `D.miniRadiusM` = 32 m fixed (`app/src/steps/4-walk/display.js:110`), relief canvas from terrain | Shows only. Same data, better framing | Low build risk; zero data-use gain for judges. Auto-zoom can disorient while walking (not verified in a source) |
| (b) way-home field as map, turn-back line as contour | `costField(terrain, rover)` (seconds, energyJ per cell; cached in `app/src/core/plan.js:21`) + `reserveOnReturn(levels, {homeEnergyJ, homeSeconds})` (`app/src/core/suit.js:107`), terrain from Access Mars mesh (Curiosity images) and HiRISE-derived slope | Decides: the colour of every cell comes from slope of NASA-derived terrain through the planner and suit model; the contour is the turn-back rule already used. Values are `model` | Per-cell `reserveOnReturn` over 256x256 cells must not run per frame (recompute every few s or on level change). The colour map can clutter the 32 m minimap; Bensch et al. ask for thin overlays. No NASA display precedent found for a contour (Sec. 1), so call it our model, Apollo radius as precedent |
| (c) uncertainty circle | walked distance (`sim.log.track`), `lineOfSight` / `radioShadowMask` (`app/src/core/radio.js`) for the rover/relay fix; horizon matching would need new per-point horizon profiles from the terrain grid | Smallest version (grow + LOS shrink): terrain decides where a fix is possible via line of sight. Horizon match: terrain decides fix quality | Drift % is an assumption from Earth pedestrians. Over a 128 m site and ~200 m walks, 2-5 % drift gives a 4-10 m circle: visible but small. Horizon fix per JPL is 10-100 m, i.e. worse than the drift here; showing a sharp horizon fix would be scientifically weak. Radio ranging accuracy not researched. Demo "seen" horizon comes from the same model (team already notes this) |

## 5. Ranking (impact on Relevance / Presentation / Validity vs. build cost; costs are my estimates for this codebase, unverified)

| Rank | Version | Smallest version | Relevance | Presentation | Validity | Est. build |
|---|---|---|---|---|---|---|
| 1 | (b) | Low-res (e.g. 64x64) reserve-on-return grid from the cached rover `costField` + current levels, recomputed every few seconds; draw only the turn-back contour (reserve = 0 / reserve floor) as one line on the minimap, label `model` | High: NASA terrain drives every cell | High: "the core sentence as a picture" | Good if labelled model; Apollo recalculated walk-back during EVA (S) | ~45-90 min |
| 2 | (b) variant: same contour on the Plan map only (static, no per-frame cost) | contour at full levels | High | Medium (judges see it in the plan screenshot) | Good | ~30-60 min |
| 3 | (c) smallest | circle grows at an assumed % of distance; shrinks when `lineOfSight` to rover is true; no horizon match | Medium (terrain decides fix) | Medium | Medium: drift % is an assumption; must not claim horizon accuracy | ~45-60 min |
| 4 | (a) | fit `miniRadiusM` to the leg's bounding box, clamped | Low (display only) | Low-medium | Neutral | ~15-20 min |

Not verified: everything marked S above; build-time estimates; whether a walk-back contour exists in SEXTANT/xGEO/Playbook; glide-range ring wording.
