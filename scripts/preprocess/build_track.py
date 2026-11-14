#!/usr/bin/env python3
"""Curiosity traverse around Murray Buttes (task 016) -> app/public/data/murray/curiosity_track.json
Source: NASA/JPL MMGIS MSL_waypoints.json (rover position at the end of each drive; straight lines between them are a guess).
Run from repo root: python3 scripts/preprocess/build_track.py
"""
import json, urllib.request
from pathlib import Path
URL = "https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json"
RAW = Path("data/raw/msl_wp.json")
OUT = Path("app/public/data/murray")
SOL0, SOL1 = 1398, 1475
if not RAW.exists():
    RAW.parent.mkdir(parents=True, exist_ok=True)
    RAW.write_bytes(urllib.request.urlopen(URL, timeout=120).read())
M = json.load(open(OUT / "murray.json"))["dtm"]
lon0, lat0 = M["north_west_corner_lonlat"]; d = M["deg_per_px"]; N = M["width"]
pts = []
for f in json.load(open(RAW))["features"]:
    p = f["properties"]
    if SOL0 <= p["sol"] <= SOL1:
        col, row = (p["lon"] - lon0) / d, (lat0 - p["lat"]) / d
        pts.append({"sol": p["sol"], "site": p["site"], "drive": p["drive"],
                    "lon": p["lon"], "lat": p["lat"], "elev_m": p["elev_geoid"],
                    "dist_total_m": p["dist_total_m"],
                    "col": round(col, 1), "row": round(row, 1),
                    "in_crop": bool(0 <= col < N and 0 <= row < N)})
stations = [
    {"name": "Marimba", "note": "drill site 13 (arrived sol 1417, drilled 1422, left 1427)", "sol": 1417},
    {"name": "Quela", "note": "drill site 14 (arrived sol 1455, left 1468)", "sol": 1455},
]
for s in stations:
    p = next(q for q in pts if q["sol"] == s["sol"]); s.update({k: p[k] for k in ("lon", "lat", "col", "row")})
out = {"source": URL, "license": "NASA/JPL-Caltech public data",
       "crs": "col,row = DTM crop pixels (murray.json dtm; row 0 = north); lon/lat planetocentric E+, as in source file",
       "note": "Sols 1398-1412 lie north of the 1 km DTM crop (in_crop=false, negative row). Positions are end-of-drive poses; the line between them is interpolated.",
       "stations": stations, "points": pts}
json.dump(out, open(OUT / "curiosity_track.json", "w"), separators=(",", ":"))
print(len(pts), "points,", sum(p["in_crop"] for p in pts), "inside crop")
