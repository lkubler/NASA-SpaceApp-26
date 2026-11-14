// Walk log: what the Walk writes into state.walk and the Debrief reads. Shape in app/README.md.

import { fullLevels, consume, workRate, doseMSv, spotSeconds, walkSeconds } from './suit.js';
import { WORK } from './values.js';
import { stepCost } from './planner.js';
import { radioShadowMask } from './radio.js';
import { reserveFrom, stopsOf } from './plan.js';
import { ROVER } from './places.js';

/** A fresh, not yet started walk log. */
export function newWalkLog() {
  return {
    started: false, ended: false, outcome: null, // 'home' | 'home-broken' | 'not-returned'
    tS: 0, distanceM: 0, radioShadowS: 0, doseMSv: 0,
    levels: fullLevels(), phase: 'out',
    track: [],              // [{ x, z, tS, reserveS, radio }]
    sample: null,           // the first sample taken: { spotId, order, x, z, tS, photo... }
    stops: [],              // per planned stop, in plan order: { id, name, order, x, z, sampled, tS, skipped } (initStops)
    turnedBack: null,       // { x, z, tS, reserveS, skipped: [stop ids] } when "Turn back now" skipped the remaining stops
    warnings: [],           // [{ id, level: 'warning'|'caution'|'advisory', text, x, z, tS }]
    brokenRules: [],        // [{ id, name, x, z, tS }]
    minReserve: null,       // { seconds, limiting, name, x, z, tS }
    reserveAtHomeS: null,
    suitEmpty: null,        // { x, z, tS, roverDistanceM }
  };
}

/** Fill log.stops from the route's stops (once; a log that has them keeps them). */
export function initStops(log, route) {
  if (!log.stops || !log.stops.length) {
    log.stops = stopsOf(route).map((st, k) => ({ id: st.id || null, name: st.name || '', order: k + 1, x: st.x, z: st.z, sampled: false, tS: null, skipped: false }));
  }
  return log.stops;
}

/** The stops still ahead (not sampled, not skipped), in plan order, for reserveFrom; [] on the way home. */
export function remainingStops(log) {
  if (log.phase !== 'out' || !log.stops) return [];
  return log.stops.filter((st) => !st.sampled && !st.skipped);
}

/**
 * Mark a stop (its index in log.stops, or its id) sampled at the log's current time (and log.sample for the first one). When no
 * stop is left ahead, the phase turns to 'back' (the way home).
 * @returns the stop entry
 */
export function markSampled(log, which, at) {
  const st = typeof which === 'number' ? log.stops[which] : log.stops.find((x) => x.id === which);
  if (!st || st.sampled) return st || null;
  st.sampled = true; st.skipped = false; st.tS = log.tS;
  if (!log.sample) log.sample = { spotId: st.id, order: st.order, x: at ? at.x : st.x, z: at ? at.z : st.z, tS: log.tS };
  if (!remainingStops(log).length) log.phase = 'back';
  return st;
}

/** Samples taken, in plan order. */
export function samplesOf(log) { return log && log.stops ? log.stops.filter((st) => st.sampled) : log && log.sample ? [log.sample] : []; }

/**
 * Advance the log by one move of the astronaut (suit seconds dtS, from a to b, work rate workW).
 * Updates time, distance, levels, dose, radio shadow time, track and the lowest reserve.
 * @returns the reserve object from reserveFrom()
 */
export function logMove(log, terrain, { from, to, dtS, workW, radio, spot, stops }) {
  log.tS += dtS;
  log.distanceM += Math.hypot(to.x - from.x, to.z - from.z, (to.y ?? 0) - (from.y ?? 0));
  log.levels = consume(log.levels, workW, dtS);
  log.doseMSv = doseMSv(log.tS);
  if (!radio) log.radioShadowS += dtS;
  // the stops still ahead (a round); without log.stops: the one spot given, as before
  const ahead = stops || (log.stops && log.stops.length ? remainingStops(log) : null);
  const r = reserveFrom(terrain, log.levels, { x: to.x, z: to.z, phase: log.phase, spot, stops: ahead || undefined });
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
export function logPath(log, terrain, pts, { shadow, spot, stops } = {}) {
  let r = null;
  for (let k = 1; k < pts.length; k++) {
    const a = { x: pts[k - 1].x, y: terrain.heightAt(pts[k - 1].x, pts[k - 1].z), z: pts[k - 1].z };
    const b = { x: pts[k].x, y: terrain.heightAt(pts[k].x, pts[k].z), z: pts[k].z };
    const flat = Math.hypot(b.x - a.x, b.z - a.z);
    if (flat < 1e-6) continue;
    const m = Math.hypot(flat, b.y - a.y);
    const slopeDeg = (Math.atan2(b.y - a.y, flat) * 180) / Math.PI;
    const radio = shadow ? shadow[terrain.indexOf(b.x, b.z)] === 0 : true;
    r = logMove(log, terrain, { from: a, to: b, dtS: walkSeconds(m), workW: workRate(slopeDeg), radio, spot, stops });
  }
  return r;
}

/** Dev aid and test helper: walk the planned route (every leg) exactly as planned, one sample at each stop. */
export function simulateWalk(terrain, route) {
  const log = newWalkLog();
  log.started = true;
  initStops(log, route);
  const shadow = radioShadowMask(terrain);
  const legs = (route.legs || [route.out, route.back]).map((l) => l.cells);
  legs.forEach((cells, li) => {
    for (let k = 1; k < cells.length; k++) {
      const st = stepCost(terrain, cells[k - 1], cells[k]);
      const a = terrain.pointOf(cells[k - 1]), b = terrain.pointOf(cells[k]);
      logMove(log, terrain, { from: a, to: b, dtS: st.seconds, workW: workRate(st.slopeDeg), radio: shadow[cells[k]] === 0 });
    }
    if (li < legs.length - 1) {
      const s = spotSeconds();
      log.tS += s;
      log.levels = consume(log.levels, WORK.spotW.value, s);
      log.doseMSv = doseMSv(log.tS);
      if (shadow[cells[cells.length - 1]] === 1) log.radioShadowS += s; // work at a spot in shadow, as in the Walk
      markSampled(log, li);
    }
  });
  const r = reserveFrom(terrain, log.levels, { x: ROVER.x, z: ROVER.z, phase: 'back' });
  log.reserveAtHomeS = r.seconds;
  log.ended = true;
  log.outcome = route.keepsRules ? 'home' : 'home-broken';
  return log;
}
