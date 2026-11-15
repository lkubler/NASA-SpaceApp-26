# Which data could drive decisions (researcher, Sun 15.11. ~09:50)

Builds on `docs/data-use.md`, `research/data-science.md`, `research/risks.md`, `research/sources-validity.md`; facts already there are cited, not repeated. V = opened by me this session. S = second-hand (search summary or another research file). U = not verified.
Out of scope (other researchers): effort-optimal routing, radio relay.

## 1. What "strong data use" means to judges

| Item | Value | Source | V/S |
|---|---|---|---|
| Relevance criterion | "NASA data is a core component, not a superficial addition. 5 = ... NASA data is integral and drives the innovation." | `docs/rules-2026.md` l.29 | V (repo) |
| Best Use of Data award | "makes space data accessible or leverages it for a unique application." | `docs/rules-2026.md` l.40 | V (repo) |
| 2025 winner: Resonant Exoplanets (USA) | AI system "ingests large sets of telescope and satellite data, including spectra from missions like the James Webb Space Telescope" and scans them for exoplanets / biosignatures. Data is the input the product's output is computed from. | https://www.nasa.gov/learning-resources/stem-engagement-at-nasa/nasa-announces-2025-international-space-apps-challenge-global-winners/ | V |
| 2023 winner: Storm Prophet (Ukraine), challenge "Develop the Oracle of DSCOVR" | "created a data model to accurately predict geomagnetic storm levels" (LSTM). Dataset not named in article; DSCOVR data implied by challenge title. | https://science.nasa.gov/directorates/smd/2023-nasa-international-space-apps-challenge-announces-10-global-winners | V (dataset name U) |
| 2022 winner: Starflock (Cleveland, USA) | Article names team only; data and method not stated. | https://www.earthdata.nasa.gov/news/nasa-announces-winners-2022-global-space-apps-challenge | V (content U) |
| 2021 Cambridge Asteroids, 2020 Monsoon Overflow, 2024 GaamaRamma | Names only, from search summary; project data not checked. | https://www.earthdata.nasa.gov/news/spaceapps-2021-winners , https://www.earthdata.nasa.gov/news/2020-space-apps-challenge-winners | S |

Pattern in the two winners whose descriptions I read: the NASA data is the input that a computed output (a prediction, a detection) is derived from. Nothing in them is display-only.

## 2. Data the app already has: what citable limit would let it decide something

### 2a. HiRISE 1 m DTM as an independent slope check (files already in `app/public/data/murray/dtm_*`, not loaded)
| Claim | Value | Source | V/S |
|---|---|---|---|
| Post spacing | "1-2 m" (about 4x the 0.25-0.5 m image pixel) | https://www.uahirise.org/dtm/about.php | V |
| Vertical precision | "in the tens of centimeters"; no accuracy number on the page; tied to MOLA | same | V |
| 25 cm vertical precision, citing Kirk et al. 2008 (doi 10.1029/2007JE003000) | 0.25 m | MarsSI wiki https://marssi.univ-lyon1.fr/wiki/+show/+1b771c73793d4e01ae5dc2035a1f0c49/HiRISE ; USGS record https://pubs.usgs.gov/publication/70034779 | S (paper not read) |
| Known artifacts | boxes 0.5-1 m offset, CCD seams, faceted and interpolated areas; "look for such artifacts in a terrain shaded relief map before using" | uahirise about page | V |
| Slope error at 1 m spacing | Not stated anywhere I read. Our arithmetic: 0.25 m height error over 1-2 m baseline is up to ~7-14 deg slope noise per cell, so a per-cell 20 deg test on the raw DTM is noisy; over a 5 m baseline ~3 deg. | arithmetic (C) | U |
| Mission use | HiRISE DTM mosaic was the basemap for Mars 2020 Terrain Relative Navigation hazard mapping (landing, not roving) | https://www.usgs.gov/data/mars-2020-terrain-relative-navigation-hirise-dtm-mosaic | S |
| Rover traverse planning with HiRISE DTM | Not found in a NASA document this session. Planetary Society guide says DTMs are preferred for mapping the Curiosity traverse | https://www.planetary.org/articles/0115-hirise-image-coverage-Curiosity | S; NASA traverse-planning use U |
| Already measured in repo | over 20 deg: 18.1 % mesh vs 18.7 % DTM; mesh ~20 % smoother; alignment about 2 m error | `research/walk-terrain.md`, `scripts/preprocess/README.md` | V (repo) |

