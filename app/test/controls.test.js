// Walk controls (specs/feedback-1.md "Walk: controls"): fast walk, demo speed and jump keep the walk log
// and the reserve consistent with the suit model.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import {
  CANDIDATES, ASTRONAUT, planRoute, newWalkLog, findRoute, workRate, demoFactor, reserveFrom, isClosed, walkSeconds,
} from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const spot = CANDIDATES[5];
const route = planRoute(t, spot);

/** Walk the sim with W along pts (heading set toward each next point), with extra input flags. */
function walkAlong(sim, pts, flags = {}, each = () => {}) {
  for (const p of pts) {
    for (let guard = 0; guard < 5000; guard++) {
      const dx = p.x - sim.s.x, dz = p.z - sim.s.z;
      if (Math.hypot(dx, dz) < 0.1 || sim.log.ended) break;
      sim.s.yaw = Math.atan2(dx, dz);
      sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0, ...flags });
      each();
    }
  }
}
/** The planned way out from the sim's start point, `n` route points long. */
function wayOut(sim, n) {
  const P = route.out.points;
  let k0 = 0;
  P.forEach((p, k) => { if (Math.hypot(p.x - sim.s.x, p.z - sim.s.z) < Math.hypot(P[k0].x - sim.s.x, P[k0].z - sim.s.z)) k0 = k; });
  return P.slice(k0 + 1, k0 + 1 + n);
}
const snap = (log) => ({ tS: log.tS, m: log.distanceM, o2: log.levels.oxygen, bat: log.levels.battery, shadowS: log.radioShadowS });
const delta = (a, b) => ({ tS: b.tS - a.tS, m: b.m - a.m, o2: a.o2 - b.o2, bat: a.bat - b.bat, shadowS: b.shadowS - a.shadowS });
const near = (a, b, rel) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b));

function walked(flags, n = 60) {
  const log = newWalkLog();
  const sim = createSim(t, route, log);
  const a = snap(log);
  let checks = 0, bad = 0;
  walkAlong(sim, wayOut(sim, n), flags, () => {
    // the reserve shown is the reserve of the logged levels at this point
    const r = reserveFrom(t, log.levels, { x: sim.s.x, z: sim.s.z, phase: log.phase, spot: route.spot });
    checks++; if (Math.abs(r.seconds - sim.s.reserve.seconds) > 1e-6) bad++;
  });
  return { sim, log, d: delta(a, snap(log)), checks, bad };
}

describe('walk controls: fast walk (Shift held)', () => {
  it('moves at the fast pace, draws the suit model work rate at that speed, log and reserve consistent', () => {
    const normal = walked({});
    const fast = walked({ fast: true });
    expect(fast.bad).toBe(0);
    const f = ASTRONAUT.fastPaceFactor.value;
    expect(near(fast.d.m, normal.d.m, 0.03)).toBe(true);
    // same path in 1/f of the suit time
    expect(near(fast.d.tS * f, normal.d.tS, 0.03)).toBe(true);
    // the battery follows time; oxygen follows the higher work rate at that speed
    expect(near(fast.d.bat, fast.d.tS, 1e-6)).toBe(true);
    const ratio = workRate(0, ASTRONAUT.paceMS.value * f) / workRate(0) / f; // flat-ground energy per metre, fast vs normal
    expect(near(fast.d.o2 / normal.d.o2, ratio, 0.08)).toBe(true);
    // the last step's work rate is the suit model's at the fast pace
    expect(fast.sim.s.fast).toBe(true);
    expect(fast.sim.s.workW).toBeGreaterThan(workRate(0) * 1.05);
  });
});

describe('walk controls: demo speed (Shift twice)', () => {
  it('moves faster on screen, but time and consumption are a normal walk over the same distance', () => {
    const normal = walked({});
    const demo = walked({ demo: true });
    expect(demo.bad).toBe(0);
    for (const k of ['m', 'tS', 'o2', 'bat']) expect(near(demo.d[k], normal.d[k], 0.03), k).toBe(true);
    // fewer real-time ticks for the same path (about screenSpeedFactor times fewer)
    expect(demo.checks).toBeLessThan(normal.checks / 3);
  });
});

describe('walk controls: jump (F)', () => {
  it('a jump from A to B changes the log by the same totals as walking the findRoute way from A to B', () => {
    const logJ = newWalkLog(), simJ = createSim(t, route, logJ);
    const logW = newWalkLog(), simW = createSim(t, route, logW);
    const A = { x: simJ.s.x, z: simJ.s.z };
    const B = wayOut(simJ, 70).at(-1);
    expect(Math.hypot(B.x - A.x, B.z - A.z)).toBeGreaterThan(15);
    expect(simJ.canLand(B.x, B.z)).toBe(true);

    const a = snap(logJ);
    const r = simJ.jumpTo(B.x, B.z);
    expect(r).not.toBeNull();
    const dJ = delta(a, snap(logJ));
    expect(Math.hypot(simJ.s.x - B.x, simJ.s.z - B.z)).toBeLessThan(1e-6);

    const way = findRoute(t, A, B);
    expect(way.keepsRules).toBe(true);
    const b = snap(logW);
    walkAlong(simW, [...way.points, B]);
    const dW = delta(b, snap(logW));
    for (const k of ['m', 'tS', 'o2', 'bat']) expect(near(dJ[k], dW[k], 0.03), `${k}: jump ${dJ[k]} walk ${dW[k]}`).toBe(true);
    expect(Math.abs(dJ.shadowS - dW.shadowS)).toBeLessThanOrEqual(walkSeconds(1.5));
    expect(r.metres).toBeCloseTo(dJ.m, 6);
    expect(r.seconds).toBeCloseTo(dJ.tS, 6);
    // the reserve shown is that of the logged levels
    expect(simJ.s.reserve.seconds).toBeCloseTo(reserveFrom(t, logJ.levels, { x: B.x, z: B.z, phase: logJ.phase, spot: route.spot }).seconds, 6);
    // suit time per metre as a normal walk
    expect(near(dJ.tS, (dJ.m / ASTRONAUT.paceMS.value) * demoFactor(), 0.06)).toBe(true);
  });

  it('never lands on closed ground or outside the site; the log stays unchanged', () => {
    const log = newWalkLog(), sim = createSim(t, route, log);
    let closed = -1;
    for (let i = 0; i < t.size && closed < 0; i++) if (isClosed(t, i)) closed = i;
    const c = t.pointOf(closed);
    expect(sim.canLand(c.x, c.z)).toBe(false);
    expect(sim.canLand(t.max + 5, 0)).toBe(false);
    const a = snap(log);
    expect(sim.jumpTo(c.x, c.z)).toBeNull();
    expect(snap(log)).toEqual(a);
  });
});
