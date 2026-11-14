// Time series along the EVA clock (pure, no DOM). Built from route.reserve (model/reserve.js) and route.points[].stationS.
// Each route point gives knots at arrival (before the station work) and at departure (after it), so values are
// interpolated by TIME, including inside a station dwell. Used by the EVA timeline strip and the walk HUD time-lapse.
const clamp01 = (v) => Math.max(0, Math.min(1, v));

/** @returns {{t:number[], res:number[], need:number[], capKJ:number, bufFrac:number, resAt:(t:number)=>number, needAt:(t:number)=>number}|null}
 *  res/need as fractions of capacity (res = suit left, need = best way home + buffer). */
export function buildSeries(route) {
  const rs = route && route.reserve, P = route && route.points;
  if (!rs || !rs.points || !P || rs.points.length !== P.length || !rs.points.length) return null;
  const cap = rs.capacityKJ, bufFrac = rs.bufferKJ / cap;
  const t = [], res = [], need = [];
  const push = (tt, r, n) => { t.push(tt); res.push(r / cap); need.push(n / cap + bufFrac); };
  rs.points.forEach((q, i) => {
    const dwell = P[i].stationS || 0;
    if (dwell > 0) push(q.elapsed_s - dwell, q.remainingKJ + q.stationKJ, q.returnCostKJ);
    push(q.elapsed_s, q.remainingKJ, q.returnCostKJ);
  });
  const at = (arr) => (te) => {
    if (te <= t[0]) return arr[0];
    const n = t.length - 1; if (te >= t[n]) return arr[n];
    let lo = 0, hi = n; while (lo < hi) { const m = (lo + hi) >> 1; if (t[m] < te) lo = m + 1; else hi = m; }
    const a = lo - 1, span = t[lo] - t[a]; return span > 0 ? arr[a] + (arr[lo] - arr[a]) * ((te - t[a]) / span) : arr[lo];
  };
  return { t, res, need, capKJ: cap, bufFrac, resAt: at(res), needAt: at(need), resFracAt: (te) => clamp01(at(res)(te)) };
}
