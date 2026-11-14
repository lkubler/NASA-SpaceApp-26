# What NASA and partners show astronauts in or on the suit during a surface EVA

Researcher, Sat 14.11. (BUILD). Builds on `research/risks.md` (walk-back, comms, EVA informatics quotes are not repeated).
Marks: **V** = I opened the source and read the passage; **S** = second-hand (search snippet, or a claim another source makes about a third source); **M** = opened a non-NASA mirror of a NASA caption.

## 1. Real systems and prototypes

| System | What it shows the EV crew | Source | Mark |
|---|---|---|---|
| Apollo RCU (chest unit) | Four warning flags: high O2 flow, low vent flow, low suit (PGA) pressure, low feedwater pressure. A fifth window (CO2) "was never used". The same four problems also sound a tone (snippet only) | ALSJ, RCU status indicators: https://www.apollojournals.org/alsj/alsj-RCU_StatusIndicators_Flags.html | V (flags), S (tone) |
| Apollo cuff checklist | Timeline with elapsed-time marks ("0+26 Deploy TV", "2+55 Sampling, Return Traverse, Closeout", "4+00 EVA Closeout"), station tasks, numbered "EMU Malfunctions" procedures. No map or consumables numbers in the index text | ALSJ Apollo 14 cuff checklist: https://www.apollojournals.org/alsj/a14/cuff14.html | V (index only; page scans not read) |
| Shuttle/ISS EMU DCM | 12-character red LED display on the chest. The astronaut toggles a switch for each line of life-support data (O2 pressure, suit pressure). A backpack Caution and Warning System (CWS) sends "caution or warning messages" to it. Known problems: crew must look down at an awkward angle, some need a special lens, sunlight washes the LEDs out, crew use a wrist mirror to read the controls, and the cuff checklist runs 40 to 50 pages | Marmolejo & Shepherd, NASA JSC, NTRS 19940019719: https://ntrs.nasa.gov/api/citations/19940019719/downloads/19940019719.pdf | V |
| ISS EMU ECWS (2000s) | Monitors suit data, "computes the system state, limiting consumables, and issues messages to the crew based on detected faults, limiting consumables, or suit configuration changes". It monitors only and does not control the suit | Campbell, ICES-2015-327, NTRS 20150009506: https://ntrs.nasa.gov/api/citations/20150009506/downloads/20150009506.pdf | V |
| Early HMD concept (1990s) | Text and graphics on the helmet visor, "located conveniently above the astronaut's prime field-of-view to prevent visual interference". Voice-controlled, meant to replace the DCM, the cuff checklist and the wrist mirror | NTRS 19940019719 (above) | V |
| xEMU / xEVAS information system (contract RQMT-065) | Consumables monitoring and display; procedure viewer; photos and graphics; **timeline viewer "including time ahead/behind and consumables margin"**; text messages to and from MCC; camera viewfinder; **map with EVA crewmember position and real-time navigation (Artemis only)**; biomedical information. On xEMU, consumables and procedures stay primarily on the DCU and the paper cuff checklist for safety-criticality reasons | Mitra et al., "Trades, Architecture, and Design of Joint AR", ICES-2023-298, Table 2: https://ntrs.nasa.gov/api/citations/20230010234/downloads/Trades_ICES_2023_07_updated_software_name.pdf | V |
| Joint AR (JSC, 2019–2023; began as xEMU xINFO Displays and Controls) | Monocular, monochrome green see-through display, "slightly offset to the right side of the user and slightly above the horizontal field of view". Controlled with a two-button and dial hand controller, voice, or remote. Navigation demands with UI concepts (ConOps §6.1): current location and heading; **next waypoint framed, with distance to it**; distance gone and distance to go; **way to the lander with time estimate ("time differential" between planned and estimated time at current speed, mm:ss)**; partner location and heading; map layers (topography, illumination, line-of-sight comms coverage); dynamic updates and pins. Suit demands (§6.2): telemetry against limits, showing how close each value is to a limit; consumables trend plots; visual alert pop-up; caution/warning notices; anomaly steps; fault code plus plain-text meaning | JointAR ConOps Rev A (CTSD-ADV-1788, Nov 2023), NTRS 20230016622: https://ntrs.nasa.gov/api/citations/20230016622/downloads/JointAR_ConOps_RevA_2023-11-14_Final_Signed.pdf | V |
| Joint AR contingency walk-back use case (§5.1.6) | After a suit alert and the cuff checklist call an abort, the crew read the direct distance to the lander (1.6 km), compare path time estimates "based on distance, slope, and terrain classification", check the comms coverage layer ("expect to lose communications for approximately 10 minutes"), then walk on the heading shown | Same, p. 31 | V |
| JETT5 field test (May 2024, Arizona) | Astronaut wore Joint AR at night. Display: "navigation, photo capture, graphical format of consumables, procedure viewing, mission control updates" and AR cues. Navigation fed by GPS/IMU, camera/IMU, LiDAR and static maps. NASA says it could "help guide crew back to the lunar lander" | NASA photo jsc2024e036533 (opened on a mirror): https://nasa-img-viewer.pages.dev/image/jsc2024e036533 | M |
| BASALT (Minerva suite) | Wrist-mounted display with Playbook mission-log text messages and GPS tracking for location awareness | Elston et al., "Review of Advanced Informatics and Display Systems for EVA Operations", NASA JSC/Ames, NTRS 20250011652: https://ntrs.nasa.gov/api/citations/20250011652/downloads/IEEE-aero-lit-review-EVA-informatics_final.pdf | V (review); S (original BASALT papers) |
| Shuttle electronic cuff checklist (1980s) | Flown four times in Shuttle EVA experiments, then dropped, "likely due to the marginal benefits" at the time | Same review | V (review) |
| NEEMO / Arctic analogs | Wrist displays tested underwater and in the Arctic. Their content is not detailed in the review | Same review | S |
| Desert RATS 2010 | Backpack "EVA Information System" with a wrist display for timelines, procedures and maps. The team said it was learning how much information crew need | NASA analog blog (URL now 404): https://blogs.nasa.gov/analogsfieldtesting/2010/09/10/post_1284131442058 | S |
| AxEMU (Axiom) | Expected to use a visor HUD; no official spec found | newspaceeconomy.ca article (snippet) | S |

