# Egress film kit

Renders the 11.7 s rover egress film (drive-in, orbit, push-in to hatch, first person).

## Files
- `egress_original.mp4` – the current film (placeholder terrain), as reference for shots and timing
- `rover_lib.py` – loads the SEV rover GLB (path set in `rover_mesh()`; point it at your copy of `Space_Exploration_Vehicle.glb`)
- `egress_scene.py` – terrain, rocks, sun, rover pose along the route
- `egress_render.py` – camera timeline (`shot(t)`), dust, shadows, post-processing
- `h.npy` – placeholder height map (1 m/px, rows = map y, cols = map x), multiplied by `EX = 1.6`
- `map_base.png` – ground colour, same size as `h.npy`
- `plan.json` – route in map pixels: `rover` polyline, `hand` (handover point), `walk` polyline

## Swapping in a real map
1. Convert the HiRISE DTM GeoTIFF to `h.npy` (float32, metres), resampled to 1 m/px. Set `EX = 1.0` for true heights.
2. Make `map_base.png` from the matching orthoimage (same size, tinted to Mars colours).
3. Put the real rover route, handover point and walking route into `plan.json` in the same pixel coordinates.
4. Shot D (first person) uses rover-local keyframes `key_x / key_z` and a yaw turn. Adjust these so the final view faces the walking route.

## Run
Set ROVER_GLB to the path of the rover model (default: Space_Exploration_Vehicle.glb next to the scripts).
pip install pyrender trimesh PyOpenGL==3.1.10 scipy pillow rtree
PYOPENGL_PLATFORM=egl python3 egress_render.py            # all frames -> egress_frames/
PYOPENGL_PLATFORM=egl python3 egress_render.py 36 120 215  # test frames -> egress_test/
ffmpeg -framerate 24 -i egress_frames/f%04d.png -c:v libx264 -crf 20 -pix_fmt yuv420p egress.mp4
