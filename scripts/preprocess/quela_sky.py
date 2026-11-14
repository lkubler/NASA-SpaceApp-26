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
MOLA_URL = ('https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megt00n090hb.img')
MOLA_ROWS = (480, 760)    # tile covers lat 0..-44, lon 90..180, 128 ppd (463 m), 23040 bytes/row, int16 big-endian
def load_mola(path='data/raw/quela/mola_rows.bin'):
    import os, urllib.request
    if not os.path.exists(path):
        os.makedirs(os.path.dirname(path), exist_ok=True)
        r0, r1 = MOLA_ROWS
        rq = urllib.request.Request(MOLA_URL, headers={'Range': f'bytes={r0*23040}-{(r1+1)*23040-1}'})
        open(path, 'wb').write(urllib.request.urlopen(rq, timeout=300).read())
    return np.fromfile(path, '>i2').reshape(-1, 11520).astype(float)
MOLA = None
def bil_v(H, c, r):
    c = c - 0.5; r = r - 0.5
    i = np.floor(r).astype(int); j = np.floor(c).astype(int); fy = r - i; fx = c - j
    ok = (i >= 0) & (j >= 0) & (i + 1 < H.shape[0]) & (j + 1 < H.shape[1])
    i = np.clip(i, 0, H.shape[0]-2); j = np.clip(j, 0, H.shape[1]-2)
    v = (H[i, j]*(1-fx)+H[i, j+1]*fx)*(1-fy) + (H[i+1, j]*(1-fx)+H[i+1, j+1]*fx)*fy
    return np.where(ok, v, np.nan)
def horizon(qc, qr, eye=1.0, tiers=('crop', 'regional', 'mola')):
    """Returns (az_rad, {tier: elevation angle deg per azimuth}, 0.25 deg bins). Void cells skipped.
    Planetary curvature d^2/2R is subtracted from every target height."""
    global MOLA
    z0 = bil(H1, qc, qr) + eye
    az = np.deg2rad(np.arange(0, 360, 0.25))
    sa, ca = np.sin(az)[:, None], np.cos(az)[:, None]
    ranges = {'crop': np.arange(1.0, 400.0, 1.0), 'regional': np.arange(400.0, 2000.0, 5.0),
              'mola': np.arange(463.0, 20000.0, 231.5)}
    qlon = lon0 + qc * dpp; qlat = lat0 - qr * dpp
    res = {}
    for t in tiers:
        d = ranges[t][None, :]
        e, n = d * sa, d * ca
        if t == 'crop':
            z = bil_v(H1, qc + e/c1, qr - n/c1)
        elif t == 'regional':
            z = bil_v(HR, (qc + e/c1 + 700)/5.0, (qr - n/c1 + 1488)/5.0)
        else:
            if MOLA is None: MOLA = load_mola()
            dlat = np.degrees(n / 3396000.0); dlon = np.degrees(e / (3396000.0 * math.cos(math.radians(qlat))))
            col = (qlon + dlon - 90.0) * 128.0; row = (0.0 - (qlat + dlat)) * 128.0 - MOLA_ROWS[0]
            z = bil_v(MOLA, col, row)
        z = z - d**2 / (2*3396000.0)
        ang = np.degrees(np.arctan2(z - z0, d))
        ang = np.where(np.isnan(ang), -90.0, ang)
        res[t] = ang.max(axis=1)
    return az, res
def metrics(elev):
    e = np.clip(np.deg2rad(elev), 0, None)                # elevation above horizontal; negative = open
    return {'unweighted_zenith_mean': float(np.mean(np.rad2deg(e))/90),   # mean over zenith of ROS(theta), no solid angle
            'solid_angle': float(np.mean(np.sin(e))),                      # fraction of hemisphere solid angle
            'cosine_weighted': float(np.mean(np.sin(e)**2)),               # projected-area weighting
            'max_elev_deg': float(np.rad2deg(e.max())), 'mean_elev_deg': float(np.rad2deg(e).mean())}
if __name__ == '__main__':
    qc, qr = to_px1(QLON, QLAT)
    print('Quela px', qc, qr, 'h', bil(H1, qc, qr), 'MOLA ref check')
    az, res = horizon(qc, qr)
    near = np.maximum(res['crop'], res['regional'])          # old 2 km result
    full = np.maximum(near, res['mola'])                     # all three tiers
    out = {'near_2km': metrics(near), 'mola_only': metrics(res['mola']), 'all_tiers': metrics(full)}
    for k, v in out.items(): print(k, {a: round(b, 3) for a, b in v.items()})
    d = full - near
    chg = np.where(d > 0.05)[0]
    print('azimuths raised by MOLA tier: %.1f%% of bins, max +%.2f deg' % (100*len(chg)/len(az), d.max()))
    sect = []
    if len(chg):
        s0 = chg[0]; prev = chg[0]
        for x in list(chg[1:]) + [None]:
            if x is None or x != prev + 1:
                sect.append((s0*0.25, prev*0.25)); 
                if x is not None: s0 = x
            if x is not None: prev = x
    print('sectors (deg az):', [(a, b) for a, b in sect if b - a >= 2])
    print('elev near/full every 30 deg:', [(round(float(near[int(a/.25)]),1), round(float(full[int(a/.25)]),1)) for a in range(0, 360, 30)])
    sens = []
    for de in (-5, -2, 0, 2, 5):
        for dn in (-5, -2, 0, 2, 5):
            _, r2 = horizon(qc + de/c1, qr - dn/c1)
            m = metrics(np.maximum(np.maximum(r2['crop'], r2['regional']), r2['mola'])); sens.append((de, dn, m))
    sv = [m['solid_angle'] for _, _, m in sens]; uw = [m['unweighted_zenith_mean'] for _, _, m in sens]
    print('+-5 m solid angle %.3f-%.3f unweighted %.3f-%.3f' % (min(sv), max(sv), min(uw), max(uw)))
    json.dump({**out, 'elev_full_every_5deg_az': [round(float(x), 2) for x in full[::20]],
               'elev_near_every_5deg_az': [round(float(x), 2) for x in near[::20]],
               'sens': [{'dE_m': a, 'dN_m': b, **m} for a, b, m in sens]}, open('data/raw/quela/sky_result.json', 'w'))
