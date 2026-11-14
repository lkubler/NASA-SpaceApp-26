import test from 'node:test';
import assert from 'node:assert/strict';
import { lightTimeMin, autonomy, evaDose, doseRate, GCR_MSV_PER_H, SPE } from './rad.js';
import { SOL1440_START } from './mars24.js';

test('light time stays inside the 4-22 min range at sampled dates', () => {
  for (let y = 2010; y <= 2030; y++) for (let m = 0; m < 12; m += 3) {
    const t = lightTimeMin(Date.UTC(y, m, 1)); assert.ok(t > 3 && t < 23, `${y}-${m}: ${t}`);
  }
});
test('known dates: opposition 2016-05-22 about 4.2 min, conjunction 2013-04-18 about 20 min', () => {
  assert.ok(Math.abs(lightTimeMin(Date.UTC(2016, 4, 22)) - 4.2) < 0.4);
  assert.ok(Math.abs(lightTimeMin(Date.UTC(2013, 3, 18)) - 20.3) < 1.2);
});
test('scenario date and round trip', () => {
  const a = autonomy(SOL1440_START); assert.ok(a.oneWayMin > 4 && a.oneWayMin < 12);
  assert.equal(a.roundTripMin, 2 * a.oneWayMin);
});
test('dose: 24 h = 0.67 mSv, SPE adds (m-1)*12h*rate', () => {
  assert.ok(Math.abs(evaDose(86400) - 0.67) < 1e-9);
  assert.equal(evaDose(0), 0);
  const extra = evaDose(13 * 3600, { spe: true }) - evaDose(13 * 3600);
  assert.ok(Math.abs(extra - (SPE.multiplier - 1) * 12 * GCR_MSV_PER_H) < 1e-9);
  assert.equal(doseRate(100, { spe: true }), GCR_MSV_PER_H * SPE.multiplier);
  assert.equal(doseRate(13 * 3600, { spe: true }), GCR_MSV_PER_H);
});