## 2. NASA SUITS challenge requirements (NASA JSC student design brief)

| Item | 2023-24 (Mars scenario) | 2025-26 (lunar scenario) |
|---|---|---|
| Map | HMD "shall display a 2-dimensional map" with POIs; "should" show rover and other crew | "shall design a 2D mini-map"; shall show live assets (other crew) |
| Navigation | "shall implement a 'bread crumb' feature" to follow back to the airlock; best-path return "may"; POI navigation aids "may" | breadcrumb "shall" ("backtrack to the PR"); best path "should"; **"shall provide predictive maximum range based upon spacesuit life support usage and limitations"** |
| Hazards | – | "real-time alerts and recommend immediate actions such as alternate routes" for environmental hazards under south-pole lighting |
| Turn-back | – | Rover team: "estimates of turn around points where the rover will need to return to base or risk depletion" |
| Telemetry | Own and partner suit and biomedical data | Own suit and simulated biomedical data |
| Caution and warning | "shall alert the DE if his/her spacesuit or biometric telemetry enter off nominal ranges", also for the partner's suit | Same, plus "shall use AI to recommend actions depending on the error" |
| Timers | MET and elapsed time at each station (LMCC side) | MET HH:MM:SS (PR side) |
| Style | Navigation must be "effective and non-obtrusive" | Same; voice answers short: "Primary O2 47%, Secondary 99%." |

Sources (all V): 2023-24 brief, https://www.nasa.gov/wp-content/uploads/2023/09/fy24-suits-mission-description.pdf (read via Wayback: https://web.archive.org/web/2024id_/https://www.nasa.gov/wp-content/uploads/2023/09/fy24-suits-mission-description.pdf). 2025-26 brief: https://github.com/SUITS-Techteam/TSS2026/blob/main/documents/mission_description/mission-description.pdf

