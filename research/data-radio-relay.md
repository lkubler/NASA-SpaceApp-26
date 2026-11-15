# Radio relay and radio shadow: NASA grounding

Researcher, Sun 15.11. ~09:50-10:00 (12 min cap). Builds on `research/risks.md` row 6 and §4 (DRA 5.0 and Moon to Mars 2023 quotes on line of sight are there and are not repeated here). App state checked: `app/src/core/radio.js` (geometric line of sight, rover antenna 1.7 m, eye 1.7 m, both labelled `assumption` in `app/src/core/values.js`); relay is only a marker and card in 2-plan.

"Opened" = I read the source text myself (PDF text extracted). "Second-hand" = search-result summary only.

## 1. Comm rules during surface EVA

| Claim | Value | Applies to | Source | Status |
|---|---|---|---|---|
| Apollo 15 measured walk/ride-to-LM radio loss and compared it with a terrain-shadow prediction; "The technique of predicting shadow losses due to obstacles in the radio line-of-sight provides a good estimate of the actual shadowing loss." | qualitative, validated | EVCS (suit) to LM VHF link, Hadley-Apennine, 1971 | Apollo 15 Mission Report Supplement 6, MSC-05161, Jan 1972, https://ntrs.nasa.gov/api/citations/19720017533/downloads/19720017533.pdf | Opened |
| "When the transmitter was on an upslope ... the radio transmission loss approached the free space loss values as the line-of-sight to the LM was regained." | qualitative | same | same | Opened |
| Link frequency | 259.7 MHz (VHF; suit to LM) and 279.0 MHz | Apollo EVCS | same | Opened |
| Antenna heights used in the prediction | LM EVA antenna 8.24 m (27 ft); suit (EVCS) antenna 1.83 m (6 ft) | Apollo 15 | same, §2.1.2 assumption 3 | Opened |
| Terrain model used for the prediction | 1:15,840 contour map, 20 m contours with 10 m interpolation (far coarser than our 0.5 m grid) | Apollo 15 | same | Opened |
| Data covered "out to 5 km and when major terrain obstacles were encountered" | 5 km | Apollo 15 EVAs | same | Opened |
| Usable link threshold: good voice and data for received signal > -105 dBm | -105 dBm | Apollo EVCS-LM | same | Opened |
| The suit-to-LM VHF link was studied as "a possible backup to the LCRU"; the LCRU on the rover was the primary link to Earth | role | Apollo 15-17 | same; LCRU role also in https://www.nasa.gov/wp-content/uploads/static/history/alsj/HSI-481184-LCRU.pdf | Opened (Suppl. 6); LCRU handbook second-hand |
| Apollo 17: crew >7 km from LM without terrain line of sight, no noticeable difference in recorded comm | anecdote (LCRU went direct to Earth, so LM line of sight did not matter) | Apollo 17 | search summary, source not identified | Second-hand, unverified |
| Artemis EVA ConOps (EVA-EXP-0042 via EVA-EXP-0075 deck): suit can record audio and video onboard "in case communication is lost" | capability, no time limit | xEVA / Artemis | https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf | Second-hand (snippet truncated) |
| Artemis III EVA Ops 101: EVA planning constraints listed include "Comm/video range", "Emergency Return", "OCADs and Flight Rules" | list item only, no number | Artemis III | https://ntrs.nasa.gov/api/citations/20240005248/downloads/EVA%20Ops%20101%20for%20Artemis%203%20External%20Teams.pdf (p. 9) | Opened |
| A NASA rule "maximum time without comm" or "terminate EVA on loss of comm" | NOT FOUND | - | searched NTRS/nasa.gov; flight rules are not public | Could not verify; do not cite as a NASA rule |

Note on the Apollo 15 source: the PDF I opened is titled "Apollo 15 Mission Report Supplement 6: Postflight Analysis of the EVCS-LM Communications Link", MSC-05161, Jan 1972; it was downloaded from https://ntrs.nasa.gov/api/citations/19720017533/downloads/19720017533.pdf (NTRS 19720017533). The ALSJ LRV handbooks (https://www.nasa.gov/wp-content/uploads/static/history/alsj/LRVSysHndbkA15RevA.pdf) were search hits, not opened.

