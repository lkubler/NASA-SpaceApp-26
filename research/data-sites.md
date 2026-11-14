# Access Mars sites, target positions, and HiRISE DTM coverage (data-scout, round 5)

Everything below was tested on Sat 14.11. ~13:30 (scripts were throwaway; raw files in `data/raw/`, not committed).
Sources: Access Mars repo https://github.com/googlecreativelab/access-mars (cloned, glb parsed by hand), MSL waypoints https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json, HiRISE DTM cumulative index https://hirise-pds.lpl.arizona.edu/PDS/INDEX/DTMCUMINDEX.TAB plus Range reads of the DTM `.IMG` files.

## 1. Access Mars scenes (Apache-2.0, repo LICENSE verified; imagery is NASA/JPL)

All 4 sites exist, each as `public/terrain/<site>/terrain.glb` (+ `background.jpg`, `tiles/`). Raw URL pattern: `https://raw.githubusercontent.com/googlecreativelab/access-mars/master/public/terrain/<site>/terrain.glb` (HTTP 200 for all, CORS `*` tested earlier). A 5th scene `live_site` ("Current Location", Oct 3 2017) exists too.

| Site (folder) | glb size | Access Mars photo dates (index.html) | Tile mesh (64 tile nodes) | SIMPLE node | Relief in 128 m window |
|---|---|---|---|---|---|
| Murray Buttes (`murray_buttes`) | 565,548 B | Sep 1-4 2016 | 81,039 verts / 127,952 tris | 818 verts / 1,320 tris | -6.4 to +11.5 m |
| Marias Pass (`marias_pass`) | 577,876 B | May 22 - Aug 6 2015 | 83,797 / 132,422 | 798 / 1,301 | -9.8 to +6.4 m |
| Pahrump Hills (`pahrump_hills`) | 568,312 B | Feb 17 - Mar 11 2015 | 83,027 / 131,519 | 792 / 1,279 | -7.4 to +10.6 m |
| Landing Site (`landing_site`) | 551,508 B | Aug 7-26 2012 | 82,316 / 127,970 | 762 / 1,200 | -3.6 to +2.7 m |

Structure (identical in all four; inspected via glb JSON chunk, node names + accessor min/max):
- Node 0 root with scale 0.01 (the app multiplies by 100 -> units are metres; consistent with POI offsets such as "Buckskin at 6.1, -0.3, 22" placed in the scene).
- 64 `TILE` nodes, names like `..TYPE_TILE___ID_03333300___SIZE_256..` (quadtree ids; the `SIZE` is texture tile size). Together they cover exactly x,z in [-64, +64] m = **128 x 128 m**, centred on the scene origin. Textures are the external `tiles/*.jpg` (glb has no embedded images), so for our own use the glb gives geometry only and tiles must be fetched to texture it.
- **1 `SIMPLE` node** (`SIMPLEMETADATA______TYPE_SIMPLE`): low-poly collision mesh, ~800 verts / ~1,300 tris, same 128 x 128 m extent. Used by the app for collision/wireframe. Easy to sample onto a 0.5 m grid (256 x 256 cells) and robust for slope. Caveat: ~800 vertices over 16,384 m^2 is ~4.5 m spacing, so slopes from it are smoothed; sampling the 64 tile meshes (~80k verts, ~0.5 m spacing) gives the real 0.5 m detail. Recommend: height grid from tiles, SIMPLE only for cheap collision.
- 1 `BACKGROUND` node: 16.3-16.7k verts, spans +/-2048 m (4.1 x 4.1 km), height range up to ~ -114..+249 m (Murray). Useful as distant skyline; coarse.
- Gotcha: `asset.generator` is COLLADA2GLTF and the app uses a custom C4D metadata loader (node names carry the type). Plain three.js GLTFLoader loads it; filter by node name containing `SIMPLE` / `BACKGROUND` / `TILE`.
- Up axis is Y; ground plane is X/Z. Height values were checked only as bbox, not visualised.

