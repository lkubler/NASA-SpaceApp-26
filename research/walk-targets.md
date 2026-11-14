# Sample candidates in the Murray Buttes walk square (data-scout, Sat 14.11. ~18:30)

Method for all numbers ("grid method"): my throwaway scripts (numpy, node; `scratchpad/targets/`). Grid = `walk_height.i16.bin` / `walk_slope.u8.bin` (256 x 256, 0.5 m, scene x east, z north, origin = square centre = start). Path = Dijkstra from (0,0), 8 neighbours, a cell is passable if its stored slope <= 20 deg, cost = 3D distance. Climb / descent = sum of positive / negative height steps along that path. Radio shadow = share of path length on cells without geometric line of sight to (0,0), from the app's own `viewshed()` (`git show 7a78fd1:app/src/model/comms.js`, eye 2 m, target 1.8 m, curvature on; hidden share of the whole square 27.5 %, reproduces walk-terrain.md). Geometric only, no radio model. Slope is per cell, not per step. Out-and-back = 2 x path length.

## 1. Access Mars points of interest, Murray Buttes
Source: `public/index.html` lines 206-211 (`murray_buttes_markers`), repo clone `data/raw/amrepo` (HEAD 4b0a445, 25 Oct 2017); raw URL pattern `https://raw.githubusercontent.com/googlecreativelab/access-mars/master/public/img/cards/<file>` (HTTP 200 tested for mb4). Licence Apache-2.0; imagery NASA/JPL.
**Resolution: there are four, and all four are inside the square.** Earlier inventory missed "Interference" because it sits 0.5 m inside the west edge (x = -63.5).

| Name | Mesh pos x, y, z (m) | Photo | What the photo shows (I looked at it) | Card text (verbatim start) | Inside |
|---|---|---|---|---|---|
| BUTTES | 13.8, 1.2, 6.9 | `img/cards/mb1.jpg` (512 px) | Curiosity selfie in front of a butte (rover visible) | "These are the Murray Buttes. Buttes are steep, knob-like rock formations. The largest one here is about as tall as a three-story building. ..." | yes |
| BRUCE MURRAY | -10.56, 1.80, -12.90 | `mb2.jpg` | Archive b/w photo of two men at a map; not a Mars image | "The Murray Buttes are named after the late Bruce Murray, a Caltech planetary scientist and director of JPL. ..." | yes |
| MONUMENT VALLEY | 21, 6.2, 3.7 | `mb3.jpg` | Layered, cross-bedded butte wall with talus blocks | "These buttes are similar to ones you'd find on Earth, formed when wind erodes ancient sandstone. Scientists have compared the region to Monument Valley." | yes |
| INTERFERENCE | -63.5, -3.9, 35.2 | `mb4.jpg` | Boulder-strewn slope against the sky | "The buttes are beautiful, but are sometimes tall enough to block the signal between Curiosity and the Mars orbiters that fly overhead. ..." | yes (0.5 m from west edge; the walk clamps position to +-63 m, `walkView.js:156`, so a player stands 0.5 m short of the marker) |

Frame check: marker y vs grid height at (x, z): Interference -3.9 vs -3.96 (match), Buttes 1.2 vs 1.45, Bruce 1.8 vs 1.14, Monument 6.2 vs 5.34. Interference matching to 0.06 m confirms (x, z) is used as is.

## 2. Reachability of the points (grid method)
| Point | Cell slope | Reachable itself | Target used | Path length | Climb / descent | Radio shadow on path | Max cell slope on path |
|---|---|---|---|---|---|---|---|
| Buttes | 26.0 deg | no | nearest reachable cell (12.75, 7.75), 1.4 m from marker | 15.6 m | 0.86 / 0.04 m | 0 % | 19.5 deg |
| Monument Valley | 44.5 deg (butte wall) | no | nearest reachable (15.25, 1.75), 6.3 m from marker, 2.6 m lower | 16.3 m | 2.62 / 0.04 m | 0 % | 19.5 deg |
| Bruce Murray | 10.5 deg | yes | (-10.75, -12.75) | 17.7 m | 1.25 / 0.12 m | 0 % | 14.5 deg |
| Interference | 5.5 deg | yes | (-63.25, 35.25) | 78.2 m | 0.40 / 4.37 m | 0 % (marker cell has LOS) | 16.0 deg |
Monument Valley is a view of a wall, not a spot you can stand on; Buttes is the foot of the same butte mass.

