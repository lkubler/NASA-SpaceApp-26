// Radio relay and contact weight (specs/x-relay.md).
import { describe, it, expect, afterEach } from 'vitest';
import { nodeTerrain } from './load.js';
import {
  CANDIDATES, ROVER, RADIO, PLANNER, RULES, lineOfSight, radioShadowMask, hasRadio, setRelay, getRelay, relayAllowed,
  relaySeesRover, withRelay, findRoute, planRound, planNumbers, planRoute, stepCost, costField, isClosed,
} from '../src/core/index.js';

const t = nodeTerrain();
afterEach(() => setRelay(null));

/** The highest allowed relay place within 45 m of the rover (a place a visitor could pick). */
function aRelayPlace() {
  let best = null;
  for (let z = -45; z <= 45; z += 1) for (let x = -45; x <= 45; x += 1) {
    if (Math.hypot(x, z) < 10 || Math.hypot(x, z) > 45 || !relayAllowed(t, x, z)) continue;
    const y = t.heightAt(x, z);
    if (!best || y > best.y) best = { x, z, y };
  }
  return best;
}

describe('relay: contact', () => {
  it('a place has contact if it sees the rover, or sees the relay while the relay sees the rover', () => {
    const r = aRelayPlace();
    expect(r).not.toBeNull();
    expect(relaySeesRover(t, r)).toBe(true);
    const rover = { x: ROVER.x, z: ROVER.z, h: RADIO.roverAntennaM.value };
    const relay = { x: r.x, z: r.z, h: RADIO.relayMastM.value };
    const without = radioShadowMask(t, undefined, null);
    const withIt = radioShadowMask(t, undefined, r);
    let gained = 0;
    for (let i = 0; i < t.size; i += 7) {
      const p = t.centerOf(t.colOf(i), t.rowOf(i));
      const eye = { x: p.x, z: p.z, h: RADIO.suitAntennaM.value };
      const direct = lineOfSight(t, rover, eye), viaRelay = lineOfSight(t, relay, eye);
      expect(withIt[i] === 0, `cell ${i}`).toBe(direct || viaRelay);
      expect(without[i] === 0, `cell ${i}`).toBe(direct);
      if (without[i] === 1 && withIt[i] === 0) gained++;
    }
    expect(gained).toBeGreaterThan(0); // the relay does change the shadow
    for (let i = 0; i < t.size; i++) expect(withIt[i] <= without[i]).toBe(true); // never adds shadow
  });

  it('a relay that does not see the rover adds no contact', () => {
    // find a cell without line of sight to the rover
    const dark = radioShadowMask(t, undefined, null);
    let far = null;
    for (let i = 0; i < t.size && !far; i += 11) {
      const p = t.centerOf(t.colOf(i), t.rowOf(i));
      if (dark[i] === 1 && !relayAllowed(t, p.x, p.z)) far = p;
    }
    expect(far).not.toBeNull();
    expect(relaySeesRover(t, far)).toBe(false);
    const m = radioShadowMask(t, undefined, far);
    expect(Array.from(m)).toEqual(Array.from(dark));
  });

  it('a place is allowed only where the relay sees the rover and the ground is open', () => {
    let steep = null, blind = null, ok = null;
    for (let i = 0; i < t.size; i += 5) {
      const p = t.centerOf(t.colOf(i), t.rowOf(i));
      const sees = relaySeesRover(t, p);
      if (isClosed(t, i) && !steep) steep = p;
      if (!sees && !isClosed(t, i) && !blind) blind = p;
      if (sees && !isClosed(t, i) && !ok) ok = p;
    }
    expect(relayAllowed(t, steep.x, steep.z)).toBe(false);
    expect(relayAllowed(t, blind.x, blind.z)).toBe(false);
    expect(relayAllowed(t, ok.x, ok.z)).toBe(true);
  });

  it('placing, moving and removing changes the shared shadow; hasRadio agrees with it', () => {
    const r = aRelayPlace();
    expect(getRelay()).toBeNull();
    setRelay(r);
    expect(getRelay()).toEqual({ x: r.x, z: r.z });
    const m = radioShadowMask(t);
    for (let i = 0; i < t.size; i += 97) {
      const p = t.centerOf(t.colOf(i), t.rowOf(i));
      expect(hasRadio(t, p.x, p.z), `cell ${i}`).toBe(m[i] === 0);
    }
    setRelay(null);
    expect(radioShadowMask(t)).toBe(radioShadowMask(t, undefined, null));
    expect(withRelay(r, () => radioShadowMask(t))).toBe(radioShadowMask(t, undefined, r));
    expect(getRelay()).toBeNull();
  });

  it('the plan numbers use the relay shadow: time without contact with and without the relay', () => {
    const r = aRelayPlace();
    let better = 0;
    for (const c of CANDIDATES) {
      const route = planRoute(t, c);
      const noRelay = withRelay(null, () => planNumbers(t, route)).radioShadowS;
      const withR = withRelay(r, () => planNumbers(t, route)).radioShadowS;
      expect(withR, c.id).toBeLessThanOrEqual(noRelay);
      if (withR < noRelay) better++;
    }
    expect(better).toBeGreaterThan(0);
  });
});

