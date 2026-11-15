// Dev test states for the Debrief (dev aid only): walk logs built with the core WalkLog functions
// (newWalkLog / logMove), one per outcome. Reached with ?step=5&outcome=home|broken|lost|turned|none, also
// for a round (&stops=F1,F2,F3): every leg walked, one sample per stop.
//   home    the planned round, a sample at every stop
//   broken  the planned legs to the last stop, then the straight shortcut home over steep ground
//   lost    the first leg, a sample, then straying near that stop until the suit is empty
//   turned  "Turn back now" before the last stop: the stops before it sampled, the last one skipped, home by
//           the fastest way (one stop: turned back halfway out, no sample)
//   none    halfway out on the first leg and back to the rover, no sample (home, the request not done)
// No number of its own: every rate, limit and duration comes from the core.

import {
  newWalkLog, logMove, stepCost, workRate, consume, doseMSv, spotSeconds, timeLeft, reserveFrom,
  radioShadowMask, RULES, WORK, ROVER, simulateWalk, initStops, markSampled, roverField, passVia,
} from '../../core/index.js';

export const OUTCOMES = ['home', 'broken', 'lost', 'turned', 'none'];

/** Walk log for one outcome on the planned route. Returns null for an unknown outcome. */
export function fixtureWalk(terrain, route, outcome) {
  if (!route) return null;
  if (outcome === 'home') return walkHome(terrain, route);
  if (outcome === 'broken') return walkBroken(terrain, route);
  if (outcome === 'lost') return walkLost(terrain, route);
  if (outcome === 'turned') return walkTurned(terrain, route);
  if (outcome === 'none') return walkNone(terrain, route);
  return null;
}

const legsOf = (route) => route.legs || [route.out, route.back];

function walker(terrain, route) {
  const log = newWalkLog();
  log.started = true;
  initStops(log, route);
  let stopK = 0; // the next stop in plan order (the fixtures sample in order)
  const shadow = radioShadowMask(terrain);
  let inShadow = false, turnBackShown = false, steepShown = false, inSteep = false, wayHomeBroken = false;
  const w = {
    log,
    /** One step between neighbouring (or near) cells. Returns false when the suit is empty. */
    move(a, b) {
      if (a === b) return true;
      const st = stepCost(terrain, a, b);
      const pa = terrain.pointOf(a), pb = terrain.pointOf(b);
      const radio = shadow[b] === 0;
      passVia(log, terrain, pb.x, pb.z); // a waypoint of the plan is passed in its cell (specs/x-waypoints.md)
      const r = logMove(log, terrain, { from: pa, to: pb, dtS: st.seconds, workW: workRate(st.slopeDeg), radio });
      if (!radio && !inShadow) log.warnings.push({ id: 'radio-shadow', level: 'advisory', text: 'Radio shadow: no line of sight to the rover', x: pb.x, z: pb.z, tS: log.tS });
      inShadow = !radio;
      // as the Walk logs them: a broken rule once per stretch (so a rule can be broken several times),
      // the warning once
      const steep = terrain.slope[b] > RULES.slopeMaxDeg.value;
      if (steep && !inSteep) {
        log.brokenRules.push({ id: 'slope', name: 'Slope on foot', x: pb.x, z: pb.z, tS: log.tS });
        if (!steepShown) log.warnings.push({ id: 'steep-underfoot', level: 'warning', text: `Ground over ${RULES.slopeMaxDeg.value}° underfoot`, x: pb.x, z: pb.z, tS: log.tS });
        steepShown = true;
      }
      inSteep = steep;
      if (r.seconds <= 0 && !turnBackShown) {
        turnBackShown = true;
        log.warnings.push({ id: 'turn-back', level: 'warning', text: 'Turn back now', x: pb.x, z: pb.z, tS: log.tS });
      }
      if (r.seconds < 0 && !wayHomeBroken) log.brokenRules.push({ id: 'wayHome', name: 'Way home', x: pb.x, z: pb.z, tS: log.tS });
      wayHomeBroken = r.seconds < 0;
      if (timeLeft(log.levels).seconds <= 0) {
        log.suitEmpty = { x: pb.x, z: pb.z, tS: log.tS, roverDistanceM: Math.hypot(pb.x - ROVER.x, pb.z - ROVER.z) };
        return false;
      }
      return true;
    },
    walkCells(cells) {
      for (let k = 1; k < cells.length; k++) if (!w.move(cells[k - 1], cells[k])) return false;
      return true;
    },
    sample() {
      const s = spotSeconds();
      log.tS += s;
      log.levels = consume(log.levels, WORK.spotW.value, s);
      log.doseMSv = doseMSv(log.tS);
      markSampled(log, stopK++);
    },
    /** "Turn back now": the stops not sampled yet are skipped, the way home from here. */
    turnBack(cell) {
      const p = terrain.pointOf(cell);
      const skipped = log.stops.filter((st) => !st.sampled);
      if (log.stops.length > 1) {
        skipped.forEach((st) => { st.skipped = true; });
        log.turnedBack = { x: p.x, z: p.z, tS: log.tS, reserveS: 0, skipped: skipped.map((st) => st.id) };
      }
      if (!turnBackShown) { turnBackShown = true; log.warnings.push({ id: 'turn-back', level: 'warning', text: 'Turn back now', x: p.x, z: p.z, tS: log.tS }); }
      log.phase = 'back';
    },
    endHome() {
      log.reserveAtHomeS = reserveFrom(terrain, log.levels, { x: ROVER.x, z: ROVER.z, phase: 'back' }).seconds;
      log.ended = true;
      log.outcome = log.brokenRules.length ? 'home-broken' : 'home';
      return log;
    },
  };
  return w;
}

