// Re-check of route slopes on the 1 m HiRISE DTM slope grid (task 029). The planner uses a 5 m regional grid,
// which smooths steep steps; the 1 m grid covers only the 1 km crop around the lander.
/**
 * Max and share-over-limit of the 1 m slope along the part of the route inside the 1 km crop.
 * @param {{x:number,y:number}[]} pts route points in the 1 km frame (metres east/south of the NW corner)
 * @param {{width:number,height:number,cellSize_m:number}} hm 1 m grid
 * @param {ArrayLike<number>} slope degrees per cell (NaN = no data)
 * @param {number} limitDeg
 * @returns {{n:number, total:number, maxDeg:number, overFrac:number, overLimit:boolean}|null} null when no point is inside
 */
export function slopeAlongRoute(pts, hm, slope, limitDeg = 20) {
  const { width: W, height: H, cellSize_m: cs } = hm;
  let n = 0, maxDeg = 0, over = 0;
  const sample = (x, y) => {
    const c = Math.floor(x / cs), r = Math.floor(y / cs);
    if (c < 0 || r < 0 || c >= W || r >= H) return NaN;
    return slope[r * W + c];
  };
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[i + 1] || a;
    const steps = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / cs)); // about one sample per 1 m cell
    for (let k = 0; k < steps; k++) {
      const t = k / steps, s = sample(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
      if (!Number.isFinite(s)) continue;
      n++; if (s > maxDeg) maxDeg = s; if (s > limitDeg) over++;
    }
  }
  if (!n) return null;
  return { n, total: pts.length, maxDeg, overFrac: over / n, overLimit: maxDeg > limitDeg };
}
