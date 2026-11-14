# Jury simulation: idea checkpoint

Jury, Sat 14.11. ~13:00, EXPLORE phase, for the 14:00 idea decision. Freeze is Sun 10:30 (about 21 h of build time).
Scored as a Space Apps panel would: Impact / Creativity / Validity / Relevance / Presentation, each 1-5, equal weight.
Inputs: `notes.md` (the humans' ideas), `research/triage.md`, `research/prior-art.md`, `research/data.md`, `docs/rules-2026.md`, `docs/challenge.md`.
No new core idea here. Everything scored comes from `notes.md`; "Suggest" marks improvements, cuts, and checks.
Nothing is built yet, so every score is a projection of what the panel would see on Sunday if the item ships as described. Scores are judgement, not measurement.

## Verdict in five lines
- The direction is right for this challenge. Relevance is a likely 5. That is the only criterion that is safe today.
- Projected total for the strongest configuration: **20/25** if it ships complete, **16-17/25** if scope slips. Triage scored more generously than a panel will, mainly on Creativity and Validity.
- Creativity is the weakest criterion on paper. Least-cost EVA routing on a DEM already exists (SEXTANT, see below), and first-person Mars walks exist. The novelty is only the combination.
- Validity is the criterion most likely to drop on Sunday. Three concrete reasons are listed under "Top 3 risks to Validity".
- The first-person walk is the highlight of the demo, not the core of the product. The notes call it "Highlight und Core Feature". A panel scores the planner; the walk sells it.

## Scores per candidate
"Alone" means: judged as if this were the whole project.

| # | Candidate (from notes.md) | I | C | V | R | P | Sum | One-line reason |
|---|---|---|---|---|---|---|---|---|
| a | Science-first route planner on the Murray Buttes HiRISE DTM (2D dashboard, POIs, slope-cost route, summary stats) | 3 | 2 | 4 | 5 | 3 | 17 | Answers the challenge text directly, but alone it is a textbook least-cost path with prior art. |
| b | Signature set: comms shadow + return reserve + load-scaled slope limits (on top of a) | 3 | 4 | 3 | 5 | 4 | 19 | Lifts Creativity and gives the demo its moment; Validity is 3 until the numbers are sourced, 4 once they are. |
| c | First-person 3D walk with helmet HUD | 3 | 3 | 2 | 4 | 5 | 17 | Strongest visual; done before (Access Mars, Solar Atlas), and Validity is 2 while the walked terrain is not the planned terrain. |
| d | Full 8-step story website (scroll launch, landing, site choice, rover route, next site) | 3 | 3 | 2 | 3 | 3 | 14 | Launch and landing carry no NASA data; unfinished breadth reads as incomplete, which costs both Validity and Presentation. |
| e | Rover segment with rover sizing from fuel, gear, instruments | 3 | 3 | 2 | 3 | 3 | 14 | A second model with no data basis; every number would be invented. |
| f | Mission briefing during the drive (goals, hazards, Curiosity history, photos) | 2 | 2 | 3 | 4 | 4 | 15 | Cheap; real Curiosity photos satisfy the challenge's point-of-view hint. Worth it as static content. |
| g | Live rerouting when the user leaves the path | 3 | 3 | 3 | 4 | 4 | 17 | Only meaningful with a free-roam walk; the warning-only version gets most of the effect. |
| h | Six data layers (topo, optical, thermal, spectral, radiation, atmospheric) | 3 | 2 | 3 | 5 | 3 | 16 | Only topography and optical drive the route at 1 m. A layer list is what the closest competitor already has. |
| i | HUD customizer | 1 | 2 | 3 | 2 | 2 | 10 | No effect on any criterion. Drop. |

### Strongest configuration (a + b + capped c + f)
| Case | I | C | V | R | P | Sum |
|---|---|---|---|---|---|---|
| Ships complete, numbers sourced, walk matches the plan | 3 | 4 | 4 | 5 | 4 | **20** |
| Scope slips: planner works, walk half-done, numbers unsourced | 3 | 3 | 3 | 5 | 2-3 | **16-17** |

What would raise each criterion most:
- **Impact (3).** The audience is a handful of future astronauts, so 3 is the honest ceiling for the tool alone. Raise it in the pitch by naming who uses it before anyone flies: mission planners, analog-mission crews, and the public walking a real planned EVA. Do not claim more than the tool does.
- **Creativity (4).** Lead with the reserve and comms shadow, never with "layered map" or "route planner". Name SEXTANT yourselves and say what is added. A judge who knows it and hears nothing about it gives a 2.
- **Validity (4).** One screen that lists every limit with its source and its status (measured, modelled, simulated). The notes' "Platzhalter-Prinzip" already does this; it is the best Validity idea in the notes and must ship. Plus one validation check (see Best Use of Science below).
- **Relevance (5).** Keep it. Risk only if the 30 s video spends its time on a rocket instead of on data.
- **Presentation (4).** One site, one mission, one story, polished. Assign one human to the demo today (the guide says to delegate). A 5 needs the video cut by Sunday 12:00, not at 15:30.

## (a) Science-first route planner at Murray Buttes as the core
Verdict: **correct core, not sufficient alone.**
- For: it matches the challenge sentence by sentence (science goals first, hyperlocal, route avoiding obstacles, suit mobility). The only real elevation source is confirmed reachable (`research/data.md`: DTM TESTED, range-readable). Murray Buttes has buttes, which give slope hazards and radio shadows, and Curiosity data for Aug-Sep 2016.
- Against, prior art the scout missed: **SEXTANT** (MIT, used in NASA BASALT analog missions) plans astronaut traverses as least-cost paths on a DEM with a metabolic cost model. Its Python port is public: https://github.com/norheim/pextant (MIT licence; repo existence, description and licence checked via the GitHub API; I did not read the code). So "least-cost EVA route on a DEM" is not new. This is good for Validity (the method is what NASA-linked researchers use) and bad for Creativity unless b is in front.
- Against, science targets: the notes use "drei Boxwork-Aufschlüsse" as the example, copied from the challenge text. To my knowledge the boxwork Curiosity studied in 2025 is several km further up Mount Sharp, not at Murray Buttes (from memory, unverified). A geologist on the panel would notice boxwork POIs placed at Murray Buttes. Suggest: POIs from what Curiosity actually studied at this site (the notes' own link names Murray mudstone and Stimson sandstone), each POI with a real Curiosity image and sol. Have `scout` confirm the boxwork location before any POI is named.
- CRISM-suggested targets: not confirmed for this site (`research/data.md`). At 18 m/px CRISM gives at most a handful of pixels per outcrop. Hand-picked POIs with a cited source are more defensible than an auto-suggestion that cannot be explained. Cut the auto-suggestion; keep "spectral" out of the claimed layers unless a Trek CRISM tile really shows something at Gale.
- "Science-first" must be visible in the output, not only in the name. Suggest: the summary shows science time at each POI and what is left of the EVA after travel, so the route is judged by science done per reserve used.

## (b) Comms shadow + return reserve + load-scaled slope limits as the signature
Verdict: **yes, make it the signature. It is the only part that is both novel in this context and cheap.** It needs only the DTM, so it has no data risk. Ranked by strength:

1. **Return reserve** (strongest). "From every point, the way back must fit the remaining reserve" is one number a judge understands in two seconds. Weakness: the reserve model does not exist yet. Suggest: use a published walking-energy model with slope and load terms (SEXTANT uses one; `scout` to pull the reference and constants) instead of a home-made formula, and show the turn-back point on the map. Without a cited model this is a made-up bar on a HUD.
2. **Comms shadow.** Visual and real: the notes cite a NASA lunar EVA planning deck listing "max time without line of sight to the lander" as an operational limit. That citation is the whole Validity argument, so open the PDF and quote the slide (not verified by any agent yet). Weaknesses a judge can raise: (1) line of sight to what? The notes say the rover; fix one transmitter position and antenna height and state them, because the result changes a lot with mast height. (2) Geometric line of sight is a conservative proxy for radio coverage, and a real crew would also have orbital relays. The notes' placeholder text already says this; keep that sentence on screen. (3) Express it as the NASA parameter does, "time out of contact along this route: N min (limit M)", not only as a red overlay.
3. **Load-scaled slope limit** (weakest). The 20 deg limit has a source but it is a lunar requirement; the notes say so honestly. The reduction to 15 deg with load is the team's own assumption with no source. A slider that moves a number nobody can justify invites the question "where is 15 from?". Suggest: either find a source in the next hours (`scout`), or present load as a term in the cited energy model (load raises cost, which shortens reach and moves the turn-back point) and keep the hard slope limit fixed at the sourced value. The second option is more defensible and less work.

One addition that fits the humans' radiation layer and this exact site (Suggest, not a new idea): Curiosity's RAD measured a **4 % lower dose rate while parked next to Butte M12 at Murray Buttes (sols 1456-1467), with 19 % of the sky blocked** (Ehresmann et al. 2021, JGR Planets, doi:10.1029/2021JE006851; abstract checked via Crossref). This matters because otherwise radiation is not a map layer at all: over a 2 km walk the dose rate is practically uniform, so "dose as a route cost" is just time multiplied by a constant, and a judge will see that. With this paper the buttes that block the radio also shield the crew, measured by NASA at this site. It is the same sky-visibility computation as the comms shadow. Use it as the shelter answer in the solar-event scenario if time allows; at minimum cite it in the pitch.

## (c) Does the first-person 3D walk earn its build cost?
Verdict: **yes in a capped form, no as specified in the notes.**

Why yes: it is the only element that scores a 5 on Presentation, the challenge names a helmet HUD explicitly, and the Sunday 16:00 live pitch and the 30 s video both need one image people remember. Without it the project is a map with a line on it.

Why not as specified:
- It adds nothing to Impact, Validity or Relevance unless what the user walks is the terrain the route was computed on. Today it is not: the notes describe the Access Mars site as a 128 x 128 m area, the mesh is built from rover photos, it is not georeferenced, and `research/data.md` reports it as probably low-poly (first mesh about 229 vertices, not inspected further). A planned EVA is 1-2 km. The walk would cover the last 100 m of a route planned elsewhere, and the HUD's "steep slope ahead" would come from a different dataset than the ground on screen. The notes' argument that the cutscene separates the two scenes solves the alignment work, not the credibility problem: the HUD route in the walk is the product's main claim.
- A mesh built from the same DTM window is consistent by construction, but 1 m posts look smooth and blurry from 1.7 m eye height. It will look worse than Access Mars.
- Free-roam first-person needs controls, collision, ground following, and performance work. That is where the hours go, and it is what makes live rerouting necessary.

Suggest (cap):
1. Build order: planner first. The walk starts only when the planner can export a route.
2. Spike both terrain options before the 18:00 stand-up, time-boxed to about 2 h, with a go/no-go. Criterion: can the computed route and the comms shadow be drawn on that terrain in the right place?
3. Make the walk a guided walk along the computed route (camera on the path, free look, play/pause) instead of free roam. No collision, no physics, always on the planned terrain, always demoable, and it records cleanly for the video. Live rerouting then reduces to the warning-only version, or is cut.
4. Fallback if the spike fails: real Curiosity photos at each waypoint (the challenge suggests exactly this) plus the HUD overlay drawn on the 2D map. Presentation drops to about 3, everything else is unchanged.
5. If Access Mars is used at all, label it as a photo-based close-up of one waypoint, not as the terrain the route was planned on.

Cost/benefit in score terms: the capped walk is worth about +1 Presentation and +0.5 Creativity. Uncapped, it risks -1 Validity (mismatch, or an unfinished planner because the hours went into controls).

## (d) What the 30 s video / 7 slides should show
Format: **30 s video**, with a 7-slide deck prepared as the fallback, because the product moves and the signature moment is a change over time. Export at 28 s; anything over 30 s is ineligible. Do not cut the video from the full 8-step story; it shows one mission on one site. The official suggested timing asks for team name, challenge, title, how it works with NASA data, and the future; the storyboard keeps all five.

| Time | Picture | Text on screen (English) |
|---|---|---|
| 0-3 s | First-person view at a butte, HUD flips to "NO SIGNAL", reserve counter running | Cold open, no logo. One line: the problem (nobody hears you behind this butte). |
| 3-7 s | Zoom out from Mars Trek's Gale view down to the 1 m map | Project name, team name, challenge name; "the layer below Mars Trek: one Marswalk". |
| 7-15 s | Planner: three science targets clicked, route bends around the steep ground, comms-shadow overlay switches on, turn-back point appears | Labels on the layers with their source: HiRISE DTM 1 m, Curiosity images. Two or three stats (distance, minutes out of contact, reserve at return). |
| 15-23 s | Guided walk along that same route; HUD shows next target, slope warning, entry into the shadow, reserve vs time to return | Nothing but the HUD. This is the picture people keep. |
| 23-28 s | Data and honesty panel: measured / modelled / simulated, sources | "Built on NASA open data", then one sentence on who it is for. |

Rules that apply: English only; any AI-generated image or clip needs a visible watermark; no NASA logo or mission patch in generated content; no persons under 18; hosted on a public link tested in a private window.

If slides instead (7 max, title and intro count): 1 title, team, challenge. 2 the gap (Trek is regional, an EVA is 2 km). 3 planner screenshot with route and science targets. 4 comms shadow and return reserve. 5 first-person HUD. 6 data and sources with real/modelled/simulated. 7 validation and what comes next.

Note the weighting: the guide says most of the evaluation comes from the project page, and local nominees are picked after the live pitch. The video mostly moves Presentation. The project page text and a working public link matter more than any cutscene.

## Top 3 risks to Validity
1. **The walk does not show what the planner computed.** Two terrain sources (photo mesh about 128 m vs HiRISE DTM over km), no georeferencing, HUD warnings from one and ground from the other. A judge who asks "is this the same place as the map?" must get a yes. Mitigation: section (c), points 2, 3, 5.
2. **Assumed numbers presented as physics.** Current state of the numbers:
   - Slope limit 20 deg: sourced, but lunar; Mars gravity is about 2.3 times the Moon's. The source PDF has not been opened by an agent.
   - Load reduces the limit to 15 deg: the team's assumption, no source.
   - Reserve and energy model: does not exist yet.
   - Radiation: the two research files disagree (0.2-0.7 mSv/day in `triage.md`, 0.2-0.3 mSv/day in `data.md`); this looks like a mix-up between absorbed dose (mGy) and dose equivalent (mSv). The RAD data files have not been located. No solar particle event is confirmed for Aug-Sep 2016, and from memory the well-known surface event RAD recorded was September 2017 (unverified). If that one is used, label it with its real date.
   - Boulders: the DTM has 1 m posts and its true resolution is coarser, so it cannot see the rocks that trip a person. "Avoids large rocks" is not supportable from the DTM. Claim buttes, scarps and steep slopes; show the 25 cm orthoimage for the rest and say so.
   - Wind: REMS wind sensing was impaired; `data.md` warns not to promise wind.
   - Thermal inertia at 100 m/px cannot be a per-step cost. Drop it from the cost model; at most a context layer.
   Mitigation: the measured/modelled/simulated labels, one assumptions panel, and `scout` on the sources before the cost model is coded.
3. **Completeness.** The rubric's 5 is "fully developed, highly usable". At 13:00 on Saturday there is no DTM crop, no 3D spike, no cost model, no RAD data, and the notes describe eight steps, four sites, a rover model and two scroll animations. A complete small thing outscores a broad unfinished one on Validity and on Presentation. Mitigation: one site, one mission, and the cut list below decided at 14:00, not on Sunday morning.

Also watch: the boxwork example (section a), and science POIs without a source.

## Cut list (recommendation for 14:00)
- **Keep:** a, b, capped c, f as static panels with real Curiosity photos, the route summary, the measured/modelled/simulated labels.
- **Reduce:** radiation and weather to one budget number and one time-window chart, precomputed; live rerouting to warning-only.
- **Cut:** scroll-driven launch and landing (a still or 3 s title is enough), rover sizing, the rover route as a second planner, multi-site and "next site" (show the other sites as "coming" at most), HUD customizer, CRISM auto-suggestion, THEMIS as a cost, pairs of astronauts.
- The rover can stay in the story at no cost as the fixed start point and the radio transmitter position. That is where the notes already put it.

## Global Awards
Honest framing first: ten Global Awards go to ten projects out of thousands. The realistic target is Global Nominee from Heilbronn, which is decided by the local panel after the live pitch. Aim the project at one award so the page and pitch tell one story.

- **Best Mission Concept** ("most plausible concept and design"): **best fit.** The signature feature is built from parameters NASA actually plans EVAs with (slope limit, time out of line of sight, consumables), on real 1 m terrain. It rewards exactly the sourcing work Validity needs anyway.
- **Best Use of Data** ("makes space data accessible or leverages it for a unique application"): second. Honest only if the pitch says what was derived (slope, visibility, turn-back point from the DTM), since one dataset does most of the work and the others are thin.
- **Art & Technology:** possible only if the walk and HUD are polished. Do not plan for it.
- **Best Storytelling:** not realistic after the cuts, and chasing it brings back the scroll animations that cost Validity.
- **Best Use of Science** ("scientific method"): not realistic without a test of the model. One cheap check would help Validity either way. Suggest: compare the planner's output with Curiosity's actual traverse through Murray Buttes (waypoint data per the notes) and report where they agree and differ, or reproduce the 19 % blocked sky at Butte M12 from the DTM as a check of the visibility code against the RAD paper.
- Galactic Impact, Local Impact, Global Connection, Most Inspirational, Best Use of Technology: not a fit.

## Checks to dispatch before code depends on them
1. `scout`: open both PDFs cited in the notes and quote the exact slope and line-of-sight statements; pull the walking-energy model reference; confirm where the boxwork is; second pass on SEXTANT and the Space Apps gallery.
2. `data-scout`: RAD numbers with units from the paper(s), not from memory; whether Curiosity waypoints for the Murray Buttes sols are downloadable; REMS file for those sols.
3. `builder`: DTM crop and slope raster first (everything depends on it), then the two-option 3D spike with the go/no-go before 18:00.

## What I verified and what I did not
- Verified today: `pextant` repo exists, description and MIT licence (GitHub API). Ehresmann et al. 2021 title, DOI, journal, and the numbers quoted (Crossref abstract).
- Not verified, from memory: boxwork location relative to Murray Buttes; the September 2017 solar event; the effective resolution of HiRISE DTMs; SEXTANT's use in BASALT and which energy model it uses.
- Taken from the other research files without re-checking: all data access results, the Access Mars mesh size and licence, the content of the two NASA PDFs cited in `notes.md`.
