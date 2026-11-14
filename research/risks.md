# Ranked risks of a human Mars mission, focus on surface excursions

Researcher, Sat 14.11. (BUILD phase). Builds on `research/science.md` §1, `research/sources-validity.md`, `research/data-science.md` §4; those facts are not repeated unless needed.
Marks: **V** = I opened the source and read the text (or, for the risk chart, the rendered slide image); **S** = search snippet only; **U** = unverified.
No new product ideas here. The map column only uses the features the team already has in mind.

## 0. What the ranking is based on

- **NASA's own rating:** the Human System Risk Board (HSRB) gives each of ~30 human system risks a likelihood x consequence colour (red = high, yellow = mid, green = low) per Design Reference Mission. The latest **public** per-mission chart I could find is **"Human System Risk Posture Summary – Risks by Hazard (as of November 2021)"**, slide 4 of Valinia et al., NESC, COSPAR 2022: https://ntrs.nasa.gov/api/citations/20220009899/downloads/F5.2_04_Valinia.pdf (**V**, colours read from the rendered slide and pixel-sampled). The column used is **"Mars (Planetary), 730-1224 days"**.
- NASA's HSRB page (https://www.nasa.gov/hhp/hsrb, V, updated Mar 2025) confirms 29-30 risks, eight DRMs, and an LxC per risk per DRM, but **publishes no current colours**. The risk list page (https://www.nasa.gov/hhp/human-system-risks/, V) has names only. So the 2021 chart is the newest rating I can cite. Risks are re-reviewed every 1-2 years (Antonsen et al. 2023, below), so some colours may have changed.
- **NASA does not rank within a colour.** Every order inside "red" below is **my judgement**, and so is the whole surface-excursion ranking (view b). View (b) breaks the red EVA risk into the contributing factors NASA itself lists in the EVA evidence report's causal diagram (DAG), then orders them using Mars architecture documents (DRA 5.0, Moon to Mars white paper) and Apollo history.

## 1. View (a): whole Mars mission (NASA HSRB, Mars Planetary, Nov 2021)

Red risks (unordered by NASA; my ordering puts first the ones NASA links directly to loss of crew):

| # | Risk (plain sentence) | NASA rating | Number | Map/route/HUD helps? | Mark |
|---|---|---|---|---|---|
| 1 | **Medical conditions:** a crew member gets ill or injured and there is no evacuation and only limited care on board. | Red | NASA's Integrated Medical Model: "at least a 1:90 likelihood of Loss of Crew Life for a 730-day Mars mission due to medical risk alone" (called an underestimate); ISS saw ≥1.7 high-consequence events per year | No (partly: fewer EVA injuries, see b) | V (Valinia slides 5, 9) |
| 2 | **Earth-independent operations / human-system integration (HSIA, renamed EIHSO on the 2025 list):** crew and systems are not designed to run without Mission Control in real time. | Red | 4-22 min one-way delay (science.md, V) | Partly: a crew-side decision aid is what this risk calls for (EVA report: "decision support for Mars missions will be limited by communication delay and will necessitate more reliance on EVA informatics systems", V) | V |
| 3 | **EVA:** injury and compromised performance during spacewalks/surface excursions. | Red (also red for both lunar-surface DRMs) | up to 24 h EVA per person per week | **Yes** (the only red risk tied to where and how you walk; see b) | V |
| 4 | **Behavioral health and team:** isolation and confinement degrade mood, cognition and teamwork. | Red / Red | – | No | V |
| 5 | **Altered gravity, long-term:** bone fracture, cardiovascular, SANS (eye), renal stone. | Red each | – | No | V |
| 6 | **Food and nutrition, pharmaceuticals:** food and drugs degrade over ~2-3 years without resupply. | Red / Red | – | No | V |
| 7 | **Crew egress:** a deconditioned crew cannot get out of the lander after landing unaided. | Red | – | No | V |
| 8 | **Dynamic loads:** injury from launch/landing/entry loads (and rover jolts, per EVA report). | Red | – | No | V |

