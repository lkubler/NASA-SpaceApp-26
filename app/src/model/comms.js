// Comms shadow model: geometric radio line of sight over a heightmap.
// ASSUMPTION (ours, not a NASA number): geometric LOS only, VHF/UHF-class link,
// no multipath or diffraction. See research/sources-validity.md section 5.
//
// Heightmap: {width, height, cellSize_m, data: Float32Array, noData}
// Coordinates x,y are in metres from the grid's top-left corner (cell i = floor(x/cellSize)).
// Visibility codes: 0 hidden, 1 visible, 2 unknown (no-data; never treated as blocking).

// The one name for the comms source, used on the map, in Walk toasts and on the Sources page.
// Geometric line of sight to a relay rover parked on high ground; the lander is not the source.
export const COMMS_SOURCE_NAME = 'relay rover';

export const HIDDEN = 0, VISIBLE = 1, UNKNOWN = 2;
export const MARS_RADIUS_M = 3389500;
// ASSUMPTION: a comms shadow longer than this is flagged (configurable).
export const DEFAULT_SHADOW_LIMIT_S = 600;

function isNoData(hm, v) {
  return Number.isNaN(v) || (hm.noData !== undefined && hm.noData !== null && v === hm.noData);
}

function sample(hm, fx, fy) {
  // bilinear in cell coordinates; returns NaN if any corner is no-data
  const x0 = Math.floor(fx), y0 = Math.floor(fy);
  const x1 = Math.min(x0 + 1, hm.width - 1), y1 = Math.min(y0 + 1, hm.height - 1);
  const tx = fx - x0, ty = fy - y0, W = hm.width, d = hm.data;
  const a = d[y0 * W + x0], b = d[y0 * W + x1], c = d[y1 * W + x0], e = d[y1 * W + x1];
  if (isNoData(hm, a) || isNoData(hm, b) || isNoData(hm, c) || isNoData(hm, e)) return NaN;
  return (a * (1 - tx) + b * tx) * (1 - ty) + (c * (1 - tx) + e * tx) * ty;
}

/**
 * Viewshed by ray casting from the observer to oversampled perimeter targets,
 * tracking the maximum terrain slope along each ray (O(rays * radius)).
 * Cells hit by no ray are filled from their already-classified neighbours.
 * @param {number} targetHeight_m height of the target antenna (suit) above ground
 * @param {{curvature?: boolean}} [opts]
 * @returns {Uint8Array} per cell 0 hidden / 1 visible / 2 unknown
 */
export function viewshed(hm, observer, targetHeight_m = 1.8, opts = {}) {
  const { width: W, height: H, cellSize_m: cs } = hm;
  const useCurv = opts.curvature !== false;
  const out = new Uint8Array(W * H);
  const seen = new Uint8Array(W * H);
  const ox = observer.x / cs - 0.5, oy = observer.y / cs - 0.5; // cell-centre coords
  const oc = Math.round(ox), orow = Math.round(oy);
  const inGrid = oc >= 0 && oc < W && orow >= 0 && orow < H;
  const ground = inGrid ? sample(hm, Math.min(Math.max(ox, 0), W - 1), Math.min(Math.max(oy, 0), H - 1)) : NaN;
  if (Number.isNaN(ground)) { out.fill(UNKNOWN); return out; }
  const eye = ground + (observer.antennaHeight_m ?? 2);
  const k = useCurv ? 1 / (2 * MARS_RADIUS_M) : 0;

  const R = Math.max(Math.hypot(ox, oy), Math.hypot(W - 1 - ox, oy),
                     Math.hypot(ox, H - 1 - oy), Math.hypot(W - 1 - ox, H - 1 - oy));
  const nRays = Math.max(16, Math.ceil(2 * Math.PI * R * 2));
  const step = 0.5; // cells; half-cell marching avoids skipping cells
  for (let r = 0; r < nRays; r++) {
    const ang = (r / nRays) * 2 * Math.PI;
    const dx = Math.cos(ang) * step, dy = Math.sin(ang) * step;
    let maxSlope = -Infinity;
    let fx = ox, fy = oy;
    for (let s = 1; ; s++) {
      fx += dx; fy += dy;
      if (fx < -0.5 || fy < -0.5 || fx > W - 0.5 || fy > H - 0.5) break;
      const cx = Math.min(Math.max(fx, 0), W - 1), cy = Math.min(Math.max(fy, 0), H - 1);
      const dist = s * step * cs;
      const z = sample(hm, cx, cy);
      const idx = Math.round(cy) * W + Math.round(cx);
      if (Number.isNaN(z)) { // unknown: report, do not block, do not update horizon
        if (!seen[idx]) { seen[idx] = 1; out[idx] = UNKNOWN; }
        continue;
      }
      const drop = k * dist * dist;
      const slopeTop = (z + targetHeight_m - eye - drop) / dist;
      const vis = slopeTop >= maxSlope;
      // a cell is visible if any ray sees it (union over rays)
      if (!seen[idx] || out[idx] === UNKNOWN || (out[idx] !== VISIBLE && vis)) {
        seen[idx] = 1; out[idx] = vis ? VISIBLE : HIDDEN;
      }
      const slopeGround = (z - eye - drop) / dist;
      if (slopeGround > maxSlope) maxSlope = slopeGround;
    }
  }
  // fill cells never touched by a ray (rare, far from the observer)
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x;
    if (seen[i]) continue;
    if (isNoData(hm, hm.data[i])) { out[i] = UNKNOWN; continue; }
    let v = 0, n = 0;
    for (let yy = Math.max(0, y - 1); yy <= Math.min(H - 1, y + 1); yy++)
      for (let xx = Math.max(0, x - 1); xx <= Math.min(W - 1, x + 1); xx++) {
        const j = yy * W + xx;
        if (seen[j] && out[j] === VISIBLE) v = 1;
        n += seen[j];
      }
    out[i] = n ? v : HIDDEN;
  }
  out[orow * W + oc] = VISIBLE;
  return out;
}