### 2b. Radiation
| Claim | Value | Source | V/S |
|---|---|---|---|
| Career limit | "total career effective radiation dose due to space flight radiation exposure shall be less than 600 mSv", all ages and sexes (NASA-STD-3001 Vol 1 Rev B [V1 4029 area]) | NASA Technical Brief OCHMO-TB-020 Rev E, https://www.nasa.gov/wp-content/uploads/2023/03/radiation-protection-technical-brief-ochmo.pdf | V (pdftotext) |
| SPE short-term limit | 250 mSv effective dose per event [V1 4031] | same | V |
| EVA rule | "Real-time alert dosimetry also provides a very high level of protection for EVAs if termination occurs within 2 hours and there is access to shielding." | same | V |
| Shelter | "timely reporting to alert crew to seek shelter"; early warning "allows for crew to safe vehicle and configure shelter" | same | V |
| SPE warning time | "may be as short as 30 minutes" | DRA 5.0 via `research/risks.md` | S (V there) |
| Gale dose | 0.67 mSv/day = ~0.028 mSv/h; 6 h EVA ~0.17 mSv (~0.03 % of 600 mSv) | `research/data-science.md` §4 | S (V there) |
| Sept 2017 SPE at Gale | dose rate 2-3x GCR, peak ~12 h, decline over 36 h | Zeitlin et al. 2018, https://elib.dlr.de/120101/ via data-science.md | S (V there) |
| Raw RAD data | PDS PPI https://pds-ppi.igpp.ucla.edu/search/?sc=MSL&i=RAD ; file access not tested | `research/data.md` | U |

Can dose be a go / no-go line? Not as a cumulative-dose line: a whole EVA is ~0.03 % of the career limit and far below 250 mSv, so it would never bind (same problem as the distance line). The citable decision is time-based: the brief's "termination within 2 hours with access to shielding" and DRA 5.0's 30 min warning. Both are a time-to-rover number, which the app already computes from the return route. That would make the existing radiation row decide something (U whether the team wants it). Values needed: 2 typed numbers (2 h, 30 min); no data file.

### 2c. Temperature
| Claim | Value | Source | V/S |
|---|---|---|---|
| xEMU thermal environment requirement | 93 K (-292 F) cold to 378 K (+220 F) hot; PSR case 40 K for 2 h | NTRS 20240000686, https://ntrs.nasa.gov/api/citations/20240000686/downloads/xEMU%20Thermal%20Vac%20Overview%20Final%202%20-2024-75.pdf | S (search summary; PDF not opened) |
| SxEMU test bounds | 116 K (-250 F) to 355 K (180 F) | NTRS 20240000743 | S |
| Gale REMS sol 1440 air temperature | ~206 K at 03-05 LMST, ~273 K at ~14 LMST | `research/data-science.md` §2 | S (V there) |
| Mars suit thermal limit | none found; lunar requirements only | - | U |
| Cold effect on battery / heater use in a NASA EVA document | not found | - | U |

Gale air (206-273 K) lies inside the lunar xEMU envelope (93-378 K), so a temperature limit line would always pass (S). Temperature cannot honestly drive a go / no-go with what I found. Note: Mars has an atmosphere (convective loss) that lunar envelopes ignore (C).

### 2d. Dust
| Claim | Value | Source | V/S |
|---|---|---|---|
| 2018 storm at Gale | Mastcam 880 nm tau 8.5, UV -97 %, diurnal air temperature range -30 K, ~100 sols; Curiosity (RTG) unaffected | Guzewich 2019, NTRS https://ntrs.nasa.gov/citations/20190001691 via sources-validity.md | S (V there) |
| Seasonal tau | clear ~0.4-0.7, dust season ~1-2 | `research/sources-validity.md` §C | partly U (figure-read) |
| Solar power | direct beam e^(-tau/cos z), model only; DRA 5.0: storms can cut solar power 1-2 months | sources-validity.md, risks.md | S / C |
| Tau data | Lemmon et al. record https://arxiv.org/pdf/2309.07378 ; archive in PDS Atmospheres (not opened) | sources-validity.md | S |
| NASA EVA rule on visibility or dust | none found | - | U |

The app's suit runs on battery and its rover/home is not described as solar (`docs/data-use.md`), so tau changes no existing number. No citable EVA limit found. Dust cannot drive a decision without a new rule.

