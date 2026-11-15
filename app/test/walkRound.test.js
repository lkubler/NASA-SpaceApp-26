// The Walk on a round (specs/feedback-1.md "Several stops", line Walk and Turn back now): the target is the
// next stop, one sample per stop, the reserve on return counts the remaining stops and the way home and never
// jumps; "Turn back now" skips the remaining stops and shows the way home.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, ROVER, planRound, planNumbers, newWalkLog, walkSeconds, simulateWalk, reserveFrom, remainingStops } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';
import { fixtureWalk } from '../src/steps/5-debrief/fixtures.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);

/** Walk the sim along pts with W (heading set toward each next point); returns when stop() or the points end. */
function walkAlong(sim, pts, seen, stop = () => false) {
  for (const p of pts) {
    for (let guard = 0; guard < 4000; guard++) {
      const dx = p.x - sim.s.x, dz = p.z - sim.s.z;
      if (Math.hypot(dx, dz) < 0.1 || stop() || sim.log.ended) break;
      sim.s.yaw = Math.atan2(dx, dz);
      sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
      seen.push(sim.s.reserve.seconds);
    }
    if (stop()) return;
  }
}
/** The points of a leg from the one nearest the walker on. */
function fromHere(sim, P) {
  let k0 = 0;
  P.forEach((p, k) => { if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < Math.hypot(P[k0].x - sim.s.x, P[k0].z - sim.s.z)) k0 = k; });
  return P.slice(k0 + 1);
}
const maxJump = (seen) => seen.reduce((m, v, k) => (k ? Math.max(m, Math.abs(v - seen[k - 1])) : m), 0);

