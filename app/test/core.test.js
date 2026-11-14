import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import {
  RULES, WORK, DEMO, SUIT, listValues, sourceOf,
  workRate, fullLevels, consume, timeLeft, reserveOnReturn, walkSeconds, doseMSv, outsideTempC,
  findRoute, costField, closedMask, lineOfSight, radioShadowMask, hasRadio,
  CANDIDATES, ACCESS_MARS_POINTS, ROVER,
  planRoute, planNumbers, planAllCandidates, reserveFrom, roverField, simulateWalk, isClosedAt,
} from '../src/core/index.js';

const t = nodeTerrain();

describe('values', () => {
  it('every value has a label and a source key', () => {
    const kinds = new Set(['real', 'model', 'simulated', 'assumption']);
    for (const { key, entry } of listValues()) {
      expect(kinds.has(entry.label), key).toBe(true);
      expect(typeof entry.text, key).toBe('string');
      expect(sourceOf(entry).title.length, key).toBeGreaterThan(0);
    }
  });
  it('rules match specs/rules.md', () => {
    expect(RULES.slopeMaxDeg.value).toBe(20);
    expect(RULES.distancePlanM.value).toBe(2000);
    expect(RULES.distanceLimitM.value).toBe(3500);
    expect(RULES.secondaryO2H.value).toBe(1);
    expect(RULES.evaPlannedH.value).toBe(6);
    expect(RULES.evaLimitH.value).toBe(8);
    expect(RULES.walkBackRateFactor.value).toBe(1.2);
    expect(DEMO.timeFactor.label).toBe('assumption');
    expect(SUIT.consumables.water.label).toBe('assumption'); // unconfirmed in source-check.md
  });
  it('moon values say so', () => {
    for (const k of ['slopeMaxDeg', 'distancePlanM', 'distanceLimitM', 'evaLimitH', 'secondaryO2H']) expect(RULES[k].moon).toBe(true);
  });
});

describe('terrain', () => {
  it('grid size and frame', () => {
    expect(t.n).toBe(256);
    expect(t.cell).toBe(0.5);
    expect(t.centerOf(0, 0)).toEqual({ x: -63.75, z: -63.75 });
    const c = t.cellOf(13.25, -0.25);
    expect(t.centerOf(c.col, c.row)).toEqual({ x: 13.25, z: -0.25 });
  });
  it('height range matches the research', () => {
    let lo = Infinity, hi = -Infinity;
    for (const h of t.height) { lo = Math.min(lo, h); hi = Math.max(hi, h); }
    expect(lo).toBeCloseTo(-6.4, 1);
    expect(hi).toBeCloseTo(11.49, 1);
  });
  it('Access Mars marker heights fit the grid (walk-targets.md §1)', () => {
    const inter = ACCESS_MARS_POINTS.find((p) => p.name === 'Interference');
    expect(Math.abs(t.heightAt(inter.x, inter.z) - inter.y)).toBeLessThan(0.2);
  });
  it('closed share about 17.6 % (walk-terrain.md §2)', () => {
    const m = closedMask(t);
    const share = m.reduce((a, b) => a + b, 0) / m.length;
    expect(share).toBeGreaterThan(0.16);
    expect(share).toBeLessThan(0.19);
  });
});