/**
 * Shadow segments along a route.
 * @param {{x:number,y:number,time_s:number}[]} route points in metres + elapsed time
 * @param {Uint8Array} visibility from viewshed()
 * @param {{width:number,height:number,cellSize_m:number,limit_s?:number}} opts grid info;
 *        limit_s defaults to 600 s (ASSUMPTION, not a NASA figure)
 * @returns {{start:number,end:number,duration_s:number,exceedsLimit:boolean,limit_s:number}[]}
 *   start/end are times; end is the first visible point after the shadow, or the last
 *   route time if the route ends in shadow. Unknown cells count as not in shadow.
 */
export function routeShadows(route, visibility, opts) {
  const limit = opts.limit_s ?? DEFAULT_SHADOW_LIMIT_S;
  const { width: W, height: H, cellSize_m: cs } = opts;
  const segs = [];
  let start = null;
  const close = (end) => {
    const duration_s = end - start;
    segs.push({ start, end, duration_s, exceedsLimit: duration_s > limit, limit_s: limit });
    start = null;
  };
  for (const p of route) {
    const cx = Math.min(Math.max(Math.floor(p.x / cs), 0), W - 1);
    const cy = Math.min(Math.max(Math.floor(p.y / cs), 0), H - 1);
    const hidden = visibility[cy * W + cx] === HIDDEN;
    if (hidden && start === null) start = p.time_s;
    else if (!hidden && start !== null) close(p.time_s);
  }
  if (start !== null && route.length) close(route[route.length - 1].time_s);
  return segs;
}

/**
 * Straight line of sight between two points over the heightmap (same rule as viewshed(): geometric, with
 * Mars curvature, no-data never blocks). x,y metres; heights are above ground.
 */
export function lineOfSight(hm, a, b, aboveA = 2, aboveB = 1.8) {
  const { width: W, height: H, cellSize_m: cs } = hm;
  const ax = a.x / cs - 0.5, ay = a.y / cs - 0.5, bx = b.x / cs - 0.5, by = b.y / cs - 0.5;
  const cl = (v, m) => Math.min(Math.max(v, 0), m - 1);
  const za = sample(hm, cl(ax, W), cl(ay, H)), zb = sample(hm, cl(bx, W), cl(by, H));
  if (Number.isNaN(za) || Number.isNaN(zb)) return true;
  const ea = za + aboveA, eb = zb + aboveB, k = 1 / (2 * MARS_RADIUS_M);
  const len = Math.hypot(bx - ax, by - ay) * cs, n = Math.max(2, Math.ceil(len / (cs * 0.5)));
  for (let s = 1; s < n; s++) {
    const t = s / n, d = t * len, z = sample(hm, cl(ax + (bx - ax) * t, W), cl(ay + (by - ay) * t, H));
    if (Number.isNaN(z)) continue;
    const ray = ea + (eb - ea) * t - k * d * (len - d); // straight line, bulged by curvature
    if (z > ray) return false;
  }
  return true;
}

/**
 * Pick the relay position that sees the most route points. Candidates [{x,y}] are tried in order; ties go
 * to the earlier one (put the nearest first). Returns {x, y, visible, total}.
 */
export function bestRelay(hm, routePoints, candidates, { antennaHeight_m = 2, targetHeight_m = 1.8 } = {}) {
  let best = null;
  for (const c of candidates) {
    let v = 0;
    for (const p of routePoints) if (lineOfSight(hm, c, p, antennaHeight_m, targetHeight_m)) v++;
    if (!best || v > best.visible) best = { x: c.x, y: c.y, visible: v, total: routePoints.length };
  }
  return best;
}
