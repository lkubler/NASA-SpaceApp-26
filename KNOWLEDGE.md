# Knowledge: what the research found

Extracted from version 1 research (Sat 14.11., files in the tag `archive-v1` under `research/`). Read this before researching anything again.

Marks: **V** = source opened and read or data tested. **S** = search snippet only. **U** = unverified. **C** = our own calculation. Use only V and C in the product and pitch without checking again.

## 1. Data that works

| Data | What it gives | Access and gotchas |
|---|---|---|
| HiRISE DTM `DTEEC_040770_1755_039280_1755_U01` (V) | 1 m elevation. Covers Murray Buttes, Quela, Marias Pass, Pahrump Hills. Not Bradbury | `https://hirise-pds.lpl.arizona.edu/PDS/DTM/ESP/ORB_040700_040799/ESP_040770_1755_ESP_039280_1755/`. PDS3 `.IMG`, float32 little-endian, no-data `0xFF7FFFFB`. HTTP Range reads work. No CORS: preprocess offline. Murray area is 72 % valid in a 3 km window; the west side is void |
| HiRISE DTM `DTEEC_018854_1755_018920_1755_U01` (V) | Covers Bradbury (65 % valid), Pahrump, Marias. Not Murray | same pattern under `PSP`/`ESP` folders |
| HiRISE DTM `DTEEC_009650_1755_009716_1755_U01` (V) | The one in notes.md. Murray valid, but Pahrump and Marias are no-data | Do not use; 040770 is better |
| HiRISE orthoimage `ESP_040770_1755_RED_A_01_ORTHO.JP2` (V) | 25 cm grayscale, same grid as the DTM at 4x | 294 MB, Pillow decodes it. Aligned to the DTM within about 2 m |
| Access Mars terrain (V) | 3D mesh per site: `murray_buttes`, `marias_pass`, `pahrump_hills`, `landing_site` | `github.com/googlecreativelab/access-mars`, `public/terrain/<site>/terrain.glb` + `tiles/`. Apache-2.0; imagery NASA/JPL. Details in section 2 |
| MSL waypoints (V) | Curiosity position per drive end: sol, lon, lat, elevation | `https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json` (1389 points). `MSL_traverse.json` also exists |
| REMS weather (V) | Air and ground temperature, pressure, UV per sol | `https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA/SOL_01418_01514/SOL01440/` file `RME_...RMD...P2.TAB`, CSV, columns in `LABEL/MODRDR6.FMT`, missing = -999. Wind is unusable (27 of 31,932 rows). UV is sparse |
| Curiosity raw images (V) | Photos by sol | `https://mars.nasa.gov/rss/api/?feed=raw_images&category=msl&feedtype=json`. CORS open. The `api.nasa.gov` DEMO_KEY is rate-limited (429) |
| Mars Trek WMTS tiles (V) | Context basemaps, CORS open | `https://trek.nasa.gov/tiles/Mars/EQ/<LAYER>/1.0.0/default/default028mm/{z}/{row}/{col}.png`. Good layers: `curiosity_hirise_mosaic` (zoom 16), `Gale_CTX_BlockAdj_dd`. Tiles are pictures, not elevation values |
| MOLA MEGDR 463 m (V) | Far-field terrain | `pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/`, tile `megt00n090hb` |
| Mars Climate Database (V, one query) | Modelled weather for any place and season; ESA-linked partner data | `https://www-mars.lmd.jussieu.fr/mcd_python/`. Clunky web form, precompute |

Not usable or not found: RAD data files (use published numbers), CRISM for this site (unconfirmed, 18 m/px is too coarse anyway), THEMIS thermal inertia (100 m/px, too coarse for one EVA), Worldview (Earth only).

Credits: HiRISE "NASA/JPL/University of Arizona". Rover images "NASA/JPL-Caltech" or "NASA/JPL-Caltech/MSSS" (Mastcam, MAHLI). REMS "NASA / CAB (INTA-CSIC)". No NASA logos.

## 2. The 3D sites (Access Mars)

