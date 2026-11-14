// TEST REFERENCE ONLY (never imported by the app): src/core/plan.js as it was before several stops
// (commit 968b444). test/core.test.js checks that one stop gives exactly the same route and numbers.

import { RULES, WORK } from '../src/core/values.js';
import { findRoute, costField, stepCost } from '../src/core/planner.js';
import { radioShadowMask } from '../src/core/radio.js';
import { ROVER, CANDIDATES } from '../src/core/places.js';
import { fullLevels, consume, reserveOnReturn, timeLeft, spotSeconds, doseMSv, consumableName } from '../src/core/suit.js';

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
/**
 * Round trip rover -> spot -> rover, fastest routes that keep every rule (or the best one if none does).
 * @returns {Route} { spotId, spot: {id,name,x,z}, out: Path, back: Path, keepsRules }
 */
export function planRoute(terrain, spot) {
  const out = findRoute(terrain, ROVER, spot);
  const back = findRoute(terrain, spot, ROVER);
  return {
    spotId: spot.id || null,
    spot: { id: spot.id || null, name: spot.name || '', x: spot.x, z: spot.z },
    out, back,
    keepsRules: out.keepsRules && back.keepsRules,
  };
}

/** Routes and plan numbers for every candidate: [{ candidate, route, plan }]. */
export function planAllCandidates(terrain, candidates = CANDIDATES) {
  return candidates.map((c) => {
    const route = planRoute(terrain, c);
    return { candidate: c, route, plan: planNumbers(terrain, route) };
  });
}

// ---------- plan numbers ----------
/**
 * Plan numbers for a route. The single source for Plan, Go / no-go and Debrief.
 * @returns {PlanNumbers} see app/README.md
 */
export function planNumbers(terrain, route) {
  const shadow = radioShadowMask(terrain);
  const profile = [];
  let sM = 0, tS = 0, climbM = 0, descentM = 0, steepest = { deg: 0, sM: 0, x: 0, z: 0 };
  let maxDist = { m: 0, sM: 0, x: 0, z: 0 };
  let levels = fullLevels();
  const leg = { out: { m: 0, s: 0, e: 0 }, back: { m: 0, s: 0, e: 0 } };
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
  // a shadow cell, the work at the spot counts when the spot is in shadow. Stretches are runs of such
  // steps, so the total is the sum of the stretches and no stretch is longer than the total.
  const shadowTime = (inShadow, seconds, fromCell) => {
    if (inShadow) {
      if (!open) { const p = terrain.pointOf(fromCell); open = { startM: sM, startS: tS, x: p.x, z: p.z, seconds: 0 }; }
      open.seconds += seconds;
      shadowS += seconds;
    } else if (open) closeShadow();
  };
  const closeShadow = () => { stretches.push({ ...open, endM: sM, endS: tS }); open = null; };

  const walk = (cells, legName, isFirst) => {
    if (isFirst) visit(cells[0], legName, null);
    for (let k = 1; k < cells.length; k++) {
      const st = stepCost(terrain, cells[k - 1], cells[k]);
      const w = st.energyJ / st.seconds;
      // the way home is drawn at the walk-back rate only for the reserve, not for the plan's own levels
      levels = consume(levels, w, st.seconds);
      shadowTime(shadow[cells[k]] === 1, st.seconds, cells[k - 1]);
      sM += st.m; tS += st.seconds;
      leg[legName].m += st.m; leg[legName].s += st.seconds; leg[legName].e += st.energyJ;
      if (st.slopeDeg > 0) climbM += Math.sin((st.slopeDeg * Math.PI) / 180) * st.m; else descentM -= Math.sin((st.slopeDeg * Math.PI) / 180) * st.m;
      if (st.closed) closedM += st.m;
      visit(cells[k], legName, st);
    }
  };

  walk(route.out.cells, 'out', true);
  const spotIndex = profile.length - 1;
  const spotS = spotSeconds();
  const spotE = WORK.spotW.value * spotS;
  levels = consume(levels, WORK.spotW.value, spotS);
  const spotCell = route.out.cells[route.out.cells.length - 1];
  shadowTime(shadow[spotCell] === 1, spotS, spotCell);
  tS += spotS;
  profile.push({ ...profile[spotIndex], tS, leg: 'spot' });
  walk(route.back.cells, 'back', false);
  if (open) closeShadow();

  const totalS = tS;
  const reserve = reserveOnReturn(fullLevels(), {
    energyJ: leg.out.e + spotE, seconds: leg.out.s + spotS,
    homeEnergyJ: leg.back.e, homeSeconds: leg.back.s,
  });

  // Turn-back point: first point on the way out where turning straight back (same path) leaves zero reserve.
  const turnBack = turnBackOnOut(terrain, route.out.cells);

  const longest = stretches.reduce((a, b) => (b.seconds > (a ? a.seconds : -1) ? b : a), null);
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

  return {
    spotId: route.spotId,
    distanceM: sM, outM: leg.out.m, backM: leg.back.m,
    timeS: totalS, walkS: leg.out.s + leg.back.s, spotS,
    legs: [
      { kind: 'rover', name: 'Rover' },
      { kind: 'foot', name: 'On foot', distanceM: leg.out.m, seconds: leg.out.s },
      { kind: 'spot', name: route.spot.name || 'Spot', distanceM: 0, seconds: spotS },
      { kind: 'foot', name: 'On foot', distanceM: leg.back.m, seconds: leg.back.s },
      { kind: 'rover', name: 'Rover' },
    ],
    climbM, descentM,
    steepestDeg: steepest.deg, steepestAt: { sM: steepest.sM, x: steepest.x, z: steepest.z },
    radioShadowS: shadowS, radioStretches: stretches, longestShadowS: longest ? longest.seconds : 0,
    reserveS: reserve.seconds, limiting: reserve.limiting, limitingName: reserve.name,
    levelsAtHome: reserve.levelsAtHome,
    energyJ: leg.out.e + spotE + leg.back.e,
    radiationMSv: doseMSv(totalS),
    maxDistanceM: maxDist.m,
    secondaryO2H: RULES.secondaryO2H.value,
    turnBack,
    spotAt: { sM: spotP.sM, x: spotP.x, z: spotP.z, index: spotIndex },
    profile,
    checks,
    brokenRules: checks.filter((c) => c.status === 'broken').map((c) => ({ id: c.id, name: c.name, where: c.where, text: c.text || '' })),
    keepsRules: checks.every((c) => c.status !== 'broken'),
  };
}

