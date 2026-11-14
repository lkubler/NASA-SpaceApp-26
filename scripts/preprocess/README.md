# Terrain preprocessing (task 002)

Offline Python; outputs are committed in `app/public/data/murray/` (about 3.9 MB). Raw inputs live in `data/raw/` (git-ignored).
Needs `numpy`, `Pillow`, `DracoPy` (`pip install DracoPy`, decodes the 2017 Draco glb fine). No GDAL or scipy.

## Regenerate (run from the repo root)
```
python3 scripts/preprocess/fetch_dtm.py                       # HTTP Range read of the HiRISE DTM -> data/raw/dtm_window.npy (~25 s, 30 MB read)
python3 scripts/preprocess/access_mars_grid.py <terrain.glb> data/raw/am_grid.npy   # 0.5 m walk grid (~20 s)
PYTHONPATH=scripts/preprocess python3 scripts/preprocess/align.py --mirror --step 5 --near 300   # coarse FFT search (optional, shows the peak)
PYTHONPATH=scripts/preprocess python3 scripts/preprocess/refine.py                    # fine fit + error estimate -> data/raw/refine.json (~40 s)
python3 scripts/preprocess/build_murray.py                    # writes app/public/data/murray/*
```
`terrain.glb`: Access Mars `murray_buttes` (Apache-2.0), e.g. branch `spike-3d`, path `spike-3d/public/murray/terrain.glb`.

## Output files (`app/public/data/murray/`)
All binaries are little-endian, row-major, no header. `murray.json` holds every number below; read it instead of hard-coding.

### DTM crop (2D map, route planner): `dtm_*`
Source: HiRISE `DTEEC_040770_1755_039280_1755_U01` (NASA/JPL/University of Arizona/USGS, PDS, public domain).
| | |
|---|---|
| Size | 1024 x 1024 cells, 1.0118 m per cell (1/58585.55 deg), about 1.04 x 1.04 km |
| Origin | row 0 = north edge, col 0 = west edge, rows increase to the south. NW corner lon/lat in `murray.json` (`dtm.north_west_corner_lonlat`) |
| CRS | Mars planetocentric lon/lat (E+), equirectangular at lat0 = 0, sphere R = 3396190 m. Cells are square in metres |
| `dtm_height.u16.bin` | uint16: elevation m = `hmin + v * 0.005` (hmin = -4458, MOLA-geoid-based DTM elevation). **No-data = 65535** (HiRISE no-data 0xFF7FFFFB). 97% valid; the no-data part is the west edge (HiRISE stereo has no data there) |
| `dtm_slope.u8.bin` | uint8: slope deg = `v * 0.5`, central difference over 2 cells. **No-data = 255** (also next to no-data cells) |
| `dtm_hillshade.png` | RGBA hillshade (azimuth 315, altitude 40), alpha 0 where no-data. Quick basemap / debug view |

### Walk grid (3D walk, local planning): `walk_*`
Source: Access Mars `terrain.glb`, 64 TILE meshes (127,952 triangles), top-surface rasterised at cell centres, 2 holes filled from neighbours.
| | |
|---|---|
| Size | 256 x 256 cells, 0.5 m, extent 128 x 128 m centred on the scene origin |
| Frame | scene metres, Y up. `x = -64 + (col + 0.5) * 0.5`, `z = -64 + (row + 0.5) * 0.5` (row index runs along +z) |
| `walk_height.i16.bin` | int16 centimetres, scene height (range -6.40 to +11.49 m). No no-data cells |
| `walk_slope.u8.bin` | uint8: deg = `v * 0.5`, central difference over 1 m |
Matches the spike-3d heightmap (same range, same 2 holes).

