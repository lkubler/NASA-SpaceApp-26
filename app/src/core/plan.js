// Routes and plan numbers. ONE function (planNumbers) gives the numbers that Plan, Go / no-go and
// Debrief all show. reserveFrom() gives the reserve on return from any point for the Walk.
// A route has one to PLANNER.maxStops stops (specs/feedback-1.md "Several stops"): rover -> stop 1 -> ...
// -> rover, each leg planned by the same findRoute rules; with one stop everything is as before.

import { RULES, WORK, PLANNER } from './values.js';
import { findRoute, costField, stepCost } from './planner.js';
import { radioShadowMask } from './radio.js';
import { ROVER, CANDIDATES } from './places.js';
import { fullLevels, consume, reserveOnReturn, timeLeft, spotSeconds, doseMSv, consumableName } from './suit.js';

// ---------- cost fields (cached) ----------
const _fields = new WeakMap();
/** Cost field to the rover (the way home from any cell). Cached per terrain. */
export function roverField(terrain) { return fieldTo(terrain, 'rover', ROVER); }
/** Cost field to a spot ({ id, x, z }). Cached per terrain and spot id. */
export function spotField(terrain, spot) { return fieldTo(terrain, spot.id || spot.x + ',' + spot.z, spot); }
function fieldTo(terrain, key, p) {
  let m = _fields.get(terrain);
  if (!m) { m = new Map(); _fields.set(terrain, m); }
  if (!m.has(key)) m.set(key, costField(terrain, p));
  return m.get(key);
}

// ---------- routes ----------
/** The most stops one round may have (PLANNER.maxStops). */
export const MAX_STOPS = PLANNER.maxStops.value;

// One leg between two places, cached per terrain when both have an id. findRoute is deterministic, so a
// cached leg is the same leg: a round reuses the legs the candidates already planned.
const _legs = new WeakMap();
function legRoute(terrain, a, b) {
  const key = a.id && b.id ? `${a.id}>${b.id}` : null;
  if (!key) return findRoute(terrain, a, b);
  let m = _legs.get(terrain);
  if (!m) { m = new Map(); _legs.set(terrain, m); }
  if (!m.has(key)) m.set(key, findRoute(terrain, a, b));
  return m.get(key);
}

/** Paths joined end to start (each leg starts in the cell where the one before ends; that cell is kept once). */
function joinPaths(paths) {
  if (paths.length === 1) return paths[0];
  const cells = [], points = [];
  paths.forEach((p, k) => {
    for (let i = k === 0 ? 0 : 1; i < p.cells.length; i++) { cells.push(p.cells[i]); points.push(p.points[i]); }
  });
  return { cells: Int32Array.from(cells), points, keepsRules: paths.every((p) => p.keepsRules), closedM: paths.reduce((a, p) => a + p.closedM, 0) };
}

const placeOf = (p) => ({ id: p.id || null, name: p.name || '', x: p.x, z: p.z });

/**
 * A round rover -> stop 1 -> ... -> stop N -> rover (N = 1..MAX_STOPS). Each leg is the fastest route that
 * keeps every rule, or the best one if none does: the same findRoute as for a single spot.
 * @param {{id,name,x,z}[]} stops  in visiting order
 * @returns {Route} see app/README.md
 */
export function planRound(terrain, stops) {
  if (!stops.length || stops.length > MAX_STOPS) throw new Error(`a round has 1 to ${MAX_STOPS} stops`);
  const places = [ROVER, ...stops, ROVER];
  const legs = [];
  for (let k = 0; k + 1 < places.length; k++) legs.push(legRoute(terrain, places[k], places[k + 1]));
  const first = stops[0];
  // stops and legs are the round: the Walk targets each stop in turn along legs[k] and the Debrief compares
  // the whole round. spot / out / back are convenience fields kept for a one-stop route and older readers
  // (Go / no-go's spot name, the Plan map bounds, plan numbers' spotId, tests): spot = the first stop,
  // out = legs[0], back = the remaining legs joined. With one stop, out = legs[0] and back = legs[1] as before.
  return {
    spotId: first.id || null,
    spot: placeOf(first),
    out: legs[0],
    back: joinPaths(legs.slice(1)),
    keepsRules: legs.every((l) => l.keepsRules),
    stops: stops.map(placeOf),
    legs,
  };
}