Bottom line for Q1: there is a documented, flight-validated NASA statement that terrain line of sight predicts radio shadow (Apollo 15), and "comm range" is a named EVA planning constraint (Artemis III). There is no public numeric rule (minutes without comm, max distance out of contact). Any limit in the app stays labelled `assumption`.

## 2. Relays: plans, heights, frequencies, model validity

| Claim | Value | Applies to | Source | Status |
|---|---|---|---|---|
| NASA Glenn Lunar Surface Relay-Mobile (LSR-M), for SCaN: mobile relay "placed in optimal locations for relay between surface elements" | concept, 2023 | Artemis sortie sites | Turnbull et al., ASCEND 2023, https://ntrs.nasa.gov/api/citations/20230012703/downloads/ASCEND-LSR-M%20Paper_final_preSTRIVES.pdf | Opened |
| LSR-M surface links: 5G and UHF up to 5 km; Wi-Fi about 300 m | 5 km / 300 m | same | same | Opened |
| LSR-M mast | UHF and 5G antennas on a 10 m boom, "as compared with the 2 m height expected on other assets, such as LTV" | same | same, §V | Opened |
| LSR-M lesson: "The lunar terrain ... makes line of sight to surface users difficult to maintain and the optimal site for one set of CONOPS may be entirely useless for another sortie site." Also: paths to "good visibility hilltops" take planning | qualitative | same | same, §V | Opened |
| Curiosity to MRO relay link frequency | 391 MHz return link (moved off 400 MHz to avoid CRISM interference) | Curiosity UHF (Electra) | Edwards et al., "Relay Support for the Mars Science Laboratory Mission", JPL, https://pdfs.semanticscholar.org/a277/f981c56f44ce1e25e4151e5fd08f54396965.pdf | Opened |
| Nokia / Intuitive Machines IM-2 4G/LTE on the Moon: network ran ~25 min, no call completed | 25 min | IM-2, Mar 2025 | https://www.fierce-network.com/wireless/nokias-moon-network-work | Second-hand |
| BASALT / Desert RATS / NEEMO relay hardware specs | - | analogs | not searched in time | Not verified |