## Access Mars -> DTM transform
The glb has no georeference. Found by matching height fields (zero-mean normalised cross-correlation, both fields high-passed with a Gaussian of sigma 8 m to remove the regional slope, 52 m radius disc, rotation steps of 5 deg then 0.1 deg, mirror and non-mirror tested). Parameters (also in `murray.json`, `transform_walk_to_dtm`):
```
east_m  =  cos(t) * x + sin(t) * z        t = 2.4 deg
north_m = -sin(t) * x + cos(t) * z
dtm_col = cx + east_m / 1.0118 ;  dtm_row = cy - north_m / 1.0118      (origin cell in crop px: col 498.25, row 499.75)
dtm_elev_m = scene_y + z_offset      z_offset = -4370.14 m
scene origin = lon 137.35562 E, lat -4.69565 (planetocentric)
```
Key facts:
- **The scene is mirrored**: scene +x = east, scene +z = **north**, Y up. (Access Mars exports are left-handed relative to a map; the non-mirror fit peaks at NCC 0.64 with no clear maximum, the mirror fit peaks at 0.93 with a sharp optimum.) The walk is nearly aligned with north: rotation 2.4 deg.
- Fit quality: NCC 0.934. Scale left free gives s = 1.00, so the 128 m extent is true metric size.
- **Error (about 1 sigma)**: position 2 m (up to 3 m at the patch edge because of rotation), rotation 1.5 deg, elevation offset std 1.1 m over the patch. Evidence: all parameter sets within NCC 0.02 of the optimum span rotation 0.4 to 4.4 deg and +-2 px in position; four independent half-patch fits (x<0, x>0, z<0, z>0) give rotation 2.4 to 3.9 deg and centres within 1.5 px. Overlay check on the hillshade shows the ridge lines and butte coincide.
- Absolute georeference is only as good as the DTM (HiRISE DTM absolute position about a few m vs. MOLA/rover; not independently checked). Relief in the Access Mars mesh is about 20% lower than the DTM (std ratio 1.25 DTM/scene): the mesh is smoother. Use the DTM for slope on the 2D map; use the walk grid only in the 3D area.
- The data-scout estimate of the origin (waypoint mean for sols 1446-1452) is 149 m E and 68 m S of the fitted origin, i.e. outside its stated +-30 m. Trust the fit. The Quela drill site (rover waypoint lon 137.353006, lat -4.695202) lies about 155 m west and 27 m north of the scene origin, outside the +-64 m walk square, so only the DTM covers it.
- Quantisation: DTM height 5 mm, slope 0.5 deg, walk height 1 cm.

# Orthoimage, Curiosity track, station photos (task 016)
Added files in `app/public/data/murray/` (about 1.7 MB): `ortho_1024.jpg` (251 KB), `ortho_2048.jpg` (693 KB), `curiosity_track.json` (5 KB), `photos/*.jpg` + `photos/credits.json` (about 0.74 MB).

## Regenerate (repo root)
```
curl -o data/raw/ortho/ESP_040770_1755_RED_A_01_ORTHO.JP2 https://hirise-pds.lpl.arizona.edu/PDS/DTM/ESP/ORB_040700_040799/ESP_040770_1755_ESP_039280_1755/ESP_040770_1755_RED_A_01_ORTHO.JP2   # 294 MB, ~1 min
python3 scripts/preprocess/build_ortho.py     # ~50 s, Pillow JPEG2000 decode at reduce=1 (needs ~2 GB RAM)
python3 scripts/preprocess/build_track.py     # downloads MSL_waypoints.json to data/raw/msl_wp.json if missing
python3 scripts/preprocess/build_photos.py    # downloads 6 images, resizes to <= 900 px, writes credits.json
```
## Orthoimage
- Source: HiRISE `ESP_040770_1755_RED_A_01_ORTHO` (the ortho made with the same stereo pair and the same uncontrolled `_01` series as `DTEEC_..._U01`). Credit: NASA/JPL/University of Arizona (HiRISE, PDS public data). Grayscale RED band, 0.2529 m/px, same equirectangular frame (lon0 137.39, lat0 0) as the DTM, exactly 4x finer, so the crop is an integer window.
- `ortho_1024.jpg`: 1024 x 1024, **pixel for pixel the same grid as `dtm_*`** (row 0 = north, col 0 = west). `ortho_2048.jpg`: same footprint at 2x (0.506 m/px); use it for zoomed views. Draw both over the same 1024 x 1024 coordinate box (scale the 2048 one by 0.5).
- Black strip along the west edge (and the slanted edge) is the stereo no-data region, 0 value, same as DTM no-data.
- Brightness is the real I/F image under its own sun angle (shadows differ from our hillshade). Do not mix its shadows with a computed hillshade without noting it.
- Alignment check (images in `data/raw/ortho/`, not committed): the west no-data edge of the ortho vs. the DTM no-data edge differs by 0 px in 11 of 16 sampled rows, by -1 to -2 px (1 to 2 m) in the others. `overlay_zoom.png` draws the DTM 25 deg slope contour on the 2048 ortho: it rings the butte caps and flanks within about 2 to 4 ortho px (1-2 m) on all ~12 buttes in the view. A cross-correlation of hillshade against ortho was not usable (different lighting, NCC 0.2). Verdict: aligned within about 2 m, as good as the DTM's own relative accuracy.
## Curiosity track
- Source: `https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json` (NASA/JPL public), one position per drive end. 27 waypoints for sols 1398 to 1475; only 20 (sol 1414 onwards) fall inside the 1 km DTM crop, sols 1398-1412 are north of it (`in_crop: false`, negative `row`). Total path length inside the file's window about 957 m (straight lines, a lower bound).
- Format: `points[] {sol, site, drive, lon, lat, elev_m, dist_total_m, col, row, in_crop}` (col,row in DTM crop pixels, not rounded to cells), `stations[]` Marimba (sol 1417) and Quela (sol 1455).
- Registration check: the waypoint elevations vs. the DTM heights at the same pixel differ by a constant 7.4 m (vertical datum difference) with std 3.7 m; shifting the track by up to +-30 px does not improve it materially (best std 3.2 m), so the track is used unshifted. The `lat` convention (planetocentric vs graphic) was not independently proven, the check above shows no visible offset.
## Photos
See `photos/credits.json` (each entry: id, station, sol, camera, credit, source_url, file, license). License basis: JPL Image Policy (`jpl.nasa.gov/imagepolicy`): "may be used for any purpose without prior permission", credit line "Courtesy NASA/JPL-Caltech" unless the caption says otherwise; no NASA/JPL logos; do not imply endorsement. For the Mastcam and MAHLI frames the NASA captions credit "NASA/JPL-Caltech/MSSS" (verified on the science.nasa.gov page for PIA21042); MSSS's own policy asks for commercial-use permission, not relevant to a non-commercial hackathon. Raw frames carry no caption, so the credit for them follows the same convention; the raw-image site was not machine-readable for an explicit rights statement (the page returned only a title), so say "raw, unprocessed" in the UI.

