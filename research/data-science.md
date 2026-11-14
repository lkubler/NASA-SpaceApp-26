# Science data answers: POIs, REMS, Mars24, RAD, gravity (data-scout)

Sat 14.11. ~14:00-14:40 Europe/Berlin. Answers the open questions in `research/science.md` section 5. Does not repeat the Access Mars/DTM alignment (task 002) or `research/data-sites.md`.
Marks: **V** = file or page opened and values read here, **S** = search-result summary only, **U** = not verified. Raw files are in `data/raw/sci/` (not committed).

## Summary
1. Waypoints for sols 1398-1475 are in the table below (27 rows, all **V**). Quela's position is the parked rover, not the drill hole (arm reach ~1-2 m).
2. REMS sol 1440 parses fine. Plain CSV with a documented 40-column format. Temperature and pressure are dense, UV is sparse (see section 2).
3. Mars24 constants verified against the official GISS page (via web.archive.org because the live page timed out). A Python implementation reproduced both worked examples. **Correction:** the epoch form quoted in `science.md` section 3 is the old AM2000 one. Use the 2015 form below.
4. RAD: 0.67 mSv/day is the GCR dose equivalent seen by a detector inside the rover, looking up. For EVA it is a reasonable first figure at 0.028 mSv/h, but it is not a suit-specific value. See section 4.
5. Gravity: use ~0.68 as the default for the unsuited total metabolic rate (primary source found, weak). Our reserve model lands on 0.67 for the unsuited flat case, so it is consistent. At 10 % grade it gives 0.48-0.51. See section 5.

## 1. Murray Buttes: Curiosity path and POIs

### Source (V)
`https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json` returned 200 and 665 KB. GeoJSON, 1389 waypoints. Properties: `sol, site, drive, lon, lat, elev_geoid, easting, northing, roll, pitch, yaw, dist_total_m`. The `lon` is degrees East. The `lat` is the one in the file, taken as-is. Each waypoint is the rover position at the end of a drive. The file is NASA public data.
Not tested: the Analyst's Notebook and PLACES (no per-target coordinates found for the named ChemCam/APXS targets).

### Path table (JSON-ready)
Columns: `[sol, site, drive, lon_E, lat, elev_geoid_m]`. Straight-line sum of these 27 points is ~960 m (our arithmetic, a lower bound on odometry).
```json
[[1398,55,1864,137.3566746,-4.68423732,-4419.4],[1399,55,2098,137.3562752,-4.68457822,-4420.6],[1400,55,2222,137.3561815,-4.68472017,-4420.3],[1401,55,2444,137.3561308,-4.68513333,-4417.3],[1405,56,0,137.3556713,-4.6851802,-4417.9],[1410,56,462,137.3550702,-4.68596208,-4415.7],[1412,56,774,137.3547297,-4.68664242,-4412.1],[1414,56,1122,137.3543902,-4.68716324,-4410.8],[1417,56,1236,137.3544744,-4.68718483,-4410.4],[1427,56,1326,137.3544504,-4.68736858,-4409.6],[1428,56,1632,137.3540271,-4.68793238,-4407.7],[1431,56,2034,137.353581,-4.68867137,-4405.4],[1432,56,2428,137.353432,-4.68927704,-4403.8],[1433,57,0,137.3533725,-4.69015912,-4401.3],[1435,57,462,137.352835,-4.69107177,-4398.7],[1438,57,774,137.3527609,-4.69174578,-4397.1],[1439,57,1020,137.3531027,-4.6922008,-4393.8],[1446,57,1392,137.3529998,-4.69305435,-4388.8],[1448,57,1942,137.3531285,-4.69417326,-4383.8],[1452,57,2296,137.3534192,-4.69477314,-4378.8],[1454,57,2582,137.3531382,-4.6953883,-4380.1],[1455,57,2798,137.3530064,-4.69520223,-4379.5],[1468,58,0,137.3537174,-4.69626845,-4375.8],[1469,58,264,137.3541287,-4.696646,-4374.4],[1471,58,642,137.3545634,-4.69707217,-4372.7],[1473,58,774,137.354695,-4.69731227,-4371.2],[1475,58,912,137.3545968,-4.69756756,-4370.1]]
```
The rover only has a waypoint where a drive ended and the pose was reconstructed. Sols without a row are not missing data, the rover did not drive or was not reported. Intermediate positions between rows are a straight-line guess.
Elevation drops ~50 m over the path (-4420 to -4370 m, geoid), roughly north to south-south-east along the buttes.