- Each scene is **128 x 128 m**, 64 tile meshes, about 128k triangles, about 0.5 m detail near the centre, coarser at the edge. A `BACKGROUND` mesh spans 4 km as skyline. A `SIMPLE` collision mesh has only about 4.5 m spacing: use the tiles for height and slope.
- Units: the root node has scale 0.01; set it to 100 to get metres. Y is up.
- The 2017 Draco compression fails in the current three.js loader. Use the original decoder from the Access Mars repo (code in `archive-v1`, see `SALVAGE.md`).
- No georeference in the files. For Murray Buttes we fitted it to the DTM (V): scene origin = lon 137.35562 E, lat -4.69565; **the scene is mirrored** (scene +x = east, +z = north); rotation 2.4 deg; error about 2 m and 1.5 deg. Relief in the mesh is about 20 % flatter than the DTM. The other three sites are not aligned yet.
- Murray Buttes slopes inside the square: median 7.8 deg, 95th percentile 34 deg, max 58 deg. Steep faces are common, so slope warnings will trigger often.
- Relief per site: Murray -6.4 to +11.5 m, Marias -9.8 to +6.4, Pahrump -7.4 to +10.6, Landing Site -3.6 to +2.7 (nearly flat).
- Access Mars' own Murray Buttes text says the buttes "are sometimes tall enough to block the signal between Curiosity and the Mars orbiters" (V). Good qualitative support for the comms shadow.

Which targets are inside the 128 m square:
| Target | Site | Inside? | Confidence |
|---|---|---|---|
| Buckskin drill | Marias Pass | yes (Access Mars has a BUCKSKIN marker) | high |
| Telegraph Peak, Mojave 2, Confidence Hills drills | Pahrump Hills | yes, Confidence Hills at the edge | medium |
| Goulburn | Landing Site | yes | medium-high |
| Link, Hottah | Landing Site | doubtful, likely outside | low |
| **Quela drill** | Murray Buttes | **no**: about 155 m west and 27 m north of the scene origin (V, from the alignment) | high |

Murray Buttes facts (V unless marked):
- Curiosity crossed the buttes sols 1427 to 1468. Marimba drill: arrived sol 1417, drilled 1422 (137.35447 E, -4.68718). Quela drill: parked sols 1455 to 1468, drilled 1464 (137.3530064 E, -4.69520223, -4379.5 m).
- Buttes are remnants of wind-deposited sandstone (Stimson formation) on lake mudstone (Murray formation). Entrance mesa about 15 m high.
- "Murray Butte 12" and the cross-bedding quote come from Universe Today relaying the team, and "Butte M12" from the Ehresmann 2021 abstract. Safe wording: "Quela, at the foot of a butte".
- **Boxwork is not at Murray Buttes** (it is higher on Mount Sharp, studied 2025). Never use it for these sites.
- Do not invent names for single buttes.
- 6 Curiosity photos with credits are prepared (in `archive-v1`).

## 3. Numbers for the models

