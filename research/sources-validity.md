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

## Addendum (after orchestrator update, notes.md pulled)

**Quela / Murray Butte 12 check (1 line):** NASA blog "Sols 1456-1458: Settling in at Quela" (https://science.nasa.gov/blog/sols-1456-1458-settling-in-at-quela/, 9 Sep 2016) confirms Quela is "right at the base of one of the Murray Buttes", and mentions Stimson block "Uutapi" (sol 1458) and fallen blocks "Cuimba". The page does **not** say "Murray Butte 12" or mention cross-bedding; those two need another source (e.g. the Quela sol-1464 drill reports) before the pitch states them. Drill success sol 1464 is from the Planetary Society update (V). Sol window 1383-1455 is consistent with my sources (arrival about sol 1373-1405, buttes sol 1428-1455, Quela from 1456); Quela drilling itself is sols 1461-1464, so "1383-1455" excludes the drill sol, say "to about sol 1464" if Quela is included.

**Correction to note on walkback (notes.md "10 km maximum distance"):** 10 km is the distance of the NASA JSC Walkback Test (Mark III, 1/6 g; Vos, ICES 2007-01-3133; NASA/TP-2009-214796), a feasibility test, not a stated mission limit. NASA suit-sizing practice assumes a walkback of 30 min or 1 h at 2.2 mph, i.e. a radius of **1.1 mi (1.8 km) or 2.2 mi (3.5 km)** (Ogilvie et al., ICES-2026-127, V). That is consistent with the xEMU ConOps "up to 2 km from lander" the team already cites. Recommend wording "10 km Walkback Test demonstrated feasibility for the Moon; planning radius is about 2 km (xEMU ConOps) to 3.5 km". A 10 km Mars rover-failure walkback is more optimistic than NASA's own sizing; flag it as a stretch assumption.

**Mapping sources to the reserve model (base x slope x terrain x load):**
- Base: 1200 BTU/hr (about 350 W) planetary EVA average; walking/walkback 1700 BTU/hr average crew, 2300 BTU/hr 95th percentile (ICES-2026-127, V). 6+/-2 h EVA from the xEMU ConOps is the team's own citation, not re-verified here.
- Slope factor: use Pandolf term eta(W+L)(0.35 V G) relative to the flat term (Kim et al. 2024, V). Worked example (our arithmetic, W=82 kg, L=23 kg, V=0.9 m/s, eta=1.2): flat 1.5V^2 part adds 1.2*105*1.215 = 153 W; 15% grade adds 1.2*105*0.35*0.9*15 = 595 W; so a 15% (8.5 deg) grade roughly quintuples the speed-dependent term. Values are Earth-gravity Pandolf outputs; label as "simplified model".
- Terrain factor: eta 1.0-1.5 (S, secondary). Load factor: Pandolf load terms, 50 lbm (23 kg) carry assumption (V).
- Slope-linked speed: no NASA table found; Marquez/SEXTANT uses one constant velocity per slope (Kluis, V). Linking speed to slope in the demo is consistent with that precedent.
- Slope limit: the team's xEMU ConOps 20 deg and Apollo 15 about 17 deg are consistent with my finds (15 deg below-threshold in EPSC 2024, 22.1 deg max traversed incl. LRV in LROC). Load-dependent limit remains our own construct, no NASA source.
- Comms: NASA statement is qualitative (EVA white paper section 9). The notes' claim that NASA names "max time without line of sight to lander" as an operational limit is not verified by me; the slide deck is not in my sources. Get its title or NTRS link from the humans before citing.

## Quela / "Murray Butte 12" / cross-bedding source check (data-scout, Sat 14.11.)

Marker: V = page text read and quoted, S = search snippet only, M = from memory, not verified, C = our own calculation.

**Result: the claims are NOT in the Access Mars repo. They are in a NASA-derived news article.**

Access Mars repo, shallow clone at commit `4b0a445f4e3b3fbfbc6b06f3adf07c24c05a2c57` (https://github.com/googlecreativelab/access-mars/commit/4b0a445f4e3b3fbfbc6b06f3adf07c24c05a2c57). V, case-insensitive grep over all text files (excluding node_modules/.git) for `quela`, `murray butte`, `cross-bed`, `stimson`, `M12`:
- `Quela`: 0 hits. `Stimson`: 0 hits. `cross-bedding` / `crossbed`: 0 hits. "Murray Butte 12": 0 hits. (`m12` hits are only three.js matrix variables in `public/js/vr.js`.)
- Murray Buttes text exists only as 4 POIs in `public/index.html` lines 207-210 (https://github.com/googlecreativelab/access-mars/blob/4b0a445f4e3b3fbfbc6b06f3adf07c24c05a2c57/public/index.html#L207-L210). Quotes:
  - BUTTES (13.8, 1.2, 6.9): "These are the Murray Buttes. Buttes are steep, knob-like rock formations. The largest one here is about as tall as a three-story building. These buttes served as Curiosity's entryway to its main destination: Mount Sharp."
  - BRUCE MURRAY (-10.56, 1.80, -12.90): named after the late Bruce Murray, Caltech planetary scientist and JPL director.
  - MONUMENT VALLEY (21, 6.2, 3.7): "These buttes are similar to ones you'd find on Earth, formed when wind erodes ancient sandstone. Scientists have compared the region to Monument Valley."
  - INTERFERENCE (-63.5, -3.9, 35.2): "The buttes are beautiful, but are sometimes tall enough to block the signal between Curiosity and the Mars orbiters that fly overhead. That can temporarily reduce the amount of data that Curiosity can send back to Earth."
- Useful by-product: the INTERFERENCE POI is a Google/NASA-JPL-sourced statement that the buttes can block the orbiter relay link. This supports a line-of-sight / comms-shadow feature at Murray Buttes (qualitative, no numbers). Also the scene's POIs are at the +/-64 m edge for that one (x = -63.5).
- Repo site-card distances (index.html line 286-289): Pahrump 9.7 km, Marias 10.8 km, Murray 14.1 km from the landing site (V, odometry-style distance as stated by Google, not straight line; our earlier straight-line figure Bradbury to Murray was about 8 km).

**Where the claims are actually stated:**
- V. Ken Kremer, Universe Today, article "Drilling at Unfathomable Alien Landscapes - All in a Sols (Day's) Work for Curiosity", https://www.universetoday.com/articles/drilling-at-unfathomable-alien-landscapes-all-in-a-days-work-for-curiosity (page shows no publication date; latest date it mentions is Sol 1470, 24 Sep 2016). Exact sentences: "The rock target named "Quela" is located at the base of one of the buttes dubbed "Murray Butte number 12,"" and "The drill (successful at second attempt) is at Quela." and "The presence of "cross-bedding" indicates that the sandstone was deposited by wind as migrating sand dunes, says the team." The page does not use the word Stimson. Secondary source (journalist relaying the Curiosity team's updates), not NASA itself. Quote it as "reported by Universe Today, relaying the Curiosity team". If the pitch needs a primary NASA citation, use the NASA blog below for Quela location plus the Banham paper for Stimson.
- V (earlier, see addendum above). NASA blog "Sols 1456-1458: Settling in at Quela", https://science.nasa.gov/blog/sols-1456-1458-settling-in-at-quela/: Quela is at the base of a Murray Butte; mentions Stimson block "Uutapi".
- S only. Banham et al. 2018, Sedimentology, "Ancient Martian aeolian processes and palaeomorphology reconstructed from the Stimson formation" (USGS listing https://www.usgs.gov/publications/ancient-martian-aeolian-processes-and-palaeomorphology-reconstructed-stimson-formation, https://pubs.usgs.gov/publication/70196324). Snippet says: Stimson is cross-bedded sandstone about 1 m thick sets separated by bounding surfaces, net transport toward the NE; simple crescentic dunes about 10 m high, wavelength about 150 m; Stimson rests unconformably on the lake-deposited Murray formation. I did not open the paper; use only after reading.
- S only. A 2021 Mastcam study of Murray Buttes dunes (British Library catalogue record, https://eld.bl.uk/catalog/100179285047_0x000001): oblique dunes, draas migrating NNW. Not read; do not cite.
- Safe wording: "Quela, drilled at the base of Murray Butte 12 (Curiosity team, Sep 2016); cross-bedding in the sandstone shows it was deposited by wind-blown dunes." Add "Stimson formation" only with the NASA blog (Uutapi) or Banham paper as the source.

## Mars dust storm and EVA hazard data (data-scout, Sat 14.11.)

### A. Datasets that exist (access tested by curl, Sat 14.11.)

| Source | What it gives | Access (tested) | License / terms | Fit for prototype |
|---|---|---|---|---|
| Mars Climate Database (LMD, with ESA/CNES) | Modelled T, pressure, density, winds, dust column, radiation-relevant fields by Ls, local time, lat/lon, altitude. Dust/EUV scenarios incl. climatology, cold, warm, "dust storm" (min/ave/max solar) and year-specific MY24-MY35 | Web interface http://www-mars.lmd.jussieu.fr/mcd_python/ returned 200 and its form lists "dust storm min/ave/max solar", "warm", "cold" scenarios (V). Dust scenario NetCDFs and docs at https://www-mars.lmd.jussieu.fr/mars/dust_scenarios/ (200, V). Full database by request form (S, EPSC 2024 abstract) | Free for research on request (S). Exact license text not read | One-point lookups via the web form are enough for a demo table. Do not integrate the database. |
| MCD dust scenario definition | Climatology = average of kriged MY24-31 maps excluding MY25 and MY28 global storms; cold = minimum over MY24-31 then -50 %; warm = maximum (excluding storms) then +50 % | V (page text) | as above | Gives the labelled dust scenarios. Note the unit: daily IR 9.3 micron absorption column optical depth normalised to 610 Pa, 5 x 5 deg. IR to visible conversion is about 1.6 to 2 (Lemmon 2023 uses 1.61 multiplier, V quote in their text); so a visible tau is roughly 1.6x the IR value. |
| MSL Mastcam tau record, Lemmon et al., "The Mars Science Laboratory record of optical depth measurements via solar imaging", https://arxiv.org/pdf/2309.07378 (V, read) | 880 nm optical depth at Gale from sol about 3644 back to 2012, all seasons, 5+ Mars years | Paper open on arXiv. Data archive is in PDS Atmospheres node (paper cites archive in Sec. 3.3, not opened) | Open | Source for seasonal shape. The paper states trends only in figure form; I could not get numbers from the text (see table C). |
| MSL REMS (pressure, air and ground temp, humidity, UV, wind) | 1 Hz, 5-min samples each hour plus extra, ENV/MOD RDR products | PDS Atmospheres page https://pds-atmospheres.nmsu.edu/data_and_services/atmospheres_data/MARS/curiosity/rems.html returned 200 (V) | NASA PDS open data | Good for diurnal temperature and pressure range at Gale. Not downloaded. |
| MRO MARCI weekly weather reports (MSSS) | Weekly text plus image captions of dust storms, global view, since 2007 | https://www.msss.com/msss_images/subject/weather_reports.html redirects (302) to asimov.msss.com, 200. Listing I fetched ends at the week of 31 Jan 2022 (V), so it may be frozen or paused; not checked beyond | Image captions NASA/JPL/MSSS, standard NASA media use | Good for narrative and the 2018 storm images. Not a quantitative feed. Check the archive end date before claiming "live". |
| Curiosity 2018 storm campaign | Mastcam, Navcam, REMS, RAD during sols 2075 to 2169 | Papers below | open arXiv/NTRS | The one real "worst case" for Gale |

No programmatic API for any of these was tested beyond HTTP 200. The simplest prototype input is a small hand-made table of labelled values (section D), each with its source.

### B. 2018 (MY34) global dust storm at Gale: numbers

- V. Guzewich et al. 2019, GRL 46(1), doi 10.1029/2018GL080839, "Mars Science Laboratory Observations of the 2018/Mars Year 34 Global Dust Storm" (NTRS https://ntrs.nasa.gov/citations/20190001691, abstract read): campaign about 100 sols; Mastcam 880 nm optical depth reached **8.5**; incident total UV fell by **97 %**; diurnal range of air temperature fell by **30 K**; semidiurnal pressure tide amplitude rose to **40 Pa**; no active dust lifting inside Gale (dust came from outside).
- V. Chen-Chen et al. (Navcam retrieval, https://www.arxiv.org/pdf/2008.01968 via the saved PDF text): storm start Ls 184.9 deg (30-31 May 2018, MSL sol 2067); campaign sols 2075 (Ls 188.7, 7 Jun 2018) to 2169 (Ls 248.2, 11 Sep 2018); pre-storm tau 1.2 rising steeply to tau > 9 in their retrieval; tau about 7.0 on sol 2084 (citing Lemmon 2019); dust particle effective radius 1 to 4 micron during the storm. Mastcam rise "from 0.6 up to 8.5 over a period of about 10 sols" (their citation of Lemmon et al. 2019).
- V. Guzewich et al., dust particle size abstract (LPSC-type, saved PDF text): particle radius exceeded 4 micron, possibly 5 micron, at storm height; sol 2097 data not used because opacity was "~8" and the signal too poor. Typical seasonal particle size about 2 micron.
- S. Viudez-Moreiras et al. 2019, JGR Planets 124(7), 1899-1912, doi 10.1029/2019JE005985 (REMS): daily maximum UV fell 90 % between sol 2075 (tau about 1) and sol 2085 (tau about 8.5). Abstract only seen via search snippets; full paper not read.
- V. JPL news 13 Jun 2018 https://www.jpl.nasa.gov/news/nasa-encounters-the-perfect-storm-for-science: on 12 Jun 2018 tau at Curiosity was between 1.0 and 2.0, "average for dust season" though usually later in the season; storm covered about 35 million km^2 (a quarter of the planet) and was still growing; Opportunity (solar) cut science as tau rose ("When the tau value is high, the rover's power levels drop"; no power numbers); Curiosity is nuclear-powered and not affected; global storms recur roughly every 3-4 Mars years (6-8 Earth years); previous in 2007. Quote: "the most powerful surface winds encountered on Mars would not topple a spacecraft."
- V. Other storms for scale (Chen-Chen intro): Spirit measured 880 nm tau up to 4.3 in 2007; Opportunity 4.6 to 5; Viking storms about 3 and 3.7 to 9 (1977).

### C. Seasonal baseline at Gale (tau, 880 nm)

- V (Lemmon et al.): optical depth "declined to low values during LS 0-140"; dust generally increases around Ls 140-150; regional storms near Ls 210 and Ls 315; every year looks qualitatively alike; Ls 90-140 isolated points 0.1-0.2 above neighbours are ice hazes; about 25 % of column optical depth was high-altitude ice in Ls 90-135 (aphelion cloud belt); diurnal change: tau peaks in the morning in southern spring/summer.
- V (Lemmon, quoting Jezero comparison): infrared tau 0.2-0.3 corresponds to visible 0.3-0.5.
- **Numeric seasonal tau at Gale was not obtainable from text in this session.** Only figure-read values exist. For the planner use, labelled as approximate and unverified by us: clear season (Ls 0-140): about 0.4 to 0.7 (M; consistent with the 0.6 start of the 2018 Mastcam rise); dust season (Ls 180-330): about 1 to 2 (V in part: JPL 1.0-2.0 on 12 Jun 2018 "average for dust season", Chen-Chen pre-storm 1.2); regional storm peaks about 2.5 to 4 (M, not verified); global storm 2018: 8.5 (V). Ask a human or the Lemmon Fig. 4 data archive before showing the first two as facts. If shown, label "typical, approximate, Mastcam record (Lemmon et al.)".

### D. Suggested labelled inputs for the EVA planner (our own scenario table, each line with source)

| Scenario | tau (880 nm) | Basis | Confidence |
|---|---|---|---|
| Clear | 0.5 | Gale low-dust season, Lemmon record (trend V, value M) | medium-low |
| Typical dust season | 1.0 to 2.0 | JPL 12 Jun 2018 statement, Chen-Chen pre-storm 1.2 (V) | medium-high |
| Regional storm | about 3 | Order of Spirit/Opportunity 2007 values 4.3-5 (V) and Viking 3 (V); Gale-specific value not verified | low |
| Global storm 2018 peak | 8.5 | Guzewich 2019 (V) | high |

Derived effects at these inputs (use the formula as a clearly labelled assumption):
- Surface UV: -90 % at tau about 8.5 early rise (S Viudez-Moreiras), -97 % total UV at peak (V Guzewich).
- Direct sunlight: Beer-Lambert e^(-tau / cos z). At tau 8.5, noon sun: e^-8.5 = 0.0002 (C). That is why Opportunity lost power. But diffuse light remains; the Sun was still seen in Mastcam images at tau about 7 (V Chen-Chen sol 2084), and sol 2097 at about 8 was "poor signal". Surface is dim, not dark; daytime light scales with diffuse sky (no numeric flux found; do not state a lux figure).
- Visibility (C, own reasoning, not sourced): tau is a vertical column. If dust is mixed over about 10 km, horizontal extinction is about tau/10 km = 0.85 per km at tau 8.5, so a contrast-visibility distance (3.9 / extinction) of a few km (about 4.6 km). Mixed to higher altitudes during storms (Lemmon: dust enhanced at altitude) and surface layer concentration unknown, so treat as "kilometre scale, not zero". At tau 1-2 the horizontal path is clear over any EVA radius (about 2 to 3.5 km). Flag as estimate; no published surface-visibility number found.
- Temperature: global storm cut the diurnal air temperature range by 30 K (V). The storm warms the night and cools the day at the surface. REMS diurnal range at Gale in normal season is on the order of 60-90 K (M, not checked). So EVA thermal load is reduced in the afternoon and night cold is milder.
- Pressure: tide amplitude up to 40 Pa (V). Mean Gale pressure about 700 to 900 Pa (M). Variation is under about 6 percent, irrelevant to suit operations or to radiation shielding.
- Solar power: for a solar-powered asset (rover, habitat panels, comms relay) loss is the dominant effect; no number for Opportunity in the JPL article (V). Curiosity RTG is unaffected (V). Do not give a % output; use "direct beam transmission e^-tau" as a clearly labelled model.
- Comms: UHF relay to orbiters is not noticeably tied to dust (no source found that dust attenuates UHF; S-band to X-band attenuation by Mars dust is small at these frequencies, M, not verified). Terrain blocking is the real comms limit; Access Mars POI INTERFERENCE (V above) says buttes block the orbiter link.
- Radiation shielding by atmosphere: not tied to dust in any source I read. The atmosphere column at Gale (about 20 g/cm^2, M) changes by the pressure tide (under about 6 percent), so shielding is effectively constant across scenarios (C). Gale surface dose about 0.6 mSv/day from the RAD instrument (M, not verified here). Do not claim dust storms add or remove radiation protection. UV does drop (V above).
- Dust on suits: Apollo lunar dust experience is NASA-documented, but the EVA architecture white paper's dust mitigation section (section 2) is lunar regolith (V text, saved earlier). No Mars-specific suit dust data found this session. Mars dust is also reported to contain perchlorate at around 0.5 wt% at Gale (M, not verified): treat as a chemical caution, flag as unverified. Note Mars dust particles are about 1-4 micron (V Chen-Chen, Guzewich); the instrument finding that "cameras collected saltating sand in their sunshades 1.97 m above the surface" (V, Lemmon abstract) shows sand is lifted to head height at Gale.

### E. What winds can really do at Mars pressure (to avoid the movie myth)

- V. JPL 2018: "the most powerful surface winds encountered on Mars would not topple a spacecraft" (https://www.jpl.nasa.gov/news/nasa-encounters-the-perfect-storm-for-science).
- V. Universe Today, 8 Oct 2025, on Science Advances paper using ESA CaSSIS (TGO) and HRSC (Mars Express), 50,000+ images: dust devils and their winds "can reach speeds of up to 44 m/s, or 160 km/h"; earlier measurements "generally remain below 50 km/h", rare 100 km/h; atmosphere "less than 1% as dense as Earth's". https://www.universetoday.com/articles/the-winds-on-mars-are-stronger-than-we-thought
- C. Dynamic pressure q = 0.5 * rho * v^2. For rho about 0.018 kg/m^3 (P 800 Pa, T 230 K, R 192 J/kg/K; assumed Gale-like values), v = 30 m/s gives q about 8 Pa; v = 44 m/s gives about 17 Pa. The same 30 m/s on Earth (rho 1.2) gives about 540 Pa, so the Mars force is about 1.5 % of Earth at equal speed. On a person-sized frontal area of about 0.7 m^2 with drag coefficient about 1: roughly 6 N at 30 m/s and 12 N at 44 m/s, i.e. less than the weight of a 1.5 kg object (Earth). A 44 m/s Earth wind is about 1.3 kPa (and ~0.9 kN on a person). So wind will not knock an astronaut over or tear equipment; the realistic effects are visibility/dimming, sand abrasion and fine dust ingress, electrostatic charging (M), and lofted dust for solar panels.
- Wind sources also disagree on typical values: REMS and Viking report sustained winds on the order of 5-10 m/s and gusts of tens of m/s, but I did not verify these. Viking 2 did not show a strong link between storm and the highest winds (S, search snippet, not opened).
- Safe pitch line: "Dust storms on Mars darken the sky and clog solar panels; they do not blow people or rovers away. At 44 m/s and Mars air density the push on a person is under 15 N (our calculation)."

### F. Recommendation (smallest set for a hazard layer)

1. A four-row labelled tau table (D) with sources, user-selectable. No data download needed.
2. Quote Guzewich 2019 (8.5, -97 % UV, -30 K, 40 Pa) and JPL 2018 (1.0-2.0 average) as the two anchor numbers; both are V.
3. Wind myth: ship the q calculation, with rho stated as an assumption.
4. Optional later: MCD web form for one Gale point (lat -4.59, lon 137.44) at one Ls per scenario, to cross-check tau and temperatures. Not attempted because it needs form interaction.
5. Do not claim: numeric surface visibility, solar power %, comms attenuation, radiation change, perchlorate level; each is M or C here.

Not verified: Viudez-Moreiras full text; Lemmon Fig. 4 numeric seasonal values; MCD form outputs; MARCI archive end date; Banham paper text.