/** Round trip rover -> spot -> rover: a round with one stop. */
export function planRoute(terrain, spot) { return planRound(terrain, [spot]); }

/** The stops of a route in visiting order ([] without a route; a route without `stops`: its one spot). */
export function stopsOf(route) { return route ? (route.stops || [route.spot]) : []; }

/** Routes and plan numbers for every candidate: [{ candidate, route, plan }]. */
export function planAllCandidates(terrain, candidates = CANDIDATES) {
  return candidates.map((c) => {
    const route = planRoute(terrain, c);
    return { candidate: c, route, plan: planNumbers(terrain, route) };
  });
}

/** Ordinal of a stop for the screen: 1 -> '1st', 2 -> '2nd', 3 -> '3rd'. */
export function stopOrdinal(n) { return `${n}${n === 1 ? 'st' : n === 2 ? 'nd' : n === 3 ? 'rd' : 'th'}`; }

// ---------- plan numbers ----------
/**
 * Plan numbers for a route with one or several stops. The single source for Plan, Go / no-go and Debrief.
 * All over the whole round: the fixed work at every stop, the rule checks, the reserve on return (the way
 * home is the last leg), radio shadow, steepest slope, farthest distance from the rover.
 * With one stop every number is the same as before several stops (test/stops.test.js).
 * @returns {PlanNumbers} see app/README.md
 */
