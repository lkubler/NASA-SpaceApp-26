#!/usr/bin/env python3
"""Rasterise the Access Mars Murray Buttes terrain.glb (64 TILE meshes) into a 0.5 m height grid.

Usage: python3 scripts/preprocess/access_mars_grid.py <terrain.glb> [out.npy]
Requires: numpy, DracoPy (pip install DracoPy). DracoPy decodes the 2017 Draco bitstream fine.
Scene coordinates: metres, Y up, x/z ground plane, origin = scene centre, extent +-64 m.
Grid: 256 x 256, cell 0.5 m, H[row=j, col=i] = height at x = -64 + (i+.5)*.5, z = -64 + (j+.5)*.5.
"""
import json, struct, sys
import numpy as np
import DracoPy

N, CELL, HALF = 256, 0.5, 64.0


def load_tiles(path):
    b = open(path, "rb").read()
    jl = struct.unpack("<I", b[12:16])[0]
    j = json.loads(b[20:20 + jl])
    off = 20 + jl
    bl = struct.unpack("<I", b[off:off + 4])[0]
    blob = b[off + 8:off + 8 + bl]
    tris = []
    for node in j["nodes"]:
        if "TYPE_TILE" not in node.get("name", ""):
            continue
        prim = j["meshes"][node["mesh"]]["primitives"][0]
        bv = j["bufferViews"][prim["extensions"]["KHR_draco_mesh_compression"]["bufferView"]]
        d = DracoPy.decode(blob[bv["byteOffset"]:bv["byteOffset"] + bv["byteLength"]])
        # root node 'Y_UP' has scale 0.01; the original app multiplies by 100 -> raw units are metres
        tris.append(np.asarray(d.points, dtype=np.float64)[np.asarray(d.faces)])
    return np.concatenate(tris)  # (T, 3 verts, 3 xyz)


def rasterise(tris):
    """Max-height (top surface) rasterisation by barycentric sampling at cell centres."""
    H = np.full((N, N), -np.inf)
    x, y, z = tris[..., 0], tris[..., 1], tris[..., 2]
    for t in range(len(tris)):
        px, pz, py = x[t], z[t], y[t]
        i0 = max(int(np.floor((px.min() + HALF) / CELL - 0.5)), 0)
        i1 = min(int(np.ceil((px.max() + HALF) / CELL - 0.5)), N - 1)
        j0 = max(int(np.floor((pz.min() + HALF) / CELL - 0.5)), 0)
        j1 = min(int(np.ceil((pz.max() + HALF) / CELL - 0.5)), N - 1)
        if i1 < i0 or j1 < j0:
            continue
        det = (pz[1] - pz[2]) * (px[0] - px[2]) + (px[2] - px[1]) * (pz[0] - pz[2])
        if abs(det) < 1e-12:
            continue
        ii, jj = np.meshgrid(np.arange(i0, i1 + 1), np.arange(j0, j1 + 1))
        cx, cz = -HALF + (ii + 0.5) * CELL, -HALF + (jj + 0.5) * CELL
        a = ((pz[1] - pz[2]) * (cx - px[2]) + (px[2] - px[1]) * (cz - pz[2])) / det
        bb = ((pz[2] - pz[0]) * (cx - px[2]) + (px[0] - px[2]) * (cz - pz[2])) / det
        c = 1 - a - bb
        m = (a >= -1e-9) & (bb >= -1e-9) & (c >= -1e-9)
        if not m.any():
            continue
        h = a * py[0] + bb * py[1] + c * py[2]
        cur = H[jj[m], ii[m]]
        H[jj[m], ii[m]] = np.maximum(cur, h[m])
    return H


def fill_holes(H):
    """Fill -inf cells by iterative neighbour averaging."""
    H = H.copy()
    miss = ~np.isfinite(H)
    n_holes = int(miss.sum())
    while miss.any():
        P = np.pad(np.where(miss, np.nan, H), 1, constant_values=np.nan)
        stack = np.stack([P[:-2, 1:-1], P[2:, 1:-1], P[1:-1, :-2], P[1:-1, 2:]])
        with np.errstate(all="ignore"):
            mean = np.nanmean(stack, axis=0)
        fill = miss & np.isfinite(mean)
        if not fill.any():
            break
        H[fill] = mean[fill]
        miss &= ~fill
    return H, n_holes


def main():
    tris = load_tiles(sys.argv[1])
    H, n_holes = fill_holes(rasterise(tris))
    print("tris", len(tris), "holes filled", n_holes, "range", H.min(), H.max())
    if len(sys.argv) > 2:
        np.save(sys.argv[2], H.astype(np.float32))


if __name__ == "__main__":
    main()
