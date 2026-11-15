# Effort-aware route planning (least suit use instead of shortest)

Researcher, Sun 15.11. 09:50-10:05. Builds on `research/sources-validity.md` (Pandolf/Santee form, SEXTANT, Gilkey 2011 field test, Marquez model), `research/science.md` (Johnson 2009 abstract, KCL 0.38 g study) and `research/suit-values.md` (Mars PLSS 350 W, Norcross O2 rates, CAR p.49). Those are not repeated.
Legend: **O** = I opened the source in this session; **2** = second-hand (search summary or earlier research file); **C** = my calculation; **U** = not verified.

## 1. Published effort-optimal traverse planning

| Work | Cost minimised | Terrain data | Finding | Source | O/2 |
|---|---|---|---|---|---|
| SEXTANT (Johnson, Newman, Waldie, Hoffman, SAE 2009-01-2562; Johnson MIT S.M. 2010) | User picks one of: path distance, EVA traversal time, or explorer metabolic energy (rover: power) | DEM; resolution not found in abstracts | No published "energy saved vs shortest route" number found | https://saemobilus.sae.org/papers/eva-mission-planning-tool-based-metabolic-cost-optimization-2009-01-2562 ; https://dspace.mit.edu/handle/1721.1/59560 | 2 (abstracts via search) |
| SEXTANT field test (Gilkey et al. ICES 2011) | — | MDRS Utah | Real time and energy significantly above prediction; distance not different | https://dspace.mit.edu/handle/1721.1/81410 | 2 (already in sources-validity.md) |
| NASA JSC Crew State and Risk Model, traverse component (Kim, Hoffmann, Estep, Marshall-Goebel, Buckland, IEEE EMBC 2024). "Development supported by the NASA Mars Campaign Office." | Not a router: estimates metabolic workload of a given traverse. Uses the field Pandolf equation MP = 1.5W + 2.0(W+L)(L/W)^2 + eta(W+L)(1.5V^2 + 0.35VG) with the Santee correction CF = eta[G(W+L)V/3.5 - (W+L)(G+6)^2/W + (25 - V^2)] and a delay factor | GPS track, JSC Rock Yard (craters, dunes, hill, rock field); 4 subjects with K5 metabolic analyser, up to 20 min | Says "decision support tools for planning EVA traverses utilize path information, metabolic expenditure"; field-tuned model beats the lab one; Lunar South Pole sites next | https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf | **O** (pdftotext) |
| Norheim MIT PhD 2018 (pextant, BASALT) | High-resolution rough terrain path planning | High-res DEM | — | in `research/science.md` | 2 |
| Apollo traverse planning | Pre-planned from orbital imagery; speed derated for slope/load | — | No energy-optimal routing found | in sources-validity.md / science.md | 2 |

**Not found (U):** any published number for how much energy a metabolic-optimal astronaut route saves against the shortest route. Johnson 2010 thesis is the likeliest place; full text not read.

## 2. Which metabolic model

| Claim | Applies to | Source | O/2 |
|---|---|---|---|
| NASA JSC uses Pandolf + Santee correction (CF) for traverse workload; the Santee term is the downhill fix | EVA traverse workload (Earth field data) | Kim 2024 above | **O** |
| Plain Pandolf grade term is linear; downhill it can go to negative cost around -10 % grade | Earth walking | https://en.wikipedia.org/wiki/Pandolf_equation | 2 |
| Santee correction "performed best", bias -13 +/- 87 W, RMSE 99 W; authors suggest Pandolf + Santee correction | Military load carriage incl. grades | https://academic.oup.com/milmed/article/183/9-10/e357/5025891 | 2 (search summary) |
| Earlier equations underestimate at slow speeds, steep downhill, heavy loads; Looney 2019 "LCDA graded walking" equation covers level, uphill, downhill | Military load carriage | Looney et al., MSSE 2022 54(4):646-654, https://pmc.ncbi.nlm.nih.gov/articles/PMC8919998 (cites Looney 2019 MSSE) | **O** (that it cites/uses Looney 2019); error figures 2 |
| Minetti 2002: walking cost measured -0.45 to +0.45 gradient; beyond +/-0.15 efficiency equals concentric/eccentric muscle work; cost per km lowest near -10 % (Margaria) | Earth, unloaded | https://iris.unibs.it/retrieve/ddc633e4-3c03-4e2e-e053-3705fe0a4c80/Minetti%20JAP%202002.pdf (HTTP 403 here) | 2; polynomial coefficients **U** |
| No suited, Mars-gravity, graded-slope metabolic regression exists | — | sources-validity.md | 2 |
| Mars-g figure we can cite: Mars PLSS design point 350 W average, 530 W max | NASA suit sizing | `research/suit-values.md` (SCH) | 2 (V in that file) |
| Measured unsuited 0.38 g level walking VO2 1.00 -> 0.68 L/min | lab LBPP | `research/science.md` #10 | 2 |

Weak points of the app's model (from `suit.js`, O): (a) downhill counted as flat (G clamped to 0), so no downhill saving and no downhill penalty; (b) Earth coefficients scaled by g_Mars/g_Earth, a linear scaling the KCL data (-32 %, not -62 %) does not support for the whole term; (c) eta 1.2 assumption.