Yellow for Mars Planetary (selected): **radiation carcinogenesis (long-term health)**, decompression sickness, hypoxia, CO2, toxic exposure, sleep, immune, sensorimotor, aerobic, muscle, electric shock, hearing. **Dust: not rated** for Mars Planetary (empty cell; yellow for long lunar-surface stays). V, same slide.

Radiation note (V, Valinia slide 12): Mars DRM 621 d transit / 40 d surface gives 331-405 mSv effective dose at solar maximum (within NASA's 600 mSv career limit) but **702-929 mSv at solar minimum (exceeds the limit)**. So radiation is yellow on the chart but mission-timing-critical; it is a whole-mission, mostly in-transit problem.

## 2. View (b): surface excursions only (my ordering, built from NASA sources)

Ordering logic: consequence first (could it kill or strand someone far from the habitat), then likelihood (how often it happened in Apollo/analogs or is expected with Mars cadence).

| # | Risk (plain sentence) | How NASA treats it | Number | Map / route / HUD can reduce it? (team features only) | Dataset involved | Mark |
|---|---|---|---|---|---|---|
| 1 | **Stranded beyond the walk-back limit:** a suit, rover, or medical failure leaves the crew with less consumables than the way back needs. | Part of red EVA risk. DRA 5.0: with one unpressurized rover, "the EVA team would be constrained to operate within rescue range of the surface base", i.e. enough time to walk back if the rover fails or for a rescue team to arrive; caches placed at "approximately 15 km, or EVA walk-back distance". Moon to Mars 2023: plan distances "to provide the crew access to a pressurized safe haven within the limits of emergency consumables in the event of a suit failure or medical event". | Apollo 14/15/17: **6 EVAs ended with <10 % usable oxygen**; 7 with ≤12 % power (one <4 %); 2 crew ended with 4 % and 2 % CO2-removal capacity left (EVA report p.29). NASA suit sizing: walk-back 30 min or 1 h at 2.2 mph (sources-validity.md, V) | **Yes:** return reserve + turn-back point | HiRISE 1 m DTM (distance, slope) + metabolic model (Pandolf/Santee, suit offset) | V |
| 2 | **Fall or musculoskeletal injury on slopes and rough ground.** | Part of red EVA risk; EVA DAG lists traumatic injury from falls, "falls on sloped terrain"; fall protection "from ... side of a crater". | Apollo crews: leg fatigue "more pronounced in terrain steeper than approximately 26°" (estimated angle) | **Yes:** slope and obstacle limits for a suited person; HUD warning in the walk | HiRISE 1 m DTM | V |
| 3 | **Crew member incapacitated, buddy must rescue.** | EVA DAG node "Incapacitation / Crew Rescue ... increases the likelihood of Loss of Crew Life"; DRA 5.0 requires minimum two per EVA ("buddy system") and ≥2 crew left in the habitat. | – | **Partly:** a turn-back point that keeps the walk home short limits how far a rescue must go; does not model carrying someone | HiRISE DTM | V |
| 4 | **Overexertion, heat storage, dehydration, fatigue** burn consumables faster than planned and degrade judgement. | EVA report contributing factors (thermal, hydration, workload and fatigue); "EVA planners must be able to make real-time adjustments to crew activity to conserve consumables". | Walk-back case 1700 BTU/h average, 2300 BTU/h 95th pct (sources-validity.md, V) | **Partly:** metabolic cost along route feeds the return reserve; time of day/temperature context | HiRISE DTM, REMS temperature | V |
| 5 | **Solar particle event during an excursion** with too little time to reach shelter. | Antonsen 2023: "If crews cannot shelter effectively during a solar particle event during an EVA, this may affect the likelihood of acute radiation sickness." DRA 5.0: warning must allow "the crew to return to the habitat or storm shelter"; "warning times ... may be as short as 30 minutes". | At Gale the Sept 2017 event raised dose rate only ~2-3x for ~12 h (data-science.md); Mars atmosphere shields much better than free space | **Partly:** RAD dose per excursion + return reserve expressed as time-to-shelter | Curiosity RAD | V (NASA text); measured Mars factor from data-science.md |
| 6 | **Losing the link to the habitat/buddy** (terrain blocks radio), so an emergency is not noticed or cannot be coordinated. | **No standalone HSRB risk.** Appears as a contributing factor (EVA decision support; EIHSO). Moon to Mars 2023: comms "may be limited by distance and/or line of sight to each other and other surface assets". DRA 5.0: surface terminal for users "in the immediate line-of-sight vicinity of the Mars habitat", relay satellites for "over-the-horizon" excursions. | No NASA number (range, antenna height, allowed blackout) found | **Yes (geometric):** comms shadow + repeater position | HiRISE DTM (viewshed) | V (qualitative only) |
| 7 | **Getting lost / navigation error,** taking a longer or harder path than planned. | Moon to Mars 2023: "Early missions will mainly utilize orienteering for navigation"; guidance systems "will help crew members get to destinations and back". | – | **Yes:** route linking science targets; first-person walk with HUD | HiRISE DTM + orthoimage | V |
| 8 | **Decompression sickness** from going to low suit pressure. | Yellow (Mars Planetary). More EVAs raise DCS likelihood (Antonsen 2023). | – | No | – | V |
| 9 | **Dust:** abrasion of suit joints/seals, intrusion into habitat, possible toxicity. | Dust risk **not rated** for Mars Planetary in 2021 chart. DRA 5.0: dust storms can cut solar power for 1-2 months (power design driver). | Mars-specific toxicity numbers (e.g. perchlorate): not checked | **Partly at most:** dust/tau as visibility context; does not reduce exposure | Dust optical depth (MER/MSL tau) | V (rating), U (toxicity) |
| 10 | **Cold and darkness:** low temperatures and light change by time of day; shadow thermal limits shorten EVAs. | Moon to Mars 2023: "Thermal control performance in dark shadows will also affect EVA duration" (lunar text). Not a separate HSRB risk. | Gale diurnal ranges in REMS data | **Partly:** time-of-day/temperature planning | REMS, sun position | V (lunar statement), Mars numbers from science.md |
| 11 | **Chronic GCR dose from excursions.** | Radiation carcinogenesis yellow (whole mission). | 6 h EVA ≈ 0.17 mSv at 0.67 mSv/day (science.md, our arithmetic) vs 600 mSv career limit: **~0.03 % per EVA** | Yes, but the effect is tiny | Curiosity RAD | V (inputs), arithmetic ours |

## 3. Where the two views differ

- The whole-mission red list is dominated by things no map can touch (medical, gravity, behavioural, food). **EVA is the one red risk that depends on where and how the crew walks.** That is the honest bridge into the product: "of NASA's red risks for Mars, this is the one a plan can change".
- Radiation looks big in public ("hazard #1" on NASA's Five Hazards page, https://www.nasa.gov/hrp/hazards/, V) but per excursion the chronic dose is negligible. The excursion-relevant radiation risk is an **SPE plus distance to shelter**, which really becomes a return-time question.

## 4. Does this contradict the team's assumption (return reserve and comms shadow as top risks)?

- **Return reserve: supported, strongly.** Three independent NASA sources make walk-back/safe-haven distance a planning constraint (DRA 5.0 rescue range and 15 km walk-back caches; Moon to Mars 2023 safe haven "within the limits of emergency consumables"; DRA 5.0 SPE return warning as short as 30 min), and Apollo came close on consumables (6 EVAs with <10 % oxygen left). One nuance: NASA frames it as a **contingency** (suit/rover failure, medical event, SPE), not as running dry on a normal walk. The story should be "if something fails *here*, can you still get home?" That also matches the existing prior-art note: SEXTANT already computed a path home (science.md), so the reserve/turn-back framing matters.
- **Comms shadow: weaker as a "top risk".** NASA rates no comms-loss risk on its own and gives no number; the statements are qualitative. DRA 5.0 assumes relay orbiters for over-the-horizon links, which reduces terrain shadowing as a problem (when an orbiter is overhead). The Mars-specific comms problem NASA stresses is the **4-22 min Earth delay**, which local line of sight does not fix. Recommendation: present comms shadow as a **supporting layer** (it matters for buddy/habitat coordination and rescue, risks #3 and #6) rather than a headline risk equal to return reserve. Don't call it a NASA-rated risk.
- **Radiation per excursion:** fine as a display, but don't present GCR dose per walk as a danger (0.03 % of the career limit). Frame it as "SPE warning → are you within reach of shelter?"

## 5. What to say in the pitch (V-marked facts only)

"NASA's Human System Risk Board rates the risk of injury during spacewalks **red** for a Mars mission. It is the one red risk that depends on where the crew walks. On Mars, help is 4 to 22 light-minutes away, so NASA says EVA decision support will have to rely on the crew's own systems. NASA's Mars architecture limits excursions to rescue range: the crew must always be able to walk back if the rover fails, and must reach shelter when a solar storm warning comes, sometimes with only 30 minutes' notice. This margin is real: on Apollo, six moonwalks ended with less than 10 % of their oxygen left. Our map answers one question at every step: if something fails here, can you still get home?"

Sources for that paragraph: HSRB chart (Valinia 2022, slide 4); EVA evidence report (Dunn et al. 2021, NTRS 20220004017, pp.29, 43); NEEMO latency (NTRS 20150019627); DRA 5.0 (NASA-SP-2009-566, §5.2.1 and §7.1.1): https://www.nasa.gov/wp-content/uploads/2015/09/373665main_nasa-sp-2009-566.pdf

## 6. Sources (all V unless marked)

| Source | Link | Used for |
|---|---|---|
| Valinia et al., "Integrated Human Health Risk Assessment: Requirements for Safe Expeditions to Mars", NESC, COSPAR 2022 | https://ntrs.nasa.gov/api/citations/20220009899/downloads/F5.2_04_Valinia.pdf | HSRB risk colours by DRM (Nov 2021), IMM 1:90, mission dose table |
| Dunn, Benson, Norcross, Newby, EVA Injury Evidence Report, NASA HRP 2021 (NTRS 20220004017) | https://ntrs.nasa.gov/api/citations/20220004017/downloads/2021%20EVA%20Injury%20Evidence%20Report%20Final.docx.pdf | EVA DAG contributing factors, Apollo consumables margins, slope >26° |
| Antonsen et al., "Updates to the NASA human system risk management process for space exploration", npj Microgravity 9:72, 2023 | https://www.nature.com/articles/s41526-023-00305-z.pdf | DRM attributes: SPE during EVA, no medical evacuation from Mars, 1-2 yr review cycle |
| NASA Mars Design Reference Architecture 5.0, NASA-SP-2009-566 | https://www.nasa.gov/wp-content/uploads/2015/09/373665main_nasa-sp-2009-566.pdf | Rescue range, 15 km walk-back, buddy system, SPE 30 min warning, line-of-sight vs relay comms, dust storm power |
| "Surface EVA Architectural Drivers", 2023 Moon to Mars Architecture Concept Review | https://ntrs.nasa.gov/api/citations/20230014957/downloads/Surface%20EVA%20Architectural%20Drivers.pdf | Safe haven within emergency consumables, comms LOS, orienteering, walk-back |
| NASA HSRB page; Human System Risks list; Five Hazards page | https://www.nasa.gov/hhp/hsrb ; https://www.nasa.gov/hhp/human-system-risks/ ; https://www.nasa.gov/hrp/hazards/ | Process, current risk names, public framing |

## 7. Not verified

- **Current (2023-2025) HSRB colours** for Mars. Not published on nasa.gov pages I opened; the Nov 2021 chart may be out of date. The rename HSIA → EIHSO is my inference from the 2025 list (image file named "hsia"), U.
- The chart uses two red shades in the Mars Planetary column; the legend shows a single "High LxC", so I treated both as red.
- Mars dust toxicity (perchlorate) and any HRP Mars dust rating: U.
- Apollo-era incidents beyond the EVA report (e.g. Apollo 15 cardiac arrhythmia during EVA): not opened, U; not used.
- No NASA number for allowed comms blackout, radio range, or repeater placement: searched in DRA 5.0 and the 2023 EVA white paper, none found.
- Ward et al. 2024 "Levels of evidence for human system risk evaluation" (npj Microgravity): S only.
- PubMed/PMC pages returned cookie/captcha walls; the Nature PDF of Antonsen 2023 was read instead.