Georeferencing: **none in the glb** (extras null, no lat/lon, no rover position, no sol). The repo has no coordinates either (grep of src and index.html: only photo date ranges and POI offsets in scene metres). The scene origin must be inferred from the rover track (next section). Heading/rotation of the scene vs. north is also undocumented (needs visual match of buttes vs HiRISE ortho; humans' optional step already in notes).

## 2. Rover positions and named targets

MSL waypoints file exists (1389 waypoints, sols 3 to 5073, 665 KB, 200 OK, fields site/drive/sol/lon/lat/elev_geoid/roll/pitch/yaw; traverse line `MSL_traverse.json` 1.36 MB also 200). Sol-to-scene mapping: Access Mars date range converted to sols (sol N ~ Aug 6 2012 + 1.0275 N days; ~ +/- 3 sols).

Method: take the waypoint mean over the scene's sol range as an estimate of the scene origin (confidence for origin: medium-low, +/- ~30 m, because we do not know which spot Google centred on), then compute metre offsets of the target sols (Mars radius 3396.19 km). Target sols are from my memory of the mission timeline, not re-verified except those named in the notes' sources; marked.

| Target | Site | Position estimate vs. scene origin | Inside 128x128 (+/-64 m)? | Confidence |
|---|---|---|---|---|
| Quela drill (Murray Butte 12), rover parked sol 1455-1468, wp 137.353006E -4.695202 | Murray Buttes | about 72 m S of mean of sols 1446-1452 (E -10, N -71); scene sols 1446-1455 span N -82..+56 m | **Borderline**. Inside only if the origin is near the southern part of the scene sols; outside if centred on the mean | Low. Access Mars photo dates (Sep 1-4 2016 = sols ~1447-1450) end before Quela sols (1455+). Do not promise Quela as inside; present it as "next to" the area, or make it the ground-control request and place the target by DTM coordinates, not mesh |
| Goulburn | Bradbury | within ~15 m of landing wp (sols 3-22 stay in E 0..15 m) | Yes | Medium-high (Goulburn is at the landing site; position from notes' source, not re-verified) |
| Link | Bradbury | rover was ~50-85 m SE of landing by sols 26-29 (E 50..74, N -17..-39) | Probably yes if the origin is east of landing; marginal at the SE corner | Low-medium |
| Hottah | Bradbury | rover ~100 m SE by sol 38 (E 99, N -46) | **Likely no** (>64 m from landing) unless origin shifted ~50 m SE | Low |
| Confidence Hills (drill sol ~759) | Pahrump | 49 m N of the mean of sols 896-926 (E 5, N 49) | Yes (marginal at N edge) | Medium; but Access Mars photos are sols ~900-925, ~140 sols later, so the scene is centred near Telegraph Peak, and the first drill is the farthest target |
| Mojave 2 (drill sol ~882) | Pahrump | E 4, N 39, dist 39 m | Yes | Medium |
| Telegraph Peak (drill sol ~908) | Pahrump | E 4, N 0, dist 4 m | Yes (it is the origin estimate) | Medium-high |
| Buckskin (drill sol ~1060) | Marias Pass | E 12, N -2, dist 12 m | Yes | **High**: the Access Mars POI "BUCKSKIN" is at scene (6.1, -0.3, 22), i.e. inside the scene, direct evidence |

Other direct evidence from `public/index.html` POIs (scene metres, x y z): Murray Buttes: buttes (13.8,1.2,6.9), "Monument Valley" (21,6.2,3.7), "Bruce Murray" (-10.6,1.8,-12.9); Pahrump: "DRILL SITE" (6.98,1.13,-5.61), "ARRIVAL" (1.9,1.0,-3.9) (the drill site POI is generic, can't tell which of the three drills); Marias: arrival (8.85,-0.65,5.6), selfie (10.8,-0.4,19.4), conjunction (2.2,-1.2,4.9). Landing: no named-target POIs.

Honest summary: Buckskin (high), Telegraph Peak / Mojave 2 / Confidence Hills (medium) and Goulburn (medium-high) fit. Quela, Link and Hottah are doubtful. Suggestion (a decision for the humans, not made here): for Murray, name the target generically ("butte base, Stimson/Murray contact") or place Quela outside the walk zone as the rover-route end point; for Bradbury, use Goulburn (+ Link as stretch).
Also: the rover position file only gives the rover, not target coordinates; for exact target positions use PDS Analyst's Notebook / PLACES, not tested here (no time).

Waypoint refs (lon E, lat, elev_geoid): Bradbury sol 3 = 137.441633, -4.589467, -4501.0. Pahrump sols 896-926 ~ 137.3774, -4.6632..-4.6638, -4453. Marias sols 1042-1056 ~ 137.3701, -4.6680, -4447. Murray sols 1446-1452 ~ 137.3531, -4.6941..-4.6948, -4384. Straight distance Bradbury to Murray ~8 km, so a single walkback rule of 10 km is ok for rover routes between them.

## 3. HiRISE DTM coverage (risk 2)

Searched the cumulative DTM index (12,761 rows) for footprints around Gale; tested actual pixels with Range reads (valid vs. no-data 0xFF7FFFFB), 1 m/px, planetocentric equirectangular.

| DTM product (ID) | Valid at | Notes |
|---|---|---|
| `DTEEC_009650_1755_009716_1755_U01` (833 MB, PSP, 2008) | Murray/Quela valid (-4375 m); Pahrump and Marias are in the bbox but **no-data** (east edge, bbox is not data) | the one in research/data.md |
| `DTEEC_040770_1755_039280_1755_U01` (12238 x 6300 px) | **Pahrump, Marias, Murray, Quela all valid**; Bradbury **no-data** | best single product for 3 of 4; 3x3 km window valid fraction: Pahrump 1.00, Marias 0.99, Murray 0.72 |
| `DTEEC_018854_1755_018920_1755_U01` (15040 x 7075 px) | **Bradbury, Pahrump, Marias valid**; Murray no-data | 3x3 km valid fraction: Bradbury 0.65, Pahrump 0.86, Marias 0.70, Murray 0.37 |
| `DTEEC_010573_1755_010639_1755_U01`, `DTEEC_023957_1755_024023_1755_U01`, `DTEEC_009505_1755_009571_1755_U01` | cover Bradbury by bbox (not pixel-tested) | alternatives for Bradbury |
| `DTEEC_009149_1750_009294_1750_U01` | none of the sites (starts E of Murray) | ignore |

Also available: 0.25 m orthoimages per DTM (listed in index). Paths pattern `https://hirise-pds.lpl.arizona.edu/PDS/DTM/<PSP|ESP>/ORB_xxxxxx_xxxxxx/<pair>/<DTEEC...>.IMG` (Range reads work, PDS3 header 25-33 KB, float32 LE, row stride = samples x 4, data offset = (^IMAGE-1) x RECORD_BYTES).

Answer to risk 2: no single DTM covers all four, but two do: **ESP_040770 pair for Murray + Marias + Pahrump** and **ESP_018854 pair for Bradbury (+ Pahrump/Marias)**. Murray has partial no-data (72% of a 3 km window valid), so a rover route there must stay in the valid area; mask no-data as impassable or fill with a coarser fallback (CTX/MOLA, label as lower resolution). Elevation sanity: DTM -4375 m at Murray vs rover geoid elevation -4380 (consistent within ~5 m; Bradbury DTM -4492 vs rover -4501, ~9 m offset: different datums, irrelevant for slope).
Caveat: sample-column mapping used simple rounding without +/-0.5 px offsets; error <2 m, fine for coverage checks. Sizes: not measured for the two new .IMG files (about 12238 x 6300 x 4 = 308 MB and 15040 x 7075 x 4 = 426 MB by arithmetic; only windows needed via Range).

## Recommendation (smallest set for the prototype)
1. Access Mars `terrain.glb` x4 + `tiles/` per site (Apache-2.0, ~0.6 MB glb each; tile JPGs for texture). Walk grid: sample tile meshes to 0.5 m (256 x 256).
2. MSL_waypoints.json (0.7 MB) for the dashboard markers and rover start positions.
3. DTM windows (Range reads, 3 x 3 km each) from `DTEEC_040770...` (Murray, Marias, Pahrump) and `DTEEC_018854...` (Bradbury). Preprocess offline to small grids; commit only the samples.
4. Marker position in dashboard = waypoint estimate above; mark +/- 30 m uncertainty; rotation of the mesh is unknown.