export function planNumbers(terrain, route) {
  const shadow = radioShadowMask(terrain);
  const legPaths = route.legs || [route.out, route.back];
  const stops = stopsOf(route);
  const last = legPaths.length - 1; // index of the way home; also the number of stops
  const profile = [];
  let sM = 0, tS = 0, climbM = 0, descentM = 0, steepest = { deg: 0, sM: 0, x: 0, z: 0 };
  let maxDist = { m: 0, sM: 0, x: 0, z: 0 };
  let levels = fullLevels();
  const legSums = legPaths.map(() => ({ m: 0, s: 0, e: 0 }));
  let shadowS = 0;
  const stretches = [];
  let open = null;
  let closedM = 0, firstClosed = null;

  const visit = (i, legName, st) => {
    const p = terrain.pointOf(i);
    const inShadow = shadow[i] === 1;
    const slope = terrain.slope[i];
    if (slope > steepest.deg) steepest = { deg: slope, sM, x: p.x, z: p.z };
    const d = Math.hypot(p.x - ROVER.x, p.z - ROVER.z);
    if (d > maxDist.m) maxDist = { m: d, sM, x: p.x, z: p.z };
    if (st && st.closed && !firstClosed) firstClosed = { sM, x: p.x, z: p.z };
    profile.push({ sM, tS, x: p.x, y: p.y, z: p.z, leg: legName, shadow: inShadow, closed: slope > RULES.slopeMaxDeg.value, slopeDeg: slope });
  };
  // Radio shadow time, counted as the Walk counts it (walklog.js logMove): a step counts when it ends in
  // a shadow cell, the work at a stop counts when the stop is in shadow. Stretches are runs of such
  // steps, so the total is the sum of the stretches and no stretch is longer than the total.
  const shadowTime = (inShadow, seconds, fromCell) => {
    if (inShadow) {
      if (!open) { const p = terrain.pointOf(fromCell); open = { startM: sM, startS: tS, x: p.x, z: p.z, seconds: 0 }; }
      open.seconds += seconds;
      shadowS += seconds;
    } else if (open) closeShadow();
  };
  const closeShadow = () => { stretches.push({ ...open, endM: sM, endS: tS }); open = null; };

  const walk = (cells, legName, sum, isFirst) => {
    if (isFirst) visit(cells[0], legName, null);
    for (let k = 1; k < cells.length; k++) {
      const st = stepCost(terrain, cells[k - 1], cells[k]);
      const w = st.energyJ / st.seconds;
      // the way home is drawn at the walk-back rate only for the reserve, not for the plan's own levels
      levels = consume(levels, w, st.seconds);
      shadowTime(shadow[cells[k]] === 1, st.seconds, cells[k - 1]);
      sM += st.m; tS += st.seconds;
      sum.m += st.m; sum.s += st.seconds; sum.e += st.energyJ;
      if (st.slopeDeg > 0) climbM += Math.sin((st.slopeDeg * Math.PI) / 180) * st.m; else descentM -= Math.sin((st.slopeDeg * Math.PI) / 180) * st.m;
      if (st.closed) closedM += st.m;
      visit(cells[k], legName, st);
    }
  };

  const spotS = spotSeconds();
  const spotE = WORK.spotW.value * spotS;
  const stopAt = [];   // per stop: its arrival point on the profile
  const legPlans = [];
  let preE = 0, preS = 0; // energy and suit time up to the end of the work at the last stop
  legPaths.forEach((path, k) => {
    const legName = k === last ? 'back' : 'out';
    const startIndex = k === 0 ? 0 : profile.length - 1;
    const startM = sM, startS = tS;
    walk(path.cells, legName, legSums[k], k === 0);
    const endIndex = profile.length - 1;
    const from = k === 0 ? ROVER : stops[k - 1], to = k === last ? ROVER : stops[k];
    legPlans.push({
      index: k, from: { id: from.id || null, name: from.name || '' }, to: { id: to.id || null, name: to.name || '' },
      distanceM: legSums[k].m, seconds: legSums[k].s, energyJ: legSums[k].e,
      startM, endM: sM, startS, endS: tS, startIndex, endIndex,
      keepsRules: path.keepsRules, closedM: path.closedM,
    });
    if (k === last) return;
    preE += legSums[k].e; preS += legSums[k].s;
    // the work at stop k + 1
    const p = profile[endIndex];
    stopAt.push({ index: endIndex, sM: p.sM, tS: p.tS, x: p.x, z: p.z });
    levels = consume(levels, WORK.spotW.value, spotS);
    const stopCell = path.cells[path.cells.length - 1];
    shadowTime(shadow[stopCell] === 1, spotS, stopCell);
    tS += spotS;
    preE += spotE; preS += spotS;
    profile.push({ ...profile[endIndex], tS, leg: 'spot' });
  });
  if (open) closeShadow();

  const totalS = tS;
  const home = legSums[last];
  const reserve = reserveOnReturn(fullLevels(), {
    energyJ: preE, seconds: preS,
    homeEnergyJ: home.e, homeSeconds: home.s,
  });

  // Turn-back point: first point on the way to the last stop where turning back leaves zero reserve.
  // One stop: straight back on the same path (as before). Several: the work at earlier stops counted, and
  // home from there by the fastest way (the rover's cost field), not back through the earlier stops.
  const toLast = joinPaths(legPaths.slice(0, last));
  const workAt = new Set();
  for (let k = 0, n = 0; k < last - 1; k++) { n += legPaths[k].cells.length - (k ? 1 : 0); workAt.add(n - 1); }
  const turnBack = turnBackOnOut(terrain, toLast.cells, workAt, spotE, spotS, last > 1 ? roverField(terrain) : null);

  const longest = stretches.reduce((a, b) => (b.seconds > (a ? a.seconds : -1) ? b : a), null);
  const spotIndex = stopAt[0].index;
  const spotP = profile[spotIndex];
  const end = profile[profile.length - 1];

  const checks = [
    {
      id: 'slope', name: 'Slope on foot', unit: '°', planned: steepest.deg, limit: RULES.slopeMaxDeg.value,
      status: closedM > 0 ? 'broken' : 'ok',
      where: closedM > 0 ? firstClosed : { sM: steepest.sM, x: steepest.x, z: steepest.z },
      text: closedM > 0 ? `Crosses ${closedM.toFixed(1)} m of ground steeper than ${RULES.slopeMaxDeg.value}°` : '',
    },
    {
      id: 'distance', name: 'Distance from the rover', unit: 'm', planned: maxDist.m,
      plan: RULES.distancePlanM.value, limit: RULES.distanceLimitM.value,
      status: maxDist.m > RULES.distanceLimitM.value ? 'broken' : maxDist.m > RULES.distancePlanM.value ? 'caution' : 'ok',
      where: { sM: maxDist.sM, x: maxDist.x, z: maxDist.z },
    },
    {
      id: 'wayHome', name: 'Way home', unit: 's', planned: reserve.seconds, limit: 0,
      status: reserve.seconds < 0 ? 'broken' : 'ok',
      where: turnBack ? { sM: turnBack.sM, x: turnBack.x, z: turnBack.z } : { sM: end.sM, x: end.x, z: end.z },
      text: `Reserve on return, limited by ${reserve.name.toLowerCase()}`,
    },
    {
      id: 'excursion', name: 'Excursion length', unit: 's', planned: totalS,
      plan: RULES.evaPlannedH.value * 3600, limit: RULES.evaLimitH.value * 3600,
      status: totalS > RULES.evaLimitH.value * 3600 ? 'broken' : totalS > RULES.evaPlannedH.value * 3600 ? 'caution' : 'ok',
      where: { sM: end.sM, x: end.x, z: end.z },
    },
    {
      id: 'radio', name: 'Radio shadow', unit: 's', planned: longest ? longest.seconds : 0, limit: null,
      status: longest ? 'caution' : 'ok', caution: true,
      where: longest ? { sM: longest.startM, x: longest.x, z: longest.z } : null,
      text: longest ? 'Longest stretch without line of sight to the rover' : '',
    },
  ];

  // the legs list of the panel: rover, on foot, stop, on foot, ..., stop, on foot, rover
  const legs = [{ kind: 'rover', name: 'Rover' }];
  legPlans.forEach((lp, k) => {
    legs.push({ kind: 'foot', name: 'On foot', distanceM: lp.distanceM, seconds: lp.seconds });
    if (k === last) return;
    const stopLeg = { kind: 'spot', name: stops[k].name || 'Spot', distanceM: 0, seconds: spotS };
    if (last > 1) Object.assign(stopLeg, { id: stops[k].id || null, order: k + 1 });
    legs.push(stopLeg);
  });
  legs.push({ kind: 'rover', name: 'Rover' });

  let walkS = 0, outM = 0, backM = 0;
  legSums.forEach((l, k) => { walkS += l.s; if (k === 0) outM += l.m; else backM += l.m; });

  return {
    spotId: route.spotId,
    distanceM: sM, outM, backM,
    timeS: totalS, walkS, spotS,
    legs,
    climbM, descentM,
    steepestDeg: steepest.deg, steepestAt: { sM: steepest.sM, x: steepest.x, z: steepest.z },
    radioShadowS: shadowS, radioStretches: stretches, longestShadowS: longest ? longest.seconds : 0,
    reserveS: reserve.seconds, limiting: reserve.limiting, limitingName: reserve.name,
    levelsAtHome: reserve.levelsAtHome,
    energyJ: preE + home.e,
    radiationMSv: doseMSv(totalS),
    maxDistanceM: maxDist.m,
    secondaryO2H: RULES.secondaryO2H.value,
    turnBack,
    spotAt: { sM: spotP.sM, x: spotP.x, z: spotP.z, index: spotIndex },
    profile,
    checks,
    brokenRules: checks.filter((c) => c.status === 'broken').map((c) => ({ id: c.id, name: c.name, where: c.where, text: c.text || '' })),
    keepsRules: checks.every((c) => c.status !== 'broken'),
    // several stops (also filled for one): who and where each stop is, each leg's own numbers
    stops: stops.map((st, k) => ({ id: st.id || null, name: st.name || '', order: k + 1, ...stopAt[k] })),
    legPlans,
    stopsS: spotS * stops.length,
  };
}

