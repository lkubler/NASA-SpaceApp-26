// Movable waypoints (specs/x-waypoints.md): a waypoint is a point a leg must pass, no sample, no work time;
// each part of a leg is planned by the same rules; no waypoint = exactly as before; closed ground is refused.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import {
  CANDIDATES, ROVER, RULES, planRoute, planRound, planNumbers, findRoute, isClosed, legKey, legKeysOf, waypointAllowed,
  waypointsFor, waypointsOf, simulateWalk, newWalkLog, initStops, remainingWay, remainingStops, passVia, reserveFrom, fullLevels,
} from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);

/** The open cell nearest to (x, z): a point where a waypoint may stand. */
function openNear(x, z) {
  for (let r = 0; r < 20; r += 0.5) {
    for (let a = 0; a < 16; a++) {
      const px = x + r * Math.cos((a * Math.PI) / 8), pz = z + r * Math.sin((a * Math.PI) / 8);
      if (waypointAllowed(t, px, pz)) { const c = t.pointOf(t.indexOf(px, pz)); return { x: c.x, z: c.z }; }
    }
  }
  throw new Error('no open ground near ' + x + ',' + z);
}
const firstClosed = () => { for (let i = 0; i < t.size; i++) if (isClosed(t, i)) return t.pointOf(i); return null; };

