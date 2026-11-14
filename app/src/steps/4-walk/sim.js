// The walk itself, without three.js or DOM: position, demo clock, suit, warnings, walk log.
// Every number comes from the core (rules, suit model, terrain, cost fields, radio shadow); the
// thresholds in display.js only decide when the display speaks.
import {
  RULES, WORK, ASTRONAUT, ROVER,
  logMove, logPath, reserveFrom, timeLeft, workRate, demoFactor, spotSeconds, walkSeconds, hasRadio,
  radioShadowMask, roverField, spotField, isClosedAt,
} from '../../core/index.js';
import { DISPLAY as D } from './display.js';

const DEG = Math.PI / 180;

/** Alerts, most urgent first (NASA order: warning, caution, advisory). */
export const ALERTS = {
  turnBack: { level: 'warning', title: 'Turn back now' },
  steepUnder: { level: 'warning', title: `Ground over ${RULES.slopeMaxDeg.value}° underfoot` },
  edge: { level: 'caution', title: 'Edge of the site' },
  steepAhead: { level: 'caution', title: 'Steep stretch ahead' },
  offPath: { level: 'caution', title: 'Off the path' },
  radioAhead: { level: 'advisory', title: 'Radio shadow ahead' },
};
const ORDER = Object.keys(ALERTS);

/**
 * @param {Terrain} t  shared walk grid
 * @param {Route} route  state.route
 * @param {WalkLog} log  state.walk (mutated in place)
 */
