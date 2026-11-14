// Shared terrain grid. Rasterises world-space triangles (top-most surface wins) into a
// regular height grid. Used by Map (planner, slope, viewshed) and Walk (ground height).
// Grid format matches model/comms.js: {width,height,cellSize_m,data:Float32Array,noData:NaN}
// plus origin {x,z}: world coordinates of the grid's top-left corner.
// Grid x index = world x, grid y index = world z.
import * as THREE from 'three';

export const MURRAY = { half_m: 64, cell_m: 0.5 };

export function buildHeightmap(meshes, { half_m = MURRAY.half_m, cell_m = MURRAY.cell_m, fillRadius = 5 } = {}) {
  const N = Math.round((half_m * 2) / cell_m);
  const H = new Float32Array(N * N).fill(NaN);
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (const m of meshes) {
    const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const cnt = idx ? idx.count : pos.count;
    for (let t = 0; t < cnt; t += 3) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(t + k) : t + k).applyMatrix4(m.matrixWorld);
      const minx = Math.min(v[0].x, v[1].x, v[2].x), maxx = Math.max(v[0].x, v[1].x, v[2].x);
      const minz = Math.min(v[0].z, v[1].z, v[2].z), maxz = Math.max(v[0].z, v[1].z, v[2].z);
      const i0 = Math.max(0, Math.ceil((minx + half_m) / cell_m - 0.5)), i1 = Math.min(N - 1, Math.floor((maxx + half_m) / cell_m - 0.5));
      const j0 = Math.max(0, Math.ceil((minz + half_m) / cell_m - 0.5)), j1 = Math.min(N - 1, Math.floor((maxz + half_m) / cell_m - 0.5));
      const d = (v[1].z - v[2].z) * (v[0].x - v[2].x) + (v[2].x - v[1].x) * (v[0].z - v[2].z);
      if (Math.abs(d) < 1e-9) continue;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = -half_m + (i + 0.5) * cell_m, z = -half_m + (j + 0.5) * cell_m;
        const a = ((v[1].z - v[2].z) * (x - v[2].x) + (v[2].x - v[1].x) * (z - v[2].z)) / d;
        const b = ((v[2].z - v[0].z) * (x - v[2].x) + (v[0].x - v[2].x) * (z - v[2].z)) / d;
        const c = 1 - a - b;
        if (a < -1e-6 || b < -1e-6 || c < -1e-6) continue;
        const y = a * v[0].y + b * v[1].y + c * v[2].y;
        const o = j * N + i; if (!(y <= H[o])) H[o] = y;
      }
    }
  }
  // fill small holes from the nearest valid cell within fillRadius; larger gaps stay NaN (no-data)
  const src = H.slice();
  let holes = 0, unfilled = 0;
  for (let o = 0; o < H.length; o++) {
    if (!Number.isNaN(src[o])) continue;
    holes++;
    const i = o % N, j = (o / N) | 0;
    let found = NaN;
    for (let r = 1; r <= fillRadius && Number.isNaN(found); r++)
      for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
        const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
        const y = src[jj * N + ii]; if (!Number.isNaN(y)) { found = y; break; }
      }
    H[o] = found; if (Number.isNaN(found)) unfilled++;
  }
  return { width: N, height: N, cellSize_m: cell_m, data: H, noData: NaN, origin: { x: -half_m, z: -half_m }, holes, unfilled };
}

// bilinear height at grid-local metres (x,y from top-left); NaN if outside / no-data
export function heightAt(hm, x, y) {
  const fx = x / hm.cellSize_m - 0.5, fy = y / hm.cellSize_m - 0.5;
  const i = Math.max(0, Math.min(hm.width - 2, Math.floor(fx))), j = Math.max(0, Math.min(hm.height - 2, Math.floor(fy)));
  const tx = Math.max(0, Math.min(1, fx - i)), ty = Math.max(0, Math.min(1, fy - j)), W = hm.width, d = hm.data;
  const a = d[j * W + i], b = d[j * W + i + 1], c = d[(j + 1) * W + i], e = d[(j + 1) * W + i + 1];
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
}

// Per-cell slope in degrees over a +-baseline_m central difference (default 1 m, a footstep pair).
// NaN where the stencil touches no-data.
export function slopeGrid(hm, baseline_m = 1) {
  const { width: W, height: Hh, cellSize_m: cs } = hm, d = hm.data;
  const s = Math.max(1, Math.round(baseline_m / cs));
  const out = new Float32Array(W * Hh).fill(NaN);
  for (let j = 0; j < Hh; j++) for (let i = 0; i < W; i++) {
    const i0 = Math.max(0, i - s), i1 = Math.min(W - 1, i + s), j0 = Math.max(0, j - s), j1 = Math.min(Hh - 1, j + s);
    const l = d[j * W + i0], r = d[j * W + i1], u = d[j0 * W + i], dn = d[j1 * W + i];
    const gx = (r - l) / ((i1 - i0) * cs), gy = (dn - u) / ((j1 - j0) * cs);
    const g = Math.atan(Math.hypot(gx, gy)) * 180 / Math.PI;
    out[j * W + i] = g; // NaN propagates
  }
  return out;
}

// Layer source registry: Walk publishes the Access Mars grid; a HiRISE DTM loader (task 002)
// can call provideHeightmap(hm, {name}) instead. Consumers use whenHeightmap().
let resolveFn; const ready = new Promise((r) => { resolveFn = r; });
let current = null;
export function provideHeightmap(hm, meta = {}) { current = { hm, meta }; resolveFn(current); }
export const whenHeightmap = () => ready;
export const currentHeightmap = () => current;