### POIs (position = rover waypoint during the activity)
Sol facts are from the Planetary Society updates (read in full: sols 1373-1427 and 1428-1488, **V**). They are not primary NASA text, but the blog titles and sols are consistent with NASA's own blog (the Quela post at `science.nasa.gov/blog/sols-1456-1458-settling-in-at-quela/` returned 200, text not read).

| POI | Sols | Rover position (lon E, lat) | Source / confidence |
|---|---|---|---|
| Bimbe (blocky conglomerate/breccia deposit, contact science) | drive toward it sol 1405, work sols 1407-1411, left sol 1410 | 137.35567, -4.68518 (sol 1405); 137.35507, -4.68596 (sol 1410) | Planetary Society V. Position: **medium**, wp 1405 is the start of the approach |
| Murray Buttes panorama, entrance (360 deg panorama) | sol 1421 | 137.35447, -4.68718 (sol 1417 wp; rover stayed at Marimba) | V (sol), position medium (same spot as Marimba) |
| Marimba (drill site 13) | arrived 1417, drilled 1422, left 1427 | 137.35447, -4.68718 (1417) and 137.35445, -4.68737 (1427) | V. **High**: two waypoints agree to ~2 m |
| Entry into the buttes (drive start) | sol 1427 (11 m), 1428 (>45 m) | 137.35445, -4.68737 then 137.35403, -4.68793 | V |
| Mid-butte driving, ChemCam/Mastcam targets (Conda, Chitado, Ganda, Andulo, Viana, Muchinda and ~60 more) | 1428-1452 | wps for sols 1431-1452 above | V (target names and sols). Per-target coordinates **U**: only rover position known |
| Karasburg (Murray/Stimson contact, Mastcam mosaics) | 1454, 1456-1458, 1462, 1468-1472 | around the Quela area, 137.3530, -4.6952 | V (sols). Observed from the rover, target location **U** |
| **Quela (drill site 14)** | arrived 1455, drill fault 1461, drill hole characterised 1464-1468, left 1468 | **137.3530064, -4.69520223**, elev -4379.5 m (sol 1455 wp) | Sols V. Position **high**: the rover was parked there for 13 sols |
| "Murray Butte 12" | -- | -- | **U**. Appears in `notes.md` only; no source found (not in Planetary Society text either). Do not label it in the app. Say "Quela, at the foot of a butte" |

Time window to use for the story: sols 1417 (Marimba) to 1468 (leaving Quela). Date range for REMS sol 1440: 2016-08-24/25 UTC.

### Caveats
- The DTM crop and the Access Mars scene need a lat/lon to metres transform. Task 002 owns that. For lon/lat to metres use R = 3396.19 km (as in `data-sites.md`).
- `lat` in the file is probably planetocentric. At -4.7 deg the difference to planetographic is ~0.03 deg (about 30 m on 3396 km radius? No: ~0.03 deg ~ 1.8 km? Not computed). Not checked; if exact co-registration matters, check the DTM label's `MAP_PROJECTION` latitude type. Task 002's own alignment against ortho imagery will absorb it.

## 2. REMS: one representative sol (1440) as parseable text

### Access (V)
- Volume: `https://atmos.nmsu.edu/PDS/data/mslrem_1001/` (200). Layout: `DATA/SOL_01418_01514/SOL01440/`.
- Direct file used (200, 11.9 MB, 31 932 rows, CSV, quoted strings, no auth, `Accept-Ranges` not tested):
  `https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA/SOL_01418_01514/SOL01440/RME_525281619RMD14400000000_______P2.TAB`
  Label (V): `...RMD14400000000_______P2.LBL` next to it. Product `MSL-M-REMS-5-MODRDR-V1.0`. `START_TIME 2016-08-24T03:55:50`, `STOP_TIME 2016-08-25T04:35:24` (one full sol).
- Column definitions (V): `https://atmos.nmsu.edu/PDS/data/mslrem_1001/LABEL/MODRDR6.FMT`. License: PDS, public. Credit: REMS, Centro de Astrobiologia (INTA-CSIC) / NASA.
- Other files in the folder: `ADR` (UV and geometry, 4.8 MB), `RNV` (0.35 MB), `RTL` (telemetry). Only `RMD` is needed.