describe('waypoints', () => {
  it('no waypoint: route and plan numbers identical to the round without the argument', () => {
    for (const ids of [['F3'], ['F1', 'F3'], ['F3', 'F7', 'F1']]) {
      const stops = ids.map(C);
      const a = planRound(t, stops), b = planRound(t, stops, null), c = planRound(t, stops, {}), d = planRound(t, stops, { 'F9>rover': [{ x: 1, z: 1 }] });
      for (const r of [b, c, d]) {
        expect(r.waypoints).toBeUndefined();
        r.legs.forEach((l, k) => expect(l).toBe(a.legs[k])); // the same cached legs
        expect(planNumbers(t, r)).toEqual(planNumbers(t, a));
      }
      if (ids.length === 1) expect(Array.from(a.out.cells)).toEqual(Array.from(planRoute(t, stops[0]).out.cells));
    }
  });

  it('a waypoint in a leg: the leg passes it, each part planned by findRoute; the numbers count no work there', () => {
    const F3 = C('F3');
    const w = openNear(-14, -12);
    const route = planRound(t, [F3], { [legKey(null, F3)]: [w] });
    const leg = route.legs[0];
    expect(route.waypoints).toEqual([[w], []]);
    // the leg = rover -> waypoint, then waypoint -> spot, joined in the waypoint's cell
    const p1 = findRoute(t, ROVER, w), p2 = findRoute(t, w, F3);
    expect(Array.from(leg.cells)).toEqual([...p1.cells, ...Array.from(p2.cells).slice(1)]);
    expect(leg.via).toEqual([{ x: w.x, z: w.z, index: p1.cells.length - 1 }]);
    expect(leg.cells[leg.via[0].index]).toBe(t.indexOf(w.x, w.z));
    // the way home is unchanged
    expect(route.legs[1]).toBe(planRoute(t, F3).legs[1]);
    const plan = planNumbers(t, route), base = planNumbers(t, planRoute(t, F3));
    expect(plan.distanceM).toBeGreaterThan(base.distanceM);
    expect(plan.timeS).toBeGreaterThan(base.timeS);
    expect(plan.reserveS).toBeLessThan(base.reserveS);
    expect(plan.stopsS).toBe(base.stopsS); // no work time at a waypoint
    expect(plan.legs.filter((l) => l.kind === 'spot').length).toBe(1); // not a stop
    // the leg's parts add up to the leg
    const lp = plan.legPlans[0];
    expect(lp.via.length).toBe(1);
    expect(lp.parts.length).toBe(2);
    expect(lp.parts[0].distanceM + lp.parts[1].distanceM).toBeCloseTo(lp.distanceM, 6);
    expect(lp.parts[0].seconds + lp.parts[1].seconds).toBeCloseTo(lp.seconds, 6);
    expect(plan.legPlans[1].via).toBeUndefined();
  });

  it('several waypoints in order and waypoints of a round kept per leg key', () => {
    const ids = ['F1', 'F3'];
    expect(legKeysOf(ids)).toEqual(['rover>F1', 'F1>F3', 'F3>rover']);
    const w1 = openNear(5, -8), w2 = openNear(-6, -20), w3 = openNear(-12, -10);
    const wps = { 'F1>F3': [w1, w2], 'F3>rover': [w3] };
    const route = planRound(t, ids.map(C), wps);
    expect(route.waypoints).toEqual([[], [w1, w2], [w3]]);
    expect(waypointsOf(route)).toEqual([[], [w1, w2], [w3]]);
    const v = route.legs[1].via;
    expect(v.map((x) => t.indexOf(x.x, x.z))).toEqual(v.map((x) => route.legs[1].cells[x.index]));
    expect(v[0].index).toBeLessThan(v[1].index);
    // reordering the stops keeps only the legs that still exist
    expect(waypointsFor(['F3', 'F1'], wps)).toBeNull();
    expect(waypointsFor(['F1', 'F3'], wps)).toEqual(wps);
    expect(waypointsFor(['F1'], wps)).toBeNull();
  });

  it('not allowed ground: over the slope rule or outside the site', () => {
    const c = firstClosed();
    expect(c).not.toBeNull();
    expect(waypointAllowed(t, c.x, c.z)).toBe(false);
    expect(waypointAllowed(t, t.max + 1, 0)).toBe(false);
    expect(waypointAllowed(t, 0, t.min - 1)).toBe(false);
    const ok = openNear(-14, -12);
    expect(waypointAllowed(t, ok.x, ok.z)).toBe(true);
    expect(t.slope[t.indexOf(ok.x, ok.z)]).toBeLessThanOrEqual(RULES.slopeMaxDeg.value);
  });

  it('the walk: waypoints ahead count in the reserve until passed; a walk along the plan matches the plan', () => {
    const F3 = C('F3');
    const w = openNear(-14, -12), h = openNear(10, -14);
    const route = planRound(t, [F3], { 'rover>F3': [w], 'F3>rover': [h] });
    const plan = planNumbers(t, route);
    const log = newWalkLog();
    initStops(log, route);
    expect(log.via).toEqual([{ leg: 0, x: w.x, z: w.z, passed: false }, { leg: 1, x: h.x, z: h.z, passed: false }]);
    expect(remainingWay(log)).toEqual([{ x: w.x, z: w.z, pass: true }, remainingStops(log)[0], { x: h.x, z: h.z, pass: true }]);
    // at the rover: the reserve over the shaped round differs from the plan's as much as without waypoints
    // (the cost fields and the planned path differ by the same small amount at the start point)
    const r0 = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', stops: remainingWay(log) });
    const direct = reserveFrom(t, fullLevels(), { x: ROVER.x, z: ROVER.z, phase: 'out', stops: [F3] });
    const baseGap = direct.seconds - planNumbers(t, planRoute(t, F3)).reserveS;
    expect(Math.abs(r0.seconds - plan.reserveS - baseGap)).toBeLessThan(10);
    expect(r0.seconds).toBeLessThan(direct.seconds);
    passVia(log, t, w.x, w.z);
    expect(log.via[0].passed).toBe(true);
    expect(remainingWay(log).length).toBe(2);
    // a whole walk along the plan: every waypoint passed, time and distance as planned
    const sim = simulateWalk(t, route);
    expect(sim.via.every((x) => x.passed)).toBe(true);
    expect(sim.tS).toBeCloseTo(plan.timeS, 3);
    expect(sim.distanceM).toBeCloseTo(plan.distanceM, 3);
  });

  it('no waypoint: remainingWay is remainingStops and the log has no via', () => {
    const route = planRound(t, ['F1', 'F3'].map(C));
    const log = newWalkLog();
    initStops(log, route);
    expect(log.via).toBeUndefined();
    expect(remainingWay(log)).toEqual(remainingStops(log));
  });

  it('a waypoint on open ground cut off by steep ground: the route breaks the slope rule, named in the checks', () => {
    const F3 = C('F3');
    expect(waypointAllowed(t, -8, -30)).toBe(true);
    const plan = planNumbers(t, planRound(t, [F3], { 'rover>F3': [{ x: -8, z: -30 }] }));
    expect(plan.keepsRules).toBe(false);
    expect(plan.brokenRules.map((b) => b.name)).toContain('Slope on foot');
  });

  it('the Walk: the band is the shaped leg, "off the path" measures to it, the waypoint is passed and is no target', () => {
    const F3 = C('F3');
    const w = { x: -14, z: -12 };
    const route = planRound(t, [F3], { 'rover>F3': [w] });
    const log = newWalkLog();
    const sim = createSim(t, route, log);
    expect(sim.leg().points).toBe(route.legs[0].points);
    const P = route.legs[0].points;
    let off = 0;
    for (const p of P.slice(1)) {
      for (let g = 0; g < 400; g++) {
        const dx = p.x - sim.s.x, dz = p.z - sim.s.z;
        if (Math.hypot(dx, dz) < 0.1 || sim.stopHere() === 0) break;
        sim.s.yaw = Math.atan2(dx, dz);
        sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
        if (sim.s.active.offPath) off++;
        expect(sim.target().kind).toBe('spot'); // the target stays the stop
      }
      if (sim.stopHere() === 0) break;
    }
    expect(off).toBe(0);
    expect(log.via[0].passed).toBe(true);
    expect(sim.stopHere()).toBe(0);
    // the direct route to F3 would have been "off the path" at the waypoint
    const direct = planRoute(t, F3).legs[0].points;
    const dmin = Math.min(...direct.map((p) => Math.hypot(p.x - w.x, p.z - w.z)));
    expect(dmin).toBeGreaterThan(D.offPathM);
  });
});
