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