### Parsing
Plain CSV (Python `csv` module works; quoted fields contain spaces). Missing value = `-999.00`. 40 columns in this order, the ones we need (0-based):
`TIMESTAMP, LMST ("01440M00:00:00.901"), LTST ("01440 00:36:17"), HORIZONTAL_WIND_SPEED, VERTICAL_WIND_SPEED, WIND_DIRECTION, WS_CONFIDENCE_LEVEL, BRIGHTNESS_TEMP (K, ground), ..., BOOM1_LOCAL_AIR_TEMP, ..., BOOM2_LOCAL_AIR_TEMP, ..., AMBIENT_TEMP (K), ..., UV_A, UV_B, UV_C, UV_ABC, UV_D, UV_E (W/m2), ..., LOCAL_RELATIVE_HUMIDITY (%), ..., PRESSURE (Pa), PRESSURE_UNCERTAINTY, PS_CONFIDENCE_LEVEL`.
Do not hardcode indices: read the names from `MODRDR6.FMT` (regex `NAME = "..."`), as done here. Python snippet in the task output is trivial (csv + dict of names).
Coverage on sol 1440 (non-missing rows out of 31 932): AMBIENT_TEMP 31 932, PRESSURE 31 932, BRIGHTNESS_TEMP 29 692, UV_ABC 30 108, humidity 31 911, **wind 27** (wind sensor effectively unavailable, do not promise wind).

### 24 h summary (LMST hour bins, means; our arithmetic from the file)
Ranges over the sol: air 204.3-277.8 K (-68.9 to +4.7 C); ground (brightness) 175.4-286.8 K (-97.8 to +13.7 C); pressure 776.1-865.4 Pa (mean 833.7); humidity 0.6-10 % (local, sensor, not trusted for quoting); UV_ABC peak 13.1 W/m2 and UV_A peak 7.35 W/m2 at LMST 11:00.

| LMST hour | Air K | Ground K | Pressure Pa |
|---|---|---|---|
| 0 | 213.6 | 206.7 | 851.4 |
| 3 | 205.9 | 201.5 | 851.6 |
| 5 | 206.7 | 200.3 | 855.4 |
| 6 | 212.0 | 208.1 | 863.7 |
| 8 | 228.8 | 238.5 | 852.7 |
| 10 | 246.8 | 270.3 | 827.7 |
| 12 | 256.2 | 281.4 | 805.3 |
| 14 | 272.6 | 280.5 | 786.8 |
| 15 | 271.5 | 272.2 | 780.3 |
| 16 | 257.6 | 260.4 | 777.1 |
| 18 | 238.3 | 237.2 | 798.0 |
| 20 | 227.4 | 225.3 | 825.8 |
| 22 | 220.7 | 214.1 | 844.0 |

Shape: the coldest period is 03:00-05:00 LMST (air ~206 K). Peak is ~14:00 (air ~273 K, ground ~284 K at 13:00). Pressure has the usual two-hump daily tide, minimum ~16:00. Sunrise is around LTST 6 h (our Mars24 run, section 3), matching UV onset at hour 5-6.
Warnings:
- **UV is sparse.** REMS runs in blocks (UV_ABC non-missing mostly in hours 0, 5-6, 11, 17, 22-23 only), so a UV curve should be modelled (cos zenith), not read from this sol. Use measured peak 13.1 W/m2 only as an anchor.
- Hours 9, 13-15 have gaps in UV, and some hours have 300-ish rows only. Interpolate.
- Nearest-sol alternatives: SOL01430-SOL01449 are all in the same directory; the buttes were crossed sols 1427-1468. Sol 1440 sits at Ls ~210 (our Mars24 run), southern spring, no dust storm.
- Also available: `https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA_UV_CORRECTED/` (not opened).
- Browser CORS **not tested**: preprocess the 12 MB file offline to a ~30 line hourly JSON (should be < 5 KB) and commit that, not the raw file.

## 3. Mars24 sun position (verified)

