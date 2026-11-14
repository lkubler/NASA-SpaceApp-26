import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { decodeRegional, makeFrames } from '../terrain/regional.js';
import { makeTransform } from '../terrain/dtm.js';
import { buildScenario } from './scenario.js';
import { planRoute, costGrid } from './planner.js';
import { makeHome } from './home.js';

const D = new URL('../../public/data/murray/', import.meta.url);
const buf = (f) => { const b = fs.readFileSync(new URL(f, D)); return b.buffer.slice(b.byteOffset, b.byteOffset + b.length); };
const meta = JSON.parse(fs.readFileSync(new URL('regional.json', D))), m1 = JSON.parse(fs.readFileSync(new URL('murray.json', D)));
const L = decodeRegional(meta, buf(meta.height_file), buf(meta.slope_file));
const cs1 = m1.dtm.cell_m, fr = makeFrames(meta, cs1), tf1 = makeTransform(m1), cs = L.hm.cellSize_m;
const tf = { sceneToLocal: (x, z) => fr.fromCrop(tf1.sceneToLocal(x, z)), lonLatToLocal: (a, b) => fr.fromCrop(tf1.lonLatToLocal(a, b)) };
const cell = (p) => [Math.floor(p.x / cs), Math.floor(p.y / cs)];

test('frame offset: regional cell = 5 x 1 km cells, exact; round trip', () => {
  assert.ok(Math.abs(cs - 5 * cs1) < 1e-6);
  const p = fr.cropCell(0, 0); // the 1 km crop NW corner sits at regional col 140, row 297.6
  assert.ok(Math.abs(p.x / cs - 140) < 1e-9 && Math.abs(p.y / cs - 1488 / 5) < 1e-9);
  const q = { x: 1234.5, y: 987.6 }, r = fr.toCrop(fr.fromCrop(q));
  assert.ok(Math.abs(r.x - q.x) < 1e-9 && Math.abs(r.y - q.y) < 1e-9);
});

test('default scenario: lander at site B, ~2.5 km from Quela; stations on walkable ground', () => {
  const sc = buildScenario(L, tf, fr);
  assert.deepEqual(cell(sc.start), [693, 486]);
  const q = tf.lonLatToLocal(137.353006, -4.695202), d = Math.hypot(sc.start.x - q.x, sc.start.y - q.y);
  assert.ok(d > 2400 && d < 2600, 'lander-Quela ' + d);
  for (const w of sc.waypoints) { const [c, r] = cell(w); assert.ok(L.slope[r * L.hm.width + c] <= 10, 'station slope'); }
});

test('cross-grid path: lander (regional) -> station inside the 1 km grid -> lander, planned and returned in < 1 s', () => {
  const sc = buildScenario(L, tf, fr), grid = costGrid(L.hm, L.slope);
  const t0 = performance.now();
  const route = planRoute(L.hm, L.slope, [sc.start, ...sc.waypoints, sc.start].map(cell), { grid });
  const home = makeHome(L.hm, grid, cell(sc.start));
  assert.ok(performance.now() - t0 < 1000, 'plan + home field under 1 s');
  assert.ok(route.total.feasible);
  assert.ok(route.total.dist_m > 4000 && route.total.dist_m < 6500, 'total ' + route.total.dist_m);
  // the 1 km grid covers 1024 cells at 1.0118 m; a point of the route inside the Walk's grid has 1 km-frame coords in range, the lander does not
  const inCrop = (p) => { const c = fr.toCrop(p); return c.x >= 0 && c.y >= 0 && c.x < 1024 * cs1 && c.y < 1024 * cs1; };
  const pts = route.points.map((p) => ({ x: p.x, y: p.y }));
  assert.ok(pts.some(inCrop) && !inCrop(pts[0]), 'route leaves the 1 km grid at the lander and enters it near Quela');
  // walk home from the farthest station: 25-60 min, driven by the regional cost field
  const mins = route.legs.slice(0, -1).map((l) => { const p = route.points[l.endIdx], [c, r] = cell(p); return home.returnS(c, r) / 60; });
  assert.ok(Math.max(...mins) > 25 && Math.max(...mins) < 60, 'home min ' + mins);
  // 1 km frame coordinates map back to the Walk scene exactly as through the 1 km transform
  const q = tf.sceneToLocal(10, -20), s = tf1.localToScene(fr.toCrop(q).x, fr.toCrop(q).y);
  assert.ok(Math.abs(s.x - 10) < 1e-6 && Math.abs(s.z + 20) < 1e-6);
});

test('task 024: default scenario is feasible but tight; relay first guess leaves a real shadow, the relay search clears it', async () => {
  const { computeReserve, DEFAULTS } = await import('../model/reserve.js');
  const { viewshed, bestRelay, routeShadowScore, lineOfSight } = await import('../model/comms.js');
  const { relayCandidates, RELAY_ANTENNA_M } = await import('./scenario.js');
  const sc = buildScenario(L, tf, fr), grid = costGrid(L.hm, L.slope), home = makeHome(L.hm, grid, cell(sc.start));
  const route = planRoute(L.hm, L.slope, [sc.start, ...sc.waypoints, sc.start].map(cell), { grid }), P = route.points;
  for (const l of route.legs) { const w = sc.waypoints[l.to - 1]; if (w) P[l.endIdx].stationS = w.minutes * 60; }
  const rin = P.map((p) => { const [c, r] = cell(p); return { dist_m: p.dist_m, elev_m: p.elev_m, stationS: p.stationS, time_s: p.time_s, returnKJ: home.returnKJ(c, r), returnS: home.returnS(c, r) }; });
  const res = computeReserve(rin, { capacityKJ: DEFAULTS.capacityKJ }), end = res.points.at(-1);
  const frac = end.remainingKJ / DEFAULTS.capacityKJ;
  assert.ok(frac >= 0.2 && frac <= 0.35, 'reserve at lander ' + frac);
  assert.equal(res.turnBack, null);
  P.forEach((p, i) => { p.elapsed_s = res.points[i].elapsed_s; });
  const vsh = (rv) => viewshed(L.hm, { x: rv.x, y: rv.y, antennaHeight_m: RELAY_ANTENNA_M }, 1.8);
  const worst = (rv) => routeShadowScore(L.hm, vsh(rv), P).longest_s;
  assert.ok(lineOfSight(L.hm, sc.rover, sc.start, RELAY_ANTENNA_M, 1.8), 'lander sees the default relay');
  const before = worst(sc.rover);
  assert.ok(before > 600, 'shadow before relay ' + before);
  const idx = new Set([0, P.length - 1]); for (let i = 0; i < P.length; i += 14) idx.add(i);
  const samples = [...idx].sort((a, b) => a - b).map((i) => ({ x: P[i].x, y: P[i].y, from_s: res.points[i].elapsed_s - (P[i].stationS || 0), to_s: res.points[i].elapsed_s }));
  const best = bestRelay(L.hm, samples, relayCandidates(L.hm, L.slope, sc.start, 20), { mustSee: sc.start, antennaHeight_m: RELAY_ANTENNA_M, verify: (c) => routeShadowScore(L.hm, vsh(c), P) });
  const after = worst(best);
  assert.ok(after <= 600 || after <= 0.1 * before, `shadow after relay ${after} (before ${before})`);
});
