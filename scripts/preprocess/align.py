#!/usr/bin/env python3
"""Estimate rotation + translation of the Access Mars Murray patch inside the HiRISE DTM.

Method: zero-mean normalised cross-correlation (FFT, masked disc of radius R) of the
Access Mars 0.5 m height grid (resampled to the DTM pixel size) against the DTM window,
for rotation steps of STEP degrees, optionally with a mirrored z axis.
Conventions (DTM): u = column = east, v = row = south. Scene: x, z (Y up).
Baseline mapping: scene (x, z) -> east = x, south = z, then rotated by theta (clockwise on map).

Usage: python3 scripts/preprocess/align.py [--mirror] [--step 4] [--coarse 2]
Needs data/raw/dtm_window.npy, data/raw/am_grid.npy (run fetch_dtm.py, access_mars_grid.py).
"""
import argparse, json
import numpy as np

M_PER_PX = 1.0117630165416
SIGMA = 8.0  # m, high-pass scale (removes slope trend)
R_PATCH = 52.0  # m, disc used for matching


def bilinear(A, x, y):
    """Sample A at fractional (x=col, y=row) coords; outside -> nan."""
    h, w = A.shape
    x0 = np.floor(x).astype(int); y0 = np.floor(y).astype(int)
    fx = x - x0; fy = y - y0
    ok = (x0 >= 0) & (y0 >= 0) & (x0 < w - 1) & (y0 < h - 1)
    x0c = np.clip(x0, 0, w - 2); y0c = np.clip(y0, 0, h - 2)
    v = (A[y0c, x0c] * (1 - fx) * (1 - fy) + A[y0c, x0c + 1] * fx * (1 - fy)
         + A[y0c + 1, x0c] * (1 - fx) * fy + A[y0c + 1, x0c + 1] * fx * fy)
    return np.where(ok, v, np.nan)


def gauss_hp(A, sigma_px):
    """A - gaussian_blur(A) with normalised convolution (nan-aware)."""
    W = np.isfinite(A).astype(float)
    A0 = np.where(W > 0, A, 0.0)
    shp = tuple(int(2 ** np.ceil(np.log2(n + 8 * sigma_px))) for n in A.shape)
    fy = np.fft.fftfreq(shp[0])[:, None]; fx = np.fft.rfftfreq(shp[1])[None, :]
    G = np.exp(-2 * (np.pi * sigma_px) ** 2 * (fx ** 2 + fy ** 2))
    blur = lambda B: np.fft.irfft2(np.fft.rfft2(B, shp) * G, shp)[:A.shape[0], :A.shape[1]]
    with np.errstate(all="ignore"):
        lp = blur(A0) / blur(W)
    return np.where(W > 0, A - lp, np.nan)


def make_template(am, theta_deg, mirror, scale):
    """Template in DTM pixel units (size 2*r+1), disc-masked, zero mean. scale = metres per px."""
    r = int(R_PATCH / scale)
    u, v = np.meshgrid(np.arange(-r, r + 1), np.arange(-r, r + 1))
    u = u * scale; v = v * scale  # metres east / south of patch centre
    t = np.deg2rad(theta_deg)
    # inverse rotation: scene = R(-t) * (east, south)
    x = np.cos(t) * u + np.sin(t) * v
    z = -np.sin(t) * u + np.cos(t) * v
    if mirror:
        z = -z
    mask = (u ** 2 + v ** 2) <= R_PATCH ** 2
    T = bilinear(am, (x + 64) / 0.5 - 0.5, (z + 64) / 0.5 - 0.5)
    mask &= np.isfinite(T)
    T = np.where(mask, T, 0.0)
    n = mask.sum()
    T = np.where(mask, T - T.sum() / n, 0.0)
    return T, mask.astype(float), r


def run(dtm, am, step, scale, mirror, near=None, th0=0, th1=360):
    D = gauss_hp(dtm, SIGMA / scale)
    am = gauss_hp(am, SIGMA / 0.5)
    W = np.isfinite(D).astype(float)
    D0 = np.where(W > 0, D - np.nanmean(D), 0.0)
    H, Wd = D.shape
    shape = (H + 2 * int(R_PATCH / scale) + 2, Wd + 2 * int(R_PATCH / scale) + 2)
    shape = tuple(int(2 ** np.ceil(np.log2(s))) if s < 4096 else s for s in shape)  # fft friendly
    F = lambda a: np.fft.rfft2(a, shape)
    FD, FD2, FW = F(D0), F(D0 ** 2), F(W)
    _, M, r = make_template(am, 0, mirror, scale)
    FM = F(M[::-1, ::-1])

    def corr(FA, FB):
        out = np.fft.irfft2(FA * FB, shape)
        return out[2 * r:2 * r + H - 2 * r, 2 * r:2 * r + Wd - 2 * r]

    n = M.sum()
    sD, sD2, cnt = corr(FD, FM), corr(FD2, FM), corr(FW, FM)
    var = sD2 - sD ** 2 / n
    valid = cnt > 0.995 * n
    if near:  # (centre_col_px, centre_row_px, radius_m) in this (possibly coarse) grid
        cc, cr, rm = near
        jj, ii = np.mgrid[0:valid.shape[0], 0:valid.shape[1]]
        valid &= ((ii + r - cc) ** 2 + (jj + r - cr) ** 2) * scale ** 2 <= rm ** 2
    best = []
    for th in np.arange(th0, th1, step):
        T, _, _ = make_template(am, th, mirror, scale)
        num = corr(FD, F(T[::-1, ::-1]))
        with np.errstate(all="ignore"):
            ncc = num / np.sqrt(np.maximum(var, 1e-9) * (T ** 2).sum())
        ncc = np.where(valid & (var > 1.0), ncc, -1)
        k = np.argmax(ncc)
        j, i = np.unravel_index(k, ncc.shape)
        best.append((float(ncc[j, i]), float(th), int(i + r), int(j + r)))  # centre in DTM px
    return sorted(best, reverse=True)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--mirror", action="store_true")
    ap.add_argument("--step", type=float, default=4)
    ap.add_argument("--near", type=float, default=0, help="restrict to this radius (m) around expected origin")
    ap.add_argument("--centre", type=float, nargs=2, default=(1050, 1482), help="expected centre (col,row) px in full-res window")
    ap.add_argument("--theta0", type=float, default=0, help="first angle")
    ap.add_argument("--theta1", type=float, default=360, help="last angle (exclusive)")
    ap.add_argument("--coarse", type=int, default=2, help="downsample factor for the search")
    a = ap.parse_args()
    dtm = np.load("data/raw/dtm_window.npy")
    am = np.load("data/raw/am_grid.npy").astype(float)
    f = a.coarse
    if f > 1:
        h, w = (dtm.shape[0] // f) * f, (dtm.shape[1] // f) * f
        with np.errstate(all="ignore"):
            dtm = np.nanmean(dtm[:h, :w].reshape(h // f, f, w // f, f), axis=(1, 3))
    near = (a.centre[0] / f, a.centre[1] / f, a.near) if a.near else None
    res = run(dtm, am, a.step, M_PER_PX * f, a.mirror, near, a.theta0, a.theta1)
    for r_ in res[:8]:
        print(r_)
    json.dump(res[:20], open("data/raw/align_coarse%s.json" % ("_mirror" if a.mirror else ""), "w"))
