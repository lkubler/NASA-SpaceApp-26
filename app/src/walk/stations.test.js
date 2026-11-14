import test from 'node:test'; import assert from 'node:assert/strict';
import { dtmToScene, pickStation } from './stations.js';
const t = { theta_deg: 2.4, origin_in_dtm_crop_px: { col: 498.25, row: 499.75 }, cell_m: 1.01176 };
test('origin maps to 0,0', () => { const p = dtmToScene(498.25, 499.75, t); assert.ok(Math.abs(p.x) < 1e-9 && Math.abs(p.z) < 1e-9); });
test('quela lies west of the square', () => { const p = dtmToScene(345.2, 473.5, t); assert.ok(p.x < -100 && Math.abs(p.z) < 64); });
const L = [{ id: 'in', x: 10, z: 10 }, { id: 'out', x: -150, z: 10 }];
test('inside station within 8 m', () => { assert.equal(pickStation(L, 12, 12).station.id, 'in'); assert.equal(pickStation(L, 30, 30), null); });
test('outside station only at the edge', () => { assert.equal(pickStation(L, -30, 10), null); assert.equal(pickStation(L, -60, 10).station.id, 'out'); });