# Regional layer (~4 km), `build_regional.py`
Same DTM as `dtm_*`, block-averaged 5 x 5 (5.059 m cells, 800 x 800 = 4.05 km) so it is an exact multiple of the 1 km grid. Files in `app/public/data/murray/`: `regional_height.u16.bin`, `regional_slope.u8.bin` (same encodings as `dtm_*`, slope over 2 cells = 10 m), `regional_hillshade.png`, `regional_ortho.jpg` (same grid, 1 m ortho resampled), `regional.json` (grid, nodata, quadrant validity, `relation_to_1km_grid`). Total about 2.4 MB.
Relation: `col_1km = col_reg*5 - 700`, `row_1km = row_reg*5 - 1488` (cell corners; centres: `(c+0.5)*5 - 700 - 0.5`). The 1 km crop lies at regional cols 140-345, rows 298-502.
```
python3 scripts/preprocess/build_regional.py   # HTTP Range read of 4000 DTM rows (~100 MB, cached in data/raw/regional_window.npy); needs the ortho JP2 from build_ortho.py (~1 min)
```
Block mean: cells with under half valid sub-pixels are no-data. Grid cannot be centred on the crop: the DTM west edge (DTM col 0) cuts it, so it is shifted east.

# Gale crater (step 1 crater view), `build_gale.py`
`python3 scripts/preprocess/build_gale.py`: HTTP Range read (~11 MB, cached in `data/raw/gale/`) of MOLA MEGDR 128 px/deg topography `megt00n090hb.img` (NASA PDS Geosciences Node, public domain) -> `app/public/data/gale/gale_height.i16.bin` (464 x 464 int16 m above the MOLA areoid, 463 m/px, lon 136.0-139.625 E, lat -3.5625 to -7.1875, row 0 = north) and `gale.json` (grid, bounds, site pixels of Murray Buttes, Marias Pass, Pahrump Hills, Mount Sharp = highest cell of the central mound, credit).

# Gale crater from the HRSC 3D model (step 1 crater view), `build_gale_hrsc.mjs`
`node scripts/preprocess/build_gale_hrsc.mjs` (Node, no packages). Input: NASA Science 3D Resources "Gale Crater" STL
(https://science.nasa.gov/3d-resources/gale-crater/, from HRSC on ESA Mars Express, data K. Gwinner, J. Oberst, R. Jaumann,
G. Neukum, ESA/DLR/FU Berlin), saved as `data/raw/gale-hrsc-stl/gale-crater-hrsc.stl`. The STL has no map coordinates:
its top surface is rasterised at 0.2 mm, then scale, offset and orientation are searched for the best height correlation
with the MOLA grid above (`gale.json`), and heights are converted to metres by a linear fit. Result: north up, 1.935 km/mm,
676 m/mm (the print's 3x exaggeration), r = 0.999. Writes `app/public/data/gale/gale_hrsc.i16.bin` (537 x 713 int16 m,
387 m/px) and `gale_hrsc.json` (same format as `gale.json`, plus `fit`, recomputed site pixels and Mount Sharp).

