// Turn-back line (specs/x-turnline.md): the value at the crew's own place is the reserve the walk shows;
// ground outside the line has reserve below zero; a whole site inside gives no line.
import { describe, it, expect } from 'vitest';
import { nodeTerrain } from './load.js';
import { CANDIDATES, planRound, newWalkLog, reserveFrom, consume, fullLevels, WORK } from '../src/core/index.js';
import { createSim } from '../src/steps/4-walk/sim.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';
import { turnField, turnContour, shownAhead, createTurnline } from '../src/steps/4-walk/turnline.js';

const t = nodeTerrain();
const C = (id) => CANDIDATES.find((c) => c.id === id);
const simFor = (ids) => createSim(t, planRound(t, ids.map(C)), newWalkLog());
const field = (sim) => turnField(t, sim.log.levels, shownAhead(sim), sim.s.x, sim.s.z, D.turnlineStepM, D.miniRadiusM + D.turnlineMarginM, D.miniRadiusM);

describe('turn-back line', () => {
  it('at the crew\'s place the value equals the reserve the walk shows (one stop and a round)', () => {
    for (const ids of [['F7'], ['F1', 'F2', 'F3']]) {
      const sim = simFor(ids);
      for (let k = 0; k < 40; k++) sim.step(D.tickS, { f: 1, r: 0, turn: 0, pitch: 0 });
      const f = field(sim), c = f.half * f.w + f.half;
      expect(f.vals[c]).toBeCloseTo(sim.s.reserve.seconds, 3);
    }
  });
  it('with the suit drawn down the line appears; outside it the reserve is below zero, inside it is not', () => {
    const sim = simFor(['F7']);
    sim.log.levels = consume(sim.log.levels, WORK.walkW.value, 2400);
    const f = field(sim);
    expect(f.anyOutside).toBe(true);
    const ahead = shownAhead(sim);
    let out = 0, inn = 0;
    for (let j = 0; j < f.w; j += 5) for (let i = 0; i < f.w; i += 5) {
      const v = f.vals[j * f.w + i]; if (v !== v) continue;
      const x = f.cx + (i - f.half) * f.step, z = f.cz + (j - f.half) * f.step;
      const r = reserveFrom(t, sim.log.levels, { x, z, ...ahead }).seconds;
      if (v < 0) { out++; expect(r).toBeLessThan(0); } else { inn++; expect(r).toBeGreaterThanOrEqual(0); }
    }
    expect(out).toBeGreaterThan(0); expect(inn).toBeGreaterThan(0);
    const seg = turnContour(f);
    expect(seg.length).toBeGreaterThan(0);
    // every contour segment lies inside one grid square whose corners are on both sides of zero
    for (const q of seg) expect(Math.hypot(q[2] - q[0], q[3] - q[1])).toBeLessThanOrEqual(f.step * 1.5);
  });
  it('nothing outside the view: no line; and not recalculated more often than the refresh time', () => {
    const sim = simFor(['F1']);
    const L = sim.log.levels;
    for (const k of Object.keys(L)) L[k] *= 100;
    const tl = createTurnline(t);
    expect(tl.update(sim, 5000)).toBe(null);
    const near = createTurnline(t).update(simFor(['F1']), 5000); // full suit, near spot: nothing outside in the map's view
    expect(near === null || !near.anyInView).toBe(true);
    sim.log.levels = fullLevels();
    expect(tl.update(sim, 5100)).toBe(null); // within the refresh time: the old answer
    expect(tl.update(sim, 7000)).not.toBe(null); // full levels: ground beyond the line in view
  });
});