describe('suit model', () => {
  it('about 350 W walking on the flat at planning pace', () => {
    expect(workRate(0)).toBeCloseTo(WORK.walkW.value, 6);
    expect(WORK.walkW.value).toBeGreaterThan(345);
    expect(WORK.walkW.value).toBeLessThan(355);
    expect(WORK.spotW.value).toBeCloseTo(308, 0);
  });
  it('uphill and load cost more; downhill counts as flat', () => {
    expect(workRate(10)).toBeGreaterThan(workRate(5));
    expect(workRate(0, undefined, 40)).toBeGreaterThan(workRate(0));
    expect(workRate(-10)).toBeCloseTo(workRate(0), 6);
  });
  it('time left is set by the first consumable to run out', () => {
    const full = fullLevels();
    const atWalk = timeLeft(full);
    expect(atWalk.seconds / 3600).toBeCloseTo(8, 1);
    const low = { ...full, water: 1000 };
    expect(timeLeft(low).limiting).toBe('water');
    expect(timeLeft(full, 600).limiting).toBe('oxygen');
    expect(timeLeft(full, 200).limiting).toBe('battery');
  });
  it('consume and reserve: way home at 1.2x', () => {
    const full = fullLevels();
    const after = consume(full, 400, 3600);
    expect(full.oxygen - after.oxygen).toBeCloseTo(400 * 3600, 3);
    expect(full.battery - after.battery).toBeCloseTo(3600, 6);
    const home = 1000 * 3600 * 0; // no way home
    const r0 = reserveOnReturn(full, { homeEnergyJ: home, homeSeconds: 0 });
    expect(r0.seconds).toBeCloseTo(timeLeft(full).seconds, 3);
    const e = WORK.walkW.value * 3600;
    const r = reserveOnReturn(full, { homeEnergyJ: e, homeSeconds: 3600 });
    expect(r.limiting).toBe('oxygen');
    expect((timeLeft(full).seconds - r.seconds) / 3600).toBeCloseTo(1.2, 3);
  });
  it('demo factor scales walking time; dose and temperature', () => {
    expect(walkSeconds(10)).toBeCloseTo((10 / (2000 / 3600)) * DEMO.timeFactor.value, 6);
    expect(doseMSv(86400)).toBeCloseTo(0.67, 6);
    expect(outsideTempC(0)).toBeCloseTo(237.8 - 273.15, 0);
  });
});

describe('planner', () => {
  it('candidate path lengths match walk-targets.md (grid method)', () => {
    for (const c of CANDIDATES) {
      const r = findRoute(t, ROVER, c);
      let m = 0;
      for (let k = 1; k < r.points.length; k++) {
        const a = r.points[k - 1], b = r.points[k];
        m += Math.hypot(b.x - a.x, b.y - a.y, b.z - a.z);
      }
      expect(r.keepsRules, c.id).toBe(true);
      expect(Math.abs(m - c.pathM), c.id).toBeLessThan(0.6);
    }
  });
  it('a target on closed ground gives the best route with the slope rule broken', () => {
    const wall = { x: 21, z: 3.7 }; // Monument Valley marker on the butte wall (44.5°)
    const r = findRoute(t, ROVER, wall);
    expect(r.keepsRules).toBe(false);
    expect(r.closedM).toBeGreaterThan(0);
    const plan = planNumbers(t, planRoute(t, { id: 'wall', ...wall }));
    expect(plan.brokenRules.map((b) => b.id)).toContain('slope');
  });
  it('cost field to the rover agrees with direct routes', () => {
    const f = roverField(t);
    for (const c of CANDIDATES) {
      const r = findRoute(t, c, ROVER);
      expect(Math.abs(f.at(c.x, c.z).metres - r.points.reduce((s, p, k, a) => k ? s + Math.hypot(p.x - a[k - 1].x, p.y - a[k - 1].y, p.z - a[k - 1].z) : 0, 0))).toBeLessThan(0.6);
    }
    expect(f.at(ROVER.x, ROVER.z).seconds).toBe(0);
  });
});

describe('radio shadow', () => {
  it('start square: hidden share near the research value (27.5 %)', () => {
    const m = radioShadowMask(t);
    const share = m.reduce((a, b) => a + b, 0) / m.length;
    expect(share).toBeGreaterThan(0.22);
    expect(share).toBeLessThan(0.33);
  });
  it('near the rover there is contact; F7 behind the butte is in shadow', () => {
    expect(hasRadio(t, 3, 3)).toBe(true);
    const f7 = CANDIDATES.find((c) => c.id === 'F7');
    expect(hasRadio(t, f7.x, f7.z)).toBe(false);
  });
});

