// The intro's part B (steps/4-walk/intro.js, specs/x-intro.md): the camera path from the rover hatch to the
// walk's start pose, for every spot. It ends exactly at the start, stays out of the rover model and on open ground.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, ROVER, planRoute, newWalkLog, isClosedAt } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { introPath } from '../src/steps/4-walk/intro.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const ry = (D.roverHeadingDeg * Math.PI) / 180;
const fwd = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: Math.cos(ry), z: -Math.sin(ry) };
const rc = { x: ROVER.x + fwd.x * D.roverShiftM, z: ROVER.z + fwd.z * D.roverShiftM };
const local = (p) => ({ a: (p.x - rc.x) * fwd.x + (p.z - rc.z) * fwd.z, b: (p.x - rc.x) * side.x + (p.z - rc.z) * side.z });

/** Points every 5 cm along the path. */
function samples(points) {
  const out = [];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / 0.05));
    for (let k = 0; k <= n; k++) out.push({ x: a.x + (b.x - a.x) * (k / n), z: a.z + (b.z - a.z) * (k / n) });
  }
  return out;
}

describe('intro: stepping out of the rover', () => {
  for (const spot of CANDIDATES) {
    it(`ends at the walk's start, outside the rover, on open ground (${spot.id})`, () => {
      const sim = createSim(t, planRoute(t, spot), newWalkLog());
      const { points } = introPath(sim.s);
      expect(points.at(-1)).toEqual({ x: sim.s.x, z: sim.s.z });
      for (const p of samples(points)) {
        const q = local(p);
        // the rover model: body 1.9 x 2.6 m, deck 2.1 m wide, arm and power unit to 2.3 m along the axis
        expect(Math.abs(q.b) >= 1.2 || Math.abs(q.a) > D.roverHalfLenM).toBe(true);
        expect(isClosedAt(t, p.x, p.z)).toBe(false);
      }
      // a few metres from the hatch to the start
      const len = points.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - points[i].x, b.z - points[i].z), 0);
      expect(len).toBeGreaterThan(1.5);
    });
  }
});
