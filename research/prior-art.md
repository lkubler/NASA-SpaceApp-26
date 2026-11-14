# Prior art: Martian Map (EVA-scale layered map)

Scout, EXPLORE phase, 2026-11-14. Time-boxed (~15 min of web search). Items marked (unverified) came from search snippets only. No new core ideas here; this maps `notes.md` directions against what exists.

## 1. Existing tools (what the challenge text calls regional/global)
| Tool | What it does | Reuse / license | Gap vs. EVA scale |
|---|---|---|---|
| NASA JPL Mars Trek https://trek.nasa.gov/mars/ | Web portal, layered global/regional Mars data, WMTS tile services, measurement/slope tools | Public NASA data. Use its tile endpoints as data source (check data-use terms). | Global/regional; no route-by-constraint, no first-person view, no radio/return reserve |
| JMARS https://oss.mars.asu.edu , https://jmars.mars.asu.edu/open_source | Java GIS (ASU): CTX, HiRISE, THEMIS, CRISM, HRSC footprints and rasters; scripting API | GPL (open source). Desktop Java; not embeddable in web demo. Inspiration only. | Mission-planning for instruments, not for walking crews |
| USGS Astrogeology Mars maps https://astrogeology-usgs.hub.arcgis.com/pages/interactive-maps-mars | Geologic maps, ArcGIS web | Public domain (USGS) | Static geology layer; useful for science-goal context |
| Esri Explore Mars https://developers.arcgis.com/javascript/latest/showcase/explore-mars/ | Web 3D Mars demo | Sample code, Esri terms | Viewer only |
| Esri "best paths for rovers and humans on Mars" https://www.esri.com/about/newsroom/arcuser/finding-the-best-paths-for-rovers-and-humans-on-mars | ArcGIS least-cost path with "Vehicle Mobility Layer" (slope + complexity) | Article, concept only | Closest conceptual precedent for slope-cost routing; not hyperlocal, not interactive for crews |
| RSketch (Caltech/JPL) https://www.its.caltech.edu/~datavis/retrospective/rsketch/ | Curiosity route planning sketch tool, flags ~15 deg slope limit (unverified detail) | Not available | Rover, not human |
| Curiosity route map https://science.nasa.gov/resource/curiositys-proposed-path-up-mount-sharp/ and JPL PIA26017 https://www.jpl.nasa.gov/images/pia26017-a-map-of-curiositys-difficult-climb/ | Annotated proposed traverse | Images/NASA media (check usage guidelines) | Static; good for story and sanity check of slope limits |
| PDS Analyst's Notebook (MSL) https://an.rsl.wustl.edu/msl/AN/an3.aspx | Curiosity traverse, photos, RAD, REMS by sol | Public NASA data | Data portal, no integration |
| HiRISE DTMs https://hirise.lpl.arizona.edu/dtm/PSP_009650_1755 | 1 m/px DTM + orthoimages, Murray Buttes | Public (credit NASA/JPL/UArizona) | Raw data; the base layer we process |

## 2. Prior projects (closest to our direction)
- **MarswalkAI / Astromind** (DEV Community challenge, not Space Apps): https://dev.to/walsal201/astromind-4ji4 . Layers MOLA/HiRISE, CRISM, THEMIS thermal inertia, MCS weather, rover ground truth; AI-generated route plan, hazard map, EVA checklist. Very close in layer list and EVA framing. Per the post, it is an AI-text-plan style tool, no first-person terrain walk, no return-reserve or comms-shadow logic (unverified; read only the post summary). Risk: a judge may see "similar layers". Differentiator is concrete, computed constraints on real DTM, not AI prose.
- **Solar Atlas** (Space Apps 2016): https://2016.spaceappschallenge.org/challenges/solar-system/open-world-generation-using-nasa-mars-and-vesta-data/projects/solar-atlas . First-person Mars simulation in Unity from Trek API terrain. Shows first-person Mars walk has been done; ours must be tied to a planned route and HUD.
- **Space Apps 2018 "Make Sense Out of Mars"**: https://2018.spaceappschallenge.org/challenges/can-you-build/make-sense-out-mars/teams/urban-engineers (and /space-marvin, /rnsm). Teams proposed topographic maps and easiest-route finding. Older, mostly global-scale.
- **Space Apps 2025 PureFlow2**: listed in `docs/resources.md`; not about Mars mapping, not reviewed here.
- **NASA SUITS (suit UI student challenge) e.g. SENVA 2**: https://spencer-l.github.io/assets/pdf/NASA_SUITS_Retrospective.pdf . AR navigation with breadcrumb path to waypoints, rover control on a 3D map. Strong precedent for HUD design (Moon-focused). Good inspiration for HUD elements.
- **MARS 2030** (VR game on HiRISE): https://store.steampowered.com/sub/118674 . Shows HiRISE-based walkable terrain is feasible; entertainment, no mission planning.
- **Access Mars** (Google/JPL): https://experiments.withgoogle.com/access-mars . Walk Curiosity's terrain in browser. Our planned 3D base.
- Not found in this quick search: a Space Apps 2024/2025 winner with the same EVA-route-planner idea. Worth a second pass in the Space Apps gallery by a human or later scout (the site fails SSL from this machine).

