import test from 'node:test';
import assert from 'node:assert/strict';
import { reserveSensitivity } from './sensitivity.js';
import { slopeAlongRoute } from '../terrain/slope1m.js';

const pts = (climb) => Array.from({ length: 101 }, (_, i) => ({ dist_m: i * 10, elev_m: i <= 50 ? i * climb : (100 - i) * climb, time_s: i * 8, stationS: i === 50 ? 1800 : 0 }));

test('sensitivity: load and suit offset move the reserve the right way', () => {
  const s = reserveSensitivity(pts(1), {});
  const by = Object.fromEntries(s.rows.map((r) => [r.key, r]));
  assert.ok(by.load0.frac > by.load23.frac && by.load23.frac > by.load40.frac);
  assert.ok(by['suit-'].frac > by['suit+'].frac);
  assert.ok(by.earth.frac < s.base); // Earth gravity costs more than Mars
  assert.ok(by.flat.frac >= s.base - 0.02); // climbing never saves energy overall
  assert.ok(Math.abs(by.load23.delta) < 1e-9); // default load row equals the base
  assert.ok(s.spread.lo <= s.base && s.spread.hi >= s.base);
});

test('slopeAlongRoute: max, over-limit share, outside the grid ignored', () => {
  const hm = { width: 10, height: 10, cellSize_m: 1 };
  const slope = new Float32Array(100).fill(5); slope[5 * 10 + 5] = 25;
  const r = slopeAlongRoute([{ x: 0.5, y: 5.5 }, { x: 9.5, y: 5.5 }, { x: 30, y: 5.5 }], hm, slope, 20);
  assert.equal(r.maxDeg, 25); assert.ok(r.overLimit); assert.ok(r.overFrac > 0 && r.overFrac < 0.2);
  assert.equal(slopeAlongRoute([{ x: 50, y: 50 }], hm, slope), null);
});