describe('contact weight in the route', () => {
  const rounds = () => [...CANDIDATES.map((c) => [c]), [CANDIDATES[0], CANDIDATES[1], CANDIDATES[2]], [CANDIDATES[2], CANDIDATES[6] || CANDIDATES[3]]];
  const shadowM = (cells, mask) => { let m = 0; for (let k = 1; k < cells.length; k++) if (mask[cells[k]]) m += stepCost(t, cells[k - 1], cells[k]).m; return m; };
  const metres = (cells) => { let m = 0; for (let k = 1; k < cells.length; k++) m += stepCost(t, cells[k - 1], cells[k]).m; return m; };

  for (const label of ['without relay', 'with relay']) {
    it(`rules first: a round that keeps every rule without the weight keeps every rule with it (${label})`, () => {
      if (label === 'with relay') setRelay(aRelayPlace());
      const w = PLANNER.contactWeight.value;
      expect(w).toBeGreaterThan(0);
      for (const ids of rounds()) {
        const weighted = planRound(t, ids);
        // the same round with the weight set to zero in the search
        const plain = { legs: [] };
        const places = [ROVER, ...ids, ROVER];
        for (let k = 0; k + 1 < places.length; k++) plain.legs.push(findRoute(t, places[k], places[k + 1], { weighted: false }));
        const pw = planNumbers(t, weighted);
        const pu = planNumbers(t, { ...weighted, legs: plain.legs, out: plain.legs[0], back: { ...weighted.back, cells: Int32Array.from(plain.legs.slice(1).flatMap((l, i) => Array.from(i ? l.cells.slice(1) : l.cells))), points: [], keepsRules: true, closedM: 0 } });
        const brokenU = new Set(pu.brokenRules.map((b) => b.id));
        for (const b of pw.brokenRules) expect(brokenU.has(b.id), `${ids.map((c) => c.id)} breaks ${b.id}`).toBe(true);
        // closed ground: never opened by the weight
        for (const leg of weighted.legs) {
          const closed = Array.from(leg.cells).filter((i) => isClosed(t, i)).length;
          const u = findRoute(t, t.pointOf(leg.cells[0]), t.pointOf(leg.cells[leg.cells.length - 1]), { weighted: false });
          if (u.keepsRules) expect(closed).toBe(0);
        }
      }
    });
  }

  it('the detour is bounded by the weight and never adds time in shadow; shown distance is the real one', () => {
    setRelay(aRelayPlace());
    const mask = radioShadowMask(t);
    for (const c of CANDIDATES) {
      const a = findRoute(t, ROVER, c, { weighted: true }), b = findRoute(t, ROVER, c, { weighted: false });
      if (!b.keepsRules) continue;
      expect(a.keepsRules).toBe(true);
      expect(metres(a.cells)).toBeLessThanOrEqual(metres(b.cells) * (1 + PLANNER.contactWeight.value) + 1e-6);
      expect(shadowM(a.cells, mask)).toBeLessThanOrEqual(shadowM(b.cells, mask) + 1e-6);
    }
    // the plan numbers use real metres, not weighted cost
    const route = planRoute(t, CANDIDATES[0]);
    const P = planNumbers(t, route);
    const real = [...route.legs].reduce((s, l) => s + metres(l.cells), 0);
    expect(P.distanceM).toBeCloseTo(real, 6);
  });

  it('the cost field (way home, route from here) follows the same weighted calculation', () => {
    setRelay(aRelayPlace());
    const c = CANDIDATES[0];
    const f = costField(t, ROVER);
    const route = findRoute(t, c, ROVER);
    // field way from the spot's cell = the weighted route's real metres and seconds
    const i = t.indexOf(c.x, c.z);
    expect(f.metres[i]).toBeCloseTo(metres(route.cells), 3);
    expect(RULES.slopeMaxDeg.value).toBe(20);
  });
});