### 2e. Daylight
| Claim | Value | Source | V/S |
|---|---|---|---|
| Gale sol 1440 (Ls ~210) | sunrise ~LTST 5.9 h, sunset ~LTST 18.3 h; at 09:00 LMST sun +53.7 deg | `research/data-science.md` §3 (Mars24 run, algorithm from GISS page via Wayback) | S (V there) |
| Mars24 algorithm | https://www.giss.nasa.gov/tools/mars24/help/algorithm.html (timed out earlier; Wayback copy read) | data-science.md | S |
| NASA rule that EVA happens in daylight | none found. Lunar statement only: "Thermal control performance in dark shadows will also affect EVA duration" | `research/risks.md` row 10 | U for a daylight rule |

Daylight as a line: start 09:00 + planned excursion (6 h max 8 h, CON §4.1.4 in `values.js`) ends 15:00-17:00, before sunset ~18:3x LMST (conversion LTST->LMST: EOT +0.61 h, so sunset ~17.7 LMST; our arithmetic, C). An 8 h excursion at 09:00 ends 17:00, ~40 min before sunset. It is computable from typed values (sunset time for sol 1440), but the "EVA in daylight" limit itself has no NASA source I found: label assumption.

## 3. Where the data is and how much is needed
| Item | Location | Format / size | Enough? |
|---|---|---|---|
| HiRISE DTM crop | already in `app/public/data/murray/dtm_*` + `murray.json` `transform_walk_to_dtm` (repo; part of ~8 MB unused) | binary grids, JSON transform | Yes, no download |
| HiRISE source | https://www.uahirise.org/dtm/ , product `DTEEC_040770_1755_039280_1755_U01` | PDS IMG | not needed |
| Radiation limits | OCHMO-TB-020 Rev E PDF (above) | 3 typed values: 600 mSv, 250 mSv/event, 2 h termination | Yes |
| RAD dose rate | already in `values.js` | 1 value | Yes |
| Sept 2017 SPE | Zeitlin 2018 abstract | 2 typed values (2-3x, 12 h) | Yes |
| REMS | already in `values.js` (13 points); PDS https://atmos.nmsu.edu/PDS/data/mslrem_1001/ | text tables | Yes |
| Suit thermal envelope | NTRS 20240000686 | 2 values (lunar, S) | Yes but never binds |
| Tau | sources-validity.md table; Lemmon arXiv | 1-4 typed values | Yes, but no decision to feed |
| Sunset sol 1440 | data-science.md Mars24 run | 1 typed value | Yes |

## 4. Ranking (at most 6) — impact on Relevance + Validity vs build cost in an existing Go / no-go list and helmet display

| # | Candidate | Makes existing displayed data decide? | Impact (R+V) | Build cost (C, U) | Citable limit |
|---|---|---|---|---|---|
| 1 | HiRISE DTM slope along the planned route as a second Go line (max DTM slope on route vs 20 deg, smoothed over >= 5 m because of tens-of-cm precision) | Yes: HiRISE moves from offline-only to a decision; addresses "one dataset drives everything" | High: second independent NASA dataset in the decision; Validity via cross-check | ~45-90 min (load grid, sample route through existing transform, one rule line); risk: 2 m alignment error, DTM noise | 20 deg (CON), precision "tens of cm" (V) |
| 2 | Radiation as time-to-shelter: return time to rover vs 2 h (NASA brief) and optionally 30 min (DRA 5.0) | Yes: radiation row stops being decoration; uses existing return-route time | Medium-high: NASA standard text, honest framing (dose itself never binds) | ~20-30 min (one rule line, two typed values) | 2 h termination with access to shielding (V); 30 min warning (S) |
| 3 | Daylight: excursion end vs sunset for sol 1440 (Mars24) | Partly: uses existing start time and excursion length; Mars24 is a NASA GISS tool | Medium; limit is assumption | ~15-20 min | No NASA daylight rule found (U) |
| 4 | Show dose vs 600 mSv career limit as a percentage | Context only; will never fail | Low-medium (Validity: correct scale) | ~10 min | 600 mSv (V) |
| 5 | Temperature vs suit envelope | Would never fail (206-273 K inside 93-378 K); lunar values | Low | ~15 min | lunar xEMU (S) |
| 6 | Dust tau | No existing number depends on it; no EVA rule | Low | ~20+ min | none (U) |

Not verified: Kirk et al. 25 cm figure (second-hand); any NASA document using HiRISE DTMs for MSL/M2020 rover traverse (only landing hazard use found); xEMU PDFs not opened; any Mars suit thermal limit; any NASA EVA daylight or visibility rule; cold effect on suit battery; RAD raw file access; data used by the 2022/2021/2020/2024 Best Use of Data winners. Build-cost minutes are estimates without reading `app/src`.
