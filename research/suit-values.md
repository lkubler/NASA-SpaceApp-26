# Suit and astronaut values for the walk-home calculation

Researcher, Sat 14.11. (BUILD). Does not repeat `research/science.md`, `research/sources-validity.md`, `research/risks.md`; the app defaults are in `app/src/model/reserve.js`.
**Src**: V = I opened the source and read the number myself today. S = search snippet or wiki only (second-hand). C = our arithmetic from V numbers.
Conversions: 1 BTU/h = 0.2931 W; 1 kcal/h = 1.163 W; 1 lb = 0.4536 kg; Mars g = 3.71 m/s².

**Mars values are scarce.** No suit has walked on Mars. The only Mars-specific numbers are NASA JSC sizing studies from 2026 (marked "Mars"). Everything else is lunar (Apollo, Artemis xEVA) or ISS. The Artemis ConOps says it plainly: "Development of the mEMU and associated walk back ranges are forward work" (Mars, section 4.2.1.3.1.2).

## Sources (short names used below)

| Key | Source | URL |
|---|---|---|
| OGI | Ogilvie, Swartout et al., "Mars Spacesuit Mass Requirements", NASA JSC, ICES-2026-127 (slides) | https://ntrs.nasa.gov/api/citations/20260005410/downloads/Mars_Mass_ICES2026_Presentation_Final.pdf |
| PLAN | Ogilvie, Chullen et al., "Mars Portable Life Support System Status and Plan", ICES-2026-126 (paper) | https://ntrs.nasa.gov/api/citations/20260003024/downloads/Final_ICES2026_Mars_PLSS_Plan.pdf |
| SCH | Oliver et al. (Amentum/NASA), "Mars Exploration PLSS Schematic Study: Architecture Down-Selection", ICES 2026 paper 158 (slides) | https://ntrs.nasa.gov/api/citations/20260005204/downloads/ICES_Mars_PLSS_Presentation_2026_1.pdf |
| CON | NASA, "Exploration EVA System Concept of Operations", EVA-EXP-0042 Rev B, 2020 | https://www.nasa.gov/wp-content/uploads/2017/02/eva-exp-0042_xeva_system_con_ops_rev_b_final_dtd_10192020_ref_doc.pdf |
| CAR | Carson, "Apollo Portable Life Support System Performance Report", NASA MSC, 1972 | https://ntrs.nasa.gov/api/citations/19720019460/downloads/19720019460.pdf |
| WH75 | Waligora and Horrigan, "Metabolism and Heat Dissipation During Apollo EVA Periods", NASA SP-368 ch. 4, 1975 | https://ntrs.nasa.gov/api/citations/19760005584/downloads/19760005584.pdf |
| WH-SKY | Waligora and Horrigan, "Metabolic Cost of Extravehicular Activities" (Gemini, Apollo, Skylab), NTRS 19750006325 | https://ntrs.nasa.gov/api/citations/19750006325/downloads/19750006325.pdf |
| EVR | Dunn et al., EVA Injury Evidence Report, NASA HRP 2021 (cites Norcross et al. 2009 Walkback Test) | https://ntrs.nasa.gov/api/citations/20220004017/downloads/2021%20EVA%20Injury%20Evidence%20Report%20Final.docx.pdf |
| GER | Gernhardt et al., "EVA Operations", Principles of Clinical Medicine for Space Flight ch. 5.4, 2013 | https://nasa.gov/wp-content/uploads/2023/03/gernhardt-eva-ops-chp-5.4-2013.pdf |
| AX | Axiom Space, AxEMU Reddit AMA news post, 2026 | https://axiomspace.com/news/axiom-space-celebrates-national-moon-day-hosts-reddit-ama-on-axemu-spacesuit |
| BELL | Bellcomm memo on Apollo 15 EVA capability (ALSJ copy; the nasa.gov PDF returned 404 today) | https://www.nasa.gov/wp-content/uploads/static/history/alsj/19790073512_1979073512.pdf |
| WIKI | Wikipedia, "Primary life support system" | https://en.wikipedia.org/wiki/Primary_life_support_system |

## 1. Suit mass

Suit = pressure garment (PGS) + backpack (PLSS). Mars weight = mass x 3.71 m/s².

