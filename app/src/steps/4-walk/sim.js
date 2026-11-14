// The walk itself, without three.js or DOM: position, demo clock, suit, warnings, walk log.
// Every number comes from the core (rules, suit model, terrain, cost fields, radio shadow); the
// thresholds in display.js only decide when the display speaks.
import {
  RULES, WORK, ASTRONAUT, ROVER,
  logMove, logPath, reserveFrom, timeLeft, workRate, demoFactor, spotSeconds, hasRadio,
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

  // start beside the rover, on the route, facing along it
  const pts = route.out.points;
  let k0 = pts.findIndex((p) => Math.hypot(p.x - ROVER.x, p.z - ROVER.z) >= D.startClearM);
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
  // the metres from the rover to the start point are walked at planning pace with the first step
  const startPath = [{ x: ROVER.x, z: ROVER.z }, ...pts.slice(1, k0 + 1)];
  s.radio = hasRadio(t, s.x, s.z);
  refreshReserve();

  function refreshReserve() {
    const p = s.started ? s : ROVER; // before the first step the walk counts from the rover, like the plan
    s.reserve = reserveFrom(t, log.levels, { x: p.x, z: p.z, phase: log.phase, spot: route.spot });
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
    if (len > 0 && !s.started) {
      s.started = true;
      if (log.distanceM === 0) logPath(log, t, startPath, { shadow, spot: route.spot });
    }
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
      const rd = Math.hypot(nx - ROVER.x, nz - ROVER.z);
      if (rd < D.roverClearM) {
        const k = D.roverClearM / Math.max(rd, 1e-3);
        nx = ROVER.x + (nx - ROVER.x) * k; nz = ROVER.z + (nz - ROVER.z) * k;
      }
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
    let best = Infinity, cur = null;
    const curLeg = log.phase === 'out' && !log.sample ? 0 : 1;
    legs.forEach((L, li) => {
      for (let i = 1; i < L.length; i++) {
        const p = L[i - 1], q = L[i];
        const dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz;
        const u = l2 ? Math.max(0, Math.min(1, ((s.x - p.x) * dx + (s.z - p.z) * dz) / l2)) : 0;
        const d = Math.hypot(s.x - (p.x + u * dx), s.z - (p.z + u * dz));
        if (d < best) best = d;
        if (li === curLeg && (!cur || d < cur.d)) cur = { d, i, u };
      }
    });
    return { m: best, cur, L: legs[curLeg] };
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

  const broken = {};
  function breakRule(id, name, on) {
    if (on && !broken[id]) log.brokenRules.push({ id, name, x: s.x, z: s.z, tS: log.tS });
    broken[id] = on;
  }

  function evaluate() {
    const i = t.indexOf(s.x, s.z);
    const cur = {}, info = {};
    cur.steepUnder = isClosedAt(t, s.x, s.z); // the planner's slope test (core/planner.js)
    if (cur.steepUnder) info.steepUnder = { slopeDeg: t.slope[i] };
    const near = nearRoute();
    if (!cur.steepUnder) {
      // on the band: closed ground on the planned route ahead (only where the plan breaks the slope rule);
      // off the band: closed ground in the walking direction
      const m = near.m <= D.onRouteM ? (s.moveDir && s.sinceMoveS <= D.aheadHoldS ? routeAheadClosed(near, D.steepAheadM) : null)
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
    if (s.tb && s.tb.on) { cur.turnBack = true; info.turnBack = { reserveS: s.reserve.seconds }; }

    // broken rules (logged once per stretch)
    breakRule('slope', 'Slope on foot', cur.steepUnder);
    breakRule('wayHome', 'Way home', s.reserve.seconds < 0);
    breakRule('excursion', 'Excursion length', log.tS > RULES.evaLimitH.value * 3600);

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

  function finish(returned) {
    if (returned) {
      // the last metres to the rover, straight, at planning pace
      const d = distTo(ROVER), n = Math.max(1, Math.ceil(d / t.cell));
      const path = Array.from({ length: n + 1 }, (_, k) => ({ x: s.x + (ROVER.x - s.x) * k / n, z: s.z + (ROVER.z - s.z) * k / n }));
      const r = logPath(log, t, path, { shadow, spot: route.spot });
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

  return { s, log, route, step, takeSample, endExcursion, endMission, atTarget, atRover, target, refreshReserve, home, toSpot };
}
