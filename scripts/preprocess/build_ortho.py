#!/usr/bin/env python3
"""Crop the HiRISE orthoimage to the DTM crop grid (task 016).

Input : data/raw/ortho/ESP_040770_1755_RED_A_01_ORTHO.JP2 (294 MB, public PDS download, see README)
        The ortho is in the same equirectangular frame as the DTM (lon0 137.39, 0.2529 m/px = DTM / 4).
Output: app/public/data/murray/ortho_1024.jpg  (1024 x 1024, exactly the dtm_* grid, 1.0118 m/px)
        app/public/data/murray/ortho_2048.jpg  (2048 x 2048, same footprint, 0.506 m/px)
Run from repo root: python3 scripts/preprocess/build_ortho.py
"""
import json
from pathlib import Path
from PIL import Image
Image.MAX_IMAGE_PIXELS = None

SRC = "data/raw/ortho/ESP_040770_1755_RED_A_01_ORTHO.JP2"
OUT = Path("app/public/data/murray")
# DTM PDS label: line/sample offsets and resolution; ortho label values (see LBL)
DTM_RES, DTM_S_OFF, DTM_L_OFF = 58585.55467457, 3212.5, -268515.50000001
ORT_RES, ORT_S_OFF, ORT_L_OFF = 234342.21869827, 12847.5, -1074063.5
meta = json.load(open(OUT / "murray.json"))["dtm"]
c0, r0, n = meta["crop_in_dtm_px"]["col0"], meta["crop_in_dtm_px"]["row0"], meta["width"]
# NW corner of the crop in ortho pixels (same lon/lat -> pixel convention as fetch_dtm.py)
lon = 137.39 + (c0 - DTM_S_OFF) / DTM_RES
lat = -(r0 - DTM_L_OFF) / DTM_RES
s0 = (lon - 137.39) * ORT_RES + ORT_S_OFF
l0 = -lat * ORT_RES + ORT_L_OFF
k = round(ORT_RES / DTM_RES)  # 4
box = (round(s0), round(l0), round(s0) + n * k, round(l0) + n * k)
print("ortho box", box, "float origin", s0, l0)

im = Image.open(SRC)
im.reduce = 1                      # decode at half resolution (0.506 m/px)
im.load()
b2 = tuple(v // 2 for v in box)
crop = im.crop(b2).convert("L")
crop.save(OUT / "ortho_2048.jpg", quality=80, optimize=True)
crop.resize((n, n), Image.LANCZOS).save(OUT / "ortho_1024.jpg", quality=85, optimize=True)
print("saved", crop.size)
