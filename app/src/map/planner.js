// Route planning: A* on a grid (pure, no DOM), slope cost, leg statistics.
// Cost model (ASSUMPTIONS, ours): hard limit 20 deg, comfortable < 15 deg, no-data blocked.

import { speedMult, WALK_SPEED_MS } from '../model/speed.js';

export const SLOPE_HARD_DEG = 20;
export const SLOPE_PREFER_DEG = 15;

/** Per-cell traversal cost multiplier from slope (deg). Infinity = blocked. */
export function slopeCost(deg) {
  if (!(deg === deg)) return Infinity; // NaN = no data
  if (deg > SLOPE_HARD_DEG) return Infinity;
  if (deg <= SLOPE_PREFER_DEG) return 1 + (deg / SLOPE_PREFER_DEG) ** 2 * 1.5; // gentle growth 1..2.5
  return 2.5 + (deg - SLOPE_PREFER_DEG) * 3; // steep but allowed: strong penalty 2.5..17.5
}

export { speedMult };

class MinHeap {
  constructor() { this.k = []; this.v = []; }
  get size() { return this.k.length; }
  push(key, val) {
    const k = this.k, v = this.v; let i = k.length; k.push(key); v.push(val);
    while (i > 0) { const p = (i - 1) >> 1; if (k[p] <= key) break; k[i] = k[p]; v[i] = v[p]; i = p; }
    k[i] = key; v[i] = val;
  }
  pop() {
    const k = this.k, v = this.v, top = v[0], lk = k.pop(), lv = v.pop(), n = k.length;
    if (n) {
      let i = 0;
      for (;;) { let c = 2 * i + 1; if (c >= n) break; if (c + 1 < n && k[c + 1] < k[c]) c++; if (k[c] >= lk) break; k[i] = k[c]; v[i] = v[c]; i = c; }
      k[i] = lk; v[i] = lv;
    }
    return top;
  }
}

/**
 * 8-connected A*.
 * @param {{width:number,height:number,cost:Float32Array|number[]}} grid cost per cell, >=1, Infinity = blocked
 * @param {[number,number]} start [col,row]
 * @param {[number,number]} goal [col,row]
 * @returns {{path:[number,number][], cost:number}|null} null if unreachable
 */
export function astar(grid, start, goal) {
  const { width: W, height: Hh, cost } = grid;
  const s = start[1] * W + start[0], g = goal[1] * W + goal[0];
  if (!Number.isFinite(cost[s]) || !Number.isFinite(cost[g])) return null;
  const gs = new Float32Array(W * Hh).fill(Infinity), from = new Int32Array(W * Hh).fill(-1), done = new Uint8Array(W * Hh);
  const gx = goal[0], gy = goal[1], SQ = Math.SQRT2;
  const h = (c, r) => { const dx = Math.abs(c - gx), dy = Math.abs(r - gy); return Math.max(dx, dy) + (SQ - 1) * Math.min(dx, dy); };
  const open = new MinHeap();
  gs[s] = 0; open.push(h(start[0], start[1]), s);
  while (open.size) {
    const cur = open.pop();
    if (done[cur]) continue;
    done[cur] = 1;
    if (cur === g) break;
    const cx = cur % W, cy = (cur / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue;
      const n = ny * W + nx; if (done[n] || !Number.isFinite(cost[n])) continue;
      if (dx && dy && (!Number.isFinite(cost[cy * W + nx]) || !Number.isFinite(cost[ny * W + cx]))) continue; // no corner cutting
      const ng = gs[cur] + (dx && dy ? SQ : 1) * (cost[cur] + cost[n]) / 2;
      if (ng < gs[n]) { gs[n] = ng; from[n] = cur; open.push(ng + h(nx, ny), n); }
    }
  }
  if (from[g] < 0 && s !== g) return null;
  const path = [];
  for (let c = g; c !== -1; c = from[c]) path.push([c % W, (c / W) | 0]);
  path.reverse();
  return { path, cost: gs[g] };
}

/**
 * Dijkstra from one goal cell over the whole grid (the cost grid is symmetric, so this is the cheapest way
 * from EVERY cell to the goal). Used for the walk home: no heuristic, one pass.
 * @returns {{cost:Float32Array, from:Int32Array, width:number, height:number}} from[i] = next cell towards the goal (-1 = goal/unreachable)
 */
