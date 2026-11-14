// Terrain access: the walk grids (0.5 m cells, 256 x 256, 128 x 128 m) of the Access Mars
// Murray Buttes scene. Format: app/public/data/murray/murray.json "walk" and
// scripts/preprocess/README.md. Scene frame: x = east, z = north, y = up, origin = square centre.
// Cell (col, row): x = -64 + (col + 0.5) * 0.5, z = -64 + (row + 0.5) * 0.5 (row runs along +z).
//
// Loaded once (getTerrain) and shared by Plan and Walk. No three.js here, so it runs in tests.

const DATA_DIR = 'data/murray/';

export class Terrain {
  /**
   * @param {object} meta   murray.json
   * @param {ArrayBuffer} heightBuf  walk_height.i16.bin (int16 cm)
   * @param {ArrayBuffer} slopeBuf   walk_slope.u8.bin (uint8, deg = v * slope_scale)
   */
  constructor(meta, heightBuf, slopeBuf) {
    const w = meta.walk;
    this.meta = meta;
    this.n = w.width;                 // 256 cells per side
    this.cell = w.cell_m;             // 0.5 m
    this.extent = w.extent_m;         // 128 m
    this.min = -this.extent / 2;      // -64 m (west / south edge)
    this.max = this.extent / 2;       // +64 m
    const h16 = new Int16Array(heightBuf);
    const s8 = new Uint8Array(slopeBuf);
    const N = this.n * this.n;
    if (h16.length !== N || s8.length !== N) throw new Error('walk grid size mismatch');
    this.height = new Float32Array(N); // m
    this.slope = new Float32Array(N);  // deg
    for (let i = 0; i < N; i++) {
      this.height[i] = h16[i] / 100;
      this.slope[i] = s8[i] * w.slope_scale;
    }
  }

  get size() { return this.n * this.n; }
  idx(col, row) { return row * this.n + col; }
  colOf(i) { return i % this.n; }
  rowOf(i) { return (i / this.n) | 0; }
  inside(x, z) { return x >= this.min && x <= this.max && z >= this.min && z <= this.max; }

  /** Scene metres -> cell { col, row } (clamped to the grid). */
  cellOf(x, z) {
    const c = Math.floor((x - this.min) / this.cell);
    const r = Math.floor((z - this.min) / this.cell);
    return { col: clamp(c, 0, this.n - 1), row: clamp(r, 0, this.n - 1) };
  }
  /** Scene metres -> flat cell index. */
  indexOf(x, z) { const { col, row } = this.cellOf(x, z); return this.idx(col, row); }
  /** Cell -> scene metres of its centre { x, z }. */
  centerOf(col, row) { return { x: this.min + (col + 0.5) * this.cell, z: this.min + (row + 0.5) * this.cell }; }
  /** Flat index -> { x, y, z } of the cell centre. */
  pointOf(i) {
    const p = this.centerOf(this.colOf(i), this.rowOf(i));
    return { x: p.x, y: this.height[i], z: p.z };
  }

  /** Ground height (m) at scene x, z, bilinear between cell centres. */
  heightAt(x, z) {
    const fx = clamp((x - this.min) / this.cell - 0.5, 0, this.n - 1);
    const fz = clamp((z - this.min) / this.cell - 0.5, 0, this.n - 1);
    const c0 = Math.floor(fx), r0 = Math.floor(fz);
    const c1 = Math.min(c0 + 1, this.n - 1), r1 = Math.min(r0 + 1, this.n - 1);
    const tx = fx - c0, tz = fz - r0;
    const H = this.height, n = this.n;
    const a = H[r0 * n + c0] * (1 - tx) + H[r0 * n + c1] * tx;
    const b = H[r1 * n + c0] * (1 - tx) + H[r1 * n + c1] * tx;
    return a * (1 - tz) + b * tz;
  }
  /** Stored slope (deg) of the cell under x, z. */
  slopeAt(x, z) { return this.slope[this.indexOf(x, z)]; }

  /** Metres per cell step to neighbour (dc, dr), horizontal. */
  stepLength(dc, dr) { return this.cell * Math.hypot(dc, dr); }
}

export function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

/** Build a Terrain from already loaded parts (tests, node). */
export function terrainFromBuffers(meta, heightBuf, slopeBuf) {
  return new Terrain(meta, heightBuf, slopeBuf);
}

/** Load the grids with fetch. baseUrl defaults to Vite's BASE_URL. */
export async function loadTerrain(baseUrl = defaultBase()) {
  const dir = baseUrl + DATA_DIR;
  const [meta, h, s] = await Promise.all([
    fetch(dir + 'murray.json').then(okJson),
    fetch(dir + 'walk_height.i16.bin').then(okBuf),
    fetch(dir + 'walk_slope.u8.bin').then(okBuf),
  ]);
  return new Terrain(meta, h, s);
}

let _terrain = null;
/** The one shared terrain, loaded once. */
export function getTerrain() {
  if (!_terrain) _terrain = loadTerrain();
  return _terrain;
}

function defaultBase() {
  try { return import.meta.env.BASE_URL || './'; } catch { return './'; }
}
function okJson(r) { if (!r.ok) throw new Error('load failed ' + r.url); return r.json(); }
function okBuf(r) { if (!r.ok) throw new Error('load failed ' + r.url); return r.arrayBuffer(); }
