// Route planner on the 0.5 m walk grid, in the browser (specs/rules.md, specs/2-plan.md).
// Method (same as research/walk-targets.md "grid method"): Dijkstra over cell centres, 8 neighbours,
// edge length = 3D distance between cell centres. A cell is closed if its stored slope > the slope rule.
// Pace is constant, so the fastest route is the shortest 3D route over open ground.
// If no route keeps every rule, closed ground is allowed at a very high cost per metre (PLANNER.steepPenalty):
// the result crosses as little closed ground as possible and is marked as breaking the slope rule.

import { RULES, PLANNER } from './values.js';
import { workRate, walkSeconds } from './suit.js';

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];

/** true if the cell is closed to the route (steeper than the slope rule). */
export function isClosed(terrain, i) { return terrain.slope[i] > RULES.slopeMaxDeg.value; }

/** Closed-ground mask for the whole grid (Uint8Array, 1 = steeper than the slope rule). */
export function closedMask(terrain) {
  const m = new Uint8Array(terrain.size);
  for (let i = 0; i < m.length; i++) m[i] = isClosed(terrain, i) ? 1 : 0;
  return m;
}

/**
 * Cost of one step from cell a to neighbour cell b.
 * @returns {{ m: number, slopeDeg: number, seconds: number, energyJ: number, closed: boolean }}
 */
export function stepCost(terrain, a, b) {
  const dc = terrain.colOf(b) - terrain.colOf(a), dr = terrain.rowOf(b) - terrain.rowOf(a);
  const flat = terrain.stepLength(dc, dr);
  const dh = terrain.height[b] - terrain.height[a];
  const m = Math.hypot(flat, dh);
  const slopeDeg = (Math.atan2(dh, flat) * 180) / Math.PI;
  const seconds = walkSeconds(m);
  return { m, slopeDeg, seconds, energyJ: workRate(slopeDeg) * seconds, closed: isClosed(terrain, a) || isClosed(terrain, b) };
}

class Heap {
  constructor(cap) { this.k = new Float64Array(cap); this.v = new Int32Array(cap); this.n = 0; }
  push(key, val) {
    if (this.n >= this.k.length) {
      const k = new Float64Array(this.k.length * 2); k.set(this.k); this.k = k;
      const v = new Int32Array(this.v.length * 2); v.set(this.v); this.v = v;
    }
    let i = this.n++;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (this.k[p] <= key) break;
      this.k[i] = this.k[p]; this.v[i] = this.v[p]; i = p;
    }
    this.k[i] = key; this.v[i] = val;
  }
  pop() {
    const top = this.v[0], topK = this.k[0];
    const lk = this.k[--this.n], lv = this.v[this.n];
    let i = 0;
    for (;;) {
      let c = 2 * i + 1;
      if (c >= this.n) break;
      if (c + 1 < this.n && this.k[c + 1] < this.k[c]) c++;
      if (this.k[c] >= lk) break;
      this.k[i] = this.k[c]; this.v[i] = this.v[c]; i = c;
    }
    this.k[i] = lk; this.v[i] = lv;
    this.lastKey = topK;
    return top;
  }
}

function penaltyOf(closed) { return closed ? PLANNER.steepPenalty.value : 1; }

/**
 * Fastest route between two scene points.
 * @returns {{ cells: Int32Array, points: {x,y,z}[], keepsRules: boolean, closedM: number }}
 */
export function findRoute(terrain, from, to) {
  const N = terrain.size, n = terrain.n;
  const s = terrain.indexOf(from.x, from.z), g = terrain.indexOf(to.x, to.z);
  const dist = new Float64Array(N).fill(Infinity);
  const prev = new Int32Array(N).fill(-1);
  const done = new Uint8Array(N);
  const heap = new Heap(4096);
  dist[s] = 0; heap.push(0, s);
  while (heap.n) {
    const u = heap.pop();
    if (done[u]) continue;
    done[u] = 1;
    if (u === g) break;
    const uc = u % n, ur = (u / n) | 0;
    for (const [dc, dr] of NB) {
      const c = uc + dc, r = ur + dr;
      if (c < 0 || r < 0 || c >= n || r >= n) continue;
      const w = r * n + c;
      if (done[w]) continue;
      const st = stepCost(terrain, u, w);
      const d = dist[u] + st.m * penaltyOf(st.closed);
      if (d < dist[w]) { dist[w] = d; prev[w] = u; heap.push(d, w); }
    }
  }
  const list = [];
  for (let c = g; c !== -1; c = prev[c]) list.push(c);
  list.reverse();
  const cells = Int32Array.from(list);
  let closedM = 0;
  for (let k = 1; k < cells.length; k++) {
    const st = stepCost(terrain, cells[k - 1], cells[k]);
    if (st.closed) closedM += st.m;
  }
  return { cells, points: Array.from(cells, (i) => terrain.pointOf(i)), keepsRules: closedM === 0, closedM };
}

/**
 * Cost field towards one target (e.g. the rover): for every cell, the fastest way from that cell to the target.
 * Built once per target; the Walk can ask it every frame with at(x, z).
 * Arrays per cell: seconds (suit time), energyJ (at normal work rate; the walk-back factor is applied
 * by reserveOnReturn), metres, closedM (metres of closed ground on that way), next (next cell towards the target).
 */
export function costField(terrain, target) {
  const N = terrain.size, n = terrain.n;
  const g = terrain.indexOf(target.x, target.z);
  const key = new Float64Array(N).fill(Infinity);
  const seconds = new Float32Array(N), energyJ = new Float32Array(N), metres = new Float32Array(N), closedM = new Float32Array(N);
  const next = new Int32Array(N).fill(-1);
  const done = new Uint8Array(N);
  const heap = new Heap(8192);
  key[g] = 0; heap.push(0, g);
  while (heap.n) {
    const v = heap.pop();
    if (done[v]) continue;
    done[v] = 1;
    const vc = v % n, vr = (v / n) | 0;
    for (const [dc, dr] of NB) {
      const c = vc + dc, r = vr + dr;
      if (c < 0 || r < 0 || c >= n || r >= n) continue;
      const u = r * n + c;
      if (done[u]) continue;
      const st = stepCost(terrain, u, v); // walking from u towards the target through v
      const k = key[v] + st.m * penaltyOf(st.closed);
      if (k < key[u]) {
        key[u] = k; next[u] = v;
        seconds[u] = seconds[v] + st.seconds;
        energyJ[u] = energyJ[v] + st.energyJ;
        metres[u] = metres[v] + st.m;
        closedM[u] = closedM[v] + (st.closed ? st.m : 0);
        heap.push(k, u);
      }
    }
  }
  return {
    target: { ...target }, seconds, energyJ, metres, closedM, next,
    /** Values of the cell under x, z: { seconds, energyJ, metres, closedM, index }. */
    at(x, z) {
      const i = terrain.indexOf(x, z);
      return { seconds: seconds[i], energyJ: energyJ[i], metres: metres[i], closedM: closedM[i], index: i };
    },
    /** Cells of the way from x, z to the target. */
    pathFrom(x, z) {
      const out = [];
      for (let i = terrain.indexOf(x, z); i !== -1; i = next[i]) out.push(i);
      return out;
    },
  };
}
