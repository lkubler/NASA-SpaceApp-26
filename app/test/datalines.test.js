// x-datalines: slope check against HiRISE and the solar storm time to shelter.
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { nodeTerrain } from './load.js';
import { CANDIDATES, planRound, planNumbers, roverField, RULES, hiriseSlopeOnRoute, timeToShelter, walkToDtm } from '../src/core/index.js';

const dir = fileURLToPath(new URL('../public/data/murray/', import.meta.url));
const meta = JSON.parse(readFileSync(dir + 'murray.json', 'utf8'));
const hirise = { meta, slope: new Uint8Array(readFileSync(dir + 'dtm_slope.u8.bin')) };
const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);
const plan = (ids) => planNumbers(t, planRound(t, ids.map(C)));

describe('HiRISE slope check', () => {
  it('the scene origin lands on the origin cell of the transform', () => {
    const p = walkToDtm(meta, 0, 0);
    expect(p.col).toBeCloseTo(meta.transform_walk_to_dtm.origin_in_dtm_crop_px.col, 6);
    expect(p.row).toBeCloseTo(meta.transform_walk_to_dtm.origin_in_dtm_crop_px.row, 6);
    const e = walkToDtm(meta, 10, 0), n = walkToDtm(meta, 0, 10);
    expect(e.col - p.col).toBeGreaterThan(9.5); // east is +col
    expect(n.row - p.row).toBeLessThan(-9.5);   // north is -row
  });
  it('counts metres over the rule on a hand-made profile; no-data and work at a stop are not counted', () => {
    const lim = RULES.slopeMaxDeg.value;
    const W = meta.dtm.width;
    const inv = (c, r) => {
      for (let x = -60; x <= 60; x += 0.5) for (let z = -60; z <= 60; z += 0.5) {
        const p = walkToDtm(meta, x, z);
        if (Math.floor(p.col) === c && Math.floor(p.row) === r) return { x, z };
      }
      return null;
    };
    let steep = null;
    for (let i = 0; i < hirise.slope.length && !steep; i += 7) {
      const v = hirise.slope[i];
      if (v === 255 || v * 0.5 <= lim + 5) continue;
      steep = inv(i % W, (i / W) | 0);
    }
    expect(steep).not.toBeNull();
    const r = hiriseSlopeOnRoute([{ sM: 0, x: steep.x, z: steep.z }, { sM: 0.4, x: steep.x, z: steep.z }], hirise);
    expect(r.steepM).toBeCloseTo(0.4, 6);
    const off = hiriseSlopeOnRoute([{ sM: 0, x: 5000, z: 5000 }, { sM: 3, x: 5000, z: 5000 }], hirise);
    expect(off.steepM).toBe(0);
    expect(off.checkedM).toBe(0);
    expect(off.noDataM).toBeCloseTo(3, 6);
    const work = hiriseSlopeOnRoute([{ sM: 1, x: steep.x, z: steep.z }, { sM: 1, x: steep.x, z: steep.z }], hirise);
    expect(work.noDataM + work.checkedM).toBe(0);
  });
  it('real routes: pieces add up to the route length', () => {
    for (const ids of [['F3'], ['F7'], ['F1', 'F2', 'F3']]) {
      const p = plan(ids), r = hiriseSlopeOnRoute(p.profile, hirise);
      console.log('HIRISE', ids.join(','), r.steepM.toFixed(1), 'm steep of', p.distanceM.toFixed(0), 'nodata', r.noDataM.toFixed(1), 'steepest', r.steepestDeg);
      expect(r.noDataM + r.checkedM).toBeCloseTo(p.distanceM, 3);
      expect(r.steepM).toBeLessThanOrEqual(r.checkedM);
    }
  });
});

describe('solar storm: time to shelter', () => {
  it('is the largest way-home time over the route and uses the 2 h value', () => {
    for (const ids of [['F3'], ['F7'], ['F1', 'F2', 'F3']]) {
      const p = plan(ids), s = timeToShelter(t, p.profile, roverField(t));
      const f = roverField(t);
      const max = Math.max(...p.profile.map((q) => f.seconds[t.indexOf(q.x, q.z)]));
      console.log('SHELTER', ids.join(','), (s.seconds / 60).toFixed(1), 'min, limit', s.limitS / 60);
      expect(s.seconds).toBe(max);
      expect(s.limitS).toBe(RULES.shelterReturnH.value * 3600);
      expect(s.seconds).toBeGreaterThan(0);
      const c = p.checks.find((q) => q.id === 'shelter');
      expect(c.planned).toBe(s.seconds);
      expect(c.status).toBe(s.seconds > s.limitS ? 'broken' : 'ok');
    }
  });
});
