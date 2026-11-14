import test from 'node:test';
import assert from 'node:assert/strict';
import { legGrades, routeGrades, slopeStats } from './science.js';

test('legGrades gives net grade between in-crop drive ends from rover elevation', () => {
  const pts = [{ col: 0, row: 5, elev_m: 0, in_crop: false }, { col: 5, row: 5, elev_m: 0, in_crop: true }, { col: 25, row: 5, elev_m: 20, in_crop: true }];
  const g = legGrades(pts, 1);
  assert.equal(g.length, 1); assert.ok(Math.abs(g[0] - 45) < 0.01);
});
test('routeGrades over stretches', () => {
  const pts = Array.from({ length: 11 }, (_, i) => ({ dist_m: i * 10, elev_m: i * 10 * Math.tan(Math.PI / 12) }));
  const g = routeGrades(pts, 40); assert.ok(g.length >= 2); assert.ok(g.every((x) => Math.abs(x - 15) < 0.01));
});
test('slopeStats percentiles and share over limit', () => {
  const s = slopeStats([1, 2, 3, 4, 25], 20);
  assert.equal(s.max, 25); assert.equal(s.median, 3); assert.equal(s.overLimit, 0.2);
  assert.equal(slopeStats([], 20), null);
});
