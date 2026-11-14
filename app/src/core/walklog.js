// Walk log: what the Walk writes into state.walk and the Debrief reads. Shape in app/README.md.

import { fullLevels, consume, workRate, doseMSv, spotSeconds, walkSeconds } from './suit.js';
import { WORK } from './values.js';
import { stepCost } from './planner.js';
import { radioShadowMask } from './radio.js';
import { reserveFrom } from './plan.js';
import { ROVER } from './places.js';

/** A fresh, not yet started walk log. */
export function newWalkLog() {
  return {
    started: false, ended: false, outcome: null, // 'home' | 'home-broken' | 'not-returned'
    tS: 0, distanceM: 0, radioShadowS: 0, doseMSv: 0,
    levels: fullLevels(), phase: 'out',
    track: [],              // [{ x, z, tS, reserveS, radio }]
    sample: null,           // { spotId, x, z, tS }
    warnings: [],           // [{ id, level: 'warning'|'caution'|'advisory', text, x, z, tS }]
    brokenRules: [],        // [{ id, name, x, z, tS }]
    minReserve: null,       // { seconds, limiting, name, x, z, tS }
    reserveAtHomeS: null,
    suitEmpty: null,        // { x, z, tS, roverDistanceM }
  };
}

/**
 * Advance the log by one move of the astronaut (suit seconds dtS, from a to b, work rate workW).
 * Updates time, distance, levels, dose, radio shadow time, track and the lowest reserve.
 * @returns the reserve object from reserveFrom()
 */
export function logMove(log, terrain, { from, to, dtS, workW, radio, spot }) {
  log.tS += dtS;
  log.distanceM += Math.hypot(to.x - from.x, to.z - from.z, (to.y ?? 0) - (from.y ?? 0));
  log.levels = consume(log.levels, workW, dtS);
  log.doseMSv = doseMSv(log.tS);
  if (!radio) log.radioShadowS += dtS;
  const r = reserveFrom(terrain, log.levels, { x: to.x, z: to.z, phase: log.phase, spot });
  if (!log.minReserve || r.seconds < log.minReserve.seconds) {
    log.minReserve = { seconds: r.seconds, limiting: r.limiting, name: r.name, x: to.x, z: to.z, tS: log.tS };
  }
  const last = log.track[log.track.length - 1];
  if (!last || Math.hypot(to.x - last.x, to.z - last.z) >= 1) {
    log.track.push({ x: to.x, z: to.z, tS: log.tS, reserveS: r.seconds, radio: !!radio });
  }
  return r;
}

/**
 * Log a stretch walked at planning pace along the scene points pts ([{ x, z }], heights from the grid):
 * used by the Walk for the few metres beside the rover that the visitor does not walk by hand
 * (rover to start point, last metres to the rover), so the log covers rover to rover like the plan.
 */
export function logPath(log, terrain, pts, { shadow, spot } = {}) {
  let r = null;
  for (let k = 1; k < pts.length; k++) {
    const a = { x: pts[k - 1].x, y: terrain.heightAt(pts[k - 1].x, pts[k - 1].z), z: pts[k - 1].z };
    const b = { x: pts[k].x, y: terrain.heightAt(pts[k].x, pts[k].z), z: pts[k].z };
    const flat = Math.hypot(b.x - a.x, b.z - a.z);
    if (flat < 1e-6) continue;
    const m = Math.hypot(flat, b.y - a.y);
    const slopeDeg = (Math.atan2(b.y - a.y, flat) * 180) / Math.PI;
    const radio = shadow ? shadow[terrain.indexOf(b.x, b.z)] === 0 : true;
    r = logMove(log, terrain, { from: a, to: b, dtS: walkSeconds(m), workW: workRate(slopeDeg), radio, spot });
  }
  return r;
}

/** Dev aid and test helper: walk the planned route exactly as planned and return the finished log. */
export function simulateWalk(terrain, route) {
  const log = newWalkLog();
  log.started = true;
  const shadow = radioShadowMask(terrain);
  const legs = [route.out.cells, route.back.cells];
  legs.forEach((cells, li) => {
    for (let k = 1; k < cells.length; k++) {
      const st = stepCost(terrain, cells[k - 1], cells[k]);
      const a = terrain.pointOf(cells[k - 1]), b = terrain.pointOf(cells[k]);
      logMove(log, terrain, { from: a, to: b, dtS: st.seconds, workW: workRate(st.slopeDeg), radio: shadow[cells[k]] === 0, spot: route.spot });
    }
    if (li === 0) {
      const s = spotSeconds();
      log.tS += s;
      log.levels = consume(log.levels, WORK.spotW.value, s);
      log.doseMSv = doseMSv(log.tS);
      if (shadow[cells[cells.length - 1]] === 1) log.radioShadowS += s; // work at a spot in shadow, as in the Walk
      log.sample = { spotId: route.spotId, x: route.spot.x, z: route.spot.z, tS: log.tS };
      log.phase = 'back';
    }
  });
  const r = reserveFrom(terrain, log.levels, { x: ROVER.x, z: ROVER.z, phase: 'back' });
  log.reserveAtHomeS = r.seconds;
  log.ended = true;
  log.outcome = route.keepsRules ? 'home' : 'home-broken';
  return log;
}
