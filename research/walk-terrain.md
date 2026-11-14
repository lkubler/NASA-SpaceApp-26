# Walk terrain inventory: Murray Buttes 128 x 128 m square

Tested Sat 14.11. ~17:30. Scene frame: x = east, z = north (mirrored vs glb, per `scripts/preprocess/README.md`), Y up, origin = square centre. All grid numbers use `app/public/data/murray/walk_height.i16.bin` and `walk_slope.u8.bin` (256 x 256 cells, 0.5 m), which `build_murray.py` rasterised from `terrain.glb`. Analysis scripts were throwaway (numpy, node), not committed.

## 1. Files and extent
| File | Size | Role |
|---|---|---|
| `app/public/murray/terrain.glb` | 565,548 B | Loaded by the app (`app/src/walk/walkView.js:55`, `BASE + 'terrain.glb'`). Old Draco, 64 TILE meshes (127,952 tris), 1 SIMPLE, 1 BACKGROUND |
| `app/public/murray/tiles/*.jpg` (64) + `background.jpg` | 3.7 MB + 54 KB | Textures (`ui/loading.js` expects 66 requests) |
| `app/public/draco-old/` | 484 KB | 2017 Draco decoder (`walk/oldDraco.js`) |
| `app/public/data/murray/walk_height.i16.bin`, `walk_slope.u8.bin` | 131 KB, 65 KB | Pre-baked 0.5 m grid of the same glb (used here; the app also builds it live from the tiles, `terrain/heightmap.js`) |
| `app/public/data/murray/dtm_*` (1 km), `regional_*` (4 km), `ortho_*`, `curiosity_track.json`, `photos/` | 7.8 MB total in `data/` | 2D layers, not the walk |
- True extent: tiles cover x, z in [-64, +64] m = 128 x 128 m (16,384 m2), metric scale (fit scale s = 1.00, `murray.json`). Source: `research/data-sites.md` (glb accessor bbox) + `README.md`. Not re-parsed by me.
- Georeference: scene origin lon 137.35562 E, lat -4.69565; rotation 2.4 deg (scene axes vs north); error 1 sigma 2 m position (3 m at edge), 1.5 deg rotation (`murray.json` `transform_walk_to_dtm`).
- Mesh is smoother than the DTM (README: relief ~20 % lower).

## 2. Elevation and slope
Scene height (walk grid): min -6.40 m at (-51, +64), max +11.49 m at (-35, -48), median +1.13 m, p5 -4.49, p95 +9.55. Height at start 0.01 m. Relief 17.9 m.

Slope shares (`walk_slope.u8.bin`, central difference over 1 m; cross-check by `np.gradient` at 0.5 m in brackets; DTM column = 1 m HiRISE `dtm_slope.u8.bin` resampled onto the square through the stored transform):
| Threshold | Mesh grid (1 m) | Mesh (0.5 m) | HiRISE DTM |
|---|---|---|---|
| > 10 deg | 37.7 % | 38.9 % | 35.3 % |
| > 15 deg | 24.6 % | 25.3 % | 24.0 % |
| > 20 deg | 17.6 % | 18.1 % | 18.7 % |
| > 25 deg | 12.6 % | 13.1 % | not computed |
| median / p95 / max | 8.0 / 35 / 62.5 deg | 7.7 / 34.9 / 62.4 | 8.0 / 42 / 65.5 |

DTM square: elevation -4377.7 to -4357.1 m (scene -7.6 to +13.0 m after offset, so the DTM relief is a bit larger), 0 no-data cells in the square.

Where it is steep (share of cells > 20 deg, mesh, 16 m blocks; rows = z south to north, cols = x west to east):
```
z 48..64   0  0  0  6 47 50 58 65
z 32..48   0  0  0  0  4  1 22 28
z 16..32   0  0  0  3  2 49 59 45
z  0..16   0  0  0  0 12 70 25 49
z -16..0   0  0  0  1  8 50 21  1
z -32..-16 0 15 22 26  0  0  0  0
z -48..-32 52 49 47 67 22  0  0  0
z -64..-48 21 37 51 42  3  0  0  0
x: -64..-48 | -48..-32 | -32..-16 | -16..0 | 0..16 | 16..32 | 32..48 | 48..64
```
| Zone | What | Evidence |
|---|---|---|
| South-west, x -64..-16, z -64..-32 | High (mean 7 to 9.5 m, peak +11.5 m), 40 to 67 % steeper than 20 deg | block table above, mean-height blocks |
| East, x 8..64, z -16..32 | Butte mass, mean 5 to 7 m, 45 to 70 % steep | same |
| North-east strip, x 0..64, z 48..64 | Steep ridge at the north edge, 47 to 65 % | same |
| West and centre-west, x -64..-16, z -32..48 | Flat low ground (-5.8 to +0.4 m mean), 0 % steep | same |
| Radial from start | share > 20 deg: 4.7 % within 16 m, 17 % at 16-32 m, 18.5 % beyond | numpy, ring bins |
Start sits on gentle ground (cell slope 8.5 deg) between the west basin and the butte mass.