# Gale crater surface colour, `build_gale_color.mjs`
`node scripts/preprocess/build_gale_color.mjs` (after `build_gale_hrsc.mjs`; Node, no packages). Samples the colour
texture of the NASA/JPL-Caltech Mars 3D model (`app/public/models/mars.glb`, the opening globe) over the bounds of
`gale_hrsc.json`, so the crater view has the globe's colours and the zoom from globe to crater has no colour jump.
Model longitude + 88.3 deg = east longitude (Gale's dark floor and wind streak on the texture; Hellas, Syrtis Major and
Olympus Mons agree within 2 deg). Writes `app/public/data/gale/gale_color.rgb.bin` (192 x 255 RGB, row 0 = north) and
adds `color` to `gale_hrsc.json`. The texture holds about 6 pixels per degree, so the colour is coarse; the relief comes
from the height grid.

# SEV rover model (walk), `app/public/models/sev.glb`
Source: NASA Science 3D Resources, "Space Exploration Vehicle", credit NASA/LaRC/Advanced Concepts Lab,
https://science.nasa.gov/3d-resources/space-exploration-vehicle/ (glTF download `Space Exploration Vehicle.glb`,
22,431,576 bytes, sha256 `09dcfbd45a475440de4ca2405fe3be4f784dee6f12e752bad5faa9f6db6c4a8d`, 413,198 triangles, Draco,
4096 px webp textures). Result: 1,269,744 bytes, 85,062 triangles, 1024 px webp textures, EXT_meshopt_compression
(decoded in the app by three.js' `MeshoptDecoder`, no extra files). Geometry and textures are otherwise unedited.
The tools run outside the app (not app dependencies), in a scratch folder:
```
npm i @gltf-transform/cli@4            # also brings @gltf-transform/core, extensions, functions and meshoptimizer
G=./node_modules/.bin/gltf-transform
$G prune  sev_orig.glb a_prune.glb    # decodes Draco, drops 3 unused PNG copies of the textures
$G weld   a_prune.glb b_weld.glb
$G resize b_weld.glb d_full.glb --width 1024 --height 1024
node simplify_uv.mjs d_full.glb u_02.glb 0.2 0.002   # 413,198 -> 85,062 triangles (stops at error 0.002)
$G meshopt u_02.glb sev.glb
```
`gltf-transform simplify` was not used: it tore the texture seams (stretched stripes on the rear plate). `simplify_uv.mjs`
uses meshoptimizer's attribute-aware simplifier so UVs and normals are kept:
```js
// node simplify_uv.mjs <in.glb> <out.glb> <ratio> <error>
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS } from '@gltf-transform/extensions';
import { compactPrimitive } from '@gltf-transform/functions';
import { MeshoptSimplifier } from 'meshoptimizer';

const [, , src, dst, ratioS, errorS] = process.argv;
const ratio = Number(ratioS), error = Number(errorS);
await MeshoptSimplifier.ready;
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
const doc = await io.read(src);
for (const mesh of doc.getRoot().listMeshes()) for (const prim of mesh.listPrimitives()) {
  const pos = prim.getAttribute('POSITION').getArray();
  const uv = prim.getAttribute('TEXCOORD_0').getArray();
  const nrm = prim.getAttribute('NORMAL').getArray();
  const n = pos.length / 3;
  const attr = new Float32Array(n * 5);
  for (let i = 0; i < n; i++) attr.set([uv[2 * i], uv[2 * i + 1], nrm[3 * i], nrm[3 * i + 1], nrm[3 * i + 2]], i * 5);
  const idx = new Uint32Array(prim.getIndices().getArray());
  const target = Math.floor((ratio * idx.length) / 3) * 3;
  const [out, err] = MeshoptSimplifier.simplifyWithAttributes(idx, pos, 3, attr, 5, [4, 4, 0.5, 0.5, 0.5], null, target, error, []);
  prim.getIndices().setArray(out);
  compactPrimitive(prim);
  console.log(`${mesh.getName()}: ${idx.length / 3} -> ${out.length / 3} triangles, error ${err.toFixed(5)}`);
}
await io.write(dst, doc);
```
Model frame: Y up, windows toward +Z, docking hatches on both sides (±X). The app scales it to 4.5 m length (2008 SEV
design, en.wikipedia.org/wiki/Space_Exploration_Vehicle; assumption, no primary NASA figure found) and turns it to face
the rover heading. Measured on the model at that scale (bounding box and wheel/hatch vertices) and kept in
`app/src/steps/4-walk/display.js`: 4.50 x 3.08 x 3.02 m; wheel contact axles at +0.95, -0.35, -1.65 m along the axis,
about 1.3 m out to each side; hatch centre 0.29 m forward of the centre, 1.71 m high, opening radius about 0.58 m.
Note: at 4.5 m length the model's wheelbase is about 2.6 m and its wheels about 0.81 m, while the same Wikipedia page
gives 4 m and 0.99 m; the length was kept because it also matches the stated 3 m height.
