// The Walk's simulation (steps/4-walk/sim.js, no three.js or DOM) driven along the planned route:
// the live reserve on return starts at the plan's number and never jumps, also across the sample.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, planRoute, planNumbers, newWalkLog, walkSeconds } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();

/** Walk the sim along pts with the keys (W, heading set toward the next point); returns reserves seen. */
function walkAlong(sim, pts, seen, stop = () => false) {
  for (const p of pts) {
    for (let guard = 0; guard < 2000; guard++) {
      const dx = p.x - sim.s.x, dz = p.z - sim.s.z;
      if (Math.hypot(dx, dz) < 0.1 || stop()) break;
      sim.s.yaw = Math.atan2(dx, dz);
      sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
      seen.push(sim.s.reserve.seconds);
    }
    if (stop()) return;
  }
}

describe('walk: reserve on return', () => {
  for (const id of [CANDIDATES[0].id, CANDIDATES[5].id]) {
    it(`starts at the plan's number and never jumps, across the sample too (${id})`, () => {
      const spot = CANDIDATES.find((c) => c.id === id);
      const route = planRoute(t, spot);
      const plan = planNumbers(t, route);
      const log = newWalkLog();
      const sim = createSim(t, route, log);
      // at the start (the metres from the rover to the start point already logged): the plan's number
      expect(Math.abs(sim.s.reserve.seconds - plan.reserveS) / 60).toBeLessThan(3);

      const seen = [sim.s.reserve.seconds];
      // from the start point beside the rover (the walk starts there, on the route)
      const P = route.out.points;
      let k0 = 0;
      P.forEach((p, k) => { if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < Math.hypot(P[k0].x - sim.s.x, P[k0].z - sim.s.z)) k0 = k; });
      walkAlong(sim, P.slice(k0 + 1), seen, () => sim.atTarget());
      expect(sim.atTarget()).toBe(true);
      const before = sim.s.reserve.seconds;
      expect(sim.takeSample()).toBe(true);
      const after = sim.s.reserve.seconds;
      sim.s.modal = null;
      seen.push(after);
      // across the 20 minutes of work: continuous (the work was already counted in the reserve on the way out)
      expect(Math.abs(after - before) / 60, `sample ${id}`).toBeLessThan(3);
      walkAlong(sim, route.back.points, seen, () => sim.atRover());

      // between consecutive steps it never changes by more than a few minutes
      let maxJump = 0;
      for (let k = 1; k < seen.length; k++) maxJump = Math.max(maxJump, Math.abs(seen[k] - seen[k - 1]));
      expect(maxJump / 60, id).toBeLessThan(3);
      // the walk on the plan keeps every rule
      expect(log.brokenRules.length, id).toBe(0);
      // and in fact by less than the walk of one metre
      expect(maxJump).toBeLessThan(walkSeconds(1));
      // back at the rover
      expect(sim.atRover(), id).toBe(true);
    });
  }
});

describe('walk: warnings near the band', () => {
  /** The route's points moved sideways by `off` metres (perpendicular to the local direction). */
  const shifted = (P, off) => P.map((p, k) => {
    const a = P[Math.max(0, k - 1)], b = P[Math.min(P.length - 1, k + 1)];
    const len = Math.hypot(b.x - a.x, b.z - a.z) || 1;
    return { x: p.x - off * (b.z - a.z) / len, z: p.z + off * (b.x - a.x) / len };
  });
  for (const id of [CANDIDATES[0].id, CANDIDATES[5].id]) {
    for (const off of [-1.5, -1, 1, 1.5]) {
      it(`${id}, ${off} m beside the band: no "steep ahead" where the plan marks none; a rule counts once per entry`, () => {
        const spot = CANDIDATES.find((c) => c.id === id);
        const route = planRoute(t, spot);
        const log = newWalkLog();
        const sim = createSim(t, route, log);
        const P = route.out.points;
        let k0 = 0;
        P.forEach((p, k) => { if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < Math.hypot(P[k0].x - sim.s.x, P[k0].z - sim.s.z)) k0 = k; });
        const seen = [];
        walkAlong(sim, shifted(P.slice(k0 + 1, -6), off), seen);
        walkAlong(sim, shifted(route.back.points.slice(6, -8), off), seen);
        expect(log.warnings.filter((w) => w.id === 'steepAhead').length, `${id} ${off}`).toBe(0);
        // walking along an edge is not counted per frame: a new entry needs a metre walked outside
        const slope = log.brokenRules.filter((b) => b.id === 'slope');
        expect(slope.length, `${id} ${off}`).toBeLessThan(10);
      });
    }
  }
});