| Suit | Earth mass | Mars weight | Applies to | Source | Src |
|---|---|---|---|---|---|
| Apollo A7L/A7LB + PLSS | 170 lbm = 77 kg (PGS 60, PLSS 110 lbm) | 283 N (63 lbf) | Moon | OGI slide 2 | V |
| Apollo suit (other count, probably incl. OPS) | 194 lbm = 89 kg | 330 N | Moon | PLAN | V |
| Apollo PLSS alone / OPS alone (Apollo 9 test) | 84 lb = 38 kg / 41 lb = 19 kg | – | Moon | WIKI | S |
| Shuttle/ISS EMU | 251 lbm = 114 kg | 418 N | ISS (no walking) | OGI slide 2 | V |
| Orlan | 231 lbm = 105 kg | 385 N | ISS | OGI slide 2 | V |
| xEMU (NASA reference design for Artemis) | 376 lbm = 170 kg (PGS 167, PLSS 209 lbm) | 627 N | Moon | OGI slides 2, 13 | V |
| xEMU (other count) | 391 lbm = 177 kg | 657 N | Moon | PLAN | V |
| xEMU PLSS breakdown | 209 lbm dry + 16.3 lbm consumables + 7.6 lbm display/control unit | – | Moon | OGI slide 3 | V |
| Axiom AxEMU (Artemis III suit) | **no official mass found**; web values 55-136 kg conflict | – | Moon | search only | S, unusable |
| **Mars suit (MxEMU) maximum** | **229 lbm = 104 kg** (PLSS 137 lbm = 62 kg, PGS 92 lbm = 42 kg) | **386 N** (C) | **Mars** | OGI slides 8, 12; PLAN | V |
| Mars PLSS options from schematic study, 8 h EVA | 87-153 kg (LOX 87-93, GOX 111-153 kg) | – | Mars | SCH slides 10-12 | V |
| Mars PLSS options, 2 h EVA | 48-73 kg | – | Mars | SCH slides 10-12 | V |

Notes:
- The 104 kg Mars limit is what a 5th-percentile female (49 kg, VO2max 36 ml/kg/min) can carry on Mars (OGI slide 8). It is 40 % lighter than xEMU. Mars "equivalent weight" with an 82 kg human: Apollo 583 N, xEMU 927 N (OGI slide 2, V).
- The schematic study shows an 8 h Mars PLSS is heavier than the 62 kg PLSS allocation; only short EVAs fit. NASA lists "reduced EVA time" and restricting distance from the habitat as ways to save suit mass (PLAN, OGI slide 12, V).
- Pressure offload: the pressurised suit carries about **48 lbf (214 N)** of its own weight off the shoulders while walking (OGI slide 7, V; Earth test).
- Whether suit mass should enter the walking-cost equation: Gernhardt 2008 found no effect below 4 km/h (already in sources-validity.md); keep as is.

## 2. Consumables

### 2a. Capacity and duration

| Suit | Capacity | Duration at a given rate | Applies to | Source | Src |
|---|---|---|---|---|---|
| Apollo PLSS, Apollo 9-14 | total metabolic heat **1200 kcal = 5.02 MJ** | 3 h at 400 kcal/h (465 W) or 4 h at 300 kcal/h (349 W); design 4 h at 1200 BTU/h | Moon | WH75 (PLSS section); CAR p.50 | V |
| Apollo PLSS (-7), Apollo 15-17 | total metabolic heat **1800 kcal = 7.53 MJ** | **7 h at 250 kcal/h (291 W)** or **8 h at 225 kcal/h (262 W)** | Moon | WH75 (PLSS section) | V |
| Apollo -7 detail | O2 at 1430 psi, LiOH 3.12 lb, cooling water 11.5 lb (5.2 L), battery 390 Wh | – | Moon | WIKI (Apollo 11-14: 1020 psi, 3.0 lb LiOH, 8.5 lb water, 279 Wh) | S |
| Apollo emergency (OPS) | – | **0.5 h** open purge (min.); **1.25 h** at low flow when cooled by partner's backpack (BSLSS) | Moon | CAR p.50, 66 | V |
| Apollo OPS flow | 3.63 kg/h O2 for 30 min | – | Moon | PLAN | V |
| Shuttle/ISS EMU | – | 7 h baseline (PLAN); ISS EVAs planned 6.5 h, often > 7 h, sometimes > 8 h (CON) | ISS | PLAN; CON section 3 | V |
| Shuttle/ISS EMU emergency (SOP) | – | 30 min | ISS | search only | S |
| xEMU | – | **up to 8 h (6 ± 2 h)** + **1 h** secondary O2 | Moon | CON sections 3, 4.2.1.3.1 | V |
| AxEMU | – | up to 8 h | Moon | AX | V |
| **Mars PLSS design point** | primary avg **350 W (1194 BTU/h)**, primary max **530 W (1810 BTU/h)** | primary 2, 4, 6 or 8 h; secondary **0.5 h** (for 2 h EVA) or **1 h** (4-8 h EVA) at 295 W avg / 350 W max | **Mars** | SCH slides 7-8 | V |
| Mars PLSS energy budget | 350 W x 8 h = **10.1 MJ** (C); secondary 350 W x 1 h = 1.26 MJ (C) | – | Mars | SCH (C) | C |

