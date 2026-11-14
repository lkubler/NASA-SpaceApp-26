# Sources for validity gaps (EVA route planner, Murray Buttes)

Scout, Sat 14.11. Purpose: citable numbers for the leading candidate. This file does not evaluate the idea itself.
Legend: **V** = text read in full or in the relevant part (PDF text extracted, page fetched). **S** = snippet only (search-result summary, not opened). Confidence: H / M / L.

## Bottom line (read this first)
- No NASA document gives a single hard "max walkable slope" for suited astronauts. Defensible framing: a **planning threshold of 15 deg (conservative) to 20 deg (hard cap)**, justified by Apollo experience, and shown as an adjustable parameter. Do not claim it is a NASA requirement.
- For the energy model use the **Pandolf/Santee load-carriage equation** with grade. NASA JSC currently uses it for traverse workload (Kim et al., IEEE EMBC 2024). Cite that as precedent. Scale it with a suit offset (Walkback study) and a Mars-gravity caveat.
- SEXTANT is the direct prior art. The pitch should position against it (section 3).
- **Boxwork is NOT at Murray Buttes.** Remove from the Murray Buttes scenario or reword (section 4).
- Comms: only a qualitative NASA statement exists. Radio LOS (horizon and terrain shadow) must be shown as our modeled assumption, not a NASA number (section 5).

## 1. Max walkable slope and speed/load effects

| Number | Source | Status | Conf. |
|---|---|---|---|
| Apollo crews walked on slopes below about 15 deg; climbed up to about 150 m | EPSC 2024 abstract EPSC2024-196 (Pena-Asensio et al.), https://meetingorganizer.copernicus.org/EPSC2024/EPSC2024-196.html | S | M |
| "Any traverse needs to be on slopes less than 20 deg" (D. Kring); the same study maps accessibility at 15 deg and 10 deg. Walking speed and time estimated "based on Apollo mission records" | Pena-Asensio et al., Acta Astronautica (ScienceDirect PII S0094576523005179, no DOI seen); press summary https://www.universetoday.com/articles/lunar-astronauts-will-need-easy-walking-trails-around-the-moons-south-pole | V (secondary article); paper itself not opened | M |
| Max slopes actually traversed (on foot and LRV), from LRO topography: 22.1 deg (Apollo 15), 24.7 deg (Apollo 16); mean about 4.5-5.6 deg. Crew estimated 15-20 deg at Apollo 15 Station 6a | LROC "Follow the Tracks", https://www.lroc.asu.edu/posts/491 ; ALSJ Station 6a, https://www.nasa.gov/wp-content/uploads/static/history/alsj/a15/a15.sta6a.html | S | M (LRV included, not foot only) |
| Apollo 12: about 10 deg slope on the Cone Crater walk, tiring, only briefly sustained | ALSJ / physicsworld summary https://physicsworld.com/a/mountain-climbing-on-the-moon | S | L-M |
| Crew misjudge slopes visually (Apollo 16: said about 60, actual under 30 deg) | same LROC/ALSJ material | S | M |
| Bellcomm 1970: baseline EVA velocities are derated for load carrying, slopes, surface | NTRS 19700009560, https://ntrs.nasa.gov/api/citations/19700009560/downloads/19700009560.pdf (file over fetch limit, not opened) | S | L-M |
| Apollo walking speeds: 2.2 mph (3.5 km/h) max nominal walkback if under 1 h, 1.7 mph (2.7 km/h) if over 1 h; Apollo 15 actual 0.7-1 mph (EVA 1), 1-1.4 mph (EVA 2). Walkback radius: 2.2 mph x 0.5 h = 1.1 mi; x 1 h = 2.2 mi | Ogilvie et al., "Mars Spacesuit Mass Requirements", NASA JSC, ICES-2026-127 (slide 9), https://ntrs.nasa.gov/api/citations/20260005410/downloads/Mars_Mass_ICES2026_Presentation_Final.pdf | V (PDF text extracted) | H |
| Bellcomm planning: walking traverse 3.3 km/h at 1200 BTU/hr (1440 with 20% walkback pad); work tasks 1050; LRV ride 700 BTU/hr | Bellcomm memo via ALSJ search hit (OCR; speed read as "3.3") | S | L |