function turnBackOnOut(terrain, cells) {
  // cumulative cost from the start to each cell, and of the reverse walk home from each cell
  const n = cells.length;
  const outE = new Float64Array(n), outS = new Float64Array(n), outM = new Float64Array(n);
  const homeE = new Float64Array(n), homeS = new Float64Array(n);
  for (let k = 1; k < n; k++) {
    const st = stepCost(terrain, cells[k - 1], cells[k]);
    outE[k] = outE[k - 1] + st.energyJ; outS[k] = outS[k - 1] + st.seconds; outM[k] = outM[k - 1] + st.m;
    const back = stepCost(terrain, cells[k], cells[k - 1]);
    homeE[k] = homeE[k - 1] + back.energyJ; homeS[k] = homeS[k - 1] + back.seconds;
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
 * phase 'out': on to the spot, the work at the spot, then home. phase 'back': home from here.
 * Uses cost fields, cheap enough to call every frame.
 * @param {object} levels  current consumable levels
 * @param {{ x:number, z:number, phase:'out'|'back', spot:{id,x,z} }} where
 * @returns {{ seconds, limiting, name, levelsAtHome, homeSeconds, homeMetres, closedM, timeLeft }}
 */
export function reserveFrom(terrain, levels, { x, z, phase, spot }) {
  const home = roverField(terrain);
  let ahead;
  if (phase === 'out' && spot) {
    const toSpot = spotField(terrain, spot).at(x, z);
    const spotHome = home.at(spot.x, spot.z);
    const s = spotSeconds();
    ahead = {
      energyJ: toSpot.energyJ + WORK.spotW.value * s, seconds: toSpot.seconds + s,
      homeEnergyJ: spotHome.energyJ, homeSeconds: spotHome.seconds,
    };
    const r = reserveOnReturn(levels, ahead);
    return { ...r, homeSeconds: toSpot.seconds + s + spotHome.seconds, homeMetres: toSpot.metres + spotHome.metres, closedM: toSpot.closedM + spotHome.closedM, timeLeft: timeLeft(levels) };
  }
  const h = home.at(x, z);
  const r = reserveOnReturn(levels, { homeEnergyJ: h.energyJ, homeSeconds: h.seconds });
  return { ...r, homeSeconds: h.seconds, homeMetres: h.metres, closedM: h.closedM, timeLeft: timeLeft(levels) };
}