describe('plan numbers', () => {
  const all = planAllCandidates(t);
  it('all candidates keep every rule with the tuned factor', () => {
    for (const { candidate, plan } of all) expect(plan.keepsRules, candidate.id).toBe(true);
  });
  it('farthest candidate uses most of the suit, and the plan names the limiting consumable', () => {
    const far = all.reduce((a, b) => (b.plan.distanceM > a.plan.distanceM ? b : a));
    expect(far.candidate.id).toBe('F7');
    expect(far.plan.reserveS).toBeGreaterThan(0);
    expect(far.plan.reserveS).toBeLessThan(2 * 3600);
    expect(far.plan.limitingName).toBe('Oxygen');
    expect(far.plan.radioShadowS).toBeGreaterThan(0);
    expect(far.plan.checks.find((c) => c.id === 'radio').status).toBe('caution');
  });
  it('radio shadow: total is the sum of the stretches, the longest never exceeds it, the Walk counts the same', () => {
    for (const { candidate, route, plan } of all) {
      const sum = plan.radioStretches.reduce((a, r) => a + r.seconds, 0);
      expect(plan.radioShadowS, candidate.id).toBeCloseTo(sum, 6);
      expect(plan.longestShadowS, candidate.id).toBeLessThanOrEqual(plan.radioShadowS + 1e-9);
      expect(plan.checks.find((c) => c.id === 'radio').planned).toBe(plan.longestShadowS);
      for (const r of plan.radioStretches) expect(r.endS - r.startS, candidate.id).toBeCloseTo(r.seconds, 6);
      expect(simulateWalk(t, route).radioShadowS, candidate.id).toBeCloseTo(plan.radioShadowS, 3);
    }
    // F7: the spot lies in shadow, so its 20 min of work count in the total as in the longest stretch
    const f7 = all.find((x) => x.candidate.id === 'F7').plan;
    expect(f7.radioShadowS).toBeGreaterThan(f7.spotS);
    expect(f7.longestShadowS).toBeGreaterThan(f7.spotS);
  });
  it('legs and totals are consistent', () => {
    const p = all[0].plan;
    expect(p.legs.map((l) => l.kind)).toEqual(['rover', 'foot', 'spot', 'foot', 'rover']);
    expect(p.timeS).toBeCloseTo(p.legs.reduce((s, l) => s + (l.seconds || 0), 0), 3);
    expect(p.distanceM).toBeCloseTo(p.outM + p.backM, 6);
    expect(p.radiationMSv).toBeCloseTo(doseMSv(p.timeS), 9);
    expect(p.turnBack).toBe(null);
  });
  it('reserve from the start (Walk) matches the plan', () => {
    for (const { candidate, plan } of all) {
      const r = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', spot: candidate });
      expect(Math.abs(r.seconds - plan.reserveS) / 60, candidate.id).toBeLessThan(10);
    }
  });
  it('simulated walk ends home with the planned reserve', () => {
    const { route, plan } = all[2];
    const log = simulateWalk(t, route);
    expect(log.outcome).toBe('home');
    // at home the time left is the planned reserve plus the 20 % walk-back pad that was not needed
    expect(log.reserveAtHomeS).toBeGreaterThan(plan.reserveS);
    expect(log.reserveAtHomeS - plan.reserveS).toBeLessThan(2 * (RULES.walkBackRateFactor.value - 1) * plan.legs[3].seconds);
    expect(log.minReserve.seconds).toBeGreaterThan(0);
    expect(log.distanceM).toBeCloseTo(plan.distanceM, 0);
  });
  it('walking every planned route breaks no rule (planner and Walk use one slope test)', () => {
    for (const { candidate, route } of all) {
      let broken = 0;
      for (const leg of [route.out.points, route.back.points]) {
        for (let k = 1; k < leg.length; k++) {
          const a = leg[k - 1], b = leg[k];
          const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05));
          for (let s = 0; s <= n; s++) {
            const f = s / n;
            if (isClosedAt(t, a.x + (b.x - a.x) * f, a.z + (b.z - a.z) * f)) broken++;
          }
        }
      }
      expect(broken, candidate.id).toBe(0);
      expect(simulateWalk(t, route).brokenRules.length, candidate.id).toBe(0);
    }
  });
});