describe('walk on a round', () => {
  for (const ids of [['F1', 'F2', 'F3'], ['F1', 'F3'], ['F7', 'F1']]) {
    it(`targets each stop in order, one sample each, reserve continuous across every sample (${ids})`, () => {
      const route = planRound(t, ids.map(C));
      const plan = planNumbers(t, route);
      const log = newWalkLog();
      const sim = createSim(t, route, log);
      expect(log.stops.map((s) => s.id)).toEqual(ids);
      // at the start: the plan's number for the whole round
      expect(Math.abs(sim.s.reserve.seconds - plan.reserveS) / 60).toBeLessThan(3);
      const seen = [sim.s.reserve.seconds];
      for (let k = 0; k < ids.length; k++) {
        const tg = sim.target();
        expect(tg.kind).toBe('spot');
        expect(tg.id).toBe(ids[k]);
        expect(tg.order).toBe(k + 1);
        expect(tg.of).toBe(ids.length);
        // the band is the planned leg to this stop
        expect(sim.leg().points).toBe(route.legs[k].points);
        walkAlong(sim, fromHere(sim, route.legs[k].points), seen, () => sim.stopHere() === k);
        expect(sim.stopHere(), `at stop ${k + 1}`).toBe(k);
        const before = sim.s.reserve.seconds;
        // the reserve before the sample counts the remaining stops: this one and the ones after it
        const want = reserveFrom(t, log.levels, { x: sim.s.x, z: sim.s.z, phase: 'out', stops: route.stops.slice(k) });
        expect(before).toBeCloseTo(want.seconds, 6);
        expect(sim.takeSample()).toBe(true);
        sim.s.modal = null;
        const after = sim.s.reserve.seconds;
        seen.push(after);
        expect(Math.abs(after - before) / 60, `sample ${k + 1}`).toBeLessThan(3);
        expect(log.stops[k].sampled).toBe(true);
        expect(log.stops[k].tS).toBeCloseTo(log.tS, 6);
        expect(remainingStops(log).map((s) => s.id)).toEqual(ids.slice(k + 1));
      }
      expect(log.phase).toBe('back');
      expect(sim.target().kind).toBe('rover');
      expect(sim.leg().points).toBe(route.legs[ids.length].points);
      expect(log.sample.spotId).toBe(ids[0]);
      walkAlong(sim, fromHere(sim, route.legs[ids.length].points), seen, () => sim.atRover());
      expect(sim.atRover()).toBe(true);
      expect(maxJump(seen)).toBeLessThan(walkSeconds(1));
      expect(log.brokenRules.length).toBe(0);
      expect(log.turnedBack).toBe(null);
      expect(sim.endExcursion()).toBe(true);
      expect(log.outcome).toBe('home');
      // planned against actual for the whole round: the walk on the plan comes close to it
      expect(Math.abs(log.distanceM - plan.distanceM) / plan.distanceM).toBeLessThan(0.1);
      expect(Math.abs(log.tS - plan.timeS) / plan.timeS).toBeLessThan(0.1);
    }, 30000);
  }

  it('a stop out of order can be sampled; the target stays the next unsampled stop in plan order', () => {
    const route = planRound(t, ['F1', 'F2', 'F3'].map(C));
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const seen = [];
    // walk past F1 to F2 first (rover -> F2 by its own planned route, not part of the round)
    walkAlong(sim, fromHere(sim, route.legs[0].points), seen, () => sim.stopHere() === 0);
    expect(sim.target().id).toBe('F1');
    // stand on F1 without sampling, walk on to F2: the target stays F1
    walkAlong(sim, fromHere(sim, route.legs[1].points), seen, () => sim.stopHere() === 1);
    expect(sim.stopHere()).toBe(1);
    expect(sim.target().id).toBe('F1');
    expect(sim.takeSample()).toBe(true);
    sim.s.modal = null;
    expect(log.stops.map((s) => s.sampled)).toEqual([false, true, false]);
    // still F1 next, by a way from here (not a planned leg)
    expect(sim.target().id).toBe('F1');
    expect(sim.leg().planned).toBe(false);
    expect(remainingStops(log).map((s) => s.id)).toEqual(['F1', 'F3']);
  });

  it('turn back: the reserve for the remaining stops runs out, they are skipped, the way home is shown', () => {
    const ids = ['F1', 'F2', 'F3'];
    const route = planRound(t, ids.map(C));
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const seen = [];
    for (let k = 0; k < 2; k++) {
      walkAlong(sim, fromHere(sim, route.legs[k].points), seen, () => sim.stopHere() === k);
      expect(sim.takeSample()).toBe(true);
      sim.s.modal = null;
    }
    expect(sim.target().id).toBe('F3');
    // stand at stop 2 until the reserve for the rest of the round runs out
    let guard = 0;
    while (!sim.s.active.turnBack && guard++ < 400000 && !log.ended) sim.step(D.tickS, { f: 0, r: 0, turn: 0, pitch: 0 });
    expect(sim.s.active.turnBack).toBe(true);
    expect(sim.s.alert).toBe('turnBack');
    expect(sim.s.alertInfo.turnBack.skipped.map((s) => s.order)).toEqual([3]);
    // the warning shows the reserve on the way home, the same number as the display (not the spent round's 0 min)
    expect(sim.s.alertInfo.turnBack.reserveS).toBe(sim.s.reserve.seconds);
    expect(sim.s.alertInfo.turnBack.reserveS).toBeGreaterThan(60);
    expect(log.turnedBack.skipped).toEqual(['F3']);
    expect(log.stops.map((s) => [s.sampled, s.skipped])).toEqual([[true, false], [true, false], [false, true]]);
    // the display: target rover, the way home from here (stop 2 is where the last planned leg does not start)
    const tg = sim.target();
    expect(tg.kind).toBe('rover');
    expect(tg.skipped).toEqual([3]);
    expect(sim.leg().kind).toBe('rover');
    // the reserve is now the way home from here, and positive: going home still works
    expect(sim.s.reserve.seconds).toBeGreaterThan(0);
    expect(sim.s.reserve.seconds).toBeCloseTo(reserveFrom(t, log.levels, { x: sim.s.x, z: sim.s.z, phase: 'back' }).seconds, 6);
    // the warning stays until the crew heads home, then goes
    walkAlong(sim, sim.leg().points, seen, () => !sim.s.active.turnBack);
    expect(sim.s.active.turnBack).toBeFalsy();
    walkAlong(sim, fromHere(sim, sim.leg().points), seen, () => sim.atRover());
    expect(sim.atRover()).toBe(true);
    expect(sim.endExcursion()).toBe(true);
    expect(log.outcome === 'home' || log.outcome === 'home-broken').toBe(true);
    expect(log.stops.filter((s) => s.sampled).length).toBe(2);
  }, 60000);

  it('one stop: turn back as before (the target switches when the crew heads home, no stop is marked skipped)', () => {
    const route = planRound(t, [C('F7')]);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const seen = [];
    walkAlong(sim, fromHere(sim, route.legs[0].points).slice(0, 20), seen);
    let guard = 0;
    while (!sim.s.active.turnBack && guard++ < 400000 && !log.ended) sim.step(D.tickS, { f: 0, r: 0, turn: 0, pitch: 0 });
    expect(sim.s.active.turnBack).toBe(true);
    expect(sim.s.alertInfo.turnBack.viaSpot).toBe(true);
    expect(sim.target().kind).toBe('spot');
    expect(log.turnedBack).toBe(null);
    expect(log.stops[0].skipped).toBe(false);
  }, 60000);

  it('simulateWalk on a round: one sample per stop, home, close to the plan', () => {
    for (const ids of [['F1', 'F2', 'F3'], ['F7', 'F1']]) {
      const route = planRound(t, ids.map(C));
      const plan = planNumbers(t, route);
      const log = simulateWalk(t, route);
      expect(log.stops.map((s) => s.sampled)).toEqual(ids.map(() => true));
      expect(log.sample.spotId).toBe(ids[0]);
      expect(log.outcome).toBe('home');
      expect(log.distanceM).toBeCloseTo(plan.distanceM, 0);
      expect(log.tS).toBeCloseTo(plan.timeS, 0);
      expect(log.radioShadowS).toBeCloseTo(plan.radioShadowS, 0);
      expect(log.reserveAtHomeS).toBeGreaterThan(plan.reserveS);
      expect(Math.hypot(log.track.at(-1).x - ROVER.x, log.track.at(-1).z - ROVER.z)).toBeLessThan(1);
    }
  });

  it('Debrief fixtures on a round: 3 of 3 home, 2 of 3 turned back, 0 taken; one stop as before', () => {
    const route = planRound(t, ['F1', 'F2', 'F3'].map(C));
    const state = (log) => log.stops.map((s) => (s.sampled ? 'taken' : s.skipped ? 'skipped' : '-'));
    const home = fixtureWalk(t, route, 'home');
    expect(state(home)).toEqual(['taken', 'taken', 'taken']);
    expect(home.outcome).toBe('home');
    const turned = fixtureWalk(t, route, 'turned');
    expect(state(turned)).toEqual(['taken', 'taken', 'skipped']);
    expect(turned.turnedBack.skipped).toEqual(['F3']);
    expect(turned.outcome.startsWith('home')).toBe(true);
    const none = fixtureWalk(t, route, 'none');
    expect(state(none)).toEqual(['-', '-', '-']);
    expect(none.sample).toBe(null);
    const lost = fixtureWalk(t, route, 'lost');
    expect(lost.outcome).toBe('not-returned');
    const one = fixtureWalk(t, planRound(t, [C('F7')]), 'turned');
    expect(one.stops[0].skipped).toBe(false);
    expect(one.turnedBack).toBe(null);
  }, 60000);
});