## 3. Chain metabolic rate -> O2, CO2, water

| Step | Value | Source | O/2 |
|---|---|---|---|
| O2, feedwater, LiOH scale with metabolic rate; battery with time | "Metabolic rate ... is the major parameter affecting PLSS duration" | CAR p.49 in `research/suit-values.md` | 2 (V there) |
| NASA lunar-g data point: 273 W -> 68 g/h O2; 696 W -> 181 g/h O2 | Norcross 2009 (EVR Table 1) | `research/suit-values.md` | 2 (V there) |
| Check: 1 L O2 releases about 20.1-20.9 kJ (RQ 0.7-1.0); 273 W = 983 kJ/h / 20.2 kJ/L = 48.7 L/h x 1.43 g/L = 70 g/h, matches the 68 g/h above | indirect calorimetry constant | textbook value, not opened here | C; constant **U** (not opened) |
| So in the app: 1 J of work = 1 J off the O2/CO2/water stores is a direct proportional chain backed by CAR p.49 and Norcross 68 g/h at 273 W (about 0.25 g O2 per Wh; C) | | | C |
| xEMU-specific O2/CO2/water per watt | not found this session | — | **U** |

## 4. Would an effort-optimal route look different here? (ran it)

Script: Dijkstra on the real 256 x 256 grid (`walk_height.i16.bin`, `walk_slope.u8.bin`), same 8 neighbours and closed cells (> 20°) as `planner.js`, cost = `stepCost().m` (today) vs `stepCost().energyJ` (= `workRate(slope) x time`). 100 random open targets, rover at (0,0), out and back (200 routes, mean 51 m). Read-only, node, nice 15. C.

| Result | Value |
|---|---|
| Open ground | 82 % of cells; slope median 6.5°, p90 14.5° |
| Energy saved by the effort route vs shortest | median **0.00 %**, p90 0.18 %, max **0.75 %** |
| Extra length of the effort route | median 0.00 %, max 2.5 % |
| Routes saving > 2 % | **0 of 200** |
| Cell overlap of the two routes | median 91 %, p10 28 % (some routes differ in shape at near-equal cost) |
| Best case | 28.3 m way back: shortest crosses a 19.5° step, effort route stays under 4.6° for +0.7 m and -0.75 % energy |

Why (from the equations, C): with `workRate`, energy per step = W_walk·t + gs·eta·(B+L)·0.35·V·G·t. Since G·V·t = 100·(height climbed), the slope part sums to a constant times **total ascent**, independent of how steep. Downhill is free. So the effort route only differs where the shortest route climbs and then drops again; steepness itself is not penalised. With today's model the effort-optimal route is visibly the same route on almost every target, and the saving is under 1 %.

What would change this (U, not run): a model with a non-linear grade cost (Minetti-type, or Santee CF downhill cost), a slope-dependent speed (SEXTANT/Marquez use one velocity per slope), or a fall-risk penalty downhill. Any of these is a model change, not just a planner switch.

## 5. Ranking: ways to carry out "suit use decides the route" for the data-use point

| # | Way | Relevance (NASA data core) | Validity | Build cost (min, rough) |
|---|---|---|---|---|
| 1 | Switch the Dijkstra edge cost from metres to `energyJ` (already computed in `stepCost`) and say so in data-use and the Plan screen: "route minimises oxygen, computed from HiRISE slope -> Pandolf/Santee (NASA JSC traverse model) -> 350 W Mars PLSS". Be honest that on this site it costs < 1 % less than the shortest | High: the HiRISE DTM now decides the route through the suit, an end-to-end data chain | Sound, but small visible effect (section 4) | 15-30 (two cost lines in `findRoute`/`costField` plus tests) |
| 2 | Cite the end-to-end chain with numbers on one line/slide: slope (HiRISE) -> W (Kim 2024 eq.) -> O2 g/h (Norcross 68 g/h at 273 W; CAR p.49 proportional) | High, no code | High if numbers stay labelled model | 10-20 (text in docs/data-use.md, slide) |
| 3 | Add the Santee downhill correction CF (the exact equation NASA JSC uses, Kim 2024) instead of "downhill = flat" | Medium | Raises it: matches the NASA paper exactly; would also make route choice slightly matter; Mars scaling still assumption | 30-45 incl. checking CF sign/units at Mars g (U) |
| 4 | Show both numbers for the chosen route: "shortest: X m, Y g O2; least-oxygen: X' m, Y' g O2" | Medium-high: makes the data visibly drive a choice | High (honest comparison) | 30-60 (second Dijkstra run, UI line) |
| 5 | State the SEXTANT precedent (metabolic cost as a route objective, MIT/NASA BASALT line) and the Gilkey finding that real energy exceeded prediction, as the reason for the reserve | Low-medium | High (honest uncertainty) | 5-10 (text) |

Not verified: SEXTANT DEM resolution and any saving figure; Minetti coefficients; xEMU per-watt consumable rates; Looney 2019 error figures; whether the effect stays < 1 % with a Santee downhill term or another site.