### Verification (V)
- Official page: `https://www.giss.nasa.gov/tools/mars24/help/algorithm.html` timed out from this machine (curl code 000, three tries, also WebFetch). The Wayback copy `https://web.archive.org/web/2023/https://www.giss.nasa.gov/tools/mars24/help/algorithm.html` returned 200 (34 KB; "Updated 2023-12-10", page footer May 2024) and was read in full. The numbers below are copied from it.
- NTRS paper (V): `https://ntrs.nasa.gov/api/citations/20000097895/downloads/20000097895.pdf`, 200, 45 pages, text extracted. Contains the 1.027491251 sol length and `JD 2405522` epoch (the old form). The GISS page says the 2015 update (Allison 2015) changed equations B-1, B-2, C-2, D-2. So follow the GISS page, not the 2000 paper.
- **Test (V):** I coded the steps in Python and ran both of the page's worked examples. Results match to the printed digits: Ls 277.18758 (page 277.18758), MST 23.99425 h, EOT -0.34585 h, declination -25.2282 (page -25.22825), solar elevation -64.2618 (page Z 154.26182), azimuth 191.0391 (page 191.03905); second example LTST 0.00020 h (page 0.00025), azimuth 179.9937 (page 179.99383). Difference 1e-4 deg, fine.
- Correction to `science.md` section 3: "MSD = (JD_TT - 2405522.0028779)/1.0274912517" is the AM2000 version. Use C-2 below (mathematically near-identical, 2405522.0028 is the same epoch). Also `science.md` says "Ls from the paper's series": that series is B-3/B-4 below.

