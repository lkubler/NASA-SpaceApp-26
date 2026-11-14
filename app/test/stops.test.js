// Several stops (specs/feedback-1.md "Several stops"): one stop exactly as before, rounds of 2 and 3 stops.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import * as legacy from './legacyPlan.js';
import {
  WORK, fullLevels, doseMSv, findRoute, CANDIDATES, ROVER, PLANNER,
  planRoute, planRound, stopsOf, stopOrdinal, planNumbers, reserveFrom, MAX_STOPS,
} from '../src/core/index.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);
const BROKEN = { id: 'TEST-BROKEN', name: 'Test point up the east butte wall', x: 18, z: 4 };

describe('several stops', () => {
  it('one stop: route and every number exactly as before several stops', () => {
    for (const c of [...CANDIDATES, BROKEN]) {
      const oldRoute = legacy.planRoute(t, c), newRoute = planRoute(t, c);
      expect(Array.from(newRoute.out.cells), c.id).toEqual(Array.from(oldRoute.out.cells));
      expect(Array.from(newRoute.back.cells), c.id).toEqual(Array.from(oldRoute.back.cells));
      expect(newRoute, c.id).toMatchObject({ spotId: oldRoute.spotId, spot: oldRoute.spot, keepsRules: oldRoute.keepsRules });
      expect(Array.from(planRound(t, [c]).back.cells), c.id).toEqual(Array.from(newRoute.back.cells));
      // every field of the old plan numbers, bit for bit (the new ones only add stops, legPlans, stopsS)
      const oldPlan = legacy.planNumbers(t, oldRoute), newPlan = planNumbers(t, newRoute);
      expect(newPlan, c.id).toMatchObject(oldPlan);
      expect(newPlan.legs, c.id).toEqual(oldPlan.legs);
      // the Walk's reserve from anywhere: spot alone and stops: [spot] give the old value
      for (const p of [ROVER, newRoute.out.points[Math.floor(newRoute.out.points.length / 2)]]) {
        const old = legacy.reserveFrom(t, fullLevels(), { x: p.x, z: p.z, phase: 'out', spot: c });
        expect(reserveFrom(t, fullLevels(), { x: p.x, z: p.z, phase: 'out', spot: c }), c.id).toEqual(old);
        expect(reserveFrom(t, fullLevels(), { x: p.x, z: p.z, phase: 'out', stops: [c] }), c.id).toEqual(old);
        expect(reserveFrom(t, fullLevels(), { x: p.x, z: p.z, phase: 'back' }), c.id).toEqual(legacy.reserveFrom(t, fullLevels(), { x: p.x, z: p.z, phase: 'back' }));
      }
    }
  });

  it('two and three stops: legs rover -> s1 -> ... -> rover by the same planner; totals = legs + one work time per stop', () => {
    for (const ids of [['F1', 'F3'], ['F3', 'F7', 'F1']]) {
      const stops = ids.map(C);
      const route = planRound(t, stops);
      expect(route.stops.map((s) => s.id)).toEqual(ids);
      expect(route.legs.length).toBe(ids.length + 1);
      const places = [ROVER, ...stops, ROVER];
      route.legs.forEach((leg, k) => expect(Array.from(leg.cells), `leg ${k}`).toEqual(Array.from(findRoute(t, places[k], places[k + 1]).cells)));
      // bridge for Walk / Debrief: the first stop via out, the rest joined in back
      expect(route.spotId).toBe(ids[0]);
      expect(route.out).toBe(route.legs[0]);
      expect(route.back.cells.length).toBe(route.legs.slice(1).reduce((a, l) => a + l.cells.length, 0) - (ids.length - 1));

      const p = planNumbers(t, route);
      const legSum = p.legPlans.reduce((a, l) => a + l.seconds, 0);
      expect(p.timeS).toBeCloseTo(legSum + ids.length * p.spotS, 6);
      expect(p.stopsS).toBeCloseTo(ids.length * p.spotS, 9);
      expect(p.distanceM).toBeCloseTo(p.legPlans.reduce((a, l) => a + l.distanceM, 0), 6);
      expect(p.distanceM).toBeCloseTo(p.outM + p.backM, 6);
      expect(p.timeS).toBeCloseTo(p.legs.reduce((s, l) => s + (l.seconds || 0), 0), 6);
      expect(p.legs.map((l) => l.kind)).toEqual(['rover', ...ids.flatMap(() => ['foot', 'spot']), 'foot', 'rover']);
      expect(p.stops.map((s) => [s.id, s.order])).toEqual(ids.map((id, k) => [id, k + 1]));
      // each stop sits at the end of its leg on the profile; the legs follow each other
      p.legPlans.forEach((l, k) => {
        if (k) expect(l.startM).toBeCloseTo(p.legPlans[k - 1].endM, 9);
        if (k < ids.length) expect(p.stops[k].sM).toBeCloseTo(l.endM, 9);
      });
      expect(p.profile.filter((q) => q.leg === 'spot').length).toBe(ids.length);
      // energy: the legs plus the work at every stop
      expect(p.energyJ).toBeCloseTo(p.legPlans.reduce((a, l) => a + l.energyJ, 0) + ids.length * WORK.spotW.value * p.spotS, 3);
      expect(p.radiationMSv).toBeCloseTo(doseMSv(p.timeS), 9);
      // the reserve on return counts the whole round: less than for any of its stops alone
      for (const id of ids) expect(p.reserveS).toBeLessThan(planNumbers(t, planRoute(t, C(id))).reserveS);
      // the Walk's reserve from the rover with all stops ahead agrees with the plan (cost fields vs routes)
      const r = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', stops });
      expect(Math.abs(r.seconds - p.reserveS) / 60).toBeLessThan(10);
      // radio shadow, steepest slope and farthest distance over the whole round
      expect(p.radioShadowS).toBeCloseTo(p.radioStretches.reduce((a, s) => a + s.seconds, 0), 6);
      const single = ids.map((id) => planNumbers(t, planRoute(t, C(id))));
      expect(p.maxDistanceM).toBeGreaterThanOrEqual(Math.max(...single.map((q) => q.maxDistanceM)) - 1e-9);
      expect(p.steepestDeg).toBe(Math.max(...p.profile.map((q) => q.slopeDeg)));
      // a stop in radio shadow (F7) counts its work in the round's shadow time
      if (ids.includes('F7')) expect(p.radioShadowS).toBeGreaterThan(p.spotS);
    }
  });

  it('order matters: the same stops in another order give other legs and numbers', () => {
    const a = planNumbers(t, planRound(t, ['F3', 'F7', 'F1'].map(C)));
    const b = planNumbers(t, planRound(t, ['F7', 'F3', 'F1'].map(C)));
    expect(Math.abs(a.distanceM - b.distanceM)).toBeGreaterThan(1);
    expect(a.legPlans[0].to.id).toBe('F3');
    expect(b.legPlans[0].to.id).toBe('F7');
    // the reserve with fewer stops ahead is larger; the way ahead is longer with more stops
    const three = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', stops: ['F3', 'F7', 'F1'].map(C) });
    const two = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', stops: ['F7', 'F1'].map(C) });
    expect(two.seconds).toBeGreaterThan(three.seconds);
    expect(three.homeMetres).toBeGreaterThan(two.homeMetres);
  });

  it('rule checks over the round: one leg without a rule-keeping way marks the round as breaking the slope rule', () => {
    const route = planRound(t, [C('F1'), BROKEN, C('F3')]);
    expect(route.keepsRules).toBe(false);
    const p = planNumbers(t, route);
    expect(p.keepsRules).toBe(false);
    expect(p.brokenRules.map((b) => b.id)).toContain('slope');
    expect(p.legPlans.map((l) => l.keepsRules)).toEqual([true, false, false, true]);
    // the broken place lies on the legs to and from the test point
    const where = p.checks.find((c) => c.id === 'slope').where;
    expect(where.sM).toBeGreaterThan(p.legPlans[1].startM - 1e-9);
    expect(where.sM).toBeLessThan(p.legPlans[2].endM + 1e-9);
    // a round of rule-keeping legs keeps every rule
    expect(planNumbers(t, planRound(t, ['F1', 'F2', 'F3'].map(C))).keepsRules).toBe(true);
  });

  it('a round has one to three stops', () => {
    expect(MAX_STOPS).toBe(PLANNER.maxStops.value);
    expect(MAX_STOPS).toBe(3);
    expect(() => planRound(t, [])).toThrow();
    expect(() => planRound(t, ['F1', 'F2', 'F3', 'F4'].map(C))).toThrow();
    expect(stopsOf(planRoute(t, C('F2'))).map((s) => s.id)).toEqual(['F2']);
    expect(stopsOf(null)).toEqual([]);
    expect(stopOrdinal(1) + stopOrdinal(2) + stopOrdinal(3)).toBe('1st2nd3rd');
  });
});
