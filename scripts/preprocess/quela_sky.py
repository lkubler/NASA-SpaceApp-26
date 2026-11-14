#!/usr/bin/env python3
"""Blocked-sky fraction at the Quela waypoint from the 1 m HiRISE DTM (task 030).
Method as in Guo et al. 2021 / 2026 (JGR Planets 10.1029/2026JE009704, Sect. 3): viewpoint 1 m above
surface, horizon elevation angle for every azimuth (0.25 deg bins). Near field from the 1 m crop,
far field (to ~2 km) from the 5 m regional grid. Void cells = unknown, treated as open (lower bound).
Run from repo root: python3 scripts/preprocess/quela_sky.py
"""
import json, math, numpy as np
D = 'app/public/data/murray/'
R = 3396190.0
m1 = json.load(open(D + 'murray.json'))['dtm']; mr = json.load(open(D + 'regional.json'))
def load(meta, f):
    a = np.fromfile(D + meta[f'height_file'], '<u2').reshape(meta['height'], meta['width']).astype(float)
    h = np.where(a == 65535, np.nan, meta['hmin'] + a * meta['height_scale'])
    return h
H1 = load(m1, 'x'); HR = load(mr, 'x')
c1 = m1['cell_m']; cR = mr['cell_m']
lon0, lat0 = m1['north_west_corner_lonlat']
dpp = m1['deg_per_px']
QLON, QLAT = 137.3530064, -4.69520223
def to_px1(lon, lat): return (lon - lon0) / dpp, (lat0 - lat) / dpp   # col,row (corner coords)
def bil(H, c, r):
    c -= 0.5; r -= 0.5
    i, j = int(math.floor(r)), int(math.floor(c)); fy, fx = r - i, c - j
    if i < 0 or j < 0 or i + 1 >= H.shape[0] or j + 1 >= H.shape[1]: return np.nan
    v = H[i:i+2, j:j+2]
    return (v[0,0]*(1-fx)+v[0,1]*fx)*(1-fy) + (v[1,0]*(1-fx)+v[1,1]*fx)*fy
def horizon(qc, qr, eye=1.0, void_open=True):
    """qc,qr = viewpoint in 1 m crop px. Returns elevation angle (deg) per azimuth, 0.25 deg bins."""
    z0 = bil(H1, qc, qr) + eye
    az = np.deg2rad(np.arange(0, 360, 0.25))
    out = np.zeros(len(az)) - 90.0
    # radii: 1 m crop 1..400 m step 1 m (cell), then regional 5 m grid to 2000 m
    rs1 = np.arange(1.0, 400.0, 1.0); rs2 = np.arange(400.0, 2000.0, 5.0)
    for k, a in enumerate(az):
        best = -90.0
        for rs, H, c, base_c, base_r, sc, off in ((rs1, H1, c1, qc, qr, 1.0, None), (rs2, HR, cR, None, None, None, True)):
            for d in rs:
                e, n = d*math.sin(a), d*math.cos(a)
                if off is None:
                    cc, rr = qc + e/c1, qr - n/c1
                    z = bil(H1, cc, rr)
                else:
                    cc, rr = qc + e/c1, qr - n/c1          # 1 m crop px
                    # to regional px: col_1km = col_reg*5-700 -> col_reg = (col_1km+700)/5
                    z = bil(HR, (cc + 700)/5.0, (rr + 1488)/5.0)
                if z != z: continue                         # void: ignored
                ang = math.degrees(math.atan2(z - z0, d))
                if ang > best: best = ang
        out[k] = best
    return az, out
def metrics(elev):
    e = np.clip(np.deg2rad(elev), 0, None)                # elevation above horizontal; negative = open
    return {'unweighted_zenith_mean': float(np.mean(np.rad2deg(e))/90),   # mean over zenith of ROS(theta), no solid angle
            'solid_angle': float(np.mean(np.sin(e))),                      # fraction of hemisphere solid angle
            'cosine_weighted': float(np.mean(np.sin(e)**2)),               # projected-area weighting
            'max_elev_deg': float(np.rad2deg(e.max())), 'mean_elev_deg': float(np.rad2deg(e).mean())}
if __name__ == '__main__':
    qc, qr = to_px1(QLON, QLAT)
    print('Quela px', qc, qr, 'h', bil(H1, qc, qr))
    az, el = horizon(qc, qr)
    base = metrics(el); print('base', base)
    print('elev by 30 deg azimuth:', [round(float(el[int(a/0.25)]),1) for a in range(0,360,30)])
    sens = []
    for de in (-5, -2, 0, 2, 5):
        for dn in (-5, -2, 0, 2, 5):
            if abs(de) + abs(dn) > 5 and not (abs(de) == 5 or abs(dn) == 5) and False: continue
            _, e2 = horizon(qc + de/c1, qr - dn/c1)
            m = metrics(e2); sens.append((de, dn, m))
            print(de, dn, {k: round(v, 3) for k, v in m.items()})
    json.dump({'base': base, 'horizon_deg_per_5deg_az': [round(float(x),2) for x in el[::20]],
               'sens': [{'dE_m': a, 'dN_m': b, **m} for a, b, m in sens]}, open('data/raw/quela/sky_result.json', 'w'))
