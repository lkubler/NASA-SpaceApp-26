// Outline of the closed (steep) ground for the Walk's border wall (specs/feedback-1.md, Walk: display).
// A display aid only: it starts from the planner's own test (isClosed), cleans that mask for the eye
// (small patches dropped, small gaps and holes filled) and traces it as smooth closed lines. The warnings
// and the planner keep using the exact test. No three.js here, so it runs in tests.
import { isClosed } from '../../core/index.js';

/**
 * Cleaned closed-ground mask (Uint8Array, 1 = inside the border).
 * @param {object} o the DISPLAY settings (display.js): steepCloseM, steepHoleMaxM2, steepKeepOpenM, steepMinAreaM2
 * @param {ArrayLike<number>[]} keepOpen cell lists of planned routes: open ground within o.steepKeepOpenM of
 *   them stays open, so the cleaning never draws the border across a way the planner walks
 */
export function steepDisplayMask(t, o, keepOpen = []) {
  const n = t.n, N = n * n;
  const raw = new Uint8Array(N);
  for (let i = 0; i < N; i++) raw[i] = isClosed(t, i) ? 1 : 0;
  let m = raw;
  // morphological close (dilate, then erode) with a disc: joins closed cells across gaps narrower than
  // about 2 * closeM and smooths the outline; the outline stays where it was elsewhere
  const r = Math.round(o.steepCloseM / t.cell);
  if (r > 0) m = erode(dilate(raw, n, r), n, r); else m = raw.slice();
  // small open holes inside closed ground: filled (open areas touching the edge of the square are kept)
  removeSmall(m, n, 0, Math.round(o.steepHoleMaxM2 / (t.cell * t.cell)), true);
  // open ground along the planned routes: open again
  const k = Math.round(o.steepKeepOpenM / t.cell), d = disc(k);
  for (const cells of keepOpen) for (const i of cells) {
    const c = i % n, row = (i / n) | 0;
    for (const [a, b] of d) {
      const cc = c + a, rr = row + b;
      if (cc >= 0 && rr >= 0 && cc < n && rr < n && !raw[rr * n + cc]) m[rr * n + cc] = 0;
    }
  }
  // closed patches below the minimum area: no border of their own
  removeSmall(m, n, 1, Math.round(o.steepMinAreaM2 / (t.cell * t.cell)), false);
  return m;
}

/**
 * Smooth closed outlines of the cleaned mask, in scene metres: [[{x,z}, ...], ...] (each loop closed,
 * the last point not repeated). Marching squares at 0.5 between cell centres (no 0.5 m stair steps),
 * then Chaikin corner cutting, an even resample and a few relaxation passes (each point moved halfway to
 * the mean of its neighbours), which round off the corners left by one-cell notches.
 */
export function steepOutlines(t, o, keepOpen = []) {
  const m = steepDisplayMask(t, o, keepOpen);
  const loops = traceLoops(m, t.n).map((loop) => loop.map(([c, r]) => ({ x: t.min + (c + 0.5) * t.cell, z: t.min + (r + 0.5) * t.cell })));
  // outlines enclosing less than the minimum area (specks left by the route corridors): none
  return loops
    .filter((l) => Math.abs(area(l)) >= o.steepMinAreaM2)
    .map((l) => relax(resample(chaikin(l, o.steepSmoothPasses), o.steepSpacingM), o.steepRelaxPasses));
}

/**
 * The lines the wall is drawn along: the outlines, without the parts that run along the edge of the mapped
 * square itself (closed ground cut by the edge of the map is not a border you can walk up to).
 * @returns {{ pts: {x,z}[], closed: boolean }[]}
 */
export function steepWallLines(t, o, keepOpen = []) {
  const lim = t.max - o.steepEdgeClearM;
  const ok = (p) => Math.abs(p.x) <= lim && Math.abs(p.z) <= lim;
  const out = [];
  for (const l of steepOutlines(t, o, keepOpen)) {
    const first = l.findIndex((p) => !ok(p));
    if (first < 0) { out.push({ pts: l, closed: true }); continue; }
    // walk once around, starting at a left-out point, and keep each run of points inside
    let run = [];
    for (let k = 1; k <= l.length; k++) {
      const p = l[(first + k) % l.length];
      if (ok(p)) run.push(p);
      else { if ((run.length - 1) * o.steepSpacingM >= o.steepMinLineM) out.push({ pts: run, closed: false }); run = []; }
    }
  }
  return out;
}