Model validity (computed here from the first Fresnel zone formula r1 = sqrt(lambda d1 d2 / d), ITU-R P.526, https://www.itu.int/rec/R-REC-P.526 , not opened):

| Case | lambda | r1 at midpoint of a 100 m path |
|---|---|---|
| 391-400 MHz (Mars UHF) | 0.75 m | 4.3 m |
| 2.4 GHz (Wi-Fi) | 0.125 m | 1.8 m |

With 1.7 m antennas on a 0.5 m grid, the first Fresnel zone at UHF is larger than the antenna heights, so a "clear" geometric line still loses some signal and a "blocked" line just behind a ridge can still get through by diffraction. Geometric line of sight is the standard first-order model (Apollo 15 used obstacle-shadow prediction and found it good), but it is a yes/no simplification. Label the shadow `model`, not exact.

## 3. Choosing a relay position on a terrain grid

| Method | What it is | Source | Status |
|---|---|---|---|
| Viewshed from a DEM | Line of sight from one point to every cell; accuracy limited by DEM resolution and error (viewshed boundaries least reliable) | EPSC 2014-620, https://meetingorganizer.copernicus.org/EPSC2014/EPSC2014-620-3.pdf | Second-hand |
| Terrain-aware coverage with a relay rover placed at an optimal position for a science rover | relay-rover siting | IAC 2021, https://core.ac.uk/download/478618325.pdf | Second-hand |
| Facility-location optimization for lunar relay architectures | multiperiod facility location | IAC-23 D1.2.2, https://iafastro.directory/iac/archive/browse/IAC-23/D1/2/78194/ | Second-hand |
| Maximal covering location problem (Church & ReVelle 1974) | choose site(s) maximising covered demand | standard OR literature | Not opened |

Simplest defensible method on the 256 x 256 grid (uses the existing `lineOfSight`):
1. Relay at cell R with mast height h_r. A cell C is in contact if LOS(rover, C) OR (LOS(rover, R) AND LOS(R, C)). One relay = one more viewshed (same cost as the current `radioShadowMask`).
2. Best position: evaluate candidates only among cells with LOS to the rover, on a coarse sub-grid (e.g. every 8 m = 256 candidates), score = cells (or route cells) covered; take the maximum. This is exhaustive search, the one-site case of maximal coverage; no heuristic to defend.
3. Report covered area before/after (m², %) and the route share in shadow before/after.

## 4. Mars orbiter passes as real data

| Claim | Value | Applies to | Source | Status |
|---|---|---|---|---|
| Curiosity planning baseline: 250 Mb/sol via MRO, 75 Mb/sol via Odyssey, "assuming two passes per sol" | 2 passes/sol | Curiosity | Edwards et al. (above) | Opened |
| Relay contact for most Mars sites about once or twice a day; "about five minutes twice a day" broadband analogy | ~5 min, illustrative | MRO Electra | archived JPL page https://webarchive.library.unt.edu/web/20090813145340/http://mars.jpl.nasa.gov/mro/mission/tl_relay.html | Second-hand (page fetch returned empty) |
| Perseverance has 4-5 passes a day; example trade 2 min at 2 Mbps vs 10 min at 128 kbps | 4-5/day | Perseverance | https://spectrum.ieee.org/how-nasa-is-adapting-radios-to-a-noisier-mars | Second-hand |
| Number and length of passes vary day to day | qualitative | Mars Relay Network | https://science.nasa.gov/mars/mars-relay-network/ | Second-hand |
| Mars Express relayed Curiosity in a ~15 min session (2012) | 15 min | ESA MEX | https://esa.int/Enabling_Support/Operations/Mars_Express_sets_data_relay_record | Second-hand |
| Actual pass times for Gale on given sols | NOT FOUND as public table | - | - | Could not verify; SPICE kernels (NAIF) could compute them but that is not a quick task |

Citable figure: "two relay passes per sol" (Curiosity design baseline, opened). Pass length in minutes: only illustrative or example values, label `assumption` if used.

## Ranking: ways the relay / radio point could strengthen the data-use story

| # | Way (carries out PROPOSAL §6 point 3) | Judge impact | Build cost (existing LOS code) |
|---|---|---|---|
| 1 | Compute the relay: shadow mask with relay = rover OR (rover-relay AND relay-cell), show shadow area and route-in-shadow before/after placing it. All on the HiRISE-derived grid | Relevance: high (NASA terrain becomes the reason for a crew decision, not a backdrop). Validity: medium-high (method Apollo 15 validated; LSR-M names relay siting as the problem) | 30-45 min |
| 2 | Replace `assumption` labels with sourced heights: suit antenna 1.83 m (Apollo EVCS), rover/vehicle antenna ~2 m (LTV height per LSR-M), relay mast as a stated assumption; cite Apollo 15 Suppl. 6 on the Sources page as the validation of terrain-shadow prediction | Validity: high, Relevance: medium. Cheap credibility | 10-15 min |
| 3 | "Best spot" button: exhaustive search over ~256 candidate cells visible from the rover, maximising covered route cells | Validity: medium (defensible, exhaustive), Creativity: medium. Risk: compute time (256 viewsheds); limit to route cells to keep it fast | 30-60 min |
| 4 | One honest label line in the UI/Sources: "geometric line of sight; at 391 MHz (Curiosity-MRO UHF) the Fresnel zone is ~4 m over 100 m, so edges are approximate" | Validity: medium (shows the team knows the limit). Relevance: low-medium | 5-10 min |
| 5 | Mention that Earth contact goes through orbiters, two passes per sol for Curiosity, so the local relay is for crew-rover contact, not Earth | Relevance: medium (ties to the real Mars Relay Network). Validity: medium. Do not show pass times as real | 5-10 min |

Not verified: Apollo 17 no-LOS anecdote source; EVA-EXP-0042 full comm text; any NASA numeric loss-of-comm limit; LCRU handbook contents; BASALT/Desert RATS/NEEMO relay details; real Gale pass times; Nokia link distance.