export function costField(grid, goal) {
  const { width: W, height: Hh, cost } = grid;
  const g = goal[1] * W + goal[0], SQ = Math.SQRT2;
  const gs = new Float32Array(W * Hh).fill(Infinity), from = new Int32Array(W * Hh).fill(-1), done = new Uint8Array(W * Hh);
  if (!Number.isFinite(cost[g])) return { cost: gs, from, width: W, height: Hh };
  const open = new MinHeap(); gs[g] = 0; open.push(0, g);
  while (open.size) {
    const cur = open.pop(); if (done[cur]) continue; done[cur] = 1;
    const cx = cur % W, cy = (cur / W) | 0;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      if (!dx && !dy) continue;
      const nx = cx + dx, ny = cy + dy; if (nx < 0 || ny < 0 || nx >= W || ny >= Hh) continue;
      const n = ny * W + nx; if (done[n] || !Number.isFinite(cost[n])) continue;
      if (dx && dy && (!Number.isFinite(cost[cy * W + nx]) || !Number.isFinite(cost[ny * W + cx]))) continue;
      const ng = gs[cur] + (dx && dy ? SQ : 1) * (cost[cur] + cost[n]) / 2;
      if (ng < gs[n]) { gs[n] = ng; from[n] = cur; open.push(ng, n); }
    }
  }
  return { cost: gs, from, width: W, height: Hh };
}

/** Cost grid for a heightmap + slope grid (deg). Reuse it across replans. */
export function costGrid(hm, slopeDeg) {
  const cost = new Float32Array(hm.width * hm.height);
  for (let i = 0; i < cost.length; i++) cost[i] = Number.isNaN(hm.data[i]) ? Infinity : slopeCost(slopeDeg[i]);
  return { width: hm.width, height: hm.height, cost };
}

/**
 * Plan through waypoints (grid cells [col,row], in order). Each leg runs A* separately.
 * @returns {{points:{x,y,elev_m,dist_m,time_s,slope_deg}[], legs:object[], total:object}}
 *  x,y in grid-local metres. A leg that cannot be routed is {feasible:false, reason}.
 */
export function planRoute(hm, slopeDeg, waypoints, { speedMs = WALK_SPEED_MS, grid } = {}) {
  const { width: W, cellSize_m: cs } = hm;
  grid = grid || costGrid(hm, slopeDeg);
  const cost = grid.cost;
  const points = [], legs = [];
  let dist = 0, time = 0;
  const push = (c, r) => points.push({ x: (c + 0.5) * cs, y: (r + 0.5) * cs, elev_m: hm.data[r * W + c], dist_m: dist, time_s: time, slope_deg: slopeDeg[r * W + c] });
  for (let w = 0; w + 1 < waypoints.length; w++) {
    const a = waypoints[w], b = waypoints[w + 1];
    const res = astar(grid, a, b);
    if (!res) {
      const bad = [a, b].findIndex((p) => !Number.isFinite(cost[p[1] * W + p[0]]));
      let reason = `no path under the ${SLOPE_HARD_DEG} deg slope limit`;
      if (bad >= 0) {
        const p = waypoints[w + bad];
        reason = `waypoint ${w + bad + 1} sits on ${Number.isNaN(hm.data[p[1] * W + p[0]]) ? 'no-data' : 'terrain steeper than ' + SLOPE_HARD_DEG + ' deg'}`;
      }
      legs.push({ from: w, to: w + 1, feasible: false, reason, dist_m: 0, time_s: 0, maxSlope_deg: NaN });
      continue;
    }
    if (!points.length) push(a[0], a[1]);
    const startIdx = points.length - 1;
    let ld = 0, lt = 0, ms = 0;
    for (let k = 1; k < res.path.length; k++) {
      const [pc, pr] = res.path[k - 1], [c, r] = res.path[k];
      const step = Math.hypot(c - pc, r - pr) * cs;
      const dz = hm.data[r * W + c] - hm.data[pr * W + pc];
      const dt = step / (speedMs * speedMult(Math.atan2(dz, step) * 180 / Math.PI));
      ld += step; lt += dt; dist += step; time += dt;
      ms = Math.max(ms, slopeDeg[r * W + c]);
      push(c, r);
    }
    legs.push({ from: w, to: w + 1, feasible: true, dist_m: ld, time_s: lt, maxSlope_deg: ms, preferExceeded: ms > SLOPE_PREFER_DEG, startIdx, endIdx: points.length - 1 });
  }
  return {
    points, legs,
    total: { dist_m: dist, time_s: time, maxSlope_deg: legs.reduce((m, l) => (l.feasible ? Math.max(m, l.maxSlope_deg) : m), 0), feasible: legs.length > 0 && legs.every((l) => l.feasible) },
  };
}
