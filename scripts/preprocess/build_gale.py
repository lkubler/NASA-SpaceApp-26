#!/usr/bin/env python3
"""Gale crater elevation grid for step 1 (crater view), from MOLA MEGDR 128 pixels per degree.

Source: MGS MOLA Mission Experiment Gridded Data Record, MEGT00N090HB.IMG (topography, lat 0 to -44,
lon 90 to 180 E, 5632 x 11520, big-endian int16 metres above the MOLA areoid, simple cylindrical,
planetocentric, 1/128 deg per pixel). NASA PDS Geosciences Node, public domain.

HTTP Range read of only the needed rows (~11 MB) -> data/raw/gale/mola_rows.bin (cached).
Writes app/public/data/gale/gale_height.i16.bin (little-endian int16 metres, row 0 = north, col 0 = west)
and app/public/data/gale/gale.json (grid, bounds, site coordinates, credit).

Run from the repo root: python3 scripts/preprocess/build_gale.py
"""
import json
import os
import urllib.request

import numpy as np

URL = 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megt00n090hb.img'
LBL = URL[:-3] + 'lbl'
PPD = 128            # pixels per degree (label MAP_RESOLUTION)
SAMPLES = 11520      # LINE_SAMPLES
LAT_MAX = 0.0        # MAXIMUM_LATITUDE of the tile
LON_W = 90.0         # WESTERNMOST_LONGITUDE of the tile
R_KM = 3396.0        # A_AXIS_RADIUS

# Crop window: 3.625 deg square that holds all of Gale crater and its rim (464 x 464 px at 463 m).
ROW0, ROWS = 456, 464    # lat -3.5625 .. -7.1875
COL0, COLS = 5888, 464   # lon 136.0 .. 139.625 E

# Site coordinates (planetocentric lon E, lat), sources in gale.json.
SITES = [
    {'id': 'murray', 'name': 'Murray Buttes', 'lon': 137.35562, 'lat': -4.69565,
     'src': 'Scene origin of the Access Mars Murray Buttes terrain fitted to the HiRISE DTM (scripts/preprocess/README.md, murray.json)'},
    {'id': 'marias', 'name': 'Marias Pass', 'lon': 137.3701, 'lat': -4.6680,
     'src': 'Curiosity waypoints sols 1042-1056, MSL_waypoints.json (research/data-sites.md)'},
    {'id': 'pahrump', 'name': 'Pahrump Hills', 'lon': 137.3774, 'lat': -4.6635,
     'src': 'Curiosity waypoints sols 896-926, MSL_waypoints.json (research/data-sites.md)'},
]

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
RAW = os.path.join(ROOT, 'data', 'raw', 'gale')
OUT = os.path.join(ROOT, 'app', 'public', 'data', 'gale')


def fetch_rows():
    os.makedirs(RAW, exist_ok=True)
    path = os.path.join(RAW, 'mola_rows.bin')
    a, b = ROW0 * SAMPLES * 2, (ROW0 + ROWS) * SAMPLES * 2 - 1
    if not os.path.exists(path) or os.path.getsize(path) != b - a + 1:
        req = urllib.request.Request(URL, headers={'Range': f'bytes={a}-{b}', 'User-Agent': 'preprocess-script'})
        with urllib.request.urlopen(req, timeout=300) as r, open(path, 'wb') as f:
            f.write(r.read())
        lbl = urllib.request.urlopen(LBL, timeout=60).read()
        open(os.path.join(RAW, 'megt00n090hb.lbl'), 'wb').write(lbl)
    return np.fromfile(path, dtype='>i2').reshape(ROWS, SAMPLES)


def main():
    rows = fetch_rows()
    grid = rows[:, COL0:COL0 + COLS].astype(np.int16)
    lat_n = LAT_MAX - ROW0 / PPD
    lat_s = LAT_MAX - (ROW0 + ROWS) / PPD
    lon_w = LON_W + COL0 / PPD
    lon_e = LON_W + (COL0 + COLS) / PPD

    def pix(lon, lat):  # fractional (col, row) of a lon/lat in the crop, pixel centres at +0.5
        return (lon - lon_w) * PPD, (lat_n - lat) * PPD

    # Mount Sharp (Aeolis Mons): highest MOLA cell of the central mound, searched inside 30 km of the
    # crop centre so the crater rim is excluded.
    cy, cx = ROWS / 2, COLS / 2
    yy, xx = np.mgrid[0:ROWS, 0:COLS]
    km_per_px = np.pi * R_KM / 180 / PPD
    inner = np.hypot((yy + 0.5 - cy), (xx + 0.5 - cx)) * km_per_px < 30
    k = np.argmax(np.where(inner, grid, -32768))
    pr, pc = divmod(int(k), COLS)
    sharp = {'id': 'sharp', 'name': 'Mount Sharp', 'lon': round(lon_w + (pc + 0.5) / PPD, 4),
             'lat': round(lat_n - (pr + 0.5) / PPD, 4), 'elev_m': int(grid[pr, pc]),
             'src': 'Highest MOLA MEGDR cell of the central mound in this grid (within 30 km of the crop centre)'}

    sites = []
    for s in SITES:
        c, r = pix(s['lon'], s['lat'])
        sites.append({**s, 'col': round(c, 2), 'row': round(r, 2), 'elev_m': int(grid[int(r), int(c)])})
    c, r = pix(sharp['lon'], sharp['lat'])
    sharp.update(col=round(c, 2), row=round(r, 2))

    os.makedirs(OUT, exist_ok=True)
    grid.astype('<i2').tofile(os.path.join(OUT, 'gale_height.i16.bin'))
    meta = {
        'file': 'gale_height.i16.bin',
        'format': 'int16 little-endian, metres above the MOLA areoid; row 0 = north edge, col 0 = west edge',
        'cols': COLS, 'rows': ROWS, 'pixels_per_degree': PPD, 'km_per_pixel': round(km_per_px, 4),
        'bounds': {'lon_west': lon_w, 'lon_east': lon_e, 'lat_north': lat_n, 'lat_south': lat_s},
        'width_km': round(COLS * km_per_px, 1),
        'elev_min_m': int(grid.min()), 'elev_max_m': int(grid.max()),
        'sites': sites, 'mount_sharp': sharp,
        'source': {
            'title': 'MGS MOLA Mission Experiment Gridded Data Record (MEGDR), 128 pixels per degree, MEGT00N090HB',
            'url': URL, 'credit': 'NASA/GSFC MOLA Science Team, NASA PDS Geosciences Node',
            'license': 'NASA PDS, public domain',
        },
    }
    json.dump(meta, open(os.path.join(OUT, 'gale.json'), 'w'), indent=1)
    print(json.dumps({k: meta[k] for k in ('width_km', 'elev_min_m', 'elev_max_m')}), sharp, sites, sep='\n')


if __name__ == '__main__':
    main()