Load effect on speed and slope:
- Suit weight (63-308 kg 1-g equivalent) did **not** change metabolic rate for walking below 4.0 km/h (level only, lunar gravity, Mark III). Differences only above 4 km/h (up to about 15 ml/kg/min at 6-8 km/h). Gernhardt, Norcross, Vos, "Integrated Suit Test 1", SAE 2008-01-1951, https://ntrs.nasa.gov/api/citations/20080013604/downloads/20080013604.pdf. V, **level ground only, no slope**. Conf H for what it says.
- Mars carry-load assumption in NASA sizing: 50 lbm (23 kg) tool/sample mass; pressure offload about 48 lbf during walking; NIOSH carry limit 51 lbf. Same ICES-2026-127 deck. V, H.
- Practical implication: there is **no published NASA slope limit as a function of load**. A "load-scaled slope limit" is our own construct. Build it from the Pandolf equation (below): choose a metabolic ceiling and solve for the max grade at given load and speed. Label it "model-derived, not NASA-specified".
- Gap: I did not find a source for grade-dependent suited speed other than the SEXTANT/Marquez model (section 3).

## 2. Metabolic cost of suited walking (return reserve)

**Model to use: Pandolf load-carriage equation with Santee grade handling (NASA JSC precedent).** V.
- Kim, Hoffmann, Estep, Marshall-Goebel, Buckland (NASA JSC, funded by NASA Mars Campaign Office), "Improving Metabolic Workload Estimation Accuracy for Planning and Analyzing Exploration Traverses", IEEE EMBC 2024, https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf
- MP = 1.5 W + 2.0 (W+L)(L/W)^2 + eta (W+L)(1.5 V^2 + 0.35 V G) [watts; W body mass kg, L load kg, V m/s, G grade percent, eta terrain coefficient]
- Downhill/correction term CF = eta [ G (W+L) V / 3.5 - (W+L)(G+6)^2 / W + (25 - V^2) ] (for negative grades, per Santee et al. 2001).
- Underlying sources: Pandolf et al. 1977 (J Appl Physiol 43:577-581, original; not opened); Santee et al. 2001, "A proposed model for load carriage on sloped terrain", Aviat Space Environ Med 72(6):562-566; Santee et al. 2003, USARIEM TN03-3. Conf H for the equation form (matches Wikipedia https://en.wikipedia.org/wiki/Pandolf_equation).
- Terrain coefficient eta: 1.0 treadmill/blacktop, 1.1 dirt road, 1.2 light brush, 1.5 heavy brush (S, Wikipedia/secondary). Soft sand value 3.5 seen only on a consumer page: unverified. Pick eta 1.2-1.5 for regolith-like ground and state it as an assumption.
- Known weakness: underpredicts at higher loads and speeds (12-33% in one study, secondary, S). The NASA paper itself argues for field-calibrated models.

**Suit and gravity corrections (Moon/Mars, suited):**
- Mark III walkback test: suit restriction adds about **14 ml/kg/min** VO2 over unsuited walking, from the 10 km walkback study. At 2.2 mph, walkback study implies 19 ml/kg/min. "Hits VO2max at 3.5 mph on Mars" (figure caption, Mars-gravity offload). Source: ICES-2026-127 slides 5-9, V, H as cited by NASA; primary is Vos 2007 ICES 2007-01-3133 and NASA/TP-2009-214796 "Feasibility of Performing a Suited 10-km Ambulation" (not opened, title seen in snippet).
- EVA planning limits: nominal VO2 should not exceed 35% VO2max over an 8 h day (about 43% expected with training); minimum VO2max flight rule 36 ml/kg/min for EVA; **average 1200 BTU/hr for planetary EVA sizing; walkback case about 1700 BTU/hr (average crew) to 2300 BTU/hr (95th percentile)**. Same deck, V, H.
- Conversion given there: MetRate (BTU/hr) = (0.961 + 0.275 RER) x VO2 (ml/kg/min) x mass (kg); MetRate (kcal/min) = 4.039 VO2 (L/min) + 1.157 VCO2 (L/min).
- Apollo measured: average 780-1200 BTU/hr (NASA TN D-7883, S), suit design point 1200 BTU/hr. Apollo task rates were observed up to 50% lower than similar ground-analog tasks (xEMU study, S).
- Gravity scaling: the best-fit open model is Ludlow and Weyand 2017, "Walking economy is predictably determined by speed, grade, and gravitational load", J Appl Physiol 123(5):1288-1302, https://doi.org/10.1152/japplphysiol.00504.2017 (r2 = 0.99, 90 conditions, 32 subjects, grades -6 to +9 deg). Unsuited, Earth-based, load via total "gravitational load"; gravity scaling to 0.38 g is an extrapolation we would have to flag. S (abstract).
- Carr and Newman: Carr thesis (MIT 2005) https://dspace.mit.edu/handle/1721.1/33088 ; SAE 2005-01-2970 "When is running more efficient than walking in a space suit?"; Carr and Newman IEEE 2017 "Exoskeleton energetics". Finding: unsuited running becomes cheaper than walking below 0.5 g; suited cost of transport is high because of joint torques. Qualitative; no ready Mars slope coefficients. S.
- Gap: no published suited, Mars-gravity, graded-slope regression with load terms found (also stated by two searches). Say so honestly in the pitch: "Pandolf-based estimate with suit offset, uncertainty band, to be validated."

**Suggested return-reserve rule (our model, not NASA):** reserve = energy to walk back the remaining path at 2.2 mph (3.5 km/h) planning speed using Pandolf plus suit offset, plus a safety factor. Reference points to cite for the factor: Bellcomm 20% walkback pad (S, L), NASA walkback sizing at 30 min or 1 h at 2.2 mph (V, H).

## 3. SEXTANT / pextant (positioning)

- **SEXTANT** = Surface Exploration Traverse Analysis and Navigation Tool. MIT (Dava Newman, Jeffrey Hoffman group). MATLAB-based. Finds the optimal path between user-chosen waypoints on a DEM, optimizing distance, time or **explorer metabolic energy** (or rover power). Shows 3D map, thermal load (suit) or solar power (rover). Later part of the NASA BASALT research project.
  - Johnson, Hoffman, Newman, Mazarico, Zuber, "An integrated traverse planner and analysis tool for planetary exploration", AIAA SPACE 2010. https://dspace.mit.edu/handle/1721.1/81322 ; thesis https://dspace.mit.edu/handle/1721.1/59560 . Original data: lunar south pole LOLA DEM. V (abstract-level).
  - Gilkey, Galvan, Johnson, Kobrick, Hoffman, Melo, Newman, "Evaluation of a Surface Exploration Traverse Analysis and Navigation Tool", ICES 2011 (AIAA). https://dspace.mit.edu/handle/1721.1/81410 . V. MDRS field test: actual traverse time significantly longer than predicted (n=6, p<0.01), distance not different, energy significantly higher than predicted (n=5, p<0.01). So the model under-predicts cost; a good talking point for an honest uncertainty band.
- Metabolic model in SEXTANT: Marquez (MIT thesis), extrapolated from Apollo velocity and metabolic data. **Constant walking velocity per slope value**, no load term. Source: Kluis and Diaz-Artiles (Texas A&M), https://bhp.engr.tamu.edu/wp-content/uploads/sites/212/2022/02/Kluis-et-al.-2022-A-METHODOLOGY-FOR-ANALYZING-AND-IMPROVING-EVA-PERFORMANCE.pdf (one-page abstract, V). Marquez thesis not opened.
- **pextant**: the Python open-source reimplementation (GitHub, "pextant", from the BASALT/SEXTANT line). I did not verify the repo, license or features in this session. Treat as unverified. **TODO for whoever reuses it: check the GitHub repo and license directly.**
- Predecessor: Geologic Traverse Planner with max-slope constraint check (S, https://core.ac.uk/download/17204791.pdf, could not be fetched).
- Also relevant: NASA "AsTrav" LPSC 2026 abstract (NTRS 20250011301, S, title only) as a current NASA traverse tool. Not opened.
- **Positioning options for the pitch (differences visible from what is documented):** (a) SEXTANT is an expert desktop planner for the Moon and analog sites, MATLAB; ours is a browser tool on real Mars terrain. (b) SEXTANT's published model has no load term; ours scales with carried load. (c) Return reserve and comms-shadow awareness are not described in the SEXTANT abstracts I read (cannot rule out in the full papers). Say "to our knowledge" and verify against the 2010 paper before claiming novelty. Prior-art status for this specific idea belongs in `research/prior-art.md`; this section only documents the tool.

## 4. Murray Buttes: what Curiosity actually did; boxwork check

**Boxwork is not at Murray Buttes. Refuted.** Boxwork was studied in 2025 (about sol 4534 onward, May 2025 to early 2026) in the sulfate-bearing unit much higher on Mount Sharp. NASA says the patterns have not been seen elsewhere on the mountain. Murray Buttes was traversed in 2016 (sols about 1420-1488). Sources: JPL news, https://www.jpl.nasa.gov/news/nasas-curiosity-mars-rover-starts-unpacking-boxwork-formations/ (V, 23 Jun 2025: patterns "stretch across miles" of a layer of Mount Sharp, sulfate layer, drilled 8 Jun); JPL PIA26552 / PIA26560; Space.com. Sol numbers for boxwork: S. Conf H for refutation. Consequence for the notes: "three boxwork outcrops" cannot be Murray Buttes targets. If a boxwork science target is wanted it is a different site entirely.

**What Curiosity did at Murray Buttes (hand-pickable POIs):**
- Context: buttes and mesas are eroded remnants of wind-deposited sandstone (Stimson formation) rising from flat Murray formation lakebed mudstone; caprock resists erosion. Informally named for Bruce Murray. Located at a gap in the Bagnold dune band, an access route to the mountain. Sources: https://science.nasa.gov/resource/rovers-panorama-of-entrance-to-murray-buttes-on-mars (V); Planetary Society updates https://www.planetary.org/articles/08111530-curiosity-update-sols-1373-1427 and https://www.planetary.org/articles/10131553-curiosity-update-sols-1428-1488 (V). Also NASA PIA17587 (HiRISE view) already in notes.
- **Sol 1405 (to 1410): "Bimbe"**, dark blocky deposit of angular blocks (conglomerate or breccia), first of this type since Bungle Bungle (sol 550). Just before the buttes.
- **Sol 1420/1422: Marimba**, 13th drill site, drilled on the Murray formation just before entering the buttes (second attempt sol 1422, 6 Aug 2016). CheMin sol 1425, drove away sol 1427. Reddish tailings.
- **Sol 1421 (5 Aug 2016): entrance panorama**; a dark flat-topped mesa about 15 m high, about 90 m from the rover, top ledge about 60 m across (NASA caption, V). Sol 1419: pyramid-shaped rock at the edge of a cross-bedded outcrop (Planetary Society, V).
- Sol 1428: 45 m drive toward the buttes; sol 1429: Mastcam stereo mosaics of the buttes (S, NASA blog "Sols 1429-1431, power limited").
- Sol 1432: another panorama; sol 1434: "Martian mesas, Murray Buttes area" image (S). Sol 1447: shadows on a butte imaged during a dust measurement.
- The team imaged the buttes in mosaics rather than sampling them (late aeolian sandstone of limited science interest, per the Planetary Society author, V). Traverse of the whole expanse took about four weeks after Marimba.
- **Sol 1461-1464: Quela**, drilled at the base of a butte just south of the buttes (first try sol 1461 faulted, success sol 1464).
- Contact science attempt: Karasburg (Murray-Stimson contact), dropped because sand-covered (sol 1454 plan). "Alma" is mentioned in a snippet as a contact target (S, L).
- Farewell panorama: "Farewell to Murray Buttes" PIA21042 (S), https://www.jpl.nasa.gov/images/pia21042-farewell-to-murray-buttes-image-2
- Individual butte names ("Mont Mercou" etc.) were **not found** in any source. Do not use those names. The team used names only for targets and drill sites.
- Gap: Marimba, Bimbe, Quela and the panorama locations should be placed on the HiRISE DTM by coordinates (data-scout), since only the entrance mesa has a size/distance in the sources.

## 5. Comms line of sight for surface EVA

- NASA white paper "Surface EVA Architectural Drivers", 2023 Moon to Mars Architecture Concept Review, https://ntrs.nasa.gov/api/citations/20230014957/downloads/Surface%20EVA%20Architectural%20Drivers.pdf (V). Section 9: "Communications between EVA crewmembers may be limited by distance and/or line of sight to each other and other surface assets during certain periods of initial surface missions"; surface mobility assets with Earth comms let the crew explore further; early missions mainly orienteering. Section 11: suit or vehicle failure may require a walkback to safe haven. **Qualitative only, no number.** Conf H for the statement, none for any figure.
- NASA Glenn 2005 briefing (NTRS 20060005060, S): surface network of habitat, rover and relay nodes over about 2-50 km; EVA needs voice, data and 2-way video without real-time Earth interaction. Old, architecture assumption.
- Georgia Tech student report (2005) and MIT MATER ConOps (2025): student work, not NASA requirements. Do not cite as NASA.
- **No NASA document with a numeric LOS requirement, antenna height or max range found.** Safe approach for the demo: compute geometric radio line of sight on the DTM (terrain viewshed from a base antenna to a suit antenna at about 1.7-2 m height), call it "geometric LOS, assumed VHF/UHF-class link, no multipath". The horizon on Mars (radius 3390 km) is about 3.5 km for a 1.8 m antenna and 3.5 km base height ~2 m as well: d = sqrt(2 R h) = sqrt(2 x 3390000 x 1.8) = about 3.5 km (our own calculation, Conf H as geometry). Terrain, not curvature, will dominate at Murray Buttes.

## Recommended wording in the pitch
- "Route cost uses the Pandolf load-carriage equation with a suit offset, the same family NASA JSC uses for traverse workload (Kim et al. 2024)."
- "Slope limits are planning thresholds based on Apollo experience (about 15 to 20 deg), adjustable by the user; NASA publishes no single limit."
- "Return reserve is sized for a walkback at 2.2 mph, the NASA sizing assumption."
- Avoid: boxwork at Murray Buttes; named individual buttes; any "NASA requirement" for slope or comms.

## Not verified / open
- pextant repo and license; Johnson 2010 paper full text (slope constraint value, whether comms or reserve is modeled); Marquez thesis; Pandolf 1977 original; NASA/TP-2009-214796 numbers; TN D-7883; Bellcomm 19700009560; core.ac.uk PDFs returned 403 or were not downloadable here.