The app's current `capacityKJ` (8 h x 1200 BTU/h = 10.1 MJ) equals the Mars PLSS design point above. Apollo 15-17 actually carried 7.5 MJ.

### 2b. Use rate per hour (measured)

| Quantity | Apollo average | Walk-back pace (6.3 km/h, lunar g) | Applies to | Source | Src |
|---|---|---|---|---|---|
| Metabolic rate | 932.8 BTU/h (273 W) | 2374 BTU/h (696 W) | Moon / lunar-g lab | EVR Table 1 (Norcross 2009) | V |
| Oxygen | 0.15 lb/h (68 g/h) | 0.40 lb/h (181 g/h) | same | EVR Table 1 | V |
| Cooling water (sublimator) | 0.98 lb/h (0.44 kg/h) | 3.1 lb/h (1.4 kg/h) | same | EVR Table 1 | V |
| Energy | 233 kcal/h | 599 kcal/h; 944 kcal for 10 km in 96 min | same | EVR Table 1 | V |
| Cooling ceiling of Apollo suit and EMU | 2000 BTU/h (586 W); walking faster than ~3 mph exceeds it | | Moon / ISS | EVR p.32 | V |

### 2c. Which consumable limits the excursion

| Finding | Source | Src |
|---|---|---|
| O2, feedwater and LiOH use scale with metabolic rate; battery use scales with time. "Metabolic rate ... is the major parameter affecting PLSS duration." | CAR p.49 | V |
| No single consumable always limits. Lowest remaining at end of EVA (hours left): Apollo 11: LiOH 2.3 h; Apollo 12 EVA-2: **oxygen** 1.5-1.7 h; Apollo 14 EVA-1: **electric power** 0.43-0.72 h, Mitchell O2 0.64 h; Apollo 14 EVA-2: Mitchell feedwater 0.96 h | CAR Tables 4.2-4.4 | V |
| Apollo 14-17: 6 EVAs ended with < 10 % usable O2; 7 with ≤ 12 % power (one < 4 %); 4 with ≤ 11 % feedwater; 2 crew with 4 % and 2 % LiOH | EVR p.29 | V |
| Apollo 15 EVA-1 was time-limited (6 h), not consumables-limited | BELL | S |
| Mars: suit cannot vent to vacuum (0.15 psia CO2 atmosphere), so Apollo/ISS cooling (sublimator, SWME) and RCA CO2 removal do not work unmodified | SCH slide 3 | V |

Practical reading: treat the suit as one energy budget (MJ) for O2, water and CO2, plus a time budget for the battery. That is how NASA sizes it (fixed metabolic rate x EVA time, SCH slide 8).

## 3. Metabolic work rates

| Value | Number | Applies to | Source | Src |
|---|---|---|---|---|
| Apollo lunar surface average, all 14 EVAs | **234 kcal/h = 272 W** (range of crew averages 198-302 kcal/h) | Moon | WH-SKY Table II | V |
| Apollo by activity | experiment setup 244, geology station 244, overhead (egress, offload, ingress) 270, rover riding 123 kcal/h | Moon | WH-SKY Table II | V |
| Apollo 14 walking traverses | **2.4 km/h at 300 kcal/h (349 W)** over 2.9 km; poor speed-rate correlation (crew kept a comfortable effort) | Moon | WH-SKY p.780 | V |
| Apollo discrete peaks | 350-450 kcal/h (407-523 W): steep uphill walking, carrying the experiment pallet, drilling | Moon | WH-SKY p.778 | V |
| Apollo average / peak, NASA summary | ~1000 BTU/h (293 W) average, peaks up to 2200 BTU/h (645 W) | Moon | GER p.1 | V |
| Apollo cooling garment | suppresses sweating up to 400 kcal/h (465 W); sustained up to 500 kcal/h (582 W) | Moon | WH75 (PLSS section) | V |
| Apollo design point | 1200 BTU/h (352 W) average | Moon | CAR p.50 | V |
| ISS/EMU requirement | 1000 BTU/h (293 W) average | ISS | OGI slide 4 | V |
| **Artemis and Mars sizing average** | **1200 BTU/h (352 W)** | Moon, Mars | OGI slide 4; SCH slide 8 (350 W) | V |
| **Walk-back, average crew member** | **1700 BTU/h (498 W)** | Mars sizing | OGI slide 9 | V |
| **Walk-back, 95th-percentile mass** | **2300 BTU/h (674 W)** | Mars sizing | OGI slide 9 | V |
| Mars PLSS max | 530 W (1810 BTU/h) | Mars | SCH slide 8 | V |
| Fitness rule | VO2max ≥ **36 ml/kg/min** at EVA (flight rule); 43-49 at launch to allow 15-25 % deconditioning | all | OGI slides 6-7 | V |
| Sustainable fraction | ≤ 35 % VO2max over 8 h (50 % if aerobically trained); ~43 % expected for EVA | all | OGI slide 6 | V |
| Walk-back test exertion | 51 % VO2peak (45-61 %), 2.0 L/min O2 | lunar-g lab | EVR Table 1 | V |
| Suited walking at Mars g | "Hits VO2max at 3.5 mph on Mars" (walkback-study chart, Mars offload) | Mars-g lab | OGI slide 5 | V |
| Suit penalty | +14 ml/kg/min VO2 over unsuited walking | lunar-g lab | OGI slide 7 | V |
| Converter | BTU/h = (0.961 + 0.275 RER) x VO2 (ml/kg/min) x mass (kg); e.g. 82 kg at 20 ml/kg/min = 1955 BTU/h | all | OGI slide 6 | V |

