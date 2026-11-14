import test from 'node:test';
import assert from 'node:assert/strict';
import { sunAt, sunAtLtst } from './mars24.js';
const ms = (jd) => (jd - 2440587.5) * 8.64e7;
const near = (a, b, tol, m) => assert.ok(Math.abs(a - b) < tol, `${m}: ${a} vs ${b}`);

test('GISS worked example 1: JD_UT 2451549.5 at 0N 0W', () => {
  const s = sunAt(ms(2451549.5), 0, 0);
  near(s.Ls, 277.18758, 0.01, 'Ls'); near(s.mst, 23.99425, 0.001, 'MST'); near(s.eotHours, -0.34585, 0.001, 'EOT');
  near(s.declination, -25.22825, 0.01, 'dec'); near(s.elevation, -64.26182, 0.01, 'elev'); near(s.azimuth, 191.03905, 0.02, 'az');
});
test('GISS worked example 2: JD_UT 2453008.07397 at -14.640N 184.702W', () => {
  const s = sunAt(ms(2453008.07397), -14.640, 184.702);
  near(Math.min(s.ltst, 24 - s.ltst), 0, 0.001, 'LTST'); near(s.azimuth, 179.99383, 0.02, 'az');
});
test('Murray Buttes sol 1440: Ls ~210, noon high, dawn low, night below horizon', () => {
  const n = sunAtLtst(12), r = sunAtLtst(6), s = sunAtLtst(18.5);
  near(n.Ls, 210, 1.5, 'Ls'); assert.ok(n.elevation > 70 && n.elevation < 85); near(r.elevation, 1, 2, 'dawn'); assert.ok(s.elevation < 0);
});

import { sunSceneDir } from './mars24.js';
test('azimuth to scene vector: +x east, +z north, 2.4 deg rotation', () => {
  const v = (az, el = 0) => sunSceneDir(az, el, 0);
  const eq = (a, b) => a.forEach((x, i) => near(x, b[i], 1e-9, 'vec'));
  eq(v(0), [0, 0, 1]); eq(v(90), [1, 0, 0]); eq(v(180), [0, 0, -1]); eq(v(270), [-1, 0, 0]); eq(v(0, 90), [0, 1, 0]);
  const w = sunSceneDir(0, 0); near(w[0], -Math.sin(2.4 * Math.PI / 180), 1e-9, 'x'); near(w[2], Math.cos(2.4 * Math.PI / 180), 1e-9, 'z');
  near(Math.hypot(...sunSceneDir(123, 33)), 1, 1e-9, 'unit');
});