### Slope
- NASA publishes no single maximum walkable slope for suited crew. Defensible: planning threshold 15 deg, hard cap 20 deg, adjustable. Apollo crews mostly stayed below about 15 deg (S); max traversed incl. rover 22 to 25 deg (S). xEMU concept of operations: 20 deg (the team's source in notes.md).
- A slope limit that falls with load has no source. Better: load raises energy cost, which shortens reach.
- A 5 m grid hides steep steps: on the v1 route the 5 m grid said 16 deg where the 1 m DTM had 29 deg.

### Energy and reserve
- Pandolf load-carriage equation with Santee downhill correction (V; NASA JSC uses it, Kim et al., IEEE EMBC 2024, `ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf`):
  `P = 1.5 W + 2 (W+L)(L/W)^2 + eta (W+L)(1.5 V^2 + 0.35 V G)` watts; W body kg, L load kg, V m/s, G grade %, eta terrain factor (1.0 road to 1.5 heavy brush; regolith value is our assumption).
- Suit adds about 14 ml/kg/min oxygen uptake over unsuited walking (V, Mark III walkback study via Ogilvie et al., ICES-2026-127, `ntrs.nasa.gov/api/citations/20260005410/downloads/Mars_Mass_ICES2026_Presentation_Final.pdf`). Measured at Earth gravity; it dominates the result.
- Same NASA deck (V): planetary EVA sizing average 1200 BTU/hr (352 W); walkback 1700 (average) to 2300 BTU/hr (95th percentile); carry load 50 lbm (23 kg); walking speed 2.2 mph (3.5 km/h) for walkback under 1 h; walkback radius 1.8 km (30 min) or 3.5 km (1 h).
- Capacity used in v1: 8 h x 1200 BTU/hr = about 10.1 MJ. Buffer 20 % (Apollo walkback pad, the team's source).
- Mars gravity: only weak evidence. Unsuited walking at 0.38 g used 0.68 of the oxygen at 1 g (Brown et al. 2018, n = 12, abstract only). No suited, sloped, loaded Mars-gravity data exists. Say "model with an uncertainty band".
- The model is uncertain: in v1 the same plan ended between 9 % and 35 % reserve when the suit term changed by 50 % either way. SEXTANT's own field test found real time and energy higher than predicted (V, Gilkey 2011).
- The 10 km walkback in notes.md is a test distance (Walkback Test), not a mission limit.

### Comms
- NASA only says it qualitatively (V): communications "may be limited by distance and/or line of sight" (Surface EVA Architectural Drivers 2023, `ntrs.nasa.gov/api/citations/20230014957/downloads/Surface%20EVA%20Architectural%20Drivers.pdf`). No numeric limit, no antenna height, no max time out of contact.
- So: geometric line of sight on the terrain, labelled as our model. Antenna heights are assumptions. Horizon for a 1.8 m antenna on Mars is about 3.5 km (C); terrain blocks long before that.
- The notes' claim that a NASA deck names "max time without line of sight" as an operational limit was never verified. Check the PDF before quoting it.

### Radiation
- Curiosity RAD: 0.67 mSv/day at the surface (V, SwRI release) = about 0.028 mSv/h. A 6 h EVA is about 0.17 mSv. Label: measured by RAD, applied to a person without suit-specific shielding.
- Dose is almost uniform over a walk, so it is time times a constant. It is not a real route cost.
- Sept 2017 solar event at Gale: dose rate 2 to 3 times normal for about 12 h (V). A "shelter or continue" story point, not a lethal one. It was 18 months after the Murray Buttes sols: label any use as a replay.
- At Quela the butte blocked 19 % of the sky and cut the dose about 4 % (V, Ehresmann 2021 abstract). **We could not reproduce the 19 %** (our terrain gives 7 to 11 %). Do not claim it validates anything.

### Sun, weather, dust
- Sun position: Mars24 algorithm (Allison and McEwen; NASA GISS). Implemented and verified against the official worked examples (V). Use the 2015 constants, not the 2000 paper.
- Gale, sol 1440: sunrise about 5.9 h, sunset 18.3 h local true solar time; noon sun 12 deg from the zenith. Air -69 to +5 C, ground -98 to +14 C, pressure 776 to 865 Pa (V, REMS).
- Dust (optical depth tau): clear about 0.5 (approximate); dust season 1 to 2 (V); 2018 global storm peak 8.5 with UV down 97 % and the daily temperature swing down 30 K (V, Guzewich 2019).
- Storm winds do not knock people over: at 44 m/s the push on a person is under 15 N (C); JPL: "would not topple a spacecraft" (V). Real effects: dim light, dust on equipment, loss of solar power.
- Earth to Mars signal takes 4 to 22 minutes one way (V, NASA NTRS 20150019627). The crew decides alone.

## 4. Prior art and how to position

- **SEXTANT** (MIT, used in NASA analog missions): least-cost astronaut traverse on an elevation model with a metabolic model. Its 2009 version already computes "the most efficient path back home from any point" (V, abstract). Its published model has no load term; comms shadow is not in the abstracts we read. Name SEXTANT ourselves and say what we add. Never claim "nobody has a way home function".
- Mars Trek, JMARS: regional and global, no route by crew constraints, no first-person view.
- MarswalkAI / Astromind: similar layer list plus an AI text plan. Do not lead with "layered map plus AI".
- First-person Mars walks exist: Access Mars, Solar Atlas (Space Apps 2016), MARS 2030. Ours must be driven by the planned route.
- NASA SUITS student challenge: precedent for helmet displays with breadcrumb navigation.
- What looked new in this context: time out of contact along a route, a suggested relay position that removes it, and a leave-by time per station, on real HiRISE terrain in a browser.

Why it matters (V): NASA rates surface EVA injury risk red for all surface missions and plans up to 24 h of EVA per person per week (Dunn et al. 2021, NTRS 20220004017). NASA says Artemis planners know terrain above 1 m but "cannot predict the nuances of terrain" (Caswell et al. 2025, NTRS 20250006063).

## 5. Submission (from the 2026 guide, full rules in `docs/rules-2026.md`)

- Form fields, all required: Project Name; High-Level Summary; Link to Project Demo; Link to Final Project; Detailed Description; Use of SI; NASA Data; Space Agency Partner Data and Other References.
- Demo: video up to 30 s or up to 7 slides including title. Longer is ineligible. Slides must show team name, members, challenge, a project image, the user experience, and how NASA data makes it possible.
- Most of the judging is based on the project page, not the demo.
- Judges do not see the "Use of SI" field. Disclose AI use in the description and references too. AI images and video need a visible watermark.
- Links public, no login. Test in a private window. Images JPG/PNG/GIF up to 10 MB; no video upload.
- Only the last saved submission counts. One person edits at a time.
- The guide says 23:59; our local deadline is 15:45. Ask the Local Lead if unsure.

## 6. Do not claim
- Boxwork at these sites. Names of single buttes. Any "NASA requirement" for slope or comms.
- That our code reproduces the RAD blocked-sky number.
- Numeric visibility in dust, solar power loss, or dust effects on radio.
- "Validated". Say "consistent with" at most.
