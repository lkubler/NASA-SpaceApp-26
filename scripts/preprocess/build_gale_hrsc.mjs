#!/usr/bin/env node
// Gale crater height grid for step 1 (crater view), from NASA's printable 3D model of Gale crater.
//
// Source: NASA Science 3D Resources, "Gale Crater" (STL, 3x vertical exaggeration), derived from the
// HRSC camera on ESA's Mars Express. Data credit: K. Gwinner, J. Oberst, R. Jaumann, G. Neukum,
// ESA/DLR/FU Berlin. https://science.nasa.gov/3d-resources/gale-crater/
// Download the STL to data/raw/gale-hrsc-stl/gale-crater-hrsc.stl (ignored by git).
//
// The STL is in millimetres with no map coordinates. Steps:
//  1. Rasterise the top surface (highest z per cell) at CELL_MM.
//  2. Fit it to the MOLA grid (app/public/data/gale, build_gale.py): search orientation, scale
//     (km per mm) and offset for the highest correlation of heights; then a linear fit gives metres
//     per mm and the height offset, so heights come out in metres above the MOLA areoid.
//  3. Write gale_hrsc.i16.bin and gale_hrsc.json in the same format as gale.json, with the site pixels
//     recomputed from their lon/lat.
//
// Run from the repo root: node scripts/preprocess/build_gale_hrsc.mjs

import { readFileSync, writeFileSync } from 'node:fs';

const STL = 'data/raw/gale-hrsc-stl/gale-crater-hrsc.stl';
const MOLA_DIR = 'app/public/data/gale/';
const OUT_DIR = 'app/public/data/gale/';
const CELL_MM = 0.2;

// --- 1. rasterise the top surface
const buf = readFileSync(STL);
const nTri = buf.readUInt32LE(80);
if (84 + 50 * nTri !== buf.length) throw new Error('not a binary STL');
let mnx = Infinity, mny = Infinity, mxx = -Infinity, mxy = -Infinity;
for (let t = 0; t < nTri; t++) {
  const o = 84 + 50 * t + 12;
  for (let k = 0; k < 3; k++) {
    const x = buf.readFloatLE(o + 12 * k), y = buf.readFloatLE(o + 12 * k + 4);
    mnx = Math.min(mnx, x); mxx = Math.max(mxx, x); mny = Math.min(mny, y); mxy = Math.max(mxy, y);
  }
}
const W = Math.ceil((mxx - mnx) / CELL_MM) + 1, H = Math.ceil((mxy - mny) / CELL_MM) + 1;
const EMPTY = -1e9;
const Z = new Float32Array(W * H).fill(EMPTY);
for (let t = 0; t < nTri; t++) {
  const o = 84 + 50 * t + 12;
  const p = [0, 1, 2].map((k) => [(buf.readFloatLE(o + 12 * k) - mnx) / CELL_MM, (mxy - buf.readFloatLE(o + 12 * k + 4)) / CELL_MM, buf.readFloatLE(o + 12 * k + 8)]);
  const [a, b, c] = p;
  const det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(det) < 1e-12) continue; // vertical side walls
  const x0 = Math.max(0, Math.floor(Math.min(a[0], b[0], c[0]))), x1 = Math.min(W - 1, Math.ceil(Math.max(a[0], b[0], c[0])));
  const y0 = Math.max(0, Math.floor(Math.min(a[1], b[1], c[1]))), y1 = Math.min(H - 1, Math.ceil(Math.max(a[1], b[1], c[1])));
  for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
    const l1 = ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / det;
    const l2 = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / det;
    const l3 = 1 - l1 - l2;
    if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
    const z = l1 * a[2] + l2 * b[2] + l3 * c[2], i = y * W + x;
    if (z > Z[i]) Z[i] = z;
  }
}
// cells on the edge of the print that only reach the base plate (z ~ 0; the lowest real ground is ~1.8 mm)
for (let i = 0; i < W * H; i++) if (Z[i] < 0.5) Z[i] = EMPTY;
// fill the empty cells from their nearest filled neighbours
for (let pass = 0, left = 1; left && pass < 20; pass++) {
  left = 0;
  const src = Z.slice();
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (src[i] > EMPTY) continue;
    let s = 0, n = 0;
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < W && yy < H && src[yy * W + xx] > EMPTY) { s += src[yy * W + xx]; n++; }
    }
    if (n) Z[i] = s / n; else left++;
  }
}