## 3. Butte feet (derived from terrain)
Definition (mine): wall = cells with stored slope >= 30 deg (8.7 % of the square); none of them is reachable at the 20 deg limit. Foot spot = reachable cell, slope <= 15 deg, <= 3 m from a wall cell, terrain rises >= 3 m within 6 m. Clusters, one spot each, listed by path length. 40 m / 6 m rise values are mesh values; the mesh is smoother than the HiRISE DTM (about 20 % lower relief), so real walls are steeper. The mesh has no rock-type data: which spot shows sandstone, mudstone or their contact is not in our data.

| Id | Position x, z | Height | Dist. to wall | Rise within 10 m | Steepest cell within 4 m | Path | Climb / descent | Radio shadow | Max slope on path |
|---|---|---|---|---|---|---|---|---|---|
| F1 | (13.25, -0.25) | 2.13 m | 2.0 m | 6.4 m | 34 deg | 13.8 m | 2.16 / 0.04 | 0 % | 19.5 deg |
| F2 (same butte as F1, 9 m north, beside the wall) | (12.25, 8.75) | 0.55 m | 2.9 m | 7.1 m | 33 deg | 15.5 m | 0.62 / 0.08 | 0 % | 16.0 deg |
| F3 (south ridge) | (-1.75, -27.75) | 4.17 m | 2.8 m | 5.7 m | 33 deg | 29.2 m | 4.16 / 0.00 | 0 % | 15.0 deg |
| F4 (south-west) | (-20.75, -30.25) | 4.96 m | 1.6 m | 5.2 m | 32 deg | 42.0 m | 5.29 / 0.34 | 0 % | 20.0 deg |
| F5 (north-east mass) | (26.75, 31.25) | -1.44 m | 3.0 m | 8.3 m | 33 deg | 42.1 m | 0.40 / 1.85 | 0 % | 18.0 deg |
| F7 (east side, behind the butte mass) | (59.75, 1.75) | 1.51 m | 2.5 m | 6.1 m | 40 deg | 68.9 m | 3.98 / 2.48 | **56 %** | 20.0 deg |
Not listed: F6 (26.25, 49.75) 60.5 m, 0 %; F8 (56.25, 36.75) 74.1 m, 17 %. A spot "beside" a wall at 5 m distance (e.g. (9.25, 2.75), 10.1 m, 0 %) also exists. Nothing at a butte foot is farther than 74 m of path; the farthest reachable cell overall is 120.5 m (walk-terrain.md).