/**
 * First point on the way (cells) where turning straight back on the same path leaves zero reserve.
 * workAt: indices of cells where the work at a stop is done on the way (a round's earlier stops).
 * homeField: if given, the way home from each cell is the fastest one (cost field), not the path reversed.
 */
function turnBackOnOut(terrain, cells, workAt = new Set(), workE = 0, workS = 0, homeField = null) {
  // cumulative cost from the start to each cell, and of the reverse walk home from each cell
  const n = cells.length;
  const outE = new Float64Array(n), outS = new Float64Array(n), outM = new Float64Array(n);
  const homeE = new Float64Array(n), homeS = new Float64Array(n);
  for (let k = 1; k < n; k++) {
    const st = stepCost(terrain, cells[k - 1], cells[k]);
    outE[k] = outE[k - 1] + st.energyJ; outS[k] = outS[k - 1] + st.seconds; outM[k] = outM[k - 1] + st.m;
    if (workAt.has(k - 1)) { outE[k] += workE; outS[k] += workS; }
    const back = stepCost(terrain, cells[k], cells[k - 1]);
    homeE[k] = homeE[k - 1] + back.energyJ; homeS[k] = homeS[k - 1] + back.seconds;
  }
  if (homeField) {
    for (let k = 0; k < n; k++) { homeE[k] = homeField.energyJ[cells[k]]; homeS[k] = homeField.seconds[cells[k]]; }
  }
  for (let k = 0; k < n; k++) {
    const r = reserveOnReturn(fullLevels(), { energyJ: outE[k], seconds: outS[k], homeEnergyJ: homeE[k], homeSeconds: homeS[k] });
    if (r.seconds <= 0) {
      const p = terrain.pointOf(cells[k]);
      return { index: k, sM: outM[k], x: p.x, z: p.z };
    }
  }
  return null;
}