// --- 2. fit to MOLA
const mola = JSON.parse(readFileSync(MOLA_DIR + 'gale.json', 'utf8'));
const M = new Int16Array(readFileSync(MOLA_DIR + mola.file).buffer.slice(0));
const N = mola.cols, KMPP = mola.km_per_pixel;
// MOLA pixel (c, r) -> km from the MOLA grid centre (x east, y south); STL pixel = (km - offset) / scale
function corr(orient, s, dx, dy, step) {
  let sx = 0, sy = 0, sxx = 0, syy = 0, sxy = 0, k = 0;
  for (let r = 0; r < N; r += step) for (let c = 0; c < N; c += step) {
    const X = (c - (N - 1) / 2) * KMPP - dx, Y = (r - (N - 1) / 2) * KMPP - dy;
    let u, v;
    switch (orient & 3) { case 0: u = X; v = Y; break; case 1: u = -Y; v = X; break; case 2: u = -X; v = -Y; break; default: u = Y; v = -X; }
    if (orient & 4) u = -u;
    const ix = Math.round(u / s / CELL_MM + (W - 1) / 2), iy = Math.round(v / s / CELL_MM + (H - 1) / 2);
    if (ix < 0 || iy < 0 || ix >= W || iy >= H) continue;
    const z = Z[iy * W + ix], m = M[r * N + c];
    sx += z; sy += m; sxx += z * z; syy += m * m; sxy += z * m; k++;
  }
  if (k < 500) return { r: -1 };
  const cov = sxy / k - (sx / k) * (sy / k), vz = sxx / k - (sx / k) ** 2, vm = syy / k - (sy / k) ** 2;
  return { r: cov / Math.sqrt(vz * vm), k, a: cov / vz, b: sy / k - (cov / vz) * (sx / k) };
}
let best = { r: -2 };
for (let o = 0; o < 8; o++) for (let s = 1.6; s <= 2.4; s += 0.05) for (let dx = -60; dx <= 60; dx += 4) for (let dy = -60; dy <= 60; dy += 4) {
  const q = corr(o, s, dx, dy, 4);
  if (q.r > best.r) best = { ...q, o, s, dx, dy };
}
const coarse = best;
for (let s = coarse.s - 0.06; s <= coarse.s + 0.06; s += 0.005) for (let dx = coarse.dx - 5; dx <= coarse.dx + 5; dx += 0.5) for (let dy = coarse.dy - 5; dy <= coarse.dy + 5; dy += 0.5) {
  const q = corr(coarse.o, s, dx, dy, 2);
  if (q.r > best.r) best = { ...q, o: coarse.o, s, dx, dy };
}
console.log('fit', JSON.stringify(best));
if (best.o !== 0) throw new Error('fit found a rotated or mirrored model; this script only writes north-up grids');
if (best.r < 0.99) throw new Error('fit too weak: r = ' + best.r);

