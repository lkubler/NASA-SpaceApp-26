// Radio shadow (specs/rules.md): no line of sight to the rover at eye height. A caution, not a rule.
// Relay (specs/x-relay.md): a place has contact if it sees the rover, or sees the relay while the relay sees
// the rover. The relay is one shared state here; Plan, Go, Walk and Debrief all read the same shadow.
// Geometric only: a straight line from the rover antenna to the astronaut's eye, tested against the
// ground every half cell. No radio physics. Mars curvature is ignored (drop over 180 m is 5 mm).

import { RADIO, HOME, RULES } from './values.js';

/** true if the line from a to b (each { x, z, h: height above ground }) clears the ground. */
export function lineOfSight(terrain, a, b) {
  const ya = terrain.heightAt(a.x, a.z) + a.h;
  const yb = terrain.heightAt(b.x, b.z) + b.h;
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const steps = Math.ceil(d / (terrain.cell / 2));
  for (let k = 1; k < steps; k++) {
    const t = k / steps;
    const x = a.x + (b.x - a.x) * t, z = a.z + (b.z - a.z) * t;
    if (terrain.heightAt(x, z) > ya + (yb - ya) * t) return false;
  }
  return true;
}


// ---------- the relay (shared state) ----------
let _relay = null; // { x, z } or null
const _listeners = new Set();
/** The relay the visitor placed ({ x, z }) or null. */
export function getRelay() { return _relay; }
/** Place, move (p = { x, z }) or remove (null) the relay. Listeners are told. */
export function setRelay(p) {
  _relay = p ? { x: p.x, z: p.z } : null;
  for (const f of _listeners) f(_relay);
}
export function onRelayChange(f) { _listeners.add(f); return () => _listeners.delete(f); }
/** Key of a relay for caches ('' without one). */
export function relayKey(relay = _relay) { return relay ? `${relay.x.toFixed(2)},${relay.z.toFixed(2)}` : ''; }
/** Run fn with another relay (or none) in force, e.g. to plan the same round without the relay for Compare. */
export function withRelay(relay, fn) {
  const was = _relay; _relay = relay ? { x: relay.x, z: relay.z } : null;
  try { return fn(); } finally { _relay = was; }
}

const roverPos = () => HOME.rover.value;
const roverAnt = (rover) => ({ x: rover.x, z: rover.z, h: RADIO.roverAntennaM.value });
const relayAnt = (relay) => ({ x: relay.x, z: relay.z, h: RADIO.relayMastM.value });

/** true if the relay at x, z sees the rover antenna. */
export function relaySeesRover(terrain, relay = _relay, rover = roverPos()) {
  return !!relay && lineOfSight(terrain, roverAnt(rover), relayAnt(relay));
}

/** A relay place is allowed only where the relay sees the rover and the ground is open (not over the slope rule). */
export function relayAllowed(terrain, x, z, rover = roverPos()) {
  if (terrain.slope[terrain.indexOf(x, z)] > RULES.slopeMaxDeg.value) return false;
  return relaySeesRover(terrain, { x, z }, rover);
}

const _cache = new WeakMap();

/**
 * Radio shadow mask over the whole grid (cached per terrain, rover and relay). The relay in force is used
 * unless one is given (null = without a relay).
 * @returns {Uint8Array} 1 = in radio shadow (no contact with the rover, direct or through the relay)
 */
export function radioShadowMask(terrain, rover = roverPos(), relay = _relay) {
  const k = rover.x + ',' + rover.z + '|' + relayKey(relay);
  let byKey = _cache.get(terrain);
  if (byKey && byKey[k]) return byKey[k];
  const m = new Uint8Array(terrain.size);
  const a = roverAnt(rover);
  const eye = RADIO.eyeHeightM.value;
  const via = relay && relaySeesRover(terrain, relay, rover) ? relayAnt(relay) : null;
  for (let i = 0; i < m.length; i++) {
    const p = terrain.centerOf(terrain.colOf(i), terrain.rowOf(i));
    const e = { x: p.x, z: p.z, h: eye };
    m[i] = lineOfSight(terrain, a, e) || (via && lineOfSight(terrain, via, e)) ? 0 : 1;
  }
  if (!byKey) { byKey = {}; _cache.set(terrain, byKey); }
  byKey[k] = m;
  return m;
}

/** true if the astronaut at x, z has contact with the rover (direct, or through the relay if one is placed). */
export function hasRadio(terrain, x, z, rover = roverPos(), relay = _relay) {
  const e = { x, z, h: RADIO.eyeHeightM.value };
  if (lineOfSight(terrain, roverAnt(rover), e)) return true;
  return !!relay && relaySeesRover(terrain, relay, rover) && lineOfSight(terrain, relayAnt(relay), e);
}
