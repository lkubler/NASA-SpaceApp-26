#!/usr/bin/env python3
"""Write the compact Murray Buttes terrain products to app/public/data/murray/.

Inputs (from the other scripts, all in data/raw/): dtm_window.npy/.json, am_grid.npy, refine.json
Run from the repo root:  python3 scripts/preprocess/build_murray.py
Outputs: see scripts/preprocess/README.md
"""
import json, math
from pathlib import Path
import numpy as np
from PIL import Image

OUT = Path("app/public/data/murray")
RAW = Path("data/raw")
M_PER_PX = 1.0117630165416
RES, LINE_OFF, SAMPLE_OFF, LON0 = 58585.55467457, -268515.50000001, 3212.5, 137.39
R_MARS = 3396190.0
CROP = (700, 1050, 1024, 1024)  # col0, row0, width, height within dtm_window
H_Q, H_NODATA = 0.005, 65535    # metres per count (uint16)
S_Q, S_NODATA = 0.5, 255        # degrees per count (uint8)


def slope_deg(h, cell, edge=False):
    """Central-difference slope (deg); nan where any of the 4 neighbours is nan."""
    p = np.pad(h, 1, mode="edge") if edge else np.pad(h, 1, constant_values=np.nan)
    gx = (p[1:-1, 2:] - p[1:-1, :-2]) / (2 * cell)
    gy = (p[2:, 1:-1] - p[:-2, 1:-1]) / (2 * cell)
    return np.degrees(np.arctan(np.hypot(gx, gy)))


