# Salvage: what version 1 left behind

Version 1 was removed from `main`. All of it is in the git tag **`archive-v1`**. Nothing here is required; take a piece only when a beat in `PLAN.md` needs it.

Get a file back: `git checkout archive-v1 -- <path>`
Read without restoring: `git show archive-v1:<path>`
List: `git ls-tree -r --name-only archive-v1 <dir>`

The raw downloads (754 MB) are still on this machine in `data/raw/` (git-ignored, not in the tag).

## Worth taking

### Prepared data: `app/public/data/murray/` (about 6 MB) and `app/public/murray/` (about 5 MB)
| File | Content |
|---|---|
| `murray.json` | Every grid size, encoding, and the mesh-to-DTM transform. Read it instead of hard-coding |
| `dtm_height.u16.bin`, `dtm_slope.u8.bin`, `dtm_hillshade.png` | HiRISE DTM crop, 1024 x 1024 at 1.01 m (about 1 km), 97 % valid |
| `ortho_1024.jpg`, `ortho_2048.jpg` | HiRISE orthoimage on the same grid |
| `walk_height.i16.bin`, `walk_slope.u8.bin` | Access Mars mesh sampled at 0.5 m, 256 x 256 (the 128 m walk square) |
| `regional_*` + `regional.json` | 4 km area at 5 m cells (82 % valid, void in the west) |
| `curiosity_track.json` | 27 Curiosity waypoints, sols 1398 to 1475, in map pixels |
| `photos/*.jpg` + `credits.json` | 6 Curiosity photos (Marimba, Quela, buttes, cross-bedding) with credit lines |
| `app/public/murray/terrain.glb`, `tiles/`, `background.jpg` | Access Mars Murray Buttes mesh and textures, with LICENSE and ATTRIBUTION |
| `app/public/draco-old/` | The 2017 Draco decoder the mesh needs |

### Preprocessing: `scripts/preprocess/` (Python: numpy, Pillow, DracoPy; no GDAL)
`README.md` there documents every step and file format. `fetch_dtm.py` (range-read a DTM window), `access_mars_grid.py` (mesh to height grid), `align.py` + `refine.py` (fit the mesh to the DTM), `build_murray.py`, `build_ortho.py`, `build_track.py`, `build_photos.py`, `build_regional.py`. Needed again only for another site.

### Models: `app/src/model/` (plain JS modules, no dependencies, with tests)
| File | Does |
|---|---|
| `reserve.js` | Energy per route point (Pandolf/Santee, suit offset, Mars gravity), cost of getting home, turn-back point |
| `comms.js` | Line of sight over a height grid; viewshed in about 0.1 s for 512 x 512 |
| `mars24.js` | Sun position for a place and time on Mars, tested against NASA's examples |
| `rad.js` | Dose from time on the surface |
| `speed.js` | Walking speed from slope |
| `sensitivity.js` | How the reserve changes when one input changes |
Run tests: `node --test app/src/model/*.test.js`

### Routing: `app/src/map/planner.js` (A* on a slope grid, 20 deg hard limit), `home.js` (best path home from every point).

### 3D walk: `app/src/walk/oldDraco.js` (loader wrapper for the old Draco mesh), `walkView.js` (first-person camera, ground height), `route3d.js` (route drawn on the terrain), `sky.js` (sun and dust look), `terrain/heightmap.js`.

## Leave behind
- The screens: `app/src/map/mapView.js` (738 lines, the dashboard), `ui/`, `styles/`, `walk/hud.js`, `map/timeline.js`. They are the part that did not communicate.
- `map/scenario.js`: the 5.9 km default plan. It was tuned to make numbers interesting and no longer matched the 128 m walk.
- `docs/design.md`: the v1 design system.
- `tasks/`, `docs/rounds.md`, `research/jury-*.md`, `research/ux-*.md`: process records.

## Gotchas already paid for
- The Emscripten Draco module object is thenable. Resolving a Promise with it hangs forever; resolve with a flag.
- Access Mars mesh: root scale must be 100; texture `flipY = false`; the scene is mirrored relative to a map.
- `git pull --rebase` flattens merge commits. On `main` use `git fetch && git merge origin/main`.
- Headless Chrome only has software rendering (3 to 20 FPS). It says nothing about real performance.
- A canvas that is hidden at 0 x 0 throws on `drawImage`.
- The relay position search blocked the page for 2 to 4 s. Long computations need a busy state or a worker.
- The deploy workflow was `.github/workflows/pages.yml` (GitHub Pages from `app/dist`). It was removed with the app; restore it when there is something to deploy.