SUITS telemetry limits (2025 TSS, V): `oxy_time_left` min 3,600 s / max 21,600 s; `batt_time_left` min 3,600 s / max 10,800 s; O2 storage min 20 %; heart rate 50/90/160 bpm; helmet CO2 max 0.15 psi; suit temperature 50/70/90 °F. "The minimum safety value is when there is an hour of oxygen, or an hour of battery left." "It is the job of the HMD Display to alert the astronaut … if any of these value fall outside their nominal bounds." https://github.com/SUITS-Techteam/TSS-2025/blob/main/SUITS_TelemetryValueRanges.pdf

## 3. Information NASA requires for the suited crew (NASA-STD-3001 Vol. 2 Rev F, approved 2026-07-14)

https://standards.nasa.gov/system/files/tmp/NASA-STD-3001%20Vol%202%20Rev%20F.pdf (V)

| Req. | Text (short) |
|---|---|
| V2 11023 | Crew must be able to receive, display and monitor "consumable levels, suit status and alerts, and biomedical data". Rationale: trends let crew "act prospectively" |
| V2 11035 / 11036 | Suit shall display suit pressure, ppO2, ppCO2 and alert the crewmember when they are outside safe limits |
| V2 11038 | Display metabolic data to the crew in real time ("adjustment of exertion level") |
| V2 11010 | Suit shall provide or accommodate radiation monitoring and alerting |
| V2 11022 | Field of regard "shall be unencumbered" if helmet- or head-mounted displays are provided ("prevent tunnel vision") |

Not in this standard: navigation, walk-back, or comms status as display requirements. Those appear in xEVAS RQMT-065 (map and navigation, text comms), the Joint AR ConOps and SUITS (§1–2).

## 4. Caution and warning tiers (NASA-STD-3001 Vol. 2 Rev F §10.3, Table 10.3-1, App. F.6.4; V)

| Priority | Class | Definition | Colour |
|---|---|---|---|
| 1 | Emergency – fire | Life-threatening, immediate action | Flashing red |
| 2 | Emergency – other (pressure loss, toxic atmosphere) | Life-threatening, immediate action | Flashing red |
| 3 | Warning | "requires immediate action because it has the potential to become a life/mission threat" | Red |
| 4 | Caution | "needs attention, but not immediate action" | Yellow |
| 5 | Advisory | Routine event, or off-nominal event below caution level | Blue |

- Emergency, warning and caution must be dual-coded (seen and heard). Advisory tone is optional.
- "If multiple alerts trigger simultaneously, the system continuously annunciates the highest priority alert until it is acknowledged". Sub-priorities within a level are allowed.
- Lower priority means a longer silent gap between tone bursts (2–4 s). The crew can silence, suppress and inhibit alerts. E/W/C alerts link to their malfunction procedure.
- Suits in practice: the EMU CWS names two levels, "caution or warning messages" (NTRS 19940019719, V). Apollo had four flags plus a tone (§1).

## 5. Overload, distraction, placement

