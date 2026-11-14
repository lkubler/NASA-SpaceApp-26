#!/usr/bin/env python3
"""Refine the Access Mars -> DTM transform found by align.py and estimate its error.

Direct (non-FFT) normalised cross-correlation of the high-passed fields at 1 m sampling.
Parameters: theta (deg), centre (cx, cy) in DTM-window pixels, uniform scale s.
Forward model (scene -> DTM pixel, mirrored z, see README):
    east_m  =  s (cos t * x + sin t * z)
    north_m =  s (-sin t * x + cos t * z)
    col = cx + east_m / m_per_px ;  row = cy - north_m / m_per_px
Prints best fit, a flat-region error estimate and a 4-way split-half consistency check.
Writes data/raw/refine.json.
"""
import json
import numpy as np
from align import gauss_hp, bilinear, M_PER_PX, SIGMA

R = 52.0


def prepare():
    dtm = np.load("data/raw/dtm_window.npy").astype(float)
    am = np.load("data/raw/am_grid.npy").astype(float)
    return dtm, gauss_hp(dtm, SIGMA / M_PER_PX), gauss_hp(am, SIGMA / 0.5)


def scene_points(spacing=1.0):
    g = np.arange(-R, R + 1e-6, spacing)
    x, z = np.meshgrid(g, g)
    m = x ** 2 + z ** 2 <= R ** 2
    return x[m], z[m]


def to_px(x, z, t_deg, cx, cy, s=1.0):
    t = np.deg2rad(t_deg)
    e = s * (np.cos(t) * x + np.sin(t) * z)
    n = s * (-np.sin(t) * x + np.cos(t) * z)
    return cx + e / M_PER_PX, cy - n / M_PER_PX


def ncc(Dhp, Ahp, x, z, t, cx, cy, s=1.0):
    col, row = to_px(x, z, t, cx, cy, s)
    d = bilinear(Dhp, col, row)
    a = bilinear(Ahp, (x + 64) / 0.5 - 0.5, (z + 64) / 0.5 - 0.5)
    ok = np.isfinite(d) & np.isfinite(a)
    if ok.sum() < 0.9 * len(x):
        return -1.0
    d, a = d[ok] - d[ok].mean(), a[ok] - a[ok].mean()
    return float((d * a).sum() / np.sqrt((d * d).sum() * (a * a).sum()))


def search(Dhp, Ahp, x, z, t0, cx0, cy0, dt, dc, nt, nc, s_list=(1.0,)):
    best = (-2, None)
    grid = {}
    for s in s_list:
        for t in t0 + dt * np.arange(-nt, nt + 1):
            for cx in cx0 + dc * np.arange(-nc, nc + 1):
                for cy in cy0 + dc * np.arange(-nc, nc + 1):
                    v = ncc(Dhp, Ahp, x, z, t, cx, cy, s)
                    grid[(s, t, cx, cy)] = v
                    if v > best[0]:
                        best = (v, (s, t, cx, cy))
    return best, grid


if __name__ == "__main__":
    dtm, Dhp, Ahp = prepare()
    x, z = scene_points(1.0)
    # stage 1 (from align.py): theta ~2.5, centre ~(1198, 1550)
    b, _ = search(Dhp, Ahp, x, z, 2.5, 1198, 1550, 0.5, 1.0, 8, 4)
    b, _ = search(Dhp, Ahp, x, z, b[1][1], b[1][2], b[1][3], 0.1, 0.25, 8, 6)
    ncc0, (s0, t0, cx0, cy0) = b
    print("best NCC %.3f theta %.2f centre px (%.2f, %.2f)" % (ncc0, t0, cx0, cy0))
    # scale diagnostic
    sb, _ = search(Dhp, Ahp, x, z, t0, cx0, cy0, 0.1, 0.25, 4, 3, s_list=(0.96, 0.98, 1.0, 1.02, 1.04))
    print("with scale free: NCC %.3f at s=%.2f (theta %.2f)" % (sb[0], sb[1][0], sb[1][1]))
    # error estimate: parameter ranges with NCC >= best - 0.02
    _, g = search(Dhp, Ahp, x, z, t0, cx0, cy0, 0.25, 0.25, 12, 12)
    ok = [k for k, v in g.items() if v >= ncc0 - 0.02]
    ts = [k[1] for k in ok]; cxs = [k[2] for k in ok]; cys = [k[3] for k in ok]
    print("NCC>=best-0.02: theta %.2f..%.2f, col %.2f..%.2f, row %.2f..%.2f (n=%d)"
          % (min(ts), max(ts), min(cxs), max(cxs), min(cys), max(cys), len(ok)))
    # split-half consistency (4 halves)
    halves = {"x<0": x < 0, "x>0": x > 0, "z<0": z < 0, "z>0": z > 0}
    fits = {}
    for name, m in halves.items():
        bh, _ = search(Dhp, Ahp, x[m], z[m], t0, cx0, cy0, 0.5, 0.5, 8, 8)
        fits[name] = bh
        print("half %s: NCC %.3f theta %.2f centre (%.2f, %.2f)" % ((name, bh[0]) + bh[1][1:]))
    # vertical offset (DTM minus scene height) on the matched disc
    col, row = to_px(x, z, t0, cx0, cy0)
    d = bilinear(dtm, col, row)
    a = bilinear(np.load("data/raw/am_grid.npy").astype(float), (x + 64) / 0.5 - 0.5, (z + 64) / 0.5 - 0.5)
    ok = np.isfinite(d) & np.isfinite(a)
    dz = d[ok] - a[ok]
    print("height offset DTM - scene: mean %.2f std %.2f m ; relief ratio (std dtm/std scene) %.2f"
          % (dz.mean(), dz.std(), np.std(d[ok]) / np.std(a[ok])))
    json.dump({"ncc": ncc0, "theta": t0, "cx": cx0, "cy": cy0, "z_offset": float(dz.mean()),
               "z_offset_std": float(dz.std()), "range": {"theta": [min(ts), max(ts)],
               "col": [min(cxs), max(cxs)], "row": [min(cys), max(cys)]},
               "halves": {k: [v[0]] + list(v[1][1:]) for k, v in fits.items()}},
              open("data/raw/refine.json", "w"), indent=1)
