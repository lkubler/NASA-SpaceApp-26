// Science layers for the Map: Curiosity's real traverse, station photos, slope statistics along the track.
// Data: public/data/murray/ (task 016, scripts/preprocess/README.md). Pure helpers first, loaders last.
export const SCIENCE_BASE = (import.meta.env?.BASE_URL ?? '/') + 'data/murray/';

// Named stations with real photos. `sol` picks the track point; photo ids refer to photos/credits.json.
export const STATIONS = [
  { id: 'marimba', name: 'Marimba', sol: 1417, photos: ['marimba_drill', 'marimba_arm_navcam', 'butte_mastcam_1421'], note: 'Drill site 13, sols 1417-1427' },
  { id: 'crossbed', name: 'Cross-bedding butte', sol: 1454, photos: ['crossbedding_PIA21042'], note: 'Mastcam view on sol 1454, just before Quela' },
  { id: 'quela', name: 'Quela', sol: 1455, photos: ['quela_drill', 'quela_navcam'], note: 'Drill site 14 at the foot of a butte, sols 1455-1468' },
];

/** Net grade (deg) of each leg between consecutive in-crop drive ends, from the rover's own elevation at each end.
 *  The DTM is not used here: its registration to the track differs by several metres (research/data-science.md section 6),
 *  and pixel slopes along a straight line would cut across butte flanks the rover never drove. */
export function legGrades(points, cell_m, minLeg_m = 4) {
  const pts = points.filter((p) => p.in_crop), out = [];
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1], b = pts[i], d = Math.hypot(b.col - a.col, b.row - a.row) * cell_m;
    if (d >= minLeg_m) out.push((Math.atan2(Math.abs(b.elev_m - a.elev_m), d) * 180) / Math.PI);
  }
  return out;
}
/** Net grade over successive stretches of about `len_m` along a planned route (points with dist_m, elev_m). */
export function routeGrades(points, len_m = 40) {
  const out = []; let i = 0;
  while (i < points.length - 1) {
    let j = i + 1; while (j < points.length - 1 && points[j].dist_m - points[i].dist_m < len_m) j++;
    const d = points[j].dist_m - points[i].dist_m;
    if (d >= len_m / 2) out.push((Math.atan2(Math.abs(points[j].elev_m - points[i].elev_m), d) * 180) / Math.PI);
    i = j;
  }
  return out;
}
/** median, 95th percentile, max and the share above `limit` of a list of slopes. */
export function slopeStats(v, limit) {
  if (!v.length) return null;
  const s = [...v].sort((x, y) => x - y), q = (p) => s[Math.min(s.length - 1, Math.floor(p * s.length))];
  return { n: s.length, median: q(0.5), p95: q(0.95), max: s[s.length - 1], overLimit: s.filter((x) => x > limit).length / s.length };
}

export async function loadScience(base = SCIENCE_BASE) {
  const [track, credits] = await Promise.all([
    fetch(base + 'curiosity_track.json').then((r) => r.json()),
    fetch(base + 'photos/credits.json').then((r) => r.json()),
  ]);
  const byId = Object.fromEntries(credits.photos.map((p) => [p.id, { ...p, url: base + 'photos/' + p.file.replace(/^photos\//, '') }]));
  const stations = STATIONS.map((s) => { const p = track.points.find((q) => q.sol === s.sol); return { ...s, col: p.col, row: p.row, photos: s.photos.map((id) => byId[id]).filter(Boolean) }; });
  return { track, stations, credits };
}