## 4. Astronaut body mass and carried load

| Value | Number | Applies to | Source | Src |
|---|---|---|---|---|
| Male body mass, percentiles 1/5/25/50/75/95/99 | 55 / 63 / 74 / **82** / 90 / **102** / 110 kg | NASA sizing | OGI slide 6 | V |
| Female body mass, same percentiles | 43 / **49** / 58 / 65 / 71 / 80 / 87 kg | NASA sizing | OGI slide 6 | V |
| Design range now | 1st-99th percentile crew mass (43-110 kg) | Artemis | OGI slide 7; AX ("1st to 99th percentile") | V |
| Design range possibly for Mars | 5th-95th percentile (49-102 kg), custom-sized suits | Mars | OGI slide 7 | V |
| VO2max, age 30-39, percentiles 5/50/95 | male 31 / 42 / 54; female 26 / 35 / 47 ml/kg/min | general population | OGI slide 6 | V |
| Average crew member used in sizing | 180 lbm = 82 kg | Mars sizing | OGI slide 2 | V |
| **Tool and sample carry mass** | **50 lbm = 23 kg** | Mars sizing | OGI slide 7 | V |
| Carry limit | NIOSH 51 lbf (≈ 23 kg) for lifting | Earth rule used for Mars | OGI slide 7 | V |
| Mars system mass example | 104 kg suit + 82 kg crew + 23 kg carry = 209 kg → 775 N on Mars, minus 214 N offload = **561 N felt** (C) | Mars | OGI formula slide 8 | C |
| Tool transport | some tools on suit/harness; larger tools and bags in a pulled/pushed carrier | Moon | CON 4.2.4.2 | V |
| Fall recovery | significant problems with backpacks of 70 and 100 kg (unpressurised test) | Mars-g lab | OGI slide 5 | V |

## 5. Reserve and walk-back rules

| Rule | Value | Applies to | Source | Src |
|---|---|---|---|---|
| Walk-back sizes the backup system and the maximum distance | walk-back of **30 min or 1 h at 2.2 mph** → radius **1.8 km or 3.5 km**; 30 min "may be preferred so the design will close" | Mars | OGI slide 9 | V |
| Apollo walk-back speed | 2.2 mph (3.5 km/h) if < 1 h; 1.7 mph (2.7 km/h) if > 1 h | Moon | OGI slide 9 | V |
| Artemis walking range | ~2 km/h pace, **2 km** radial from lander, 16 km total per EVA; includes **1 h secondary O2**; failures not stacked | Moon | CON 4.2.1.3.1 | V |
| Artemis unpressurised rover | stay within a **5 h walk-back** (~10 km at 2 km/h), TBR | Moon | CON 4.2.1.3.1.1 | V |
| Artemis single pressurised rover | walk-back up to 8 h (16 km), conservative 6 h (12 km) | Moon | CON 4.2.1.3.1.1 | V |
| Consumables "bingo" | reaching a consumables limit ends work and starts the walk back | Moon | CON 7.2.9 | V |
| Mars secondary life support | sized for 1 h (4-8 h EVA) or 0.5 h (2 h EVA) | Mars | SCH slide 7 | V |
| Apollo backup | OPS 0.5 h; 1.25 h with partner cooling (BSLSS) | Moon | CAR p.66 | V |
| Apollo 15 rover walk-back envelope | consumables left must cover a walk to the LM at **3.3 km/h and 1440 BTU/h** (= 1200 BTU/h + 20 % pad) | Moon | BELL (via search snippet; also in sources-validity.md as S) | S |
| Mars | "Development of the mEMU and associated walk back ranges are forward work" | Mars | CON 4.2.1.3.1.2 | V |

