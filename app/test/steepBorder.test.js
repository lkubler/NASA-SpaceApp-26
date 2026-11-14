// The Walk's steep border (specs/feedback-1.md, Walk: display): a display aid that must never run across a
// planned route, follows the outline smoothly and gives small patches no border of their own.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, isClosed, planRoute, planRound, roverField } from '../src/core/index.js';
import { steepWallLines, steepDisplayMask } from '../src/steps/4-walk/steepBorder.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const t = nodeTerrain();
const home = roverField(t);
const keep = CANDIDATES.map((c) => home.pathFrom(c.x, c.z));
const lines = steepWallLines(t, D, keep);
const mask = steepDisplayMask(t, D, keep);
const segs = lines.flatMap(({ pts, closed }) => pts.slice(0, closed ? pts.length : -1).map((p, k) => [p, pts[(k + 1) % pts.length]]));

const crosses = (p, q, r, s) => {
  const d = (q.x - p.x) * (s.z - r.z) - (q.z - p.z) * (s.x - r.x);
  if (!d) return false;
  const u = ((r.x - p.x) * (s.z - r.z) - (r.z - p.z) * (s.x - r.x)) / d;
  const v = ((r.x - p.x) * (q.z - p.z) - (r.z - p.z) * (q.x - p.x)) / d;
  return u >= 0 && u <= 1 && v >= 0 && v <= 1;
};

describe('steep border', () => {
  it('is a few long lines, not a field of fragments', () => {
    expect(lines.length).toBeGreaterThan(0);
    expect(lines.length).toBeLessThan(20);
    for (const { pts } of lines) expect(pts.length * D.steepSpacingM).toBeGreaterThan(5);
  });

  it('has no stair steps: neighbouring segments (0.4 m) turn by less than 60 degrees (a grid step turns 90)', () => {
    let worst = 0;
    for (const { pts, closed } of lines) {
      for (let k = 1; k < pts.length - (closed ? 0 : 1); k++) {
        const a = pts[k - 1], b = pts[k], c = pts[(k + 1) % pts.length];
        const a1 = Math.atan2(b.z - a.z, b.x - a.x), a2 = Math.atan2(c.z - b.z, c.x - b.x);
        let d = Math.abs(a2 - a1); if (d > Math.PI) d = 2 * Math.PI - d;
        worst = Math.max(worst, d);
      }
    }
    expect((worst * 180) / Math.PI).toBeLessThan(60);
  });

  for (const c of CANDIDATES) {
    it(`never runs across the planned route to ${c.id} (out and back)`, () => {
      const r = planRoute(t, c);
      for (const leg of [r.out, r.back]) {
        const pts = leg.points;
        let cross = 0, inside = 0;
        for (let i = 0; i < pts.length; i++) {
          const ci = t.indexOf(pts[i].x, pts[i].z);
          if (!isClosed(t, ci) && mask[ci]) inside++;
          if (i) for (const [a, b] of segs) if (crosses(pts[i - 1], pts[i], a, b)) cross++;
        }
        expect(cross, `${c.id} crossings`).toBe(0);
        expect(inside, `${c.id} open route cells inside the border`).toBe(0);
      }
    });
  }

  // a round's spot-to-spot legs (specs/feedback-1.md "Several stops"): the Walk keeps their corridors open
  // as well (index.js passes route.legs to the scene), so the border never runs across a leg of the round
  const legCrossings = (ls, m, pts) => {
    const sg = ls.flatMap(({ pts: q, closed }) => q.slice(0, closed ? q.length : -1).map((p, k) => [p, q[(k + 1) % q.length]]));
    let cross = 0, inside = 0;
    for (let i = 0; i < pts.length; i++) {
      const ci = t.indexOf(pts[i].x, pts[i].z);
      if (!isClosed(t, ci) && m[ci]) inside++;
      if (i) for (const [a, b] of sg) if (crosses(pts[i - 1], pts[i], a, b)) cross++;
    }
    return { cross, inside };
  };
  const C = (id) => CANDIDATES.find((c) => c.id === id);
  for (const ids of [['F1', 'F2', 'F3'], ['F3', 'F7', 'F1'], ['F2', 'F5', 'F7'], ['F5', 'F7', 'F4'], ['F7', 'F1']]) {
    it(`never runs across a leg of the round ${ids.join(' -> ')}`, () => {
      const route = planRound(t, ids.map(C));
      const k2 = [...keep, ...route.legs.map((l) => l.cells)];
      const ls = steepWallLines(t, D, k2), m = steepDisplayMask(t, D, k2);
      route.legs.forEach((leg, k) => {
        const { cross, inside } = legCrossings(ls, m, leg.points);
        expect(cross, `leg ${k} crossings`).toBe(0);
        expect(inside, `leg ${k} open cells inside the border`).toBe(0);
      });
    });
  }
  it('without the round\'s legs some spot-to-spot legs would cross the border (why the Walk passes them)', () => {
    let crossing = 0;
    for (const a of CANDIDATES) for (const b of CANDIDATES) {
      if (a === b) continue;
      if (legCrossings(lines, mask, planRound(t, [a, b]).legs[1].points).cross) crossing++;
    }
    expect(crossing).toBeGreaterThan(0);
  });
});
