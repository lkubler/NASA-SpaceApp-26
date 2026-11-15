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

/**
 * The one slope test for a point (scene metres), shared by the planner tests and the Walk
 * (ground underfoot, steep stretch ahead): true if the point lies in a closed cell and is at least
 * PLANNER.edgeToleranceM inside it. Every point on a planned step between two open cells passes it,
 * diagonal steps included (they only touch the corner of the cells beside them).
 */
export function isClosedAt(terrain, x, z) {
  const i = terrain.indexOf(x, z);
  if (!isClosed(terrain, i)) return false;
  const c = terrain.centerOf(terrain.colOf(i), terrain.rowOf(i));
  const half = terrain.cell / 2 - PLANNER.edgeToleranceM.value;
  return Math.abs(x - c.x) <= half && Math.abs(z - c.z) <= half;
}

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

/** Binary min-heap of (key, cell) pairs (also used by the Walk for its local way back to allowed ground). */
export class Heap {
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
    /**
     * Way from the point x, z (not only its cell): the shortest of "straight to the centre of a nearby open
     * cell, then that cell's way". Continuous as the visitor walks, so the reserve on return never jumps
     * when a step crosses into a cell whose own way is much longer (e.g. a closed cell whose corner the
     * visitor may cut, or a cell on the other side of closed ground). { seconds, energyJ, metres, closedM, index }
     */
    at(x, z) {
      const i0 = terrain.indexOf(x, z), c0 = terrain.colOf(i0), r0 = terrain.rowOf(i0);
      const y = terrain.heightAt(x, z);
      let best = null, bestKey = Infinity;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const c = c0 + dc, r = r0 + dr;
        if (c < 0 || r < 0 || c >= n || r >= n) continue;
        const i = r * n + c;
        if (isClosed(terrain, i)) continue;
        // the target's own cell: straight to the target point itself (0 at the target)
        const p = i === g ? target : terrain.centerOf(c, r);
        const flat = Math.hypot(p.x - x, p.z - z), dh = (i === g ? terrain.heightAt(p.x, p.z) : terrain.height[i]) - y;
        const m = Math.hypot(flat, dh);
        const k = metres[i] + m;
        if (k < bestKey) { bestKey = k; best = { i, m, slopeDeg: flat > 1e-6 ? (Math.atan2(dh, flat) * 180) / Math.PI : 0 }; }
      }
      if (!best) best = { i: i0, m: 0, slopeDeg: 0 }; // inside closed ground: the cell's own way
      const { i, m, slopeDeg } = best;
      const s = walkSeconds(m);
      return { seconds: seconds[i] + s, energyJ: energyJ[i] + workRate(slopeDeg) * s, metres: metres[i] + m, closedM: closedM[i], index: i };
    },
    /** Cells of the way from x, z to the target. */
    pathFrom(x, z) {
      const out = [];
      for (let i = terrain.indexOf(x, z); i !== -1; i = next[i]) out.push(i);
      return out;
    },
  };
}