def hillshade(h, cell, az=315, alt=40):
    p = np.pad(h, 1, mode="edge")
    gx = (p[1:-1, 2:] - p[1:-1, :-2]) / (2 * cell)
    gy = (p[2:, 1:-1] - p[:-2, 1:-1]) / (2 * cell)  # rows go south
    az_r, alt_r = np.radians(az), np.radians(alt)
    # surface normal (-dz/dx_east, +dz/dy_north-ish): north = -row direction
    nx, ny, nz = -gx, gy, np.ones_like(gx)
    nrm = np.sqrt(nx ** 2 + ny ** 2 + 1)
    lx, ly, lz = np.sin(az_r) * np.cos(alt_r), np.cos(az_r) * np.cos(alt_r), np.sin(alt_r)
    return np.clip((nx * lx + ny * ly + nz * lz) / nrm, 0, 1)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    win = np.load(RAW / "dtm_window.npy")
    wmeta = json.load(open(RAW / "dtm_window.json"))
    ref = json.load(open(RAW / "refine.json"))
    c0, r0, w, h = CROP
    D = win[r0:r0 + h, c0:c0 + w].astype(np.float64)
    valid = np.isfinite(D)
    hmin = float(np.floor(np.nanmin(D)))
    hq = np.where(valid, np.round((D - hmin) / H_Q), H_NODATA).astype("<u2")
    assert hq[valid].max() < H_NODATA
    hq.tofile(OUT / "dtm_height.u16.bin")
    sl = slope_deg(D, M_PER_PX)
    sq = np.where(np.isfinite(sl), np.minimum(np.round(sl / S_Q), 254), S_NODATA).astype("u1")
    sq.tofile(OUT / "dtm_slope.u8.bin")
    hs = hillshade(np.where(valid, D, np.nanmean(D)), M_PER_PX)
    rgba = np.zeros((h, w, 4), "u1")
    rgba[..., :3] = (60 + 195 * hs)[..., None].astype("u1")
    rgba[..., 3] = np.where(valid, 255, 0)
    Image.fromarray(rgba, "RGBA").save(OUT / "dtm_hillshade.png", optimize=True)

    # Access Mars walk grid (scene frame, 0.5 m, 256 x 256)
    am = np.load(RAW / "am_grid.npy").astype(np.float64)
    amq = np.round(am * 100).astype("<i2")
    amq.tofile(OUT / "walk_height.i16.bin")
    asl = slope_deg(am, 0.5, edge=True)
    np.minimum(np.round(asl / S_Q), 254).astype("u1").tofile(OUT / "walk_slope.u8.bin")

    # georeference of the scene origin
    cx, cy = ref["cx"], ref["cy"]                     # window px
    col_full, row_full = wmeta["col0"] + cx, wmeta["row0"] + cy
    lon = (col_full - SAMPLE_OFF) / RES + LON0
    lat = -(row_full - LINE_OFF) / RES
    meta = {
        "name": "Murray Buttes",
        "crs": "Mars planetocentric lon/lat (deg E), sphere R=3396190 m; local metres east/north",
        "source_dtm": "DTEEC_040770_1755_039280_1755_U01 (HiRISE, NASA/JPL/University of Arizona/USGS)",
        "dtm": {
            "width": w, "height": h, "cell_m": M_PER_PX,
            "origin": "row 0 = north edge, col 0 = west edge; rows increase to the south",
            "height_file": "dtm_height.u16.bin", "height_dtype": "uint16 little-endian",
            "height_m": "hmin + value * height_scale", "hmin": hmin, "height_scale": H_Q,
            "height_nodata": H_NODATA,
            "slope_file": "dtm_slope.u8.bin", "slope_dtype": "uint8", "slope_deg": "value * slope_scale",
            "slope_scale": S_Q, "slope_nodata": S_NODATA,
            "hillshade_file": "dtm_hillshade.png", "valid_fraction": float(valid.mean()),
            "crop_in_dtm_px": {"col0": wmeta["col0"] + c0, "row0": wmeta["row0"] + r0},
            "north_west_corner_lonlat": [
                (wmeta["col0"] + c0 - SAMPLE_OFF) / RES + LON0,
                -(wmeta["row0"] + r0 - LINE_OFF) / RES],
            "deg_per_px": 1 / RES,
        },
        "walk": {
            "width": 256, "height": 256, "cell_m": 0.5, "extent_m": 128,
            "origin": "scene frame: x = -64 + (col + 0.5) * 0.5, z = -64 + (row + 0.5) * 0.5; Y up",
            "height_file": "walk_height.i16.bin", "height_dtype": "int16 little-endian",
            "height_m": "value / 100 (scene height, add z_offset_dtm_m for DTM elevation)",
            "height_nodata": None, "slope_file": "walk_slope.u8.bin", "slope_scale": S_Q,
            "slope_note": "central difference over 1 m; mesh is smoother than the DTM in places",
        },
        "transform_walk_to_dtm": {
            "model": "east_m = cos(t)*x + sin(t)*z ; north_m = -sin(t)*x + cos(t)*z ; "
                     "dtm_col = cx + east_m / cell_m ; dtm_row = cy - north_m / cell_m ; "
                     "dtm_elev = scene_y + z_offset_dtm_m",
            "theta_deg": ref["theta"],
            "origin_in_dtm_crop_px": {"col": cx - c0, "row": cy - r0},
            "origin_lonlat": [lon, lat],
            "z_offset_dtm_m": ref["z_offset"],
            "ncc": ref["ncc"],
            "error_1sigma": {"position_m": 2.0, "rotation_deg": 1.5, "edge_position_m": 3.0,
                             "elevation_m": ref["z_offset_std"]},
            "note": "scene z axis points NORTH (z mirrored vs. a right-handed Y-up map); see README",
        },
    }
    json.dump(meta, open(OUT / "murray.json", "w"), indent=1)
    print("scene origin lon/lat", lon, lat)
    # distance to waypoint-mean estimate used by data-scout
    dn = (lat - -4.6945) * math.pi / 180 * R_MARS
    de = (lon - 137.3531) * math.pi / 180 * R_MARS
    print("offset to waypoint-mean estimate: E %.0f m, N %.0f m" % (de, dn))
    for f in sorted(OUT.iterdir()):
        print(f.name, f.stat().st_size)


if __name__ == "__main__":
    main()
