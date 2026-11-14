// Radio shadow (specs/rules.md): no line of sight to the rover at eye height. A caution, not a rule.
// Geometric only: a straight line from the rover antenna to the astronaut's eye, tested against the
// ground every half cell. No radio physics. Mars curvature is ignored (drop over 180 m is 5 mm).

import { RADIO, HOME } from './values.js';

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

const _cache = new WeakMap();

/**
 * Radio shadow mask over the whole grid, seen from the rover (cached per terrain).
 * @returns {Uint8Array} 1 = in radio shadow (no line of sight to the rover)
 */
export function radioShadowMask(terrain, rover = HOME.rover.value) {
  const k = rover.x + ',' + rover.z;
  let byRover = _cache.get(terrain);
  if (byRover && byRover[k]) return byRover[k];
  const m = new Uint8Array(terrain.size);
  const a = { x: rover.x, z: rover.z, h: RADIO.roverAntennaM.value };
  const eye = RADIO.eyeHeightM.value;
  for (let i = 0; i < m.length; i++) {
    const p = terrain.centerOf(terrain.colOf(i), terrain.rowOf(i));
    m[i] = lineOfSight(terrain, a, { x: p.x, z: p.z, h: eye }) ? 0 : 1;
  }
  if (!byRover) { byRover = {}; _cache.set(terrain, byRover); }
  byRover[k] = m;
  return m;
}

/** true if the astronaut at x, z has radio contact with the rover. */
export function hasRadio(terrain, x, z, rover = HOME.rover.value) {
  return lineOfSight(terrain, { x: rover.x, z: rover.z, h: RADIO.roverAntennaM.value }, { x, z, h: RADIO.eyeHeightM.value });
}