| Finding | Source | Mark |
|---|---|---|
| Joint AR: each feature set is "the minimum amount of necessary information" needed to answer one work demand; the display is offset to the right and slightly above the horizontal | Joint AR ConOps p. 22 | V |
| Design rules: minimise physical acts, minimise time to reach the needed state, minimise interference with audio and visual comms | Joint AR ConOps §3.2 | V |
| 1990s HMD: images above the prime field of view to avoid interference | NTRS 19940019719 | V |
| Standard: helmet field of regard unencumbered by displays | NASA-STD-3001 V2 11022 | V |
| SUITS: navigation "effective and non-obtrusive"; short, concise voice readouts | SUITS 2023-24, 2025-26 | V |
| VR study, n=25 incl. 3 astronauts (DLR/ESA/RWTH): put HUD items at the top of the view and keep the lower view (terrain, footing) clear; vital signs at the top rather than the sides; one astronaut proposed edges for vitals and the centre for navigation | Bensch et al., CHI 2024, https://arxiv.org/pdf/2402.15692 | V |
| Same study: information overload named as a "primary challenge"; most wanted context-sensitive or task-specific displays, presets, toggles; but crew should not be able to switch off safety-critical features; red for warnings; avoid white/black on lunar terrain; path overlays should be thin or semi-transparent so they don't hide rocks; a compass that makes you look up drew criticism | Same | V |
| Same study: features asked for most were O2 level, heart rate, suit temperature, battery, "connectivity strength", EVA elapsed time, a minimap with shadow and elevation/contours "to identify steep slopes", hazard rings, distance to POIs, traverse history to get home. Astronaut: "you can't burn 50% of your time on the first 10% of the targets" | Same | V |
| Same study cites aviation work: susceptibility to attentional tunnelling rises with workload; spatial (world-anchored) cues clutter less but too-dominant cues backfire (Fadden et al. 2001) | Same | V (in paper), S (originals) |
| NASA review: low sun angles hurt HUD legibility; proposes "visual redundancy" (same info in several UI spots) or lighting-based layout templates | Elston et al. 2025 (NTRS 20250011652) | V |
| NASA review: under time delay, analogs show text messages are preferred over voice, so displays must support text comms | Same | V |
| NASA review: Apollo crews often exceeded predicted metabolic and consumable rates | Same | V |
| Numeric limit on how many items to show: **none found** in any NASA or partner source I read | – | – |

## 6. Our planned items that NASA sources support

- Direction and distance to the next point: Joint AR §6.1.2/6.1.4 (next waypoint framed, with distance); SUITS POI navigation aids; Bensch distance-to-destination.
- Reserve: NASA-STD V2 11023 (consumable levels); xEVAS "consumables margin"; SUITS `oxy_time_left`/`batt_time_left` with a 1-hour floor; JETT5 consumables graphic.
- Minimap: SUITS "shall" 2D mini-map (both years); Bensch participants.
- Radio status: Bensch participants list "connectivity strength" (wish list, not a NASA requirement).
- Radio shadow ahead: Joint AR walk-back narrative uses a line-of-sight coverage layer ("lose communications for approximately 10 minutes"). In that narrative it is a map layer the crew opens, not an automatic alert.
- Steep stretch ahead: SUITS 2025-26 real-time hazard alerts with alternate routes; Joint AR path times from slope; Bensch contours "to identify steep slopes".
- Turn back now: SUITS 2025-26 "predictive maximum range" (EV, shall) and "turn around points" (rover); Joint AR "how to get to my lander and how long".
- Off the path: partly. Joint AR shows "on the right heading" and planned-vs-estimated time; no source has an explicit off-path alert.

## 7. Items NASA sources show that we do not have

- Suit and biomedical telemetry against limits: O2, CO2, suit pressure, temperature, battery, heart rate, metabolic rate (V2 11035/11038, SUITS).
- Caution and warning on suit faults with the E/W/C/A tiers, a recommended action or procedure per alert, and acknowledge/silence.
- EVA elapsed time, time at station, timeline ahead/behind (xEVAS, SUITS, Bensch).
- Breadcrumb trail and a best path back to the airlock or lander, with time estimate (SUITS "shall"; Joint AR §6.1.12).
- Partner position and heading, and the partner's suit status (Joint AR §6.1.14; SUITS 2023-24).
- Procedures / cuff checklist view.
- Text messages from MCC or IV crew (xEVAS; review: text beats voice under delay).
- Drop pins; selectable map layers (illumination, topography, comms coverage).
- Radiation monitoring and alerting in the suit (V2 11010).
- Camera viewfinder and photo capture.

## 8. Not verified

- Apollo RCU warning tone: snippet only. Cuff checklist page images not read.
- AxEMU display plans: no official source; snippet from a news site only.
- D-RATS 2010 blog: URL now 404, snippet only. NEEMO and original BASALT papers: not opened, known only through the 2025 NASA review.
- JETT5 caption read on a third-party mirror, not on nasa.gov (nasa.gov blocks scripted downloads here).
- The Joint AR ConOps figures (UI images) are not in the extracted text; the descriptions above come from their captions and body text.
- Bensch et al. did not publish their performance data; the findings are qualitative.
