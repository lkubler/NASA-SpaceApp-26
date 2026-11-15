// Turn-back line on the small map (specs/x-turnline.md): the edge of the ground from which the crew still
// gets back to the rover with reserve. Per place the value is exactly the reserve the helmet shows
// (reserveFrom with the stops the sim counts: the rest of the plan, then the way home at the walk-back
// factor), evaluated on a coarse grid around the crew and drawn again about once a second. No numbers of
// its own: the grid step and the refresh time are display settings (display.js).
import { reserveFrom, remainingWay } from '../../core/index.js';
import { DISPLAY as D } from './display.js';

/** The places the shown reserve counts ahead, as sim.js applies them (also on a round too long for the suit). */
export function shownAhead(sim) {
  const { s, log } = sim;
  const way = remainingWay(log);
  if (s.fit) {
    if (!s.fit.j) return { phase: 'back', stops: undefined };
    let last = -1, seen = 0;
    way.forEach((p, k) => { if (!p.pass && ++seen <= s.fit.j) last = k; });
    return { phase: 'out', stops: way.slice(0, last + 1) };
  }
  return { phase: log.phase, stops: way };
}

/**
 * Reserve on return (seconds) on a grid of nodes centred on (cx, cz), `step` metres apart, `r` metres
 * out. Node (0,0) is the crew's own place. NaN where the grid has no ground.
 * @returns {{ cx, cz, step, half, w, vals: Float32Array, anyOutside: boolean, anyInView: boolean }}
 */
export function turnField(terrain, levels, ahead, cx, cz, step, r, viewR = r) {
  const half = Math.ceil(r / step), w = 2 * half + 1;
  const vals = new Float32Array(w * w);
  let anyOutside = false, anyInView = false; // anyInView: outside ground within viewR metres of the centre (what the small map shows)
  const lo = terrain.min, hi = terrain.max;
  for (let j = 0; j < w; j++) for (let i = 0; i < w; i++) {
    const x = cx + (i - half) * step, z = cz + (j - half) * step;
    let v = NaN;
    if (x >= lo && x <= hi && z >= lo && z <= hi) {
      v = reserveFrom(terrain, levels, { x, z, phase: ahead.phase, stops: ahead.stops }).seconds;
      if (!(v >= 0)) {
        if (!Number.isFinite(v)) v = -1e9;
        anyOutside = true;
        if (Math.hypot(x - cx, z - cz) <= viewR) anyInView = true;
      }
    }
    vals[j * w + i] = v;
  }
  return { cx, cz, step, half, w, vals, anyOutside, anyInView };
}

/** Segments of the zero level (marching squares, linear along the edges): [[x1,z1,x2,z2], ...] in scene metres. */
export function turnContour(f) {
  const { w, vals, step, cx, cz, half } = f, out = [];
  const X = (i) => cx + (i - half) * step, Z = (j) => cz + (j - half) * step;
  const cross = (a, b, xa, za, xb, zb) => { const t = Math.max(0, Math.min(1, a / (a - b))); return [xa + (xb - xa) * t, za + (zb - za) * t]; };
  for (let j = 0; j < w - 1; j++) for (let i = 0; i < w - 1; i++) {
    const a = vals[j * w + i], b = vals[j * w + i + 1], c = vals[(j + 1) * w + i + 1], d = vals[(j + 1) * w + i];
    if (a !== a || b !== b || c !== c || d !== d) continue;
    const pts = [];
    if ((a >= 0) !== (b >= 0)) pts.push(cross(a, b, X(i), Z(j), X(i + 1), Z(j)));
    if ((b >= 0) !== (c >= 0)) pts.push(cross(b, c, X(i + 1), Z(j), X(i + 1), Z(j + 1)));
    if ((c >= 0) !== (d >= 0)) pts.push(cross(c, d, X(i + 1), Z(j + 1), X(i), Z(j + 1)));
    if ((d >= 0) !== (a >= 0)) pts.push(cross(d, a, X(i), Z(j + 1), X(i), Z(j)));
    for (let k = 0; k + 1 < pts.length; k += 2) out.push([pts[k][0], pts[k][1], pts[k + 1][0], pts[k + 1][1]]);
  }
  return out;
}

/**
 * Keeps the field up to date for the small map. update(sim, nowMs) returns the current field (with its
 * contour) or null when nothing in the mapped view is outside (then nothing is drawn). Recalculated at most
 * every D.turnlineEveryMs, and only when the suit levels or the crew's place changed.
 */
export function createTurnline(terrain) {
  let cur = null, lastMs = -1e9, key = '', at = null;
  const api = {
    lastCostMs: 0,
    update(sim, nowMs) {
      const { s, log } = sim;
      const L = log.levels;
      const k = `${L.oxygen}|${L.co2}|${L.water}|${L.battery}|${log.phase}|${log.stops.map((st) => (st.sampled ? 1 : st.skipped ? 2 : 0)).join('')}`;
      const moved = !at || Math.hypot(s.x - at.x, s.z - at.z) > D.turnlineRedoM;
      if (nowMs - lastMs >= D.turnlineEveryMs && (k !== key || moved)) {
        const t0 = performance.now();
        const f = turnField(terrain, L, shownAhead(sim), s.x, s.z, D.turnlineStepM, D.miniRadiusM + D.turnlineMarginM, D.miniRadiusM);
        f.contour = f.anyOutside ? turnContour(f) : [];
        cur = f.anyOutside ? f : null; key = k; lastMs = nowMs; at = { x: s.x, z: s.z };
        api.lastCostMs = performance.now() - t0;
      }
      return cur;
    },
  };
  return api;
}
