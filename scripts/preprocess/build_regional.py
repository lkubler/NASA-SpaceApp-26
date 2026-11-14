#!/usr/bin/env python3
"""Regional DTM layer (~4 km) around Murray Buttes for the walkback-scale story.

Same DTM as the 1 km crop (DTEEC_040770_1755_039280_1755_U01), block-averaged by an integer
factor K so the regional grid is an exact multiple of the 1 km grid (no resampling shift).
Run from repo root: python3 scripts/preprocess/build_regional.py
Raw: data/raw/regional_window.npy (HTTP Range read, ~110 MB, cached), ortho JP2 from build_ortho.py.
Out: app/public/data/murray/regional_{height.u16.bin,slope.u8.bin,hillshade.png,ortho.jpg}, regional.json
"""
import json, sys
from pathlib import Path
import urllib.request
import numpy as np
from PIL import Image
sys.path.insert(0, str(Path(__file__).parent))
from build_murray import slope_deg, hillshade, M_PER_PX, RES, LINE_OFF, SAMPLE_OFF, LON0
import fetch_dtm as F

Image.MAX_IMAGE_PIXELS = None
OUT = Path("app/public/data/murray"); RAW = Path("data/raw")
K, N = 5, 800                    # block factor (DTM px per cell) and grid size -> 5.059 m, 4.05 km
H_Q, H_ND, S_Q, S_ND = 0.005, 65535, 0.5, 255
ORTHO = RAW / "ortho/ESP_040770_1755_RED_A_01_ORTHO.JP2"

m = json.load(open(OUT / "murray.json"))["dtm"]
C1, R1 = m["crop_in_dtm_px"]["col0"], m["crop_in_dtm_px"]["row0"]   # 1 km crop NW corner, full DTM px
# regional NW corner in full DTM px: centre the grid on the 1 km crop centre, aligned to the crop grid
C0 = C1 + 512 - (N * K) // 2; R0 = R1 + 512 - (N * K) // 2
C0 = max(C0, 0)  # west DTM edge
W = N * K

def fetch():
    f = RAW / "regional_window.npy"
    if f.exists(): return np.load(f)
    off = (F.DATA_START_REC - 1) * F.RECORD_BYTES + R0 * F.RECORD_BYTES
    n = W * F.RECORD_BYTES
    req = urllib.request.Request(F.URL, headers={"Range": f"bytes={off}-{off + n - 1}"})
    raw = urllib.request.urlopen(req, timeout=600).read()
    a = np.frombuffer(raw, "<f4").reshape(W, F.SAMPLES)[:, C0:C0 + W].copy()
    a[(a == F.MISSING) | (a < -1e30)] = np.nan
    np.save(f, a); return a

def main():
    a = fetch()
    blocks = a.reshape(N, K, N, K)
    cnt = np.isfinite(blocks).sum((1, 3))
    with np.errstate(all="ignore"):
        D = np.nanmean(blocks, (1, 3))
    D[cnt < K * K // 2] = np.nan            # mostly no-data blocks stay no-data
    cell = M_PER_PX * K
    valid = np.isfinite(D)
    hmin = float(np.floor(np.nanmin(D)))
    hq = np.where(valid, np.round((D - hmin) / H_Q), H_ND).astype("<u2"); hq.tofile(OUT / "regional_height.u16.bin")
    sl = slope_deg(D, cell)
    sq = np.where(np.isfinite(sl), np.minimum(np.round(sl / S_Q), 254), S_ND).astype("u1"); sq.tofile(OUT / "regional_slope.u8.bin")
    hs = hillshade(np.where(valid, D, np.nanmean(D)), cell)
    rgba = np.zeros((N, N, 4), "u1"); rgba[..., :3] = (60 + 195 * hs)[..., None].astype("u1"); rgba[..., 3] = np.where(valid, 255, 0)
    Image.fromarray(rgba, "RGBA").save(OUT / "regional_hillshade.png", optimize=True)
    # ortho: same footprint, same N x N grid
    ORT_RES, ORT_S, ORT_L = 234342.21869827, 12847.5, -1074063.5
    lon = LON0 + (C0 - SAMPLE_OFF) / RES; lat = -(R0 - LINE_OFF) / RES
    s0 = round((lon - LON0) * ORT_RES + ORT_S); l0 = round(-lat * ORT_RES + ORT_L)
    im = Image.open(ORTHO); im.reduce = 1; im.load()   # 0.506 m/px (reduce=2 fails to decode)
    box = tuple(v // 2 for v in (s0, l0, s0 + 4 * W, l0 + 4 * W))
    im.crop(box).convert("L").resize((N, N), Image.LANCZOS).save(OUT / "regional_ortho.jpg", quality=80, optimize=True)
    # valid stats
    q = N // 4
    quad = {"NW": valid[:N//2, :N//2], "NE": valid[:N//2, N//2:], "SW": valid[N//2:, :N//2], "SE": valid[N//2:, N//2:]}
    cols_valid = valid.mean(0); rows_valid = valid.mean(1)
    meta = {
        "source_dtm": "DTEEC_040770_1755_039280_1755_U01 (HiRISE, NASA/JPL/University of Arizona/USGS)",
        "width": N, "height": N, "cell_m": cell, "block_factor_vs_dtm": K,
        "origin": "row 0 = north edge, col 0 = west edge; rows increase to the south",
        "height_file": "regional_height.u16.bin", "height_dtype": "uint16 little-endian",
        "height_m": "hmin + value * height_scale", "hmin": hmin, "height_scale": H_Q, "height_nodata": H_ND,
        "slope_file": "regional_slope.u8.bin", "slope_dtype": "uint8", "slope_deg": "value * slope_scale",
        "slope_scale": S_Q, "slope_nodata": S_ND, "slope_note": "central difference over 2 regional cells (10 m)",
        "hillshade_file": "regional_hillshade.png", "ortho_file": "regional_ortho.jpg",
        "valid_fraction": float(valid.mean()),
        "valid_fraction_quadrants": {k: float(v.mean()) for k, v in quad.items()},
        "crop_in_dtm_px": {"col0": C0, "row0": R0},
        "north_west_corner_lonlat": [(C0 - SAMPLE_OFF) / RES + LON0, -(R0 - LINE_OFF) / RES],
        "deg_per_px_dtm": 1 / RES,
        "relation_to_1km_grid": {
            "model": "col_1km = col_reg * scale + col_offset ; row_1km = row_reg * scale + row_offset  (cell-corner coordinates; for cell centres use (c+0.5)*scale+offset-0.5)",
            "scale": cell / M_PER_PX,
            "col_offset": (C0 - C1), "row_offset": (R0 - R1),
            "note": "1 km grid px = 1 DTM px, so offsets are exact integers (DTM px); regional cell = block mean of K x K DTM px",
        },
    }
    json.dump(meta, open(OUT / "regional.json", "w"), indent=1)
    print("valid", valid.mean(), {k: round(float(v.mean()), 3) for k, v in quad.items()})
    nz = np.where(cols_valid > 0.5)[0]; print("cols with >50% valid:", nz.min(), nz.max())
    print("hmin", hmin, "hmax", np.nanmax(D))

if __name__ == "__main__":
    main()