// --- 3. write the grid (north-up: STL +y = north, row 0 = north edge)
const kmpp = best.s * CELL_MM;
const heights = new Int16Array(W * H);
let emin = Infinity, emax = -Infinity;
for (let i = 0; i < W * H; i++) {
  const m = Math.round(best.a * Z[i] + best.b);
  heights[i] = m; emin = Math.min(emin, m); emax = Math.max(emax, m);
}
// MOLA col/row (pixel centres at +0.5, as in gale.json) -> this grid's col/row
const toHrsc = (col, row) => ({
  col: +(((col - 0.5 - (N - 1) / 2) * KMPP - best.dx) / kmpp + (W - 1) / 2 + 0.5).toFixed(2),
  row: +(((row - 0.5 - (N - 1) / 2) * KMPP - best.dy) / kmpp + (H - 1) / 2 + 0.5).toFixed(2),
});
const degPerKm = 1 / (KMPP * mola.pixels_per_degree);
const lonC = (mola.bounds.lon_west + mola.bounds.lon_east) / 2 + best.dx * degPerKm;
const latC = (mola.bounds.lat_north + mola.bounds.lat_south) / 2 - best.dy * degPerKm;
const bounds = {
  lon_west: +(lonC - (W / 2) * kmpp * degPerKm).toFixed(4), lon_east: +(lonC + (W / 2) * kmpp * degPerKm).toFixed(4),
  lat_north: +(latC + (H / 2) * kmpp * degPerKm).toFixed(4), lat_south: +(latC - (H / 2) * kmpp * degPerKm).toFixed(4),
};
const at = (col, row) => heights[Math.min(H - 1, Math.max(0, Math.floor(row))) * W + Math.min(W - 1, Math.max(0, Math.floor(col)))];
const sites = mola.sites.map((s) => { const p = toHrsc(s.col, s.row); return { ...s, ...p, elev_m: at(p.col, p.row) }; });
// Mount Sharp: highest cell within 15 km of the MOLA summit
const ms = toHrsc(mola.mount_sharp.col, mola.mount_sharp.row), rad = 15 / kmpp;
let peak = { col: ms.col, row: ms.row, elev_m: -Infinity };
for (let r = Math.floor(ms.row - rad); r <= ms.row + rad; r++) for (let c = Math.floor(ms.col - rad); c <= ms.col + rad; c++) {
  if (r < 0 || c < 0 || r >= H || c >= W || (r + 0.5 - ms.row) ** 2 + (c + 0.5 - ms.col) ** 2 > rad * rad) continue;
  const e = heights[r * W + c];
  if (e > peak.elev_m) peak = { col: c + 0.5, row: r + 0.5, elev_m: e };
}
const mount_sharp = {
  id: 'sharp', name: 'Mount Sharp', ...peak,
  lon: +(lonC + (peak.col - 0.5 - (W - 1) / 2) * kmpp * degPerKm).toFixed(4),
  lat: +(latC - (peak.row - 0.5 - (H - 1) / 2) * kmpp * degPerKm).toFixed(4),
  src: 'Highest cell of the HRSC model within 15 km of the MOLA summit of the central mound',
};

const meta = {
  file: 'gale_hrsc.i16.bin',
  format: 'int16 little-endian, metres above the MOLA areoid (fitted, see fit); row 0 = north edge, col 0 = west edge',
  cols: W, rows: H, pixels_per_degree: +(1 / (kmpp * degPerKm)).toFixed(2), km_per_pixel: +kmpp.toFixed(4),
  bounds, width_km: +(W * kmpp).toFixed(1), height_km: +(H * kmpp).toFixed(1),
  elev_min_m: emin, elev_max_m: emax,
  fit: {
    method: 'Top surface of the STL rasterised at ' + CELL_MM + ' mm; scale, offset and orientation searched for the highest height correlation with the MOLA MEGDR grid (gale.json); heights = a * z_mm + b by least squares',
    r: +best.r.toFixed(4), km_per_mm: +best.s.toFixed(3), m_per_mm: +best.a.toFixed(1), offset_m: +best.b.toFixed(1),
    vertical_exaggeration_of_print: +(best.s * 1000 / best.a).toFixed(2), centre_offset_km: [best.dx, best.dy], samples: best.k,
  },
  sites, mount_sharp,
  source: {
    title: 'Gale Crater, NASA Science 3D Resources (STL, from HRSC on ESA Mars Express)',
    url: 'https://science.nasa.gov/3d-resources/gale-crater/',
    credit: 'Data: K. Gwinner, J. Oberst, R. Jaumann, G. Neukum, ESA/DLR/FU Berlin; model: NASA',
    license: 'NASA 3D Resources, free to use with the credit given on the page',
  },
};
writeFileSync(OUT_DIR + meta.file, Buffer.from(heights.buffer));
writeFileSync(OUT_DIR + 'gale_hrsc.json', JSON.stringify(meta, null, 1) + '\n');
console.log(`wrote ${W} x ${H} grid, ${kmpp.toFixed(3)} km/px, elev ${emin}..${emax} m, r = ${best.r.toFixed(4)}`);
