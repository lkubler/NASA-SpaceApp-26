#!/usr/bin/env python3
"""Fetch a window of the HiRISE DTM via HTTP Range reads (no 300 MB download).

Usage: python3 scripts/preprocess/fetch_dtm.py [lon lat half_width_m]
Writes data/raw/dtm_window.npy (float32, NaN = no-data) and data/raw/dtm_window.json.
Defaults: Murray Buttes region, 1.5 km half width (3 x 3 km).
"""
import json, math, sys, urllib.request
from pathlib import Path
import numpy as np

URL = ("https://hirise-pds.lpl.arizona.edu/PDS/DTM/ESP/ORB_040700_040799/"
       "ESP_040770_1755_ESP_039280_1755/DTEEC_040770_1755_039280_1755_U01.IMG")
# PDS3 header values (verified from the file header)
RECORD_BYTES, DATA_START_REC = 25200, 2          # ^IMAGE = 2
LINES, SAMPLES = 12238, 6300
RES = 58585.55467457                             # pixel/deg (equirectangular, lat0 = 0)
LINE_OFF, SAMPLE_OFF, LON0 = -268515.50000001, 3212.5, 137.39
R_MARS = 3396190.0
M_PER_PX = 2 * math.pi * R_MARS / 360 / RES      # 1.0118 m
MISSING = np.frombuffer(bytes.fromhex("FBFF7FFF"), dtype="<f4")[0]  # 0xFF7FFFFB


def lonlat_to_px(lon, lat):
    """lon (E, deg), lat (planetocentric deg) -> (sample0, line0), 0-based pixel coords."""
    return (lon - LON0) * RES + SAMPLE_OFF, -lat * RES + LINE_OFF


def main():
    lon, lat, half = (137.3531, -4.6945, 1500.0)
    if len(sys.argv) == 4:
        lon, lat, half = map(float, sys.argv[1:])
    s0, l0 = lonlat_to_px(lon, lat)
    hp = int(half / M_PER_PX)
    c0, c1 = max(0, int(s0) - hp), min(SAMPLES - 1, int(s0) + hp)
    r0, r1 = max(0, int(l0) - hp), min(LINES - 1, int(l0) + hp)
    off = (DATA_START_REC - 1) * RECORD_BYTES + r0 * RECORD_BYTES
    n = (r1 - r0 + 1) * RECORD_BYTES
    req = urllib.request.Request(URL, headers={"Range": f"bytes={off}-{off + n - 1}"})
    raw = urllib.request.urlopen(req, timeout=300).read()
    a = np.frombuffer(raw, dtype="<f4").reshape(r1 - r0 + 1, SAMPLES)[:, c0:c1 + 1].copy()
    a[(a == MISSING) | (a < -1e30)] = np.nan
    out = Path("data/raw")
    out.mkdir(parents=True, exist_ok=True)
    np.save(out / "dtm_window.npy", a)
    json.dump({"col0": c0, "row0": r0, "shape": a.shape, "res_deg": RES, "lon0": LON0,
               "line_off": LINE_OFF, "sample_off": SAMPLE_OFF}, open(out / "dtm_window.json", "w"))
    print(a.shape, "valid fraction", float(np.isfinite(a).mean()),
          "min/max", float(np.nanmin(a)), float(np.nanmax(a)))


if __name__ == "__main__":
    main()