## 3. Start point and walkable area
- Start: `walkView.js:85` puts the player at scene (0, 0), height 0.01 m. With a planned route, `route3d.js` `spawn()` instead puts the player at the first route point inside the square (`R.first`), facing along the route. The default planner lander (`map/scenario.js` `LANDER_B`, lon 137.39435, lat -4.70324) is about 2.5 km away, far outside the square; the square has no lander marker of its own. Whether the walk is to be entered from (0,0) is not decided in code that I could find.
- Reachability, Dijkstra from (0,0) on the 0.5 m grid, 8-neighbours, a cell is passable if its stored slope <= limit, cost = 3D distance (my script, `scratchpad/a.py`). Slope is per cell, not per step, so a path can still cross a single steep cell edge.
| Limit | Reachable area | Share of square | Farthest cell from start by path | Climb on that path | Longest path between two reachable cells ("diameter", double sweep) |
|---|---|---|---|---|---|
| 20 deg | 11,944 m2 | 72.9 % | 120.5 m to (+45, +64); straight line 78 m; net +3.2 m, climb 8.1 m, descent 4.9 m | 8.1 m | 228.8 m from (-51, -64) to (+45, +64); climb 13.3 m one way, 10.2 m the other |
| 15 deg | 10,872 m2 | 66.4 % | 95.7 m to (-34, -64); climb 6.2 m | 6.2 m | 186 m |
| 10 deg | 8,929 m2 | 54.5 % | 113.8 m to (+64, +46); climb 2.2 m | 2.2 m | 219 m |
- Reachable cells at 20 deg form one connected region (49 components in total; the other 48 are islands). Reachable height range -6.40 to +6.28 m: the summit (+11.5 m) and the butte tops are not reachable on foot.
- Path length from start within the 20 deg limit: 10 m reaches 280 m2, 20 m 1,023 m2, 30 m 2,156 m2, 60 m 7,547 m2.
- Honest reading: the longest straight-through walk is about 230 m with 10 to 13 m climb; the farthest out-and-back from (0,0) is about 2 x 120 m = 241 m with about 13 m total climb (8.1 up, 4.9 down on the way out, reversed on the way back). "Sensible" (loop shape, avoiding edge clamping) was not optimised. The walk clamps position to +-63 m (`walkView.js:156`).

## 4. Line of sight to the start
Computed with the app's own `viewshed()` from `app/src/model/comms.js` (node, grid from `walk_height.i16.bin`, observer at (0,0), 2 m above ground, target 1.8 m, Mars curvature on). `lineOfSight()` spot checks agree. Geometric only, no radio model.
| Result | Value |
|---|---|
| Whole square hidden from the start | 27.5 % (eye 1.7 m to 1.7 m: 29.3 %) |
| Hidden among cells <= 20 deg slope | 26.2 % |
| Hidden by distance from start | 0 % within 16 m, 2.6 % at 16-32 m, 15.9 % at 32-48 m, 41.6 % beyond 48 m |
Hidden share (%) per 16 m block, rows from the south edge (z -64) to the north edge, columns west to east:
```
z -64..-48  77  66  79 100 100 100 100  79
z -48..-32   0   0   0  11  27  61  64  97
z -32..-16   0   0   0   0   0   0  38  99
z -16..0     0   0   0   0   0  23 100 100
z   0..16    0   0   0   0   0   9  81 100
z  16..32    0   0   0   0   0   0  29 100
z  32..48    0   0   0   0   0   0  13  90
z  48..64    0   0   0   0  10   2   0   6
```
Hidden: the south edge strip (z -64..-48, all x), and the east side behind the butte mass (x > 24, z -32..48). Open: the whole west half and the north. Not determined: line of sight to anything other than the start; no LOS test against the Curiosity or lander positions.