export function createSim(t, route, log) {
  const shadow = radioShadowMask(t);
  const home = roverField(t);
  const toSpot = spotField(t, route.spot);
  const legs = [route.out.points, route.back.points];

  // the rover model's footprint: the visitor is kept outside it
  const ry = D.roverHeadingDeg * DEG;
  const fwd = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: Math.cos(ry), z: -Math.sin(ry) };
  const rc = { x: ROVER.x + fwd.x * D.roverShiftM, z: ROVER.z + fwd.z * D.roverShiftM };
  const halfL = D.roverHalfLenM + D.roverMarginM, halfW = D.roverHalfWidthM + D.roverMarginM;
  const insideRover = (x, z) => {
    const a = (x - rc.x) * fwd.x + (z - rc.z) * fwd.z, b = (x - rc.x) * side.x + (z - rc.z) * side.z;
    return Math.abs(a) < halfL && Math.abs(b) < halfW ? { a, b } : null;
  };
  /** A point inside the footprint moves out to its nearest edge. */
  const outOfRover = (x, z) => {
    const q = insideRover(x, z);
    if (!q) return { x, z };
    let { a, b } = q;
    if (halfL - Math.abs(a) < halfW - Math.abs(b)) a = Math.sign(a || 1) * halfL; else b = Math.sign(b || 1) * halfW;
    return { x: rc.x + fwd.x * a + side.x * b, z: rc.z + fwd.z * a + side.z * b };
  };

  // start beside the rover, on the route, facing along it
  const pts = route.out.points;
  let k0 = pts.findIndex((p) => Math.hypot(p.x - ROVER.x, p.z - ROVER.z) >= D.startClearM && !insideRover(p.x, p.z));
  if (k0 < 0) k0 = Math.min(1, pts.length - 1);
  const a = pts[k0], b = pts[Math.min(pts.length - 1, k0 + 6)];
  const s = {
    x: a.x, z: a.z, yaw: Math.atan2(b.x - a.x, b.z - a.z), pitch: -6 * DEG,
    started: false, paused: false, modal: null, // modal: 'sample' | 'empty' | null
    moveDir: null, sinceMoveS: Infinity, moving: false,
    workW: WORK.restW.value, radio: true,
    reserve: null, timeLeft: null,
    active: {}, alert: null, alertInfo: {},
    tb: null, leftRover: false, atEdge: false,
    homeAtSample: null,
  };
  log.track.length || log.track.push({ x: ROVER.x, z: ROVER.z, tS: log.tS, reserveS: NaN, radio: true });
  // the metres from the rover to the start point are logged at planning pace right away, so the clock,
  // the distances and the reserve shown in the helmet all count from the rover, like the plan and the
  // debrief (the clock then runs from the first step)
  const startPath = [{ x: ROVER.x, z: ROVER.z }, ...pts.slice(1, k0 + 1)];
  if (log.distanceM === 0 && log.tS === 0) logPath(log, t, startPath, { shadow, spot: route.spot });
  s.radio = hasRadio(t, s.x, s.z);
  refreshReserve();

  function refreshReserve() {
    s.reserve = reserveFrom(t, log.levels, { x: s.x, z: s.z, phase: log.phase, spot: route.spot });
    s.timeLeft = timeLeft(log.levels);
  }

  const ground = (x, z) => t.heightAt(x, z);

  /** Advance by dt real seconds with input { f, r, turn, pitch } (each -1..1). */
  function step(dt, inp) {
    if (log.ended || s.paused || s.modal) return;
    s.yaw += inp.turn * D.turnDegS * DEG * dt;
    s.pitch = Math.max(-D.pitchMaxDeg * DEG, Math.min(D.pitchMaxDeg * DEG, s.pitch + inp.pitch * D.pitchDegS * DEG * dt));
    let f = inp.f, r = inp.r;
    const len = Math.hypot(f, r);
    if (len > 0 && !s.started) s.started = true;
    if (!s.started) return; // the clock starts with the first step
    const from = { x: s.x, y: ground(s.x, s.z), z: s.z };
    let nx = s.x, nz = s.z;
    s.atEdge = false;
    if (len > 0) {
      f /= len; r /= len;
      const d = ASTRONAUT.paceMS.value * dt; // walking pace, real time on screen
      const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
      nx += (f * sy + r * cy) * d;
      nz += (f * cy - r * sy) * d;
      // edge of the site: stopped
      const lo = t.min + t.cell / 2, hi = t.max - t.cell / 2;
      if (nx < lo || nx > hi || nz < lo || nz > hi) s.atEdge = true;
      nx = Math.max(lo, Math.min(hi, nx)); nz = Math.max(lo, Math.min(hi, nz));
      // the rover model is solid
      ({ x: nx, z: nz } = outOfRover(nx, nz));
    }
    const to = { x: nx, y: ground(nx, nz), z: nz };
    const horiz = Math.hypot(to.x - from.x, to.z - from.z);
    s.moving = horiz > 1e-6;
    if (s.moving) {
      s.moveDir = { x: (to.x - from.x) / horiz, z: (to.z - from.z) / horiz };
      s.sinceMoveS = 0;
      s.workW = workRate(Math.atan2(to.y - from.y, horiz) / DEG);
    } else {
      s.sinceMoveS += dt;
      s.workW = WORK.restW.value; // standing still: resting work rate (core, label assumption)
    }
    s.x = nx; s.z = nz;
    s.radio = hasRadio(t, s.x, s.z);
    const dtS = dt * demoFactor();
    s.reserve = logMove(log, t, { from, to, dtS, workW: s.workW, radio: s.radio, spot: route.spot });
    s.timeLeft = timeLeft(log.levels);
    if (Math.hypot(s.x - ROVER.x, s.z - ROVER.z) > D.leftRoverM) s.leftRover = true;
    evaluate();
    if (s.timeLeft.seconds <= 0) suitEmpty();
  }

  // ---------- warnings ----------
  function aheadHit(test, maxM) {
    if (!s.moveDir || s.sinceMoveS > D.aheadHoldS) return null;
    for (let m = t.cell; m <= maxM; m += t.cell / 2) {
      const x = s.x + s.moveDir.x * m, z = s.z + s.moveDir.z * m;
      if (!t.inside(x, z)) return null;
      if (test(t.indexOf(x, z), x, z)) return m;
    }
    return null;
  }

  /** Distance to the planned route (both legs), and the nearest point on the current leg. */
  function nearRoute() {
    let best = Infinity, cur = null, bp = null;
    const curLeg = log.phase === 'out' && !log.sample ? 0 : 1;
    legs.forEach((L, li) => {
      for (let i = 1; i < L.length; i++) {
        const p = L[i - 1], q = L[i];
        const dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz;
        const u = l2 ? Math.max(0, Math.min(1, ((s.x - p.x) * dx + (s.z - p.z) * dz) / l2)) : 0;
        const d = Math.hypot(s.x - (p.x + u * dx), s.z - (p.z + u * dz));
        if (d < best) { best = d; bp = { x: p.x + u * dx, z: p.z + u * dz }; }
        if (li === curLeg && (!cur || d < cur.d)) cur = { d, i, u };
      }
    });
    return { m: best, cur, L: legs[curLeg], p: bp };
  }

  /** Closed ground on the planned route ahead (the crew keeps to the band): metres to it, or null. */
  function routeAheadClosed(near, maxM) {
    const { cur, L } = near;
    if (!cur) return null;
    let p = { x: L[cur.i - 1].x + (L[cur.i].x - L[cur.i - 1].x) * cur.u, z: L[cur.i - 1].z + (L[cur.i].z - L[cur.i - 1].z) * cur.u };
    let m = 0;
    for (let i = cur.i; i < L.length && m <= maxM; i++) {
      const q = L[i], len = Math.hypot(q.x - p.x, q.z - p.z), n = Math.max(1, Math.ceil(len / (t.cell / 4)));
      for (let k = 1; k <= n; k++) {
        const x = p.x + (q.x - p.x) * k / n, z = p.z + (q.z - p.z) * k / n;
        if (isClosedAt(t, x, z)) return m + len * k / n;
      }
      m += len; p = q;
    }
    return null;
  }

  // one entry per time into a broken rule: leaving and coming back counts again, but only after
  // reenterM metres walked outside it, so walking along the edge of closed ground is not counted per frame
  const broken = {}, outsideM = {};
  let lastPos = { x: s.x, z: s.z };
  function breakRule(id, name, on, movedM) {
    if (on && !broken[id] && (outsideM[id] ?? Infinity) >= D.reenterM) log.brokenRules.push({ id, name, x: s.x, z: s.z, tS: log.tS });
    if (on) outsideM[id] = 0; else if (broken[id] || outsideM[id] != null) outsideM[id] = (outsideM[id] || 0) + movedM;
    broken[id] = on;
  }

  function evaluate() {
    const cur = {}, info = {};
    const near = nearRoute();
    // the planner's slope test (core/planner.js). On the band (within onRouteM of the planned route) the
    // test reads the route point beside the visitor: the band is the checked ground, and a visitor a
    // step beside it is still on it. Off the band it reads the ground underfoot.
    const onBand = near.m <= D.onRouteM && !!near.p;
    const q = onBand ? near.p : s;
    cur.steepUnder = isClosedAt(t, q.x, q.z);
    if (cur.steepUnder) info.steepUnder = { slopeDeg: t.slope[t.indexOf(q.x, q.z)], offRoute: !onBand };
    if (!cur.steepUnder) {
      // on or near the band: closed ground on the planned route ahead (only where the plan breaks the slope
      // rule); farther off: closed ground in the walking direction
      // near the band (within nearBandM) the crew follows the route: warn only where the plan marks a
      // steep stretch, not for steep ground a step beside it
      const m = near.m <= D.nearBandM ? (s.moveDir && s.sinceMoveS <= D.aheadHoldS ? routeAheadClosed(near, D.steepAheadM) : null)
        : aheadHit((j, x, z) => isClosedAt(t, x, z), D.steepAheadM);
      if (m != null) { cur.steepAhead = true; info.steepAhead = { m }; }
    }
    if (s.radio) {
      const m = aheadHit((j) => shadow[j] === 1, D.radioAheadM);
      if (m != null) { cur.radioAhead = true; info.radioAhead = { m }; }
    }
    const off = near.m;
    if (off > D.offPathM) { cur.offPath = true; info.offPath = { m: off }; }
    const edgeM = Math.min(s.x - t.min, t.max - s.x, s.z - t.min, t.max - s.z);
    if (edgeM < D.edgeBandM || s.atEdge) { cur.edge = true; info.edge = { m: edgeM }; }

    // Turn back now: from reserve zero until the crew heads home (the way home gets shorter)
    const hm = home.at(s.x, s.z).metres;
    if (s.reserve.seconds <= 0) {
      if (!s.tb) s.tb = { on: true, ref: hm };
      else if (s.tb.on) {
        s.tb.ref = Math.max(s.tb.ref, hm);
        if (s.tb.ref - hm >= D.homeTurnM) {
          s.tb = { on: false, ref: hm };
          if (log.phase === 'out' && !log.sample) { log.phase = 'back'; s.reserve = reserveFrom(t, log.levels, { x: s.x, z: s.z, phase: 'back' }); }
        }
      } else {
        s.tb.ref = Math.min(s.tb.ref, hm);
        if (hm - s.tb.ref >= D.homeTurnM) s.tb = { on: true, ref: hm };
      }
    } else s.tb = null;
    if (s.tb && s.tb.on) { cur.turnBack = true; info.turnBack = { reserveS: s.reserve.seconds, viaSpot: log.phase === 'out' && !log.sample }; }

    // broken rules (logged once per stretch)
    const movedM = Math.hypot(s.x - lastPos.x, s.z - lastPos.z);
    lastPos = { x: s.x, z: s.z };
    breakRule('slope', 'Slope on foot', cur.steepUnder, movedM);
    breakRule('wayHome', 'Way home', s.reserve.seconds < 0, movedM);
    breakRule('excursion', 'Excursion length', log.tS > RULES.evaLimitH.value * 3600, movedM);

    // warnings log: each onset, where it occurred
    // (a warning that flickers on and off in the same place is logged once)
    for (const id of ORDER) {
      if (!cur[id] || s.active[id]) continue;
      const prev = log.warnings.findLast((w) => w.id === id);
      if (prev && Math.hypot(prev.x - s.x, prev.z - s.z) < D.relogM) continue;
      log.warnings.push({ id, level: ALERTS[id].level, text: ALERTS[id].title, x: s.x, z: s.z, tS: log.tS });
    }
    s.active = cur; s.alertInfo = info;
    s.alert = ORDER.find((id) => cur[id]) || null;
  }

  // ---------- actions ----------
  function distTo(p) { return Math.hypot(s.x - p.x, s.z - p.z); }
  const atTarget = () => !log.ended && !log.sample && distTo(route.spot) <= D.atTargetM;
  const atRover = () => !log.ended && s.leftRover && distTo(ROVER) <= D.atRoverM;

  function takeSample() {
    if (!atTarget()) return false;
    // the last metres to the spot are walked at planning pace and the crew stands at the spot for the work,
    // as the plan counts them: the reserve on return stays continuous across the sample (the reserve on
    // the way out already counted these metres; skipping them made it jump up by their time there and back)
    const r0 = logPath(log, t, [{ x: s.x, z: s.z }, { x: route.spot.x, z: route.spot.z }], { shadow, spot: route.spot });
    if (r0) { s.x = route.spot.x; s.z = route.spot.z; s.radio = hasRadio(t, s.x, s.z); }
    log.phase = 'back';
    const p = { x: s.x, y: ground(s.x, s.z), z: s.z };
    s.reserve = logMove(log, t, { from: p, to: p, dtS: spotSeconds(), workW: WORK.spotW.value, radio: s.radio, spot: route.spot });
    s.timeLeft = timeLeft(log.levels);
    log.sample = { spotId: route.spotId, x: s.x, z: s.z, tS: log.tS };
    s.homeAtSample = home.at(s.x, s.z).metres;
    s.tb = null;
    evaluate();
    if (s.timeLeft.seconds <= 0) suitEmpty();
    else s.modal = 'sample';
    return true;
  }

  /** The last metres from here to the rover's centre (where the plan ends), straight. */
  function lastPath() {
    const d = distTo(ROVER), n = Math.max(1, Math.ceil(d / t.cell));
    return Array.from({ length: n + 1 }, (_, k) => ({ x: s.x + (ROVER.x - s.x) * k / n, z: s.z + (ROVER.z - s.z) * k / n }));
  }
  /** Metres and suit seconds the walk log adds for the last metres when the excursion ends here (as logPath counts them). */
  function lastLeg() {
    const p = lastPath();
    let metres = 0, seconds = 0;
    for (let k = 1; k < p.length; k++) {
      const flat = Math.hypot(p[k].x - p[k - 1].x, p[k].z - p[k - 1].z);
      if (flat < 1e-6) continue;
      const m = Math.hypot(flat, t.heightAt(p[k].x, p[k].z) - t.heightAt(p[k - 1].x, p[k - 1].z));
      metres += m; seconds += walkSeconds(m);
    }
    return { metres, seconds };
  }

  function finish(returned) {
    if (returned) {
      // the last metres to the rover, straight, at planning pace
      const r = logPath(log, t, lastPath(), { shadow, spot: route.spot });
      if (r) { s.reserve = r; s.timeLeft = timeLeft(log.levels); }
    }
    log.ended = true;
    log.returned = returned;
    const at = returned ? { x: ROVER.x, z: ROVER.z } : { x: s.x, z: s.z };
    const r = reserveFrom(t, log.levels, { ...at, phase: 'back' });
    log.reserveAtHomeS = returned ? r.seconds : null;
    log.outcome = !returned ? 'not-returned' : log.brokenRules.length ? 'home-broken' : 'home';
    log.end = { ...at, tS: log.tS, roverDistanceM: returned ? 0 : distTo(ROVER) };
  }

  function suitEmpty() {
    log.suitEmpty = { x: s.x, z: s.z, tS: log.tS, roverDistanceM: distTo(ROVER) };
    finish(false);
    s.modal = 'empty';
    s.alert = null;
  }

  function endExcursion() { if (!atRover()) return false; finish(true); return true; }
  function endMission() { if (log.ended) return; finish(atRoverAny()); log.endedByVisitor = true; }
  const atRoverAny = () => distTo(ROVER) <= D.atRoverM;

  /** Where the visitor is heading now: the sample spot, then the rover. */
  let legStart = null;
  function target() {
    const spotLeg = log.phase === 'out' && !log.sample;
    const c = spotLeg ? toSpot.at(s.x, s.z) : home.at(s.x, s.z);
    const kind = spotLeg ? 'spot' : 'rover';
    if (!legStart || legStart.kind !== kind) legStart = { kind, m: Math.max(c.metres, 1e-6) };
    const base = spotLeg
      ? { kind, name: route.spot.name || 'Sample spot', id: route.spotId, x: route.spot.x, z: route.spot.z }
      : { kind, name: 'Rover', id: null, x: ROVER.x, z: ROVER.z };
    return { ...base, metres: c.metres, seconds: c.seconds, done: Math.max(0, Math.min(1, 1 - c.metres / legStart.m)) };
  }

  return { s, log, route, lastLeg, step, takeSample, endExcursion, endMission, atTarget, atRover, target, refreshReserve, home, toSpot };
}