## 4. Is butte "M9a" (PIA20843) in the square?
NASA caption (https://science.nasa.gov/photojournal/butte-m9a-in-murray-buttes-on-mars, fetched today): Mastcam right, sol 1448 (1 Sept 2016), images taken from the site of the sol 1446 drive; butte top about 5 m above the rover and about 25 m east-southeast of it; left ridge > 40 deg, highest point right side about 30 deg.
| Step | Value |
|---|---|
| Rover at end of sol 1446 drive (MSL_waypoints.json, `data/raw/msl_wp.json`, through the stored walk transform) | scene (-161, +147) |
| M9a = rover + 25 m ESE | about (-138, +137) |
| Square | x, z in [-64, 64] |
| Result | **No: about 74 m west of the west edge and 73 m north of the north edge** |
Confidence: fairly sure (about 85 %) it is not in the square. Why: it rests on the caption offset (25 m is rounded, direction approximate) plus rover pose (a few metres) plus the mesh-to-DTM fit (2 m, 0.93 NCC); no combination of these errors reaches 70 m. Residual doubt: every rover pose of sols 1446-1452 is 130-190 m from the square (sol 1448 at (-151, +81), sol 1452 at (-132, +47)), yet Access Mars says the photos are 1-4 Sept; the square is nearest to the sol 1469-1475 poses (22 m beyond the west edge). So the mesh does not obviously show the place of the 1 Sept images. I did not match the butte shape to the mesh by eye.

## 5. Curiosity's named targets, sols 1448-1451 (1-4 Sept 2016)
| Target | Instrument | Sol | Source |
|---|---|---|---|
| Luxilo (bedrock) | ChemCam, Mastcam | 1448-1449 plan | https://science.nasa.gov/blog/sols-1448-1449-no-touch-just-go (Herkenhoff, 31 Aug 2016) |
| Caxito (laminated exposure) | Mastcam right | 1448-1449 plan | same |
| "Sol 1446 AEGIS target" (unnamed) | Mastcam right (ChemCam AEGIS) | 1446/1449 | same |
| Benguela (bedrock) | ChemCam | 1450-1453 plan | https://science.nasa.gov/blog/sols-1450-1453-communication-challenges (Edgar, 2 Sept 2016) |
| Gabela (bedrock) | ChemCam | 1450-1453 plan | same |
| Butte mosaics, 360 deg Mastcam mosaic | Mastcam | 1451 | same |
| "Karasburg" (Murray-Stimson contact mosaic) | Mastcam | 1450-1453 | named in a search-engine summary only; the NASA page text I fetched does not contain it. Unconfirmed |
No MAHLI or APXS close-up (arm not moved: MAHLI dropped on 1448-1449, Odyssey pass lost 1450-1453). Not queried: PDS Analyst's Notebook (not reachable by plain fetch in the time; coordinates there are rover-frame/site-frame, not in mesh metres).
**Position transfer: not possible.** None of these targets has a position in our sources; the rover was 130-190 m from the square on those sols (section 4), so by the pose data none of them lies in the square. Only a generic wording ("bedrock at the foot of a butte") can be placed, via section 3.

## 6. Marias Pass for comparison
| Item | Result |
|---|---|
| Access Mars POIs (`index.html` lines 221-224) | 4: ARRIVAL (8.85, -0.65, 5.60), BUCKSKIN (6.1, -0.3, 22), SELFIE (10.8, -0.4, 19.4), CONJUNCTION (2.16, -1.17, 4.88) |
| Buckskin card text | "A sample drilled here showed high levels of silica ... traces of the mineral tridymite"; photo `img/cards/mp2.jpg` |
| glb | yes: `data/raw/am/marias_pass/terrain.glb` (577,876 B), full folder `data/raw/amrepo/public/terrain/marias_pass/` |
| Grids, reachability | not computed (not asked) |

## Candidate spots
Kind: AM = Access Mars point, T = derived from terrain (butte-foot rule of section 3), no real Curiosity target is placeable. Path from rover in metres, one way (grid method, 20 deg rule).

| Id | What it is | Position x, z (m) | Path | Climb | Radio shadow | Source | Photo | Kind |
|---|---|---|---|---|---|---|---|---|
| A1 | Foot of the buttes next to the marker "Buttes" | (12.75, 7.75) | 15.6 | 0.86 | 0 % | `index.html` mb1, grid | `mb1.jpg` | AM (nearest reachable cell) |
| A2 | Below the Monument Valley wall (layered butte wall) | (15.25, 1.75) | 16.3 | 2.62 | 0 % | `index.html` mb3, grid | `mb3.jpg` | AM (nearest reachable cell) |
| A3 | "Bruce Murray" marker, low ground south-west | (-10.75, -12.75) | 17.7 | 1.25 | 0 % | `index.html` mb2, grid | `mb2.jpg` (historic portrait, not a Mars image) | AM |
| A4 | "Interference" marker, west edge | (-63.25, 35.25) | 78.2 | 0.40 | 0 % | `index.html` mb4, grid | `mb4.jpg` | AM |
| F1 | Butte foot, east butte | (13.25, -0.25) | 13.8 | 2.16 | 0 % | grid | none | T |
| F2 | Beside the same wall, 9 m north | (12.25, 8.75) | 15.5 | 0.62 | 0 % | grid | none | T |
| F3 | Foot of the south ridge | (-1.75, -27.75) | 29.2 | 4.16 | 0 % | grid | none | T |
| F4 | Foot of the south-west wall | (-20.75, -30.25) | 42.0 | 5.29 | 0 % | grid | none | T |
| F5 | Foot of the north-east butte mass | (26.75, 31.25) | 42.1 | 0.40 | 0 % | grid | none | T |
| F7 | East side, behind the butte mass | (59.75, 1.75) | 68.9 | 3.98 | 56 % | grid | none | T |
Real targets (Luxilo, Caxito, Benguela, Gabela): none placeable in the square, see section 5.

Does Murray Buttes have at least three reachable candidates with different cost: **yes** (13.8 m / 0 % shadow, 42 m / 5.3 m climb, 68.9 m / 56 % shadow, all derived or marker-based; none is a real Curiosity target).