## 5. Points of interest vs the square
Positions from `curiosity_track.json` (DTM crop px) through the stored transform (my python, same formula as `walk/stations.js dtmToScene`). Square = max(|x|,|z|) <= 64.
| POI | Source | Scene x, z (m) | In square |
|---|---|---|---|
| Quela (drill 14, sol 1455) | track `stations[]` | (-156, +20) | No, 92 m beyond the west edge |
| Cross-bedding butte photo (sol 1454, `crossbedding_PIA21042`) | `science.js` STATIONS, track point | (-148, +9) | No, 84 m beyond the west edge |
| Marimba (drill 13, sol 1417; 3 photos) | track `stations[]` | (-89, +499) | No, 435 m north |
| All 27 track waypoints, sols 1398-1475 | `curiosity_track.json` | closest: sol 1469 (-86, -63), sol 1471 (-59, -87), sol 1468 (-111, -41) | None inside; nearest approach about 22 m west of the west edge |
- Photos in `photos/` (6 files: `marimba_drill`, `marimba_arm_navcam`, `butte_mastcam_1421`, `crossbedding_PIA21042`, `quela_drill`, `quela_navcam`) are tied to those three stations only. **No Curiosity photo, drill site, or named waypoint lies inside the square.** `walk/stations.js` already states this.
- Only Access Mars hand-placed POIs fall inside, from `research/data-sites.md` (taken from Access Mars `public/index.html`, scene metres x, y, z; not in our repo files). I checked frame consistency against our grid: marker heights vs grid height at (x, z) as written: Buttes (13.8, 6.9) y 1.2 vs 1.45; Monument Valley (21, 3.7) y 6.2 vs 5.34; Bruce Murray (-10.6, -12.9) y 1.8 vs 1.14. Mirroring z gives worse matches for Monument and Bruce, so the POIs use our (x, z) as is (marker heights are within about 1 m, offset by marker height unknown).
| Access Mars POI | x, z | Inside |
|---|---|---|
| Buttes | (13.8, 6.9) | Yes, 15 m east of start, on the butte mass edge |
| Monument Valley | (21, 3.7) | Yes, 21 m east, on the steep butte zone (50 % steep block) |
| Bruce Murray | (-10.6, -12.9) | Yes, 17 m south-west of start |
They are viewpoints of the original 2016 app, not science targets. Using them is a team choice.

## 6. Other sites' 3D terrain
| Site | In repo (`app/public`) | Local, uncommitted (`data/raw/`, git-ignored) | Downloadable (HTTP HEAD tested today) |
|---|---|---|---|
| Murray Buttes | Yes, full (glb + tiles + background) | also | 200, 565,548 B |
| Pahrump Hills | No | `data/raw/am/pahrump_hills/terrain.glb` (568,312 B); `data/raw/amrepo/public/terrain/pahrump_hills/` has glb + tiles + background | 200, 568,312 B (raw.githubusercontent, googlecreativelab/access-mars, `public/terrain/pahrump_hills/terrain.glb`) |
| Marias Pass | No | glb in `data/raw/am/` and `data/raw/access-mars/`, full folder in `amrepo` | 200, 577,876 B |
| Landing Site | No | `data/raw/am/landing_site/terrain.glb` (551,508 B); full folder in `amrepo` | 200, 551,508 B |
Also `live_site` exists locally and in the repo. Licence Apache-2.0 (`app/public/murray/LICENSE-access-mars.txt`). Each is the same 128 x 128 m structure (`research/data-sites.md`; relief in window: Pahrump -7.4 to +10.6 m, Marias -9.8 to +6.4 m, Landing -3.6 to +2.7 m). No app code references them (grep of `app/src` for pahrump, marias, landing returns nothing). No walk grid, slope, or georeference transform exists for them; building one needs `access_mars_grid.py` plus a DTM fit as done for Murray (`align.py`, `refine.py`). I did not parse those glbs or build grids.

## 7. The square inside the planning area
| | 1 km layer (`dtm_*`, 1.0118 m cells, 1024 px, 1.036 km) | 4 km layer (`regional_*`, 5.0588 m cells, 800 px, 4.047 km) |
|---|---|---|
| Square centre | col 498.25, row 499.75 (almost the centre) | col 239.65, row 397.55 (`col_reg = (col_1km + 700) / 5`, `row_reg = (row_1km + 1488) / 5`) |
| Distance centre to W / N / E / S edge | 504 / 506 / 532 / 530 m | 1,212 / 2,011 / 2,835 / 2,036 m |
| Share of area covered by the square | 1.53 % | 0.10 % |
| Valid data | 96.7 % valid; west-edge strip is no-data, square has 0 no-data | 81.7 %; NW 70 %, SW 57 %, NE and SE 100 % |
- The 1 km crop is cut at DTM col 700, row 6082; the regional grid cannot centre on it because the DTM west edge cuts it, so it sits 1.2 km from the west edge and the square is in the west part of the regional grid.
- Quela is 157 m from the square centre, inside the 1 km layer (156 m west, 27 m north by the DTM check). Marimba is 506 m from the centre, in the 1 km layer's north rim (row 3.8) and inside the 4 km layer. Both are outside the square, as in section 5.
- Slope on the 2D layers (1 m at 1 km, 10 m baseline at 4 km) will be smoother than the square's 0.5 m mesh; the 4 km layer cannot represent the cliffs listed in section 2.

## Could not determine
- Absolute accuracy of the Access Mars mesh vs the HiRISE DTM beyond the fit error (2 m, 1.5 deg); the mesh is about 20 % smoother.
- Which "sensible" walk the team wants: I report geodesic distances only, no loop, no energy cost, no edge clamping, no 20 deg limit on step slope between cells.
- Slope at the square edges is coarser (outer tiles about 175 vertices, `research/spike-3d.md`).
- Radio shadow with real radio physics; LOS only to the start, geometric.
- Heights of loose rocks and obstacles: the mesh does not resolve them (0.5 m grid, mesh typically 4.7 cm vs SIMPLE).
- No hands-on test of FPS or walking on real hardware.
