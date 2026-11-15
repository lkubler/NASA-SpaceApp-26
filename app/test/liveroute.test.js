// The live route in the Walk (specs/x-liveroute.md): off the planned leg the display shows the way from where
// the crew stands to the current target by the planner's rules, through the waypoints still ahead, planned
// again as the crew moves; "off the path" still measures to the planned route.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, ROVER, planRound, newWalkLog, spotField, roverField, isClosed } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);
const near = (p, q, m) => Math.hypot(p.x - q.x, p.z - q.z) <= m;

/** Jump sideways off the planned leg at its point k (first offset that lands), so the crew stands off the route. */
function jumpOff(sim, P, k, offs = [12, -12, 9, -9, 15, -15, 7, -7]) {
  const a = P[Math.max(0, k - 2)], b = P[Math.min(P.length - 1, k + 2)];
  const l = Math.hypot(b.x - a.x, b.z - a.z) || 1;
  for (const o of offs) {
    const x = P[k].x - (o * (b.z - a.z)) / l, z = P[k].z + (o * (b.x - a.x)) / l;
    if (sim.canLand(x, z) && sim.jumpTo(x, z)) return { x, z };
  }
  return null;
}

describe('live route', () => {
  it('on the planned leg: the band is the planned leg; off it: the live route from here to the target, off the path still shows', () => {
    const route = planRound(t, [C('F7')]);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    expect(sim.leg().points).toBe(route.legs[0].points);
    const P = route.legs[0].points;
    expect(jumpOff(sim, P, Math.floor(P.length / 2))).not.toBe(null);
    const lg = sim.leg();
    expect(lg.planned).toBe(false);
    expect(lg.points[0]).toEqual({ x: sim.s.x, z: sim.s.z });
    const end = lg.points.at(-1);
    expect(near(end, C('F7'), t.cell)).toBe(true);
    // the distance on the display: along the live route (the stop's cost field from here)
    expect(sim.target().metres).toBeCloseTo(spotField(t, C('F7')).at(sim.s.x, sim.s.z).metres, 6);
    // the steps of the live route are grid steps (no jump over ground)
    for (let i = 2; i < lg.points.length; i++) expect(Math.hypot(lg.points[i].x - lg.points[i - 1].x, lg.points[i].z - lg.points[i - 1].z)).toBeLessThan(t.cell * 1.5);
    // "off the path" still measures to the planned route: farther than offPathM, it shows
    const offM = Math.min(...route.legs.flatMap((L) => L.points.map((p) => Math.hypot(p.x - sim.s.x, p.z - sim.s.z))));
    if (offM > D.offPathM + 1) expect(sim.s.active.offPath).toBe(true);
    expect(offM).toBeGreaterThan(D.offPathM);
  });

  it('planned again when the crew moves to another cell, not per frame; the same cell keeps the same route', () => {
    const route = planRound(t, [C('F7')]);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const P = route.legs[0].points;
    jumpOff(sim, P, Math.floor(P.length / 2));
    const a = sim.leg();
    expect(sim.leg()).toBe(a); // same cell: the same route object
    const c0 = t.indexOf(sim.s.x, sim.s.z);
    let n = 0;
    while (t.indexOf(sim.s.x, sim.s.z) === c0 && n++ < 200) sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
    const b = sim.leg();
    expect(b).not.toBe(a);
    expect(b.points[0]).toEqual({ x: sim.s.x, z: sim.s.z });
    // the replan is cheap (cost fields built at the start)
    const t0 = performance.now();
    for (let i = 0; i < 50; i++) { sim.s.leg = null; sim.leg(); }
    expect((performance.now() - t0) / 50).toBeLessThan(5);
  });

  it('passes a waypoint still ahead on this leg; distance along it', () => {
    const F3 = C('F3');
    const w = { x: -14, z: -12 };
    const route = planRound(t, [F3], { 'rover>F3': [w] });
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const P = route.legs[0].points;
    // jump off before the waypoint (its cell index on the leg)
    const wi = route.legs[0].via[0].index;
    expect(jumpOff(sim, P, Math.max(3, Math.floor(wi / 2)), [8, -8, 6, -6, 10, -10, 12, -12])).not.toBe(null);
    expect(log.via[0].passed).toBe(false);
    const lg = sim.leg();
    expect(lg.planned).toBe(false);
    expect(lg.points.some((p) => near(p, w, t.cell))).toBe(true);
    expect(near(lg.points.at(-1), F3, t.cell)).toBe(true);
    const viaM = spotField(t, w).at(sim.s.x, sim.s.z).metres + spotField(t, F3).at(w.x, w.z).metres;
    expect(sim.target().metres).toBeCloseTo(viaM, 6);
  });

  it('"Turn back now": target the rover at once, the live route is the way home from here, replanned as the crew moves', () => {
    const route = planRound(t, [C('F7')]);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const P = route.legs[0].points;
    jumpOff(sim, P, Math.floor(P.length / 3));
    let guard = 0;
    while (!sim.s.active.turnBack && guard++ < 400000 && !log.ended) sim.step(D.tickS, { f: 0, r: 0, turn: 0, pitch: 0 });
    expect(sim.s.active.turnBack).toBe(true);
    const tg = sim.target();
    expect(tg.kind).toBe('rover');
    const lg = sim.leg();
    expect(lg.kind).toBe('rover');
    expect(lg.planned).toBe(false);
    expect(lg.points[0]).toEqual({ x: sim.s.x, z: sim.s.z });
    expect(near(lg.points.at(-1), ROVER, t.cell)).toBe(true);
    expect(tg.metres).toBeCloseTo(roverField(t).at(sim.s.x, sim.s.z).metres, 6);
    // walk a few metres along it: a new route from the new place, still ending at the rover
    for (const p of lg.points.slice(1, 8)) {
      for (let g = 0; g < 200 && Math.hypot(p.x - sim.s.x, p.z - sim.s.z) > 0.1; g++) {
        sim.s.yaw = Math.atan2(p.x - sim.s.x, p.z - sim.s.z);
        sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
      }
    }
    const lg2 = sim.leg();
    expect(lg2.kind).toBe('rover');
    expect(lg2.points[0]).toEqual({ x: sim.s.x, z: sim.s.z });
    expect(near(lg2.points.at(-1), ROVER, t.cell)).toBe(true);
    expect(sim.target().metres).toBeLessThan(tg.metres);
  }, 60000);

  it('no rule-keeping way from here (inside closed ground): the shortest way back to allowed ground, in the warning colour', () => {
    const route = planRound(t, [C('F7')]);
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    const field = spotField(t, C('F7'));
    // a cell deep in closed ground: it and its neighbours two cells round are closed
    const n = t.n;
    let cell = -1;
    for (let i = 0; i < t.size && cell < 0; i++) {
      const c = i % n, r = (i / n) | 0;
      if (c < 10 || r < 10 || c > n - 10 || r > n - 10) continue;
      let all = true;
      for (let dr = -2; dr <= 2 && all; dr++) for (let dc = -2; dc <= 2 && all; dc++) all = isClosed(t, (r + dr) * n + c + dc);
      if (all && field.closedM[i] > 0) cell = i;
    }
    expect(cell).toBeGreaterThan(-1);
    const p = t.pointOf(cell);
    sim.s.x = p.x; sim.s.z = p.z; sim.s.leg = null; sim.s.leftRover = true;
    const lg = sim.leg();
    expect(lg.warn).toBe(true);
    expect(lg.points[0]).toEqual({ x: p.x, z: p.z });
    const end = lg.points.at(-1), ei = t.indexOf(end.x, end.z);
    expect(isClosed(t, ei)).toBe(false);
    expect(field.closedM[ei]).toBe(0);
    // the shortest: no longer than the straight distance plus a few cells
    expect(lg.points.length).toBeLessThan(400);
  });
});
