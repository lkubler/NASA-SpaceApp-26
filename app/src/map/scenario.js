// Default scenario for the Map (task 022): a NASA-scale walkback EVA. Pure, no DOM; all positions in the regional
// local frame (metres, terrain/regional.js).
// Lander: site B of research/data-science.md section 7 (SE of the buttes, ~2.5 km from Quela, flat, easiest approach).
// Station minutes and the choice of stations are assumptions of ours (research/science.md); Quela is Curiosity's waypoint.
import { STATION_TASKS } from '../model/reserve.js';

export const QUELA = { lon: 137.353006, lat: -4.695202 };
export const LANDER_B = { lon: 137.39435, lat: -4.70324 };
// Stations, in visiting order. `cell` = cell of the 1 km DTM grid; `quela`/`fromQuela` = metres from the Quela waypoint.
export const SCENARIO = [
  { cell: [645, 463], task: 'imaging', short: 'Butte flank', maxDeg: 8, R: 30 },
  { fromStart: [-30, 25], task: 'sample', minutes: 60, short: 'Cross-bedding, butte foot' },
  { quela: true, task: 'drill', short: 'Quela drill site' },
  { fromQuela: [45, 25], task: 'sample', short: 'Murray/Stimson contact' },
  { cell: [250, 660], task: 'sample', short: 'Mudstone outcrop', maxDeg: 8, R: 30 },
];

/** nearest cell flatter than maxDeg within R_m metres of p (stations must sit on walkable ground) */
export function snapFlat(hm, slope, p, maxDeg = 12, R_m = 30) {
  const cs = hm.cellSize_m, W = hm.width, Hh = hm.height, R = Math.max(2, Math.round(R_m / cs));
  const c0 = Math.floor(p.x / cs), r0 = Math.floor(p.y / cs);
  let best = null;
  for (let r = Math.max(0, r0 - R); r <= Math.min(Hh - 1, r0 + R); r++) for (let c = Math.max(0, c0 - R); c <= Math.min(W - 1, c0 + R); c++) {
    if (!(slope[r * W + c] <= maxDeg)) continue;
    const d = Math.hypot(c - c0, r - r0); if (!best || d < best.d) best = { d, x: (c + 0.5) * cs, y: (r + 0.5) * cs };
  }
  return best ? { x: best.x, y: best.y } : p;
}

/**
 * @param {{hm,slope}} L regional layer
 * @param {{lonLatToLocal:Function, sceneToLocal:Function}} tf regional-frame transform
 * @param {{cropCell:Function}} frames terrain/regional.js makeFrames()
 * @returns {{start:{x,y}, rover:{x,y}, waypoints:object[]}}
 */
export function buildScenario(L, tf, frames) {
  const { hm, slope } = L, cs = hm.cellSize_m, snap = (p, d, R) => snapFlat(hm, slope, p, d, R);
  const start = snap(tf.lonLatToLocal(LANDER_B.lon, LANDER_B.lat), 6, 60);
  const rover = snap({ x: start.x + 50, y: start.y - 40 }, 8, 60); // relay parked beside the lander: plausible first guess
  const Q = snap(tf.lonLatToLocal(QUELA.lon, QUELA.lat), 10, 40), S0 = tf.sceneToLocal(0, 0);
  const waypoints = SCENARIO.map((w) => {
    let p;
    if (w.quela) p = Q;
    else if (w.cell) p = snap(frames.cropCell(w.cell[0] + 0.5, w.cell[1] + 0.5), w.maxDeg, w.R);
    else if (w.fromQuela) p = snap({ x: Q.x + w.fromQuela[0], y: Q.y + w.fromQuela[1] }, 10, 40);
    else p = snap({ x: S0.x + w.fromStart[0], y: S0.y + w.fromStart[1] }, 10, 40);
    return { x: p.x, y: p.y, task: w.task, short: w.short, minutes: w.minutes ?? STATION_TASKS[w.task].minutes };
  });
  return { start, rover, waypoints, cs };
}
