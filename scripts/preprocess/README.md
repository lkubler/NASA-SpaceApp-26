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