### Step list (all angles in degrees, trig in radians internally)
Input: Unix time in ms (UT), planetographic latitude phi (deg N), longitude Lambda in **degrees West** (Gale: 360 - 137.353 = 222.647 W).
- A-2: `JD_UT = 2440587.5 + millis / 8.64e7`
- A-4: `TT-UTC = 64.184 s` for dates after 2017 (TAI-UTC 37 s + 32.184 s; no leap seconds since 2017 to the page's 2024 note). Mars24's formula for dates before 1972 is not needed.
- A-5: `JD_TT = JD_UT + (TT-UTC)/86400`
- A-6: `dt = JD_TT - 2451545.0`  (days since J2000, TT)
- B-1: `M = 19.3871 + 0.52402073 * dt`  (mean anomaly)
- B-2: `alpha_FMS = 270.3871 + 0.524038496 * dt`
- B-3: `PBS = sum_{i=1..7} A_i * cos( 0.985626 * dt / tau_i + phi_i )` with (A, tau, phi):
  (0.0071, 2.2353, 49.409), (0.0057, 2.7543, 168.173), (0.0039, 1.1177, 191.837), (0.0037, 15.7866, 21.736), (0.0021, 2.1354, 15.704), (0.0020, 2.4694, 95.528), (0.0018, 32.8493, 49.095)
- B-4: `nu_M = (10.691 + 3.0e-7*dt) sin M + 0.623 sin 2M + 0.050 sin 3M + 0.005 sin 4M + 0.0005 sin 5M + PBS`   (equation of centre, nu - M)
- B-5: `Ls = alpha_FMS + nu_M`  (mod 360)
- C-1: `EOT = 2.861 sin 2Ls - 0.071 sin 4Ls + 0.002 sin 6Ls - nu_M`  (degrees; hours = deg/15)
- C-2: `MST = mod24( 24 * ( (JD_TT - 2451549.5)/1.0274912517 + 44796.0 - 0.0009626 ) )`  hours, mean solar time at the prime meridian
- C-3: `LMST = mod24( MST - Lambda/15 )`
- C-4: `LTST = LMST + EOT/15`
- C-5: `Lambda_s = MST*15 + EOT + 180`  (sub-solar longitude, deg W)
- D-1: `delta_s = asin( 0.42565 sin Ls ) + 0.25 sin Ls`  (the first term in radians converted to deg; the 0.25 is degrees)
- D-5: `H = Lambda - Lambda_s`; `Z = acos( sin(delta_s) sin(phi) + cos(delta_s) cos(phi) cos(H) )`; elevation = 90 - Z
- D-6: `Az = atan2( sin H , cos(phi) tan(delta_s) - sin(phi) cos(H) )` (mod 360, from north, as the page says, but see check below)
Sanity numbers for a unit test: JD_UT 2451549.5 at 0 N 0 W gives Ls 277.18758, MST 23.99425 h, EOT -0.34585 h, elevation -64.2618, az 191.0391. And 2453008.07397 at -14.640 N, 184.702 W gives LTST 0.0002 h, az 179.994.
Not needed for the prototype: D-2 to D-4 (heliocentric distance, longitude, latitude), only used for Earth-Mars geometry.

### Gale sol 1440 result (our run)
Start of REMS sol 1440 at 2016-08-24T03:55:50 UTC gives LMST 23.996 h. Site -4.695, 137.353 E (222.647 W). TT-UTC = 67.184? Used 69.184 (Jan 2017 value); the true value in Aug 2016 was 68.184 s (TAI-UTC 36 s). The 1 s error is 0.0004 deg, irrelevant. Result: Ls ~209.6-210.3 over the sol, EOT +0.61 h, declination -12.3 to -12.5 deg.

| LMST | LTST | Sun elevation | Azimuth |
|---|---|---|---|
| 06:00 | 06.60 | +9.8 | 101.7 |
| 09:00 | 09.60 | +53.7 | 104.5 |
| 12:00 | 12.60 | +78.2 | 228.7 |
| 15:00 | 15.60 | +36.1 | 258.0 |
| 18:00 | 18.60 | -7.8 | 256.7 |
So sunrise ~LTST 5.9 h, sunset ~LTST 18.3 h. Noon sun is 12 deg from the zenith, so shadows are short at midday, long at dawn/dusk (good for the buttes).
Check on azimuth: at LMST 9 the sun is in the east (104.5 deg) and at 15 in the west (258 deg), so the formula with planetographic west longitude gives azimuth from north, clockwise. Verified against the page's examples; the page's wording is correct. At 12 h the sun is near the zenith, azimuth is meaningless there.

## 4. RAD: surface dose and the shielding question

### Verified
- **0.67 mSv/day** surface GCR dose equivalent rate, Aug 2012 to June 2013 (about 300 sols); **1.8 mSv/day** in cruise. Source: SwRI release `https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars` (V, text fetched) and the ScienceDaily copy of the NASA/SwRI release `https://www.sciencedaily.com/releases/2013/12/131209181133.htm` (V). Both give 0.67 and neither gives mGy/day.
- Round trip about 0.66 Sv, 500-day surface stay about 1 Sv total (same release, V). That is the story number for a mission, not for one EVA.
- Absorbed dose **0.21 mGy/day** and quality factor figures (3.05 on the surface, 3.82 in cruise) come from search summaries of the Science paper (Hassler et al. 2014, doi 10.1126/science.1244797, 403 to bots): **S**, not read. The Science abstract may say 0.64 +/- 0.12 mSv/day for GCR alone; the press release says 0.67. Quote 0.67 and cite the release; 0.64 vs 0.67 is a rounding/definition difference we could not resolve (**U**).
- Atmosphere shielding above the detector is 23 g/cm2 of CO2 (Zeitlin et al. 2018 abstract, `https://elib.dlr.de/120101/`, V). RAD's charged-particle telescope looks at the zenith with a 65 degree field of view (S, a figure caption in a search result). Planet shielding cuts the dose by ~2 in the lower hemisphere (S).
- Kim et al. 2014 (a RAD vs model paper, S): albedo particles from the regolith are ~10 % of the absorbed dose and ~42 % of the dose equivalent. So ground-reflected neutrons matter and are included in RAD's number.

### Is 0.67 mSv/day already "inside the rover"?
Not exactly, and the honest answer is "mostly measured in the open sky view, with some rover material in the way".
- RAD sits inside the rover body (S, the release does not say where; it is a body-mounted instrument, not on the deck). Its zenith-looking cone is thinly shielded by the rover; the radioisotope generator also floods it with neutrons and gamma rays below ~5 MeV (S, Rafkin et al. in a search result), which the dose calculation tries to remove (not verified how).
- A suited person on foot sees the full upper sky plus the ground, and the suit adds a few g/cm2 at most, far less than the 23 g/cm2 atmosphere. So the open-sky dose is a defensible first figure for a person, within a factor of ~1.5. I could not find a paper giving suit-shielded Mars-surface dose, so do not state one.
- Dose equivalent is mainly set by GCR high-energy particles that thin shielding hardly changes. Extra shielding would raise the quality factor slightly by making secondaries (physics, not found as a citation here).

### Defensible per-hour EVA figure
`0.67 mSv/day / 24.66 h per sol = 0.0272 mSv/h` per Mars hour. Per Earth hour (24 h) `0.0279 mSv/h`. Use "about 0.028 mSv/h". The dose rate runs all 24 h at the surface (GCR is nearly flat day and night, small diurnal variation from the atmosphere tide, not quantified here (**U**)).
- A 6 h EVA: ~0.17 mSv. An 8 h EVA: ~0.22 mSv. A 24 h/week EVA load (Dunn 2021, from `science.md`): ~0.67 mSv/week. For comparison, about 20 mSv/yr is the typical earth worker limit (not sourced here, drop it if you cannot cite).
- Label: "measured by RAD (inside rover, sky view), applied to a person without suit-specific shielding". Mark as **measured, scaling assumed**. The dose is tiny per EVA, so radiation matters in the app only for the SPE scenario and the mission total, not as a route cost.

### Sept 2017 solar particle event at Gale (partly V)
- Zeitlin et al. GRL 2018 abstract (V, `https://elib.dlr.de/120101/`): the 10-12 Sept 2017 event was the largest RAD has seen on the surface. Dose rate rose to **2-3 x** the GCR background, stayed at peak ~12 h, then declined over the next 36 h. A shock front then cut dose rates by ~15 % and a Forbush decrease pushed GCR below the pre-event level.
- Hassler et al. Space Weather 2018 (S, key points via a catalogue record): dose rates and neutral particle fluxes up by 2, proton flux x30, helium-4 x10; the integrated dose only slightly above pre-event because of a lower quality factor and the Forbush decrease. doi 10.1029/2018SW001959, full text not read.
- `science.md` quotes "x3 peak". Use "2 to 3 times the GCR rate for about 12 hours" (V). At 0.028 mSv/h that is 0.056-0.084 mSv/h at peak, so a 12 h peak adds ~0.3-0.5 mSv beyond the GCR baseline (our arithmetic). Even a worst-case SPE is a small dose for a few hours on the surface. This is a "shelter vs continue" story point, not a lethal one. State it honestly.
- The September 2017 SPE and the sols 1417-1468 window are 18 months apart. If the SPE scenario is shown, label it "replay of Sept 2017 event applied to this route".

## 5. Gravity: is ~0.75 defensible for metabolic cost at 0.38 g?

### The primary source for "VO2 1.00 to 0.68 L/min" (V at abstract level)
Brown E, Russomano T, Bueno B, Bandeira L, Disiuta L, Lamadrid I, Da Rosa M, De Lima JCM, Baptista RR, Da Luz Dias R. "The Metabolic Cost of Walking in Simulated Martian Gravity and its Implications." **Journal of Exercise Physiology Online 21(1): 25-35, Feb 2018.** Landing page `https://kclpure.kcl.ac.uk/portal/en/publications/the-metabolic-cost-of-walking-in-simulated-martian-gravity-and-it/` (200, abstract read). The PDF at `https://meriva.pucrs.br/dspace/bitstream/10923/12329/2/The_Metabolic_Cost_of_Walking_in_Simulated_Martian_Gravity_and_its_Implications.pdf` (listed in search, **connection refused/000 from this machine, full text NOT read**).
Abstract facts (V): n=12 healthy adults (age 22.75 +/- 5.38), lower-body positive-pressure (LBPP) treadmill, 8 min at 1 g then 8 min at 0.38 g two weeks later. VO2 **1.00 +/- 0.61 L/min at 1 g vs 0.68 +/- 0.33 at 0.38 g (P<0.05)**; heart rate 118.5 -> 106.2 bpm; RER 0.83 -> 1.14; VCO2 unchanged.
Problems with it (so it is a weak anchor, say so):
- **Unsuited, tiny n, large SD (SD is 60 % of mean at 1 g).** A single 8 minute bout, not steady state, and LBPP is a proxy.
- The abstract lists 4.79 kcal/min at 0.38 g vs 3.37 at 1 g, which contradicts its own VO2 numbers and conclusion ("Energy consumption was significantly decreased"). RER 1.14 is physiologically odd. The kcal numbers are probably mislabelled; only the VO2 ratio should be used.
- 0.68/1.00 = 0.68 is our arithmetic (about -32 %).
- Speed, grade, load not stated in the abstract (**U**).
Other directional sources (S): Newman & Alexander 1993, Acta Astronautica 29(8):613-620 and Newman, Alexander, Webbon 1994 (underwater treadmill, "energy requirements for 1/6 g and 3/8 g significantly less than at 1 g", no number in the abstract). Lacquaniti et al. 2017, Front Physiol 8:893 (V, partial text): external mechanical work to walk a given distance on Mars-g parabolic flights was "about half as much as on Earth" (Cavagna 1998/2000), no metabolic cost given. A thesis summary (S) mentions walking cost of transport -18 % in hypogravity (gravity level and source unconfirmed, **U**).
The "load max 80 % vs 45 %" claim in `science.md` section 3: not found in anything read, **U**; delete it or re-source.
Ludlow & Weyand 2017 (J Appl Physiol 123:1288, doi 10.1152/japplphysiol.00504.2017): abstract confirms walking economy is set by speed, grade and load with r2 0.99, SEE 1.06 ml/kg/min, 32 subjects, but it is **1 g only**; the abstract does not support the claim that it covers reduced gravity ("gravitational load" there means added load mass). Do not cite it for 0.38 g.

### Verdict on the default
- ~0.75 is within the evidence range (measured total 0.68 unsuited; mechanical work 0.5; thesis 0.82) and is a defensible, *conservative* default if worded as "total metabolic rate scales between 0.68 and 1.0, default 0.75, user-adjustable". It is not a measured value for suited walking. No source gives a suited, graded, loaded Mars-g factor.
- **Our model** (`app/src/model/reserve.js`, run with Node, V): `P = 1.5 W + (g/9.81) * loaded + suitW`, gravityScale = 0.378 on the Pandolf locomotion+load term, the 1.5 W basal and the suit offset unscaled. Results, 80 kg, regolith, 3.5 km/h, load 23 kg, suited (14 ml/kg/min offset = 392 W):

| Case | Earth g | Mars g | Ratio |
|---|---|---|---|
| Flat, no load, suited | 648 W | 564 W | 0.87 |
| Flat, 23 kg, suited | 704 W | 585 W | 0.83 |
| +10 % grade, 23 kg, suited | 1125 W | 744 W | 0.66 |
| -10 %, 23 kg, suited | 623 W | 554 W | 0.89 |
| Unsuited, flat, no load | 256 W | 171 W | **0.67** |
| Unsuited, flat, 23 kg | 312 W | 193 W | 0.62 |
| Unsuited, +10 %, no load | 583 W | 295 W | 0.51 |

So the model reproduces the Brown ratio (0.67 vs 0.68) for its one directly comparable case (unsuited, flat, level), by luck: the unscaled 1.5 W basal term and a 0.378 scale on the rest happen to give 0.67. On slopes it predicts a bigger drop (0.5) than anything measured (no graded data at 0.38 g exists, **U**). On the suited, flat route case the model gives a **ratio 0.83**, close to the 0.75 default but milder, because the 392 W suit term is unscaled. Total 400-700 W is the right size for a suited EVA (NASA sizing average 1200 BTU/h = 352 W, 95th percentile 2300 BTU/h = 674 W, from `sources-validity.md`; 8 h x 352 W matches the model's 10.1 MJ capacity). So: **consistent for flat ground and the totals; on steep grades it may be optimistic.** Suggestion for the builder (not applied): expose the uncertainty band by running with gravityScale 0.38 (model) and a flat-ground factor 0.83-0.87 and an upper bound that treats the walking term as unscaled (factor 1.0); keep the 0.68 anchor in the label.

## What I could not verify
- Live GISS Mars24 page (only the Wayback copy of 2023-12-10, with the page footer May 2024).
- Hassler 2014 full text (0.64 vs 0.67, 0.21 mGy/day, RAD mounting and shielding details), Hassler 2018 full text, Kim 2014, Rafkin et al.
- Brown et al. 2018 full text (speed, grade, load, suit, kcal table). PDF host refused connection.
- Coordinates of individual ChemCam/APXS targets, "Murray Butte 12", Analyst's Notebook and PLACES.
- Whether MSL_waypoints `lat` is planetocentric or planetographic.
- Whether REMS PDS files send CORS headers.