## 3. Reusable code and assets
- **Access Mars** https://github.com/googlecreativelab/access-mars : Apache-2.0 (verified on repo page). A-Frame + Three.js, glTF with Draco, "experiment, not an official Google product". Notes say use only `public/terrain/<site>/terrain.glb`, `tiles/`. Action: keep NOTICE/attribution, credit NASA/JPL imagery; verify the terrain assets' own license/credit in the repo before shipping (not confirmed, since the page fetch didn't show the terrain folder). Terrain is Curiosity-photo reconstruction, so it is not HiRISE-DTM; check that it aligns with the HiRISE DTM for route overlay (georeferencing is a risk; ask data-scout).
- **Three.js / A-Frame**: MIT, standard for web 3D and first-person.
- **Routing**: no need for a library; least-cost path (Dijkstra/A*) on a DTM-derived grid is small to write. Directional cost (uphill energy, downhill fall risk) is custom either way. Candidate libs: `ngraph.path` (MIT), or hand-rolled on a typed array. Not checked.
- **Map UI**: Leaflet/MapLibre (BSD) for 2D routing views over HiRISE ortho tiles. Not checked against Mars CRS; a plain image-overlay on a local pixel grid avoids CRS issues.
- **Sun position**: Mars24 algorithm (NASA GISS), open item in notes.md.
- **Scroll animation**: GSAP ScrollTrigger / Lottie; generic, no Mars-specific reuse needed.

## 4. Idea directions in notes.md: what exists, how to stand out
1. **Science-driven EVA, route links science targets, not A to B.** Exists: Esri/RSketch do least-cost A to B; MarswalkAI flags "biosignature targets" in AI text. Stand out: multi-waypoint tour optimization over CRISM-derived targets with real constraints (a TSP-like route on a cost surface). Low prior art for human-scale.
2. **"Layer below Mars Trek" at single-EVA scale.** Directly echoes the challenge text; no existing tool fills it. Stand out by showing explicit scale step-down (Trek global to HiRISE 1 m DTM).
3. **Hard limits (slope, boulders) that scale with carried load.** Exists: generic slope thresholds (~15 deg rover driving). Human suit-slope-with-load limit is rarely in public tools. Needs sourced values (research task: EVA suit mobility/slope studies, Apollo LRV/EVA data, Artemis suit papers). Strong Validity points if cited.
4. **Directional cost (uphill energy, downhill fall risk).** Esri vehicle mobility is non-directional (per the article summary). Moderate novelty, cheap to implement.
5. **Return constraint (from every point the way back is feasible on remaining reserve) and radio-shadow/line-of-sight.** Not seen in any tool found. Line-of-sight viewshed on a DTM is well-known GIS technique, but applying it as a crew-safety layer plus return-reserve is the likely unique highlight (as the humans noted). Variant of known techniques, new in this context.
6. **Rover segments + pairs of astronauts.** Named in the challenge. NASA SUITS has rover control on a map; our rover-to-foot handoff at the steep-terrain edge with load limits is a variant.
7. **Live rerouting with warning on deviation, HUD.** NASA SUITS-style HUDs exist (Moon). Variant; execution quality matters.
8. **First-person interactive EVA walk as core feature.** Exists as concept (Solar Atlas, Access Mars, MARS 2030), but not driven by a computed mission route with HUD warnings. Variant; the integration is the novelty.
9. **Story website: scroll rocket launch, landing, mission briefing cutscene.** Presentation strength. Visually common (scrollytelling), but tied to real data it supports Best Storytelling. Scope risk: heavy; keep it short for a 30 s video or 7 slides.
10. **Data layers (HiRISE DTM, THEMIS, CRISM, RAD, REMS).** All used by MarswalkAI at the listing level. We stand out by showing computed derivatives (slope, roughness, dose budget, comms shadow) at 1 m, not just overlays. RAD solar-particle-event scenario is a nice real-data hook (needs a data-scout check that an event exists in Aug-Sep 2016).

## 5. Gaps and risks
- Closest competitor concept: MarswalkAI (layers + AI plan). Do not lead with "layered map plus AI"; lead with constraint-computed route with reserve and comms.
- HiRISE DTM is 833 MB; browser use needs preprocessed tiles/heightmaps (build step). Check Access Mars terrain vs HiRISE DTM alignment.
- Many ideas for 27 hours. Core to keep per judging: computed route + HUD walk; cutscenes optional.
- Space Apps gallery search is incomplete; second pass recommended.

## Sources
Links inline above. Fetched/verified directly: Access Mars repo page (license, stack), Astromind post. Others from search result snippets only.