Caution for the app: the "20 % reserve" in `PROPOSAL.md` and `reserve.js` traces to the Bellcomm 1440 BTU/h figure, which is a **20 % pad on the walk-back metabolic rate**, not a rule to keep 20 % of the suit's consumables. I did not open that memo (the link is 404 now). The rules I could verify are written as **time**: 30 min or 1 h of walk-back, 1 h secondary O2.

## 6. Recommended default values for the demo

| Parameter | Default | Range or options | Basis |
|---|---|---|---|
| Body mass | 82 kg | 49-102 kg (5th female to 95th male); 43-110 kg for 1st-99th | OGI |
| Suit mass (Earth) | 104 kg (Mars target) | Apollo 77, Mars 104, xEMU 170 kg | OGI |
| Carried load | 23 kg | 0-23 kg | OGI, NIOSH |
| Gravity | 3.71 m/s² | fixed | – |
| Pressure offload while walking | 214 N (48 lbf) | fixed | OGI |
| Average work rate (planning) | 350 W (1200 BTU/h) | 270 W (Apollo measured) to 350 W | SCH, WH-SKY |
| Walk-back work rate | 500 W (1700 BTU/h) | 675 W (2300 BTU/h) for a large crew member | OGI |
| Work-rate ceiling | 530 W (Mars PLSS max) | 586 W cooling limit of Apollo/EMU | SCH, EVR |
| Primary suit budget | 10.1 MJ (350 W x 8 h) | Apollo 15-17: 7.5 MJ; Mars 2/4/6 h options = 2.5/5.0/7.6 MJ (C) | SCH, WH75 |
| EVA length | 6 h | 4-8 h | CON |
| Secondary (emergency) O2 | 1 h | Apollo 0.5 h | CON, SCH |
| Walk-back speed | 3.5 km/h (2.2 mph) | 2 km/h (Artemis), 2.7 km/h (Apollo, > 1 h) | OGI, CON |
| Walk-back time rule | 30 min | 30 min or 1 h | OGI |
| VO2max | 36 ml/kg/min | 36-49 | OGI |
| Sustainable effort | 35 % VO2max | 35-50 % | OGI |
| Suit penalty | +14 ml/kg/min | fixed | OGI |

## 7. Sensible for a visitor to change
- **Body mass** (49-102 kg): changes walking cost and, through VO2max x mass, the safe work rate.
- **Carried load** (0-23 kg): samples picked up on the way make the walk back heavier.
- **Suit** (Apollo 77 kg / Mars target 104 kg / xEMU 170 kg): shows why NASA says Mars needs a lighter suit. Pair each suit with its own budget (Apollo 7.5 MJ; Mars and xEMU 8 h at 350 W).
- **Fitness** (VO2max 36-49 ml/kg/min): sets the work-rate ceiling.
- **EVA length** (4-8 h): NASA's own trade between suit mass and time outside.
- **Walk-back rule** (30 min or 1 h): the two NASA sizing cases.
Keep fixed: gravity, pressure offload, suit penalty, unit conversions, cooling ceiling.

## 8. Not verified / not found
- AxEMU mass: no official number. Web values (55-136 kg) conflict; do not use.
- Exact O2 mass, battery Ah and water mass for xEMU and EMU: not found in sources I could open. The Apollo -7 detail (1430 psi, 3.12 lb LiOH, 11.5 lb water, 390 Wh) is Wikipedia only. EMU 8.5 h incl. 30 min SOP: Wikipedia only.
- Bellcomm Apollo 15 memo (3.3 km/h, 1440 BTU/h, 20 % pad): nasa.gov PDF returned 404 today; snippet only.
- No measured suited walking cost on a Mars-gravity slope (also stated in science.md). OGI slide 5 shows a chart only ("hits VO2max at 3.5 mph on Mars").
- Apollo suit mass differs between two NASA papers by the same lead author (77 vs 89 kg; xEMU 170 vs 177 kg). Likely different counting (OPS, consumables); not resolved.
