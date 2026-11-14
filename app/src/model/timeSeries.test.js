import test from 'node:test';
import assert from 'node:assert/strict';
import { buildSeries } from './timeSeries.js';

// two points: start, and a station 1000 s in with a 600 s dwell. Capacity 1000 kJ, station burns 100 kJ (0.1 kJ/s... test numbers only).
const route = {
  points: [{ stationS: 0 }, { stationS: 600 }, { stationS: 0 }],
  reserve: { capacityKJ: 1000, bufferKJ: 200, points: [
    { elapsed_s: 0, remainingKJ: 1000, stationKJ: 0, returnCostKJ: 0 },
    { elapsed_s: 1600, remainingKJ: 600, stationKJ: 120, returnCostKJ: 300 }, // arrives at t=1000 with 720, leaves at 1600 with 600
    { elapsed_s: 2600, remainingKJ: 400, stationKJ: 0, returnCostKJ: 0 },
  ] },
};
test('reserve is interpolated by time inside a station dwell, not stepped', () => {
  const s = buildSeries(route);
  assert.equal(s.resAt(1000), 0.72);
  assert.ok(Math.abs(s.resAt(1300) - 0.66) < 1e-9); // mid-dwell
  assert.equal(s.resAt(1600), 0.6);
  assert.ok(s.resAt(1000) > s.resAt(1300) && s.resAt(1300) > s.resAt(1600));
});
test('walking leg interpolates linearly; need includes the buffer; ends clamp', () => {
  const s = buildSeries(route);
  assert.ok(Math.abs(s.resAt(500) - 0.86) < 1e-9);
  assert.ok(Math.abs(s.needAt(1300) - (0.3 + 0.2)) < 1e-9);
  assert.equal(s.resAt(99999), 0.4); assert.equal(s.resAt(-5), 1);
});
test('no reserve -> null', () => assert.equal(buildSeries({ points: [{}, {}] }), null));
