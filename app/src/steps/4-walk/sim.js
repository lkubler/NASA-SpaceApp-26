// The walk itself, without three.js or DOM: position, demo clock, suit, warnings, walk log.
// Every number comes from the core (rules, suit model, terrain, cost fields, radio shadow); the
// thresholds in display.js only decide when the display speaks.
import {
  RULES, WORK, ASTRONAUT, DEMO, ROVER,
  logMove, logPath, reserveFrom, timeLeft, workRate, demoFactor, spotSeconds, walkSeconds, hasRadio,
  radioShadowMask, roverField, spotField, isClosedAt, isClosed, findRoute,
  stopsOf, initStops, remainingWay, passVia, markSampled, Heap,
} from '../../core/index.js';
import { DISPLAY as D } from './display.js';

const DEG = Math.PI / 180;

/**
 * Alerts, most important first (specs/feedback-1.md, Walk: display): turn back, rule broken, steep, radio,
 * off path. The edge of the site, not named there, keeps its place before the steep stretch (the visitor is
 * stopped there). Several at once: the first is shown large, the others as small chips beside it.
 */
export const ALERTS = {
  turnBack: { level: 'warning', title: 'Turn back now' },
  steepUnder: { level: 'warning', title: `Ground over ${RULES.slopeMaxDeg.value}° underfoot` },
  edge: { level: 'caution', title: 'Edge of the site' },
  steepAhead: { level: 'caution', title: 'Steep stretch ahead' },
  radioAhead: { level: 'advisory', title: 'Radio shadow ahead' },
  offPath: { level: 'caution', title: 'Off the path' },
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
  // a round (specs/feedback-1.md "Several stops"): rover -> stop 1 -> ... -> stop N -> rover. The target is
  // the next stop not sampled yet, in plan order; one sample per stop; then the rover
  const stops = stopsOf(route), N = stops.length;
  const plannedLegs = route.legs || [route.out, route.back];
  const legs = plannedLegs.map((l) => l.points); // the whole planned round: "off the path" measures to it
  const stopField = stops.map((st) => spotField(t, st));
  const toSpot = stopField[0];
  initStops(log, route);

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

  // start beside the rover, on the route, facing along it (the first leg)
  const pts = legs[0];
  let k0 = pts.findIndex((p) => Math.hypot(p.x - ROVER.x, p.z - ROVER.z) >= D.startClearM && !insideRover(p.x, p.z));
  if (k0 < 0) k0 = Math.min(1, pts.length - 1);
  const a = pts[k0], b = pts[Math.min(pts.length - 1, k0 + 6)];
  const s = {
    x: a.x, z: a.z, yaw: Math.atan2(b.x - a.x, b.z - a.z), pitch: -6 * DEG,
    started: false, paused: false, modal: null, // modal: 'sample' | 'empty' | null
    moveDir: null, sinceMoveS: Infinity, moving: false,
    workW: WORK.restW.value, radio: true,
    reserve: null, timeLeft: null,
    active: {}, alert: null, alerts: [], alertInfo: {},
    tb: null, leftRover: false, atEdge: false, fast: false,
    leg: null, lastSample: -1, // the leg shown now (band, minimap, steep ahead): { target, key, kind, stop, points, planned }
  };
  log.track.length || log.track.push({ x: ROVER.x, z: ROVER.z, tS: log.tS, reserveS: NaN, radio: true });
  // the metres from the rover to the start point are logged at planning pace right away, so the clock,
  // the distances and the reserve shown in the helmet all count from the rover, like the plan and the
  // debrief (the clock then runs from the first step)
  const startPath = [{ x: ROVER.x, z: ROVER.z }, ...pts.slice(1, k0 + 1)];
  if (log.distanceM === 0 && log.tS === 0) logPath(log, t, startPath, { shadow });
  s.radio = hasRadio(t, s.x, s.z);
  refreshReserve();

  /** Reserve on return from here: the remaining stops in plan order (walk and work at each), then home. */
  // (and the waypoints of the plan not passed yet, specs/x-waypoints.md; without waypoints: the remaining stops)
  function reserveHere() { return reserveFrom(t, log.levels, { x: s.x, z: s.z, phase: log.phase, stops: remainingWay(log) }); }
  function refreshReserve() {
    s.reserve = reserveHere();
    s.timeLeft = timeLeft(log.levels);
  }

  /** Index (in plan order) of the stop the walk heads for now, or -1: the rover. */
  // "Turn back now" on (one stop, before its sample): the target is the rover at once, so the display shows
  // the way back from here (team clarification on specs/x-liveroute.md: low reserve, the way home)
  function nextStop() {
    if (log.phase !== 'out' || (s.tb && s.tb.on && !log.sample)) return -1;
    return log.stops.findIndex((st) => !st.sampled && !st.skipped);
  }
  /**
   * The waypoints of the plan still ahead before the current target (specs/x-waypoints.md), in order: those of
   * the leg to the next stop, or of the way home after the last stop (remainingWay: none after a turn back).
   */
  function viaAhead() {
    const way = remainingWay(log);
    const k = way.findIndex((p) => !p.pass);
    return (k < 0 ? way : way.slice(0, k)).filter((p) => p.pass);
  }
  const viaField = (w) => spotField(t, { x: w.x, z: w.z });
  /** Distance from here to a polyline. */
  function distToLine(L) {
    let best = Infinity;
    for (let i = 1; i < L.length; i++) {
      const p = L[i - 1], q = L[i];
      const dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz;
      const u = l2 ? Math.max(0, Math.min(1, ((s.x - p.x) * dx + (s.z - p.z) * dz) / l2)) : 0;
      best = Math.min(best, Math.hypot(s.x - (p.x + u * dx), s.z - (p.z + u * dz)));
    }
    return best;
  }
  /**
   * The way from here to the current target by the planner's rules (specs/x-liveroute.md): along the cost
   * fields built at the start, through the waypoints still ahead on this leg. No full search: each field
   * already holds the next cell towards its place from every cell.
   */
  function liveWay(field, vias) {
    const pts = [{ x: s.x, z: s.z }];
    let from = { x: s.x, z: s.z };
    const ends = [...vias.map((w) => ({ f: viaField(w), p: w })), { f: field, p: field.target }];
    for (const { f, p } of ends) {
      f.pathFrom(from.x, from.z).forEach((i, j) => {
        const q = t.pointOf(i);
        if (j > 0 || Math.hypot(q.x - from.x, q.z - from.z) > 1e-3) pts.push(q);
      });
      from = { x: p.x, z: p.z };
    }
    const end = field.target;
    if (pts.length < 2 || Math.hypot(pts.at(-1).x - end.x, pts.at(-1).z - end.z) > 1e-3) pts.push({ x: end.x, z: end.z });
    return pts;
  }
  /**
   * No way to the target by the rules from here (standing in closed ground, or cut off by it): the shortest
   * way to the nearest ground from which the rule-keeping way leads on (Dijkstra over the walk grid, local:
   * it stops at the first such cell).
   */
  function escapeWay(field) {
    const n = t.n, s0 = t.indexOf(s.x, s.z);
    const ok = (i) => !isClosed(t, i) && field.closedM[i] === 0;
    const dist = new Map([[s0, 0]]), prev = new Map(), done = new Set();
    const heap = new Heap(256);
    heap.push(0, s0);
    let goal = -1;
    while (heap.n) {
      const u = heap.pop(), d = heap.lastKey;
      if (done.has(u)) continue;
      done.add(u);
      if (ok(u)) { goal = u; break; }
      const uc = u % n, ur = (u / n) | 0;
      for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
        const c = uc + dc, r = ur + dr;
        if ((!dc && !dr) || c < 0 || r < 0 || c >= n || r >= n) continue;
        const w = r * n + c, nd = d + t.stepLength(dc, dr);
        if (nd < (dist.get(w) ?? Infinity)) { dist.set(w, nd); prev.set(w, u); heap.push(nd, w); }
      }
    }
    const cells = [];
    for (let i = goal; i !== undefined && i !== -1; i = prev.get(i)) { cells.push(i); if (i === s0) break; }
    return [{ x: s.x, z: s.z }, ...cells.reverse().filter((i) => i !== s0).map((i) => t.pointOf(i))];
  }

  /**
   * The leg shown now (band, minimap, steep ahead), specs/x-liveroute.md: the planned leg to the next stop
   * (or home) while the crew is on it (at its start as before, or on the band; it is left once the crew is
   * farther than nearBandM from it); otherwise the live route: from here to the target by the planner's
   * rules, planned again whenever the crew stands in another grid cell; with no rule-keeping way from here,
   * the shortest way back to allowed ground (warn: true).
   */
  function currentLeg() {
    const k = nextStop();
    const target = k >= 0 ? 'stop' + k : 'rover';
    const li = k >= 0 ? k : N;
    const vias = viaAhead();
    let planned;
    if (s.leg && s.leg.target === target && s.leg.planned) planned = distToLine(legs[li]) <= D.nearBandM;
    else {
      const from = li === 0 ? null : stops[li - 1];
      const atStart = li === 0 ? !log.stops.some((st) => st.sampled) && !s.leftRover : Math.hypot(s.x - from.x, s.z - from.z) <= D.legStartM;
      // at the start as before; back on the band of the planned leg (only on a leg still walked as planned:
      // the leg to the next stop with the stop before it done, the way home after the last stop)
      const asPlanned = !log.turnedBack && (li === 0 ? !log.stops.some((st) => st.sampled) : log.stops[li - 1].sampled);
      planned = atStart || (asPlanned && distToLine(legs[li]) <= D.onRouteM);
    }
    if (planned) {
      if (!(s.leg && s.leg.planned && s.leg.target === target)) {
        s.leg = { target, key: 'leg' + li, kind: k >= 0 ? 'spot' : 'rover', stop: k, points: legs[li], planned: true, li };
      }
      return s.leg;
    }
    const cell = t.indexOf(s.x, s.z);
    const id = `${target}:${cell}:${vias.length}`;
    if (s.leg && !s.leg.planned && s.leg.id === id) return s.leg;
    const field = k >= 0 ? stopField[k] : home;
    const warn = field.at(s.x, s.z).closedM > 0;
    const points = warn ? escapeWay(field) : liveWay(field, vias);
    if (points.length < 2) points.push({ x: field.target.x, z: field.target.z });
    // key: one band per way; the 3D view drops the band before it
    s.leg = { target, id, key: `live:${id}`, kind: k >= 0 ? 'spot' : 'rover', stop: k, points, planned: false, warn, li };
    return s.leg;
  }

  /**
   * The planned way the warnings measure to, as built before the live route: the planned leg to the next stop
   * (or home) when the walk stood where that leg starts when the target switched; otherwise (a stop sampled
   * out of order, a turn back) the fastest rule-keeping way from where the target switched.
   */
  let ref = null;
  function refLeg() {
    const k = nextStop();
    const target = k >= 0 ? 'stop' + k : 'rover';
    if (ref && ref.target === target) return ref;
    const li = k >= 0 ? k : N;
    const from = li === 0 ? null : stops[li - 1];
    const atStart = li === 0 ? !log.stops.some((st) => st.sampled) : Math.hypot(s.x - from.x, s.z - from.z) <= D.legStartM;
    let points;
    if (atStart) points = legs[li];
    else {
      const field = k >= 0 ? stopField[k] : home;
      const way = field.pathFrom(s.x, s.z).map((i) => t.pointOf(i)).filter((p, j) => j > 0 || Math.hypot(p.x - s.x, p.z - s.z) > 1e-3);
      points = [{ x: s.x, z: s.z }, ...way];
      if (points.length < 2) points.push(k >= 0 ? { x: stops[k].x, z: stops[k].z } : { x: ROVER.x, z: ROVER.z });
    }
    ref = { target, points, planned: atStart };
    return ref;
  }

  /** Way still ahead to the current target along the live route: through the waypoints ahead, then the target. */
  function wayAhead(field) {
    let from = { x: s.x, z: s.z }, metres = 0, seconds = 0;
    for (const w of viaAhead()) {
      const c = viaField(w).at(from.x, from.z);
      metres += c.metres; seconds += c.seconds; from = w;
    }
    const c = field.at(from.x, from.z);
    return { metres: metres + c.metres, seconds: seconds + c.seconds };
  }

  const ground = (x, z) => t.heightAt(x, z);

  const PACE = ASTRONAUT.paceMS.value;
  const lo = t.min + t.cell / 2, hi = t.max - t.cell / 2;

  /**
   * Advance by dt real seconds with input { f, r, turn, pitch, fast, demo }.
   *   fast: Shift held, fast walk at ASTRONAUT.fastPaceFactor x pace; the work rate comes from the suit model at that speed.
   *   demo: demo speed, DEMO.screenSpeedFactor x pace on screen; movement only: suit time and consumption count
   *         as a normal walk over the same distance (time = distance / pace, work rate at pace).
   */
  function step(dt, inp) {
    if (log.ended || s.paused || s.modal) return;
    s.yaw += inp.turn * D.turnDegS * DEG * dt;
    s.pitch = Math.max(-D.pitchMaxDeg * DEG, Math.min(D.pitchMaxDeg * DEG, s.pitch + inp.pitch * D.pitchDegS * DEG * dt));
    let f = inp.f, r = inp.r;
    const len = Math.hypot(f, r);
    if (len > 0 && !s.started) s.started = true;
    if (!s.started) return; // the clock starts with the first step
    const demo = !!inp.demo, fast = !!inp.fast && !demo;
    const pace = fast ? PACE * ASTRONAUT.fastPaceFactor.value : PACE;
    const from = { x: s.x, y: ground(s.x, s.z), z: s.z };
    let nx = s.x, nz = s.z;
    s.atEdge = false;
    if (len > 0) {
      f /= len; r /= len;
      const d = (demo ? PACE * DEMO.screenSpeedFactor.value : pace) * dt; // on screen, real time
      const sy = Math.sin(s.yaw), cy = Math.cos(s.yaw);
      nx += (f * sy + r * cy) * d;
      nz += (f * cy - r * sy) * d;
      // edge of the site: stopped
      if (nx < lo || nx > hi || nz < lo || nz > hi) s.atEdge = true;
      nx = Math.max(lo, Math.min(hi, nx)); nz = Math.max(lo, Math.min(hi, nz));
      // the rover model is solid
      ({ x: nx, z: nz } = outOfRover(nx, nz));
    }
    const to = { x: nx, y: ground(nx, nz), z: nz };
    const horiz = Math.hypot(to.x - from.x, to.z - from.z);
    s.moving = horiz > 1e-6;
    s.fast = fast && s.moving;
    let dtS = dt * demoFactor(), workW;
    if (s.moving) {
      s.moveDir = { x: (to.x - from.x) / horiz, z: (to.z - from.z) / horiz };
      s.sinceMoveS = 0;
      const slopeDeg = Math.atan2(to.y - from.y, horiz) / DEG;
      if (demo) { dtS = (horiz / PACE) * demoFactor(); workW = workRate(slopeDeg); } // counted as a normal walk
      else workW = workRate(slopeDeg, pace);
    } else {
      s.sinceMoveS += dt;
      workW = WORK.restW.value; // standing still: resting work rate (core, label assumption)
    }
    record(from, to, dtS, workW);
  }

  /** One move into the walk log (the one path for walking, fast walk, demo speed and jumps). */
  function record(from, to, dtS, workW) {
    s.workW = workW;
    s.x = to.x; s.z = to.z;
    s.radio = hasRadio(t, s.x, s.z);
    // a waypoint of the plan counts as passed once the crew stands at it, like at a target
    passVia(log, t, s.x, s.z, D.atTargetM);
    s.reserve = logMove(log, t, { from, to, dtS, workW, radio: s.radio });
    s.timeLeft = timeLeft(log.levels);
    if (Math.hypot(s.x - ROVER.x, s.z - ROVER.z) > D.leftRoverM) s.leftRover = true;
    evaluate();
    if (s.timeLeft.seconds <= 0) suitEmpty();
  }

  // ---------- jump (F) ----------
  // open ground connected to where the visitor stands by a rule-keeping way: one flood fill over the
  // planner's step rule (a step is closed when either cell is over the slope rule)
  let comp = null;
  function components() {
    if (comp) return comp;
    const n = t.n, N = t.size;
    comp = new Int32Array(N).fill(-1);
    const stack = new Int32Array(N);
    let id = 0;
    for (let i0 = 0; i0 < N; i0++) {
      if (comp[i0] !== -1 || isClosed(t, i0)) continue;
      let sp = 0; stack[sp++] = i0; comp[i0] = id;
      while (sp) {
        const u = stack[--sp], uc = u % n, ur = (u / n) | 0;
        for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
          const c = uc + dc, rr = ur + dr;
          if ((!dc && !dr) || c < 0 || rr < 0 || c >= n || rr >= n) continue;
          const w = rr * n + c;
          if (comp[w] !== -1 || isClosed(t, w)) continue;
          comp[w] = id; stack[sp++] = w;
        }
      }
      id++;
    }
    return comp;
  }

  /** Can the visitor jump to (x, z)? Only ground they could walk to: inside the site, not over the slope rule, with a rule-keeping way from here. */
  function canLand(x, z) {
    if (!(x >= lo && x <= hi && z >= lo && z <= hi)) return false;
    if (insideRover(x, z)) return false;
    const c = components(), a = c[t.indexOf(s.x, s.z)], b = c[t.indexOf(x, z)];
    return a !== -1 && a === b && !isClosedAt(t, x, z);
  }

  /**
   * Jump to (x, z): counted as a normal walk from here to there on the best rule-keeping way (core findRoute),
   * logged in small steps through the same path as walking, so warnings, radio time and the debrief stay correct.
   * @returns {null | { metres, seconds }}
   */
  function jumpTo(x, z) {
    if (log.ended || s.paused || s.modal || !canLand(x, z)) return null;
    const way = findRoute(t, { x: s.x, z: s.z }, { x, z });
    if (!way.keepsRules) return null;
    s.started = true;
    const pts = [{ x: s.x, z: s.z }, ...way.points, { x, z }];
    const t0 = log.tS, m0 = log.distanceM;
    for (let k = 1; k < pts.length && !log.ended; k++) {
      const a = pts[k - 1], b = pts[k];
      const n = Math.max(1, Math.ceil(Math.hypot(b.x - a.x, b.z - a.z) / D.jumpStepM));
      for (let j = 1; j <= n && !log.ended; j++) {
        const from = { x: s.x, y: ground(s.x, s.z), z: s.z };
        const tx = a.x + ((b.x - a.x) * j) / n, tz = a.z + ((b.z - a.z) * j) / n;
        const to = { x: tx, y: ground(tx, tz), z: tz };
        const horiz = Math.hypot(to.x - from.x, to.z - from.z);
        if (horiz < 1e-6) continue;
        s.moveDir = { x: (to.x - from.x) / horiz, z: (to.z - from.z) / horiz };
        s.sinceMoveS = 0;
        const slopeDeg = Math.atan2(to.y - from.y, horiz) / DEG;
        record(from, to, (horiz / PACE) * demoFactor(), workRate(slopeDeg));
      }
    }
    s.moving = false;
    return { metres: log.distanceM - m0, seconds: log.tS - t0 };
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

  /**
   * Distance to the planned round (every leg, and the way home fixed at a turn back or a stop out of order:
   * refLeg), and the nearest point on that leg. "Off the path" and the steep checks measure to it as before;
   * the live route shown is not part of it (specs/x-liveroute.md).
   */
  function nearRoute() {
    let best = Infinity, cur = null, bp = null;
    const lg = refLeg();
    const all = lg.planned ? legs : [...legs, lg.points];
    const curLeg = lg.planned ? legs.indexOf(lg.points) : all.length - 1;
    all.forEach((L, li) => {
      for (let i = 1; i < L.length; i++) {
        const p = L[i - 1], q = L[i];
        const dx = q.x - p.x, dz = q.z - p.z, l2 = dx * dx + dz * dz;
        const u = l2 ? Math.max(0, Math.min(1, ((s.x - p.x) * dx + (s.z - p.z) * dz) / l2)) : 0;
        const d = Math.hypot(s.x - (p.x + u * dx), s.z - (p.z + u * dz));
        if (d < best) { best = d; bp = { x: p.x + u * dx, z: p.z + u * dz }; }
        if (li === curLeg && (!cur || d < cur.d)) cur = { d, i, u };
      }
    });
    return { m: best, cur, L: all[curLeg], p: bp };
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
    // a round: the reserve for the remaining stops has run out. The warning means "skip the remaining stops":
    // they are skipped at once and the display shows the way home (target rover, band from here); the
    // warning stays until the crew heads home. One stop: as before (the target switches when they head home)
    if (N > 1 && log.phase === 'out' && s.reserve.seconds <= 0) {
      const skipped = log.stops.filter((st) => !st.sampled && !st.skipped);
      skipped.forEach((st) => { st.skipped = true; });
      log.turnedBack = { x: s.x, z: s.z, tS: log.tS, reserveS: s.reserve.seconds, skipped: skipped.map((st) => st.id) };
      log.phase = 'back';
      const roundS = s.reserve.seconds;
      s.reserve = reserveHere();
      s.tb = { on: true, ref: hm, skip: { reserveS: roundS, stops: skipped.map((st) => ({ order: st.order, id: st.id })) } };
    }
    if (s.tb && s.tb.skip && s.reserve.seconds > 0) {
      // skipped, and the way home itself still has reserve: the warning goes once the crew heads home
      if (s.tb.on) {
        s.tb.ref = Math.max(s.tb.ref, hm);
        if (s.tb.ref - hm >= D.homeTurnM) s.tb = { ...s.tb, on: false };
      }
    } else if (s.reserve.seconds <= 0) {
      if (!s.tb) s.tb = { on: true, ref: hm };
      else if (s.tb.on) {
        s.tb.ref = Math.max(s.tb.ref, hm);
        if (s.tb.ref - hm >= D.homeTurnM) {
          s.tb = { on: false, ref: hm };
          if (log.phase === 'out' && !log.sample) { log.phase = 'back'; s.reserve = reserveHere(); }
        }
      } else {
        s.tb.ref = Math.min(s.tb.ref, hm);
        if (hm - s.tb.ref >= D.homeTurnM) s.tb = { on: true, ref: hm };
      }
    } else s.tb = null;
    if (s.tb && s.tb.on) {
      cur.turnBack = true;
      info.turnBack = s.tb.skip
        ? { reserveS: s.reserve.seconds, skipped: s.tb.skip.stops } // the reserve on the way home, as on the display
        : { reserveS: s.reserve.seconds, viaSpot: log.phase === 'out' && !log.sample };
    }

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
    s.alerts = ORDER.filter((id) => cur[id]);
    s.alert = s.alerts[0] || null;
  }

  // ---------- actions ----------
  function distTo(p) { return Math.hypot(s.x - p.x, s.z - p.z); }
  /**
   * The stop the walker stands on, if a sample can be taken there: any planned stop not sampled yet (also one
   * out of plan order, or one skipped by a turn back), the nearest within atTargetM; else -1.
   */
  function stopHere() {
    if (log.ended) return -1;
    let best = -1, bd = D.atTargetM;
    log.stops.forEach((st, k) => { const d = distTo(st); if (!st.sampled && d <= bd) { bd = d; best = k; } });
    return best;
  }
  const atTarget = () => stopHere() >= 0;
  /** Points from here to p along the cost field's way (as field.at counts it): here, the cells, p itself. */
  function wayTo(field, p) {
    const pts = [{ x: s.x, z: s.z }];
    const c = field.at(s.x, s.z);
    const g = t.indexOf(p.x, p.z);
    for (let i = c.index, n = 0; i !== -1 && i !== g && n < 4000; i = field.next[i], n++) pts.push(t.pointOf(i));
    pts.push({ x: p.x, z: p.z });
    return pts;
  }
  const atRover = () => !log.ended && s.leftRover && distTo(ROVER) <= D.atRoverM;

  function takeSample() {
    const k = stopHere();
    if (k < 0) return false;
    const spot = log.stops[k];
    // the last metres to the spot are walked at planning pace and the crew stands at the spot for the work,
    // as the plan counts them: the reserve on return stays continuous across the sample (the reserve on
    // the way out already counted these metres; skipping them made it jump up by their time there and back)
    // along the way the reserve counted (the stop's cost field from here), so it does not jump where that
    // way bends round closed ground; straight when the walker stands in the stop's own cell
    const r0 = logPath(log, t, wayTo(stopField[k], spot), { shadow });
    if (r0) { s.x = spot.x; s.z = spot.z; s.radio = hasRadio(t, s.x, s.z); }
    // the stop leaves the remaining stops before its work is logged: the reserve after the work counts the
    // stops still ahead from here (after the last one: the way home), continuous with the reserve before
    const first = !log.sample;
    markSampled(log, k, { x: s.x, z: s.z });
    const p = { x: s.x, y: ground(s.x, s.z), z: s.z };
    s.reserve = logMove(log, t, { from: p, to: p, dtS: spotSeconds(), workW: WORK.spotW.value, radio: s.radio });
    s.timeLeft = timeLeft(log.levels);
    // the sample's time: when the work is done (as before)
    spot.tS = log.tS;
    if (first) log.sample.tS = log.tS;
    s.lastSample = k;
    s.leg = null; ref = null; // the band and the target follow from the stops left
    if (!(s.tb && s.tb.skip)) s.tb = null;
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
      const r = logPath(log, t, lastPath(), { shadow });
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
    s.alert = null; s.alerts = [];
  }

  function endExcursion() { if (!atRover()) return false; finish(true); return true; }
  function endMission() { if (log.ended) return; finish(atRoverAny()); log.endedByVisitor = true; }
  const atRoverAny = () => distTo(ROVER) <= D.atRoverM;

  /** Where the visitor is heading now: the next stop not sampled yet (plan order), then the rover. */
  let legStart = null;
  function target() {
    const lg = currentLeg();
    const k = lg.stop;
    const spotLeg = k >= 0;
    // along the live route: through the waypoints still ahead on this leg (without any: the field's way)
    const c = wayAhead(spotLeg ? stopField[k] : home);
    if (!legStart || legStart.key !== lg.target) legStart = { key: lg.target, m: Math.max(c.metres, 1e-6) };
    const base = spotLeg
      ? { kind: 'spot', name: stops[k].name || 'Sample spot', id: stops[k].id || null, x: stops[k].x, z: stops[k].z, order: k + 1 }
      : { kind: 'rover', name: 'Rover', id: null, x: ROVER.x, z: ROVER.z, order: null };
    return {
      ...base, metres: c.metres, seconds: c.seconds, done: Math.max(0, Math.min(1, 1 - c.metres / legStart.m)),
      of: N, sampled: log.stops.filter((st) => st.sampled).length,
      skipped: log.stops.filter((st) => st.skipped && !st.sampled).map((st) => st.order),
    };
  }

  return { s, log, route, stops, lastLeg, step, canLand, jumpTo, takeSample, endExcursion, endMission, atTarget, atRover, stopHere, target, leg: currentLeg, refreshReserve, home, toSpot };
}