// ---------- the Walk ----------
/**
 * Reserve on return from any point, if the crew continues as planned.
 * phase 'out': on to the remaining stops in order, the work at each, then home from the last one.
 * phase 'back': home from here. The remaining stops are `stops` ([{id,x,z}], the next one first), or
 * `spot` alone (one stop, as before). Uses cost fields, cheap enough to call every frame.
 * @param {object} levels  current consumable levels
 * @param {{ x:number, z:number, phase:'out'|'back', spot?:{id,x,z}, stops?:{id,x,z}[] }} where
 * @returns {{ seconds, limiting, name, levelsAtHome, homeSeconds, homeMetres, closedM, timeLeft }}
 *   homeSeconds / homeMetres / closedM: the whole way ahead (stops, their work, the way home)
 */
export function reserveFrom(terrain, levels, { x, z, phase, spot, stops }) {
  const home = roverField(terrain);
  const ahead = stops && stops.length ? stops : spot ? [spot] : [];
  if (phase === 'out' && ahead.length) {
    const s = spotSeconds();
    // walk to the next stop, then from stop to stop, the work at each
    const first = spotField(terrain, ahead[0]).at(x, z);
    let energyJ = first.energyJ, seconds = first.seconds, metres = first.metres, closedM = first.closedM;
    for (let k = 1; k < ahead.length; k++) {
      const leg = spotField(terrain, ahead[k]).at(ahead[k - 1].x, ahead[k - 1].z);
      energyJ = energyJ + WORK.spotW.value * s + leg.energyJ; seconds = seconds + s + leg.seconds;
      metres += leg.metres; closedM += leg.closedM;
    }
    const lastStop = ahead[ahead.length - 1];
    const lastHome = home.at(lastStop.x, lastStop.z);
    const r = reserveOnReturn(levels, {
      energyJ: energyJ + WORK.spotW.value * s, seconds: seconds + s,
      homeEnergyJ: lastHome.energyJ, homeSeconds: lastHome.seconds,
    });
    return { ...r, homeSeconds: seconds + s + lastHome.seconds, homeMetres: metres + lastHome.metres, closedM: closedM + lastHome.closedM, timeLeft: timeLeft(levels) };
  }
  const h = home.at(x, z);
  const r = reserveOnReturn(levels, { homeEnergyJ: h.energyJ, homeSeconds: h.seconds });
  return { ...r, homeSeconds: h.seconds, homeMetres: h.metres, closedM: h.closedM, timeLeft: timeLeft(levels) };
}

export { consumableName };