/** Cells on the straight line from a to b (scene points), consecutive duplicates removed. */
function lineCells(terrain, a, b) {
  const d = Math.hypot(b.x - a.x, b.z - a.z);
  const n = Math.max(1, Math.ceil(d / (terrain.cell / 2)));
  const out = [];
  for (let k = 0; k <= n; k++) {
    const i = terrain.indexOf(a.x + ((b.x - a.x) * k) / n, a.z + ((b.z - a.z) * k) / n);
    if (out[out.length - 1] !== i) out.push(i);
  }
  return out;
}

/** Walk the planned legs before the last one (rover to the last stop), a sample at each stop. False: suit empty. */
function toLastStop(w, route) {
  const legs = legsOf(route);
  for (let k = 0; k < legs.length - 1; k++) {
    if (!w.walkCells(legs[k].cells)) return false;
    w.sample();
  }
  return true;
}

/** Home with reserve: the planned route, walked as planned. */
function walkHome(terrain, route) {
  const w = walker(terrain, route);
  toLastStop(w, route);
  w.walkCells(legsOf(route).at(-1).cells);
  const log = w.endHome();
  if (log.outcome !== 'home') return simulateWalk(terrain, route); // planned route itself breaks a rule
  return log;
}

/** Home with a broken rule: planned route out, then the straight shortcut home over steep ground. */
function walkBroken(terrain, route) {
  const w = walker(terrain, route);
  toLastStop(w, route);
  const legs = legsOf(route);
  const spotCell = legs.at(-2).cells.at(-1);
  const roverCell = legs.at(-1).cells.at(-1);
  w.walkCells(lineCells(terrain, terrain.pointOf(spotCell), terrain.pointOf(roverCell)));
  return w.endHome();
}

/** Not returned: after the first sample the crew strays back and forth near that stop until the suit is empty. */
function walkLost(terrain, route) {
  const w = walker(terrain, route);
  const first = legsOf(route)[0];
  if (!w.walkCells(first.cells)) return lost(w.log);
  w.sample();
  const out = Array.from(first.cells);
  const half = out.slice(Math.floor(out.length / 2));
  const loop = [...half.slice().reverse(), ...half.slice(1)];
  for (let guard = 0; guard < 1000; guard++) {
    if (!w.walkCells(loop)) return lost(w.log);
  }
  return lost(w.log);
}

/** Turned back before the last stop (one stop: halfway out), home by the fastest way from there. */
function walkTurned(terrain, route) {
  const w = walker(terrain, route);
  const legs = legsOf(route);
  let at;
  if (legs.length > 2) {
    for (let k = 0; k < legs.length - 2; k++) { w.walkCells(legs[k].cells); w.sample(); }
    const toLast = legs.at(-2).cells;
    const part = Array.from(toLast).slice(0, Math.max(2, Math.floor(toLast.length / 3)));
    w.walkCells(part);
    at = part.at(-1);
  } else {
    const part = Array.from(legs[0].cells).slice(0, Math.max(2, Math.floor(legs[0].cells.length / 2)));
    w.walkCells(part);
    at = part.at(-1);
  }
  w.turnBack(at);
  w.walkCells(roverField(terrain).pathFrom(terrain.pointOf(at).x, terrain.pointOf(at).z));
  return w.endHome();
}

/** Halfway out on the first leg and straight back the same way: home, no sample. */
function walkNone(terrain, route) {
  const w = walker(terrain, route);
  const first = Array.from(legsOf(route)[0].cells);
  const part = first.slice(0, Math.max(2, Math.floor(first.length / 2)));
  w.walkCells(part);
  w.walkCells(part.slice().reverse());
  return w.endHome();
}
function lost(log) {
  log.ended = true;
  log.outcome = 'not-returned';
  return log;
}
