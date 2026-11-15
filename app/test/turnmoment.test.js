// "Turn back now, the moment" (specs/x-liveroute.md): a round longer than the suit allows gets no "Turn back
// now" at the rover but one caution with the stops that still fit; "Turn back now" comes when going on to the
// next stop would no longer leave a way home with reserve.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, planRound, planNumbers, newWalkLog, reserveFrom } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);

/** Walk along pts until stop(); records the reserve and whether "Turn back now" showed. */
function walkAlong(sim, pts, rec, stop) {
  for (const p of pts) {
    for (let g = 0; g < 4000; g++) {
      if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < 0.1 || stop() || sim.log.ended) break;
      sim.s.yaw = Math.atan2(p.x - sim.s.x, p.z - sim.s.z);
      sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
      rec.push({ r: sim.s.reserve.seconds, tb: !!sim.s.active.turnBack });
    }
    if (stop()) return;
  }
}
const fromHere = (sim, P) => {
  let k0 = 0;
  P.forEach((p, k) => { if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < Math.hypot(P[k0].x - sim.s.x, P[k0].z - sim.s.z)) k0 = k; });
  return P.slice(k0 + 1);
};

describe('turn back now, the moment', () => {
  it('too long: no turn back at the rover, a caution with the stops that fit, turn back when the next stop no longer fits', () => {
    const ids = ['F1', 'F3', 'F7'];
    const route = planRound(t, ids.map(C));
    expect(planNumbers(t, route).reserveS).toBeLessThan(0);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    expect(sim.s.tooLong).toBe(true);
    sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
    sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
    expect(sim.s.active.turnBack).toBeFalsy();
    expect(sim.s.active.tooLong).toBe(true);
    expect(sim.s.alertInfo.tooLong.out).toContain(3);
    expect(sim.s.alertInfo.tooLong.fit.length).toBeGreaterThan(0);
    // the reserve shown counts the stops that fit and the way home: not a large negative time
    expect(sim.s.reserve.seconds).toBeGreaterThan(0);
    const rec = [];
    for (let k = 0; k < ids.length && !sim.s.active.turnBack; k++) {
      walkAlong(sim, fromHere(sim, route.legs[k].points), rec, () => sim.stopHere() === k || sim.s.active.turnBack);
      if (sim.s.active.turnBack) break;
      expect(sim.takeSample()).toBe(true);
      sim.s.modal = null;
    }
    expect(rec.some((x) => x.tb)).toBe(false); // never on the way while the next stop still fits
    expect(Math.min(...rec.map((x) => x.r))).toBeGreaterThan(-60);
    // turned back after the stops that fit, the rest skipped as built
    expect(sim.s.active.turnBack).toBe(true);
    const fitN = log.stops.filter((st) => st.sampled).length;
    expect(fitN).toBeGreaterThan(0);
    expect(log.turnedBack.skipped).toEqual(ids.slice(fitN));
    // at that moment going on to the next stop would not leave a way home with reserve
    const at = log.turnedBack;
    const lv = log.levels;
    expect(reserveFrom(t, lv, { x: at.x, z: at.z, phase: 'out', stops: [log.stops[fitN]] }).seconds).toBeLessThanOrEqual(0);
    expect(sim.target().kind).toBe('rover');
    expect(sim.s.reserve.seconds).toBeGreaterThan(0);
    expect(sim.s.active.tooLong).toBeFalsy();
  }, 120000);

  it('a round that fits: as built (no caution)', () => {
    const route = planRound(t, ['F1', 'F2', 'F3'].map(C));
    const sim = createSim(t, route, newWalkLog());
    expect(sim.s.tooLong).toBe(false);
    sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
    expect(sim.s.active.tooLong).toBeFalsy();
  });
});
