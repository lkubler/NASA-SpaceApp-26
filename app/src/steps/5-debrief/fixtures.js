// Dev test states for the Debrief (dev aid only): three walk logs built with the core WalkLog
// functions (newWalkLog / logMove), one per outcome. Reached with ?step=5&outcome=home|broken|lost.
// No number of its own: every rate, limit and duration comes from the core.

import {
  newWalkLog, logMove, stepCost, workRate, consume, doseMSv, spotSeconds, timeLeft, reserveFrom,
  radioShadowMask, RULES, WORK, ROVER, simulateWalk,
} from '../../core/index.js';

export const OUTCOMES = ['home', 'broken', 'lost'];

/** Walk log for one outcome on the planned route. Returns null for an unknown outcome. */
export function fixtureWalk(terrain, route, outcome) {
  if (!route) return null;
  if (outcome === 'home') return walkHome(terrain, route);
  if (outcome === 'broken') return walkBroken(terrain, route);
  if (outcome === 'lost') return walkLost(terrain, route);
  return null;
}

function walker(terrain, route) {
  const log = newWalkLog();
  log.started = true;
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
      const r = logMove(log, terrain, { from: pa, to: pb, dtS: st.seconds, workW: workRate(st.slopeDeg), radio, spot: route.spot });
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
      log.sample = { spotId: route.spotId, x: route.spot.x, z: route.spot.z, tS: log.tS };
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

/** Home with reserve: the planned route, walked as planned. */
function walkHome(terrain, route) {
  const w = walker(terrain, route);
  w.walkCells(route.out.cells);
  w.sample();
  w.walkCells(route.back.cells);
  const log = w.endHome();
  if (log.outcome !== 'home') return simulateWalk(terrain, route); // planned route itself breaks a rule
  return log;
}

/** Home with a broken rule: planned route out, then the straight shortcut home over steep ground. */
function walkBroken(terrain, route) {
  const w = walker(terrain, route);
  w.walkCells(route.out.cells);
  w.sample();
  const spotCell = route.out.cells[route.out.cells.length - 1];
  const roverCell = route.back.cells[route.back.cells.length - 1];
  w.walkCells(lineCells(terrain, terrain.pointOf(spotCell), terrain.pointOf(roverCell)));
  return w.endHome();
}

/** Not returned: after the sample the crew strays back and forth near the spot until the suit is empty. */
function walkLost(terrain, route) {
  const w = walker(terrain, route);
  if (!w.walkCells(route.out.cells)) return lost(w.log);
  w.sample();
  const out = Array.from(route.out.cells);
  const half = out.slice(Math.floor(out.length / 2));
  const loop = [...half.slice().reverse(), ...half.slice(1)];
  for (let guard = 0; guard < 1000; guard++) {
    if (!w.walkCells(loop)) return lost(w.log);
  }
  return lost(w.log);
}
function lost(log) {
  log.ended = true;
  log.outcome = 'not-returned';
  return log;
}
