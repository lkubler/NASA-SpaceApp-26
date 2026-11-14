# Spike: 3D walk on Access Mars Murray Buttes (builder)

Branch `spike-3d`, code in `spike-3d/` (Vite + Three.js 0.170, static build). Run: `cd spike-3d && npm i && npm run dev` (or `npm run build && npx vite preview`). Screenshot: `research/spike-3d.png` (headless Chrome, software GL). Headless check script: `spike-3d/check.mjs`.

## Verdict: GO

The walk is viable on the planned stack. All four spike goals work; the same terrain feeds walk, slope and HUD.

## What works (verified headless, 0 console errors/warnings, 0 failed requests)
1. **glb + textures**: loads, 64 tile meshes, 127,952 tris, 64/64 tile JPGs applied (UV flipY=false). Murray Buttes skyline visible. `npm run build` OK (~2 s).
2. **First-person**: WASD/arrows + pointer-lock mouse, Shift = run, eye height 1.7 m, ground height by raycast down on the 64 tile meshes only (SIMPLE hidden). Speed multiplier from the heightmap gradient in travel direction: uphill 1 - 0.0375*deg (min 0.25), downhill up to 1.15. Headless walk test from one point in 4 directions: 0.71 m/s uphill (13 deg) vs 1.44 / 1.57 m/s on flatter/downhill headings (base 1.4 m/s).
3. **Heightmap**: 256 x 256 cells @ 0.5 m (128 x 128 m), built by rasterising world-space tile triangles (not by 65k raycasts): **~36-52 ms** in software-GL headless Chrome (CPU-bound JS, so about the same on a real machine). 2 holes of 65,536 cells (filled from neighbours). Height range -6.40 to +11.49 m, matching `research/data-sites.md`. Grid vs raycast over 2,000 random points: mean abs diff 3 mm, max 0.11 m (cell-size effect on steep rock). Walk raycast vs grid max diff 0.08 m.
   Slope stats over the whole area (+-1 m central difference): median 7.8 deg, p95 34 deg, max 58 deg. So the area has many steep rock faces; hazard thresholds (e.g. warn > 15-20 deg) will be hit often, planner needs to route around them.
   HUD shows slope deg and %, speed and its multiplier, position, height, FPS, heightmap time.
4. **Lighting**: directional sun with 2048 shadow map following the player (+-40 m), hemisphere light, reddish background and exp fog. Sun vector is a placeholder; Mars24 / pyMarsTime can feed it later.

## Findings and problems (important for the real build)
- **Draco blocker (solved)**: the glb uses `KHR_draco_mesh_compression` from 2017. Modern three.js `DRACOLoader` fails with "Unsupported minor version". Fix: use the original decoder from the Access Mars repo (`public/third_party/draco/draco_wasm_wrapper.js` + `draco_decoder.wasm`, Apache-2.0), wrapped in `spike-3d/oldDraco.js` which implements the one method GLTFLoader calls. Gotcha: the Emscripten module object is thenable, so resolving a Promise with it hangs forever; resolve with a flag instead. Cost me most of the time.
- **Units**: geometry is already in metres. The glb root node carries a 0.01 scale that the original app undoes with x100. We set `root.scale = 100`. Without it everything is 0.01 size (flat, +-0.03 m).
- **SIMPLE vs tiles**: SIMPLE mesh deviates from the detailed tiles by mean 4.7 cm, max 25 cm in height at 400 random points. Height is fine; slope from SIMPLE would still be smoothed. Use tiles for the heightmap as planned.
- Tile mesh density varies (e.g. outer tiles ~175 vertices); the 0.5 m grid is only fully resolved near the centre. Slopes at the 128 m edge are coarser.
- The scene has no georeference; no rotation/north known (unchanged from data-sites.md).
- Tile textures are the plain `ID.jpg` (4.3 MB for all 64 + background). The `_lg` variants (14 MB total) are available for close-up quality if wanted. Committed assets in `spike-3d/public/murray/` (4.3 MB) with LICENSE + ATTRIBUTION.txt.
- Footstep jitter: eye height uses simple exponential smoothing (no jitter seen in the headless test, not tested by hand with a real mouse).

## FPS
Headless Chrome only has software GL (SwiftShader): 3-20 FPS at 1280x720, **not representative**. Estimate on any normal laptop GPU: scene is 64 draw calls, 128k tris + a 16k-tri background + one shadow pass (another ~64 draw calls); well within budget for 60 FPS. Per-frame CPU: 1 raycast against 64 meshes (bounding-sphere culled) + 4 bilinear lookups, negligible. Not measured on real hardware, so please run it once on a human machine.

## Not done / next steps
- Collision against steep walls (currently the player can climb any slope; only speed is reduced) and the 128 m border is a hard clamp at +-63 m.
- Heightmap slope for the route planner is available now: `window.__spike.H` (Float32Array 256x256, row = z, col = x, origin -64 m), `gradient(x,z)`. Factor into a shared module when building for real.
- Visual polish, sky, dust, footsteps, HUD arrows are for the designer.