// ---------- grid helpers ----------
function disc(r) {
  const out = [];
  for (let a = -r; a <= r; a++) for (let b = -r; b <= r; b++) if (a * a + b * b <= r * r + r * 0.5) out.push([a, b]);
  return out;
}
function dilate(m, n, r) {
  const o = new Uint8Array(m.length), d = disc(r);
  for (let row = 0; row < n; row++) for (let c = 0; c < n; c++) {
    if (!m[row * n + c]) continue;
    for (const [a, b] of d) {
      const cc = c + a, rr = row + b;
      if (cc >= 0 && rr >= 0 && cc < n && rr < n) o[rr * n + cc] = 1;
    }
  }
  return o;
}
function erode(m, n, r) {
  const o = new Uint8Array(m.length), d = disc(r);
  for (let row = 0; row < n; row++) for (let c = 0; c < n; c++) {
    let all = 1;
    for (const [a, b] of d) {
      const cc = c + a, rr = row + b;
      // beyond the square counts as "same as the cell", so the edge of the square does not eat closed ground
      if (cc < 0 || rr < 0 || cc >= n || rr >= n) continue;
      if (!m[rr * n + cc]) { all = 0; break; }
    }
    o[row * n + c] = all;
  }
  return o;
}
/** Flip connected regions of `value` smaller than `minCells` (8-connected for 1, 4-connected for 0). */
function removeSmall(m, n, value, minCells, keepEdge) {
  const seen = new Uint8Array(m.length);
  const nb = value ? [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (let i = 0; i < m.length; i++) {
    if (seen[i] || m[i] !== value) continue;
    const comp = [i], st = [i]; seen[i] = 1; let edge = false;
    while (st.length) {
      const j = st.pop(), c = j % n, r = (j / n) | 0;
      if (c === 0 || r === 0 || c === n - 1 || r === n - 1) edge = true;
      for (const [a, b] of nb) {
        const cc = c + a, rr = r + b;
        if (cc < 0 || rr < 0 || cc >= n || rr >= n) continue;
        const k = rr * n + cc;
        if (!seen[k] && m[k] === value) { seen[k] = 1; st.push(k); comp.push(k); }
      }
    }
    if (comp.length < minCells && !(keepEdge && edge)) for (const k of comp) m[k] = 1 - value;
  }
}

/**
 * Marching squares on the cell-centre lattice at level 0.5 (mask padded with 0 outside the square, so
 * every outline is closed). Returns loops of [col, row] points (fractional, on lattice edges).
 */
function traceLoops(m, n) {
  const v = (c, r) => (c < 0 || r < 0 || c >= n || r >= n ? 0 : m[r * n + c]);
  // edge ids: horizontal edge from (c, r) to (c+1, r) = 'h' ; vertical from (c, r) to (c, r+1) = 'v'
  const pt = new Map(), next = new Map();
  const id = (k, c, r) => k + c + ',' + r;
  const put = (k, c, r) => { const key = id(k, c, r); if (!pt.has(key)) pt.set(key, k === 'h' ? [c + 0.5, r] : [c, r + 0.5]); return key; };
  // squares between lattice points (c, r) .. (c+1, r+1), for c, r from -1 to n-1; segments oriented with
  // the closed side on the right, so each edge point has exactly one successor
  for (let r = -1; r < n; r++) for (let c = -1; c < n; c++) {
    const a = v(c, r), b = v(c + 1, r), d = v(c + 1, r + 1), e = v(c, r + 1); // corners: bl, br, tr, tl
    const code = a | (b << 1) | (d << 2) | (e << 3);
    if (code === 0 || code === 15) continue;
    const S = put('h', c, r), E = put('v', c + 1, r), Nn = put('h', c, r + 1), W = put('v', c, r);
    const seg = (p, q) => next.set(p, q);
    switch (code) {
      case 1: seg(W, S); break;      // bl
      case 2: seg(S, E); break;      // br
      case 3: seg(W, E); break;      // bl br
      case 4: seg(E, Nn); break;     // tr
      case 5: seg(W, S); seg(E, Nn); break; // bl tr (saddle: kept apart)
      case 6: seg(S, Nn); break;     // br tr
      case 7: seg(W, Nn); break;     // all but tl
      case 8: seg(Nn, W); break;     // tl
      case 9: seg(Nn, S); break;     // tl bl
      case 10: seg(S, E); seg(Nn, W); break; // br tl (saddle: kept apart)
      case 11: seg(Nn, E); break;    // all but tr
      case 12: seg(E, W); break;     // tr tl
      case 13: seg(E, S); break;     // all but br
      case 14: seg(S, W); break;     // all but bl
    }
  }
  const loops = [], used = new Set();
  for (const start of next.keys()) {
    if (used.has(start)) continue;
    const loop = [];
    let k = start;
    while (k && !used.has(k)) { used.add(k); loop.push(pt.get(k)); k = next.get(k); }
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function area(l) {
  let a = 0;
  for (let i = 0; i < l.length; i++) { const p = l[i], q = l[(i + 1) % l.length]; a += p.x * q.z - q.x * p.z; }
  return a / 2;
}

function relax(l, passes) {
  let p = l;
  for (let s = 0; s < passes; s++) {
    p = p.map((q, i) => {
      const a = p[(i - 1 + p.length) % p.length], b = p[(i + 1) % p.length];
      return { x: q.x * 0.5 + (a.x + b.x) * 0.25, z: q.z * 0.5 + (a.z + b.z) * 0.25 };
    });
  }
  return p;
}

function chaikin(l, passes) {
  let p = l;
  for (let s = 0; s < passes; s++) {
    const o = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      o.push({ x: a.x * 0.75 + b.x * 0.25, z: a.z * 0.75 + b.z * 0.25 }, { x: a.x * 0.25 + b.x * 0.75, z: a.z * 0.25 + b.z * 0.75 });
    }
    p = o;
  }
  return p;
}

/** Points about every `step` metres along the closed line. */
function resample(l, step) {
  let len = 0;
  for (let i = 0; i < l.length; i++) { const a = l[i], b = l[(i + 1) % l.length]; len += Math.hypot(b.x - a.x, b.z - a.z); }
  const k = Math.max(3, Math.round(len / step)), d = len / k, out = [];
  let i = 0, acc = 0, want = 0;
  for (let s = 0; s < k; s++, want += d) {
    for (;;) {
      const a = l[i % l.length], b = l[(i + 1) % l.length], seg = Math.hypot(b.x - a.x, b.z - a.z);
      if (acc + seg >= want || i >= l.length - 1) {
        const f = seg ? Math.min(1, Math.max(0, (want - acc) / seg)) : 0;
        out.push({ x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f });
        break;
      }
      acc += seg; i++;
    }
  }
  return out;
}
