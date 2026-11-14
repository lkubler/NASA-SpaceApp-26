// Map view (2D route planner). Plain canvas + a plain HTML side panel; both are meant to be
// restyled/replaced by the designer (task 006). Logic lives in planner.js and model/*.
// Controls: click = add waypoint, drag a waypoint or the lander to move it, right-click a
// waypoint = remove, wheel = zoom, shift/middle-drag = pan.
import { app } from '../state.js';
import { loadDtm, makeTransform } from '../terrain/dtm.js';
import { whenHeightmap, slopeGrid } from '../terrain/heightmap.js';
import { planRoute, costGrid, SLOPE_HARD_DEG, SLOPE_PREFER_DEG } from './planner.js';
import { computeReserve, DEFAULTS, STATION_TASKS } from '../model/reserve.js';
import { viewshed, HIDDEN, DEFAULT_SHADOW_LIMIT_S } from '../model/comms.js';
import { tile, chip, badge, button, provLegend } from '../ui/components.js';

const QUELA = { lon: 137.353006, lat: -4.695202 }; // rover waypoint at the Quela drill site (research/)
// Comms source: a rover parked on the highest nearby ground (about +10 m over the lander, antenna ~2 m [assumption]).
// Curiosity's real parking spot at the Murray Buttes entrance ('Marimba', 137.35447 E, -4.68718, research/data-science.md
// section 1) lies on the DTM's north edge in a hollow and sees none of the walk area, so the relay position is
// picked on the DTM itself (offset from the lander, found by scanning candidates for line of sight to the route).
const RELAY_OFFSET = { dx: -79, dy: 61 };
const EVA_START_H = 8.5; // EVA clock start, local true solar time [assumption]
const fmtClock = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
// Default scenario: six stations between the lander and Quela. Three stations cannot use up an 8 h suit
// (research/planner-012 numbers), so the plan is a full Apollo-style science EVA. Station minutes: assumptions.
const SCENARIO = [
  { dx: -60, dy: -30, task: 'imaging' }, { dx: -130, dy: 40, task: 'sample' }, { dx: -230, dy: 50, task: 'sample' },
  { dx: -250, dy: -20, task: 'imaging' }, { dx: -200, dy: -60, task: 'sample' }, { quela: true, task: 'drill' },
];
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hex = (c) => { const v = parseInt(c.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const fmtT = (s) => (s >= 3600 ? Math.floor(s / 3600) + ' h ' : '') + Math.floor((s % 3600) / 60) + ' min ' + Math.round(s % 60) + ' s';

export function mountMap(el) {
  const canvas = document.createElement('canvas');
  const panel = document.createElement('div'); panel.id = 'map-panel';
  el.append(canvas, panel);
  const ctx = canvas.getContext('2d');

  // ---- data + derived layers ----
  let L = null; // {hm, slope, meta, name, tf, grid, base, shade}
  let waypoints = []; // local metres [{x,y}]
  let rover = null, start = null; // rover = comms source, start = lander / EVA start (route start)
  let capacityPct = 100, startH = EVA_START_H;
  let route = null, vis = null, comms = null; // comms = overlay canvas
  let view = { s: 1, ox: 0, oy: 0 }; // screen = cell * s + o   (cells of the DTM grid)
  let msg = 'Loading HiRISE DTM...';

  async function init() {
    try { L = await loadDtm(); }
    catch (e) { // fallback layer: the Access Mars grid built by the Walk view
      console.warn('DTM unavailable, using Access Mars grid', e);
      const { hm } = await whenHeightmap(); L = { hm, slope: slopeGrid(hm), meta: null, name: 'Access Mars 0.5 m' };
    }
    L.tf = L.meta ? makeTransform(L.meta) : null;
    L.grid = costGrid(L.hm, L.slope);
    L.base = renderBase(L);
    const c0 = L.tf ? L.tf.sceneToLocal(0, 0) : { x: L.hm.width * L.hm.cellSize_m / 2, y: L.hm.height * L.hm.cellSize_m / 2 };
    start = { x: c0.x, y: c0.y }; // lander starts at the Walk view's origin
    if (L.tf) {
      rover = { x: start.x + RELAY_OFFSET.dx, y: start.y + RELAY_OFFSET.dy };
      const Q = L.tf.lonLatToLocal(QUELA.lon, QUELA.lat);
      waypoints = SCENARIO.map((w) => ({ ...snapFlat(w.quela ? Q : { x: start.x + w.dx, y: start.y + w.dy }), task: w.task, minutes: STATION_TASKS[w.task].minutes }));
    } else rover = { x: c0.x, y: c0.y - 300 };
    fit(); msg = '';
    replan(true); draw(); window.__map = api;
  }

  // nearest cell flatter than maxDeg within R cells (default scenario stations must sit on walkable ground)
  function snapFlat(p, maxDeg = 12, R = 30) {
    const W = L.hm.width, Hh = L.hm.height, c0 = Math.floor(p.x / cs()), r0 = Math.floor(p.y / cs());
    let best = null;
    for (let r = Math.max(0, r0 - R); r <= Math.min(Hh - 1, r0 + R); r++) for (let c = Math.max(0, c0 - R); c <= Math.min(W - 1, c0 + R); c++) {
      if (!(L.slope[r * W + c] <= maxDeg)) continue;
      const d = Math.hypot(c - c0, r - r0); if (!best || d < best.d) best = { d, x: (c + 0.5) * cs(), y: (r + 0.5) * cs() };
    }
    return best ? { x: best.x, y: best.y } : p;
  }

  function renderBase({ hm, slope }) {
    const { width: W, height: H, cellSize_m: cs, data } = hm;
    const lo = hex(css('--terrain-lo')), hi = hex(css('--terrain-hi')), warn = hex(css('--warn')), bad = hex(css('--danger'));
    let mn = Infinity, mx = -Infinity;
    for (let i = 0; i < data.length; i += 7) { const v = data[i]; if (v === v) { if (v < mn) mn = v; if (v > mx) mx = v; } }
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), img = g.createImageData(W, H), o = img.data;
    const az = (315 * Math.PI) / 180, alt = (40 * Math.PI) / 180, lx = Math.sin(az) * Math.cos(alt), ly = -Math.cos(az) * Math.cos(alt), lz = Math.sin(alt);
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i, p = k * 4, z = data[k];
      if (z !== z) { o[p] = 40; o[p + 1] = 34; o[p + 2] = 36; o[p + 3] = 255; continue; }
      const l = data[j * W + Math.max(0, i - 1)], r = data[j * W + Math.min(W - 1, i + 1)], u = data[Math.max(0, j - 1) * W + i], d = data[Math.min(H - 1, j + 1) * W + i];
      let sh = 0.75;
      if (l === l && r === r && u === u && d === d) {
        const gx = (r - l) / (2 * cs), gy = (d - u) / (2 * cs); // gy positive = downhill to the south
        const nl = Math.hypot(gx, gy, 1);
        sh = Math.max(0, (-gx * lx - gy * ly * -1 + lz) / nl); // north is up on screen
        sh = 0.25 + 0.95 * sh;
      }
      const t = Math.min(1, Math.max(0, (z - mn) / (mx - mn || 1)));
      let R = (lo[0] + (hi[0] - lo[0]) * t) * sh, G = (lo[1] + (hi[1] - lo[1]) * t) * sh, B = (lo[2] + (hi[2] - lo[2]) * t) * sh;
      const sd = slope[k];
      if (sd !== sd) { R = 60; G = 56; B = 58; }
      else if (sd > SLOPE_HARD_DEG) { R = R * 0.35 + bad[0] * 0.65; G = G * 0.35 + bad[1] * 0.65; B = B * 0.35 + bad[2] * 0.65; }
      else if (sd > SLOPE_PREFER_DEG) { R = R * 0.55 + warn[0] * 0.45; G = G * 0.55 + warn[1] * 0.45; B = B * 0.55 + warn[2] * 0.45; }
      o[p] = R; o[p + 1] = G; o[p + 2] = B; o[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  // ---- coordinates ----
  const cs = () => L.hm.cellSize_m;
  const toScreen = (p) => [(p.x / cs()) * view.s + view.ox, (p.y / cs()) * view.s + view.oy];
  const toLocal = (sx, sy) => ({ x: ((sx - view.ox) / view.s) * cs(), y: ((sy - view.oy) / view.s) * cs() });
  const cellOf = (p) => [Math.min(L.hm.width - 1, Math.max(0, Math.floor(p.x / cs()))), Math.min(L.hm.height - 1, Math.max(0, Math.floor(p.y / cs())))];
  function fit() {
    const w = canvas.width = el.clientWidth, h = canvas.height = el.clientHeight;
    // frame the working area (lander, rover, stations) in the space right of the side panel; whole DTM if there is none
    const pts = [start, rover, ...waypoints].filter(Boolean);
    if (pts.length < 2) { const s = Math.min(w, h) / L.hm.width * 0.96; view = { s, ox: (w - L.hm.width * s) / 2, oy: (h - L.hm.height * s) / 2 }; return; }
    const pad = 70, x0 = Math.min(...pts.map((p) => p.x)) - pad, x1 = Math.max(...pts.map((p) => p.x)) + pad, y0 = Math.min(...pts.map((p) => p.y)) - pad, y1 = Math.max(...pts.map((p) => p.y)) + pad;
    const left = w > 800 ? 400 : 0, aw = w - left - 20, ah = h - 20;
    const s = Math.min(aw / ((x1 - x0) / cs()), ah / ((y1 - y0) / cs()));
    view = { s, ox: left + (aw - ((x1 - x0) / cs()) * s) / 2 - (x0 / cs()) * s, oy: 10 + (ah - ((y1 - y0) / cs()) * s) / 2 - (y0 / cs()) * s };
  }

  // ---- planning ----
  function replan(commsToo) {
    const pts = [start, ...waypoints];
    const cells = pts.map(cellOf);
    const capKJ = DEFAULTS.capacityKJ * (capacityPct / 100);
    route = null;
    if (pts.length > 1) {
      route = planRoute(L.hm, L.slope, cells, { grid: L.grid });
      route.waypoints = waypoints.slice(); route.rover = { ...rover }; route.start = { ...start };
      const P = route.points;
      // stations sit at the end point of each feasible leg
      route.stations = [];
      for (const l of route.legs) {
        const w = waypoints[l.to - 1];
        if (l.feasible && w.task && w.task !== 'none' && w.minutes > 0) {
          P[l.endIdx].stationS = w.minutes * 60;
          route.stations.push({ n: l.to, wp: l.to - 1, idx: l.endIdx, task: w.task, minutes: w.minutes });
        }
      }
      if (P.length > 1) {
        const r = computeReserve(P.map((p) => ({ dist_m: p.dist_m, elev_m: p.elev_m, stationS: p.stationS, time_s: p.time_s })), { capacityKJ: capKJ });
        route.reserve = r; route.turnBackIndex = r.turnBackIndex;
        P.forEach((p, i) => { const q = r.points[i]; p.elapsed_s = q.elapsed_s; p.remainingFraction = q.remainingFraction; p.metabolicW = q.metabolicW; });
        route.startHour = startH;
        route.turnBackStation = r.turnBackIndex >= 0 ? route.stations.find((s) => s.idx === r.turnBackIndex) || null : null;
        for (const st of route.stations) { st.arrive_s = P[st.idx].elapsed_s - st.minutes * 60; st.depart_s = P[st.idx].elapsed_s; st.remainingFraction = P[st.idx].remainingFraction; st.afterTurnBack = r.turnBackIndex >= 0 && st.idx >= r.turnBackIndex; }
      } else route.turnBackIndex = -1;
      route.toScene = L.tf ? (x, y) => L.tf.localToScene(x, y) : null;
      route.layer = L.name;
    }
    if (commsToo) computeComms();
    attachShadows(); renderCommsOverlay();
    publish();
    panelUpdate(); draw();
  }
  // Route results for the Walk view. `reserve`/`comms` use the shapes walk/hud.js reads.
  // route.points[i] additionally carry elapsed_s, remainingFraction, metabolicW, inShadow;
  // route.stations, route.shadowSegments, route.turnBackIndex/turnBackStation, route.startHour.
  function publish() {
    const rs = route && route.reserve, last = rs && rs.points[rs.points.length - 1];
    app.set({
      route, rover: { ...rover }, start: { ...start },
      reserve: last ? { fraction: Math.max(0, Math.min(1, last.remainingKJ / rs.capacityKJ)) } : undefined,
      comms: route && route.shadows ? { status: route.shadows.length ? 'shadow' : 'ok' } : undefined,
    });
  }
  let commsTimer = 0, commsKey = '';
  function computeComms() {
    const key = rover.x.toFixed(1) + ',' + rover.y.toFixed(1);
    if (key === commsKey) return; commsKey = key;
    const t0 = performance.now();
    vis = viewshed(L.hm, { x: rover.x, y: rover.y, antennaHeight_m: 2 }, 1.8);
    api.stats.viewshedMs = performance.now() - t0;
  }
  // Overlay: hatched magenta inside a corridor around the route, only the outline of shadow areas elsewhere,
  // so the base map stays readable even when the relay sees little of the area.
  function renderCommsOverlay() {
    if (!vis) return;
    const { width: W, height: H } = L.hm, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), m = hex(css('--comms-shadow')), d = img.data;
    let near = null;
    if (route && route.points.length > 1) { // corridor mask: route stroked 90 m wide
      const mk = document.createElement('canvas'); mk.width = W; mk.height = H; const mg = mk.getContext('2d');
      mg.lineWidth = 90 / cs(); mg.lineCap = mg.lineJoin = 'round'; mg.strokeStyle = '#000'; mg.beginPath();
      route.points.forEach((p, i) => (i ? mg.lineTo(p.x / cs(), p.y / cs()) : mg.moveTo(p.x / cs(), p.y / cs()))); mg.stroke();
      near = mg.getImageData(0, 0, W, H).data;
    }
    for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) {
      const k = j * W + i; if (vis[k] !== HIDDEN) continue;
      const edge = i > 0 && j > 0 && i < W - 1 && j < H - 1 && (vis[k - 1] !== HIDDEN || vis[k + 1] !== HIDDEN || vis[k - W] !== HIDDEN || vis[k + W] !== HIDDEN);
      let a = 0;
      if (edge) a = 150;
      else if (near && near[k * 4 + 3] > 0 && (i + j) % 5 === 0) a = 120; // diagonal hatch
      if (a) { const p = k * 4; d[p] = m[0]; d[p + 1] = m[1]; d[p + 2] = m[2]; d[p + 3] = a; }
    }
    g.putImageData(img, 0, 0); comms = c;
  }
  function attachShadows() {
    if (!route) return;
    route.shadows = []; route.shadowSegments = [];
    if (!vis || route.points.length < 2) return;
    const { width: W, height: H } = L.hm, P = route.points;
    P.forEach((p) => { p.inShadow = vis[Math.min(H - 1, Math.max(0, Math.floor(p.y / cs()))) * W + Math.min(W - 1, Math.max(0, Math.floor(p.x / cs())))] === HIDDEN; });
    // clock: arrival at a point = elapsed minus station dwell there; leaving = elapsed. Dwell in shadow counts.
    const arr = (p) => (p.elapsed_s ?? p.time_s) - (p.stationS || 0), dep = (p) => p.elapsed_s ?? p.time_s;
    let a = -1;
    const close = (i0, i1, endT) => {
      const start_s = arr(P[i0]), duration_s = endT - start_s;
      const seg = { startIdx: i0, endIdx: i1, start: start_s, end: endT, duration_s, exceedsLimit: duration_s > DEFAULT_SHADOW_LIMIT_S, limit_s: DEFAULT_SHADOW_LIMIT_S };
      if (duration_s >= 30) { route.shadows.push(seg); route.shadowSegments.push(seg); }
      a = -1;
    };
    for (let i = 0; i < P.length; i++) {
      if (P[i].inShadow && a < 0) a = i;
      else if (!P[i].inShadow && a >= 0) close(a, i, arr(P[i]));
    }
    if (a >= 0) close(a, P.length - 1, dep(P[P.length - 1]));
  }
  function scheduleReplan(commsToo) {
    if (commsToo) { // viewshed is the slow part: debounce while dragging
      clearTimeout(commsTimer);
      commsTimer = setTimeout(() => { computeComms(); attachShadows(); renderCommsOverlay(); publish(); panelUpdate(); draw(); }, 160);
    }
    replan(false);
  }

  // ---- drawing ----
  function path(points, from, to) {
    ctx.beginPath();
    for (let i = from; i <= to; i++) { const [x, y] = toScreen(points[i]); i === from ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
  }
  function draw() {
    const w = canvas.width = el.clientWidth, h = canvas.height = el.clientHeight;
    ctx.fillStyle = css('--scrim-solid'); ctx.fillRect(0, 0, w, h);
    if (!L) { ctx.fillStyle = css('--hud-text'); ctx.font = '14px ' + css('--font-mono'); ctx.fillText(msg, 24, 70); return; }
    const W = L.hm.width, H = L.hm.height;
    ctx.imageSmoothingEnabled = view.s < 1.5;
    ctx.drawImage(L.base, view.ox, view.oy, W * view.s, H * view.s);
    if (comms) ctx.drawImage(comms, view.ox, view.oy, W * view.s, H * view.s);
    // walk square outline
    if (L.tf) {
      const h2 = L.tf.walkHalf_m, c = [[-h2, -h2], [h2, -h2], [h2, h2], [-h2, h2]].map(([x, z]) => toScreen(L.tf.sceneToLocal(x, z)));
      ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.strokeStyle = css('--hud-text'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      label('3D walk area', c[0][0] + 4, c[0][1] - 5);
      const q = toScreen(L.tf.lonLatToLocal(QUELA.lon, QUELA.lat));
      ctx.fillStyle = css('--hud-text'); ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.fill();
      if (!waypoints.some((w) => Math.hypot(toScreen(w)[0] - q[0], toScreen(w)[1] - q[1]) < 16)) label('Quela (drill site)', q[0] + 7, q[1] + 4);
    }
    // route
    if (route && route.points.length > 1) {
      const P = route.points;
      for (const l of route.legs) if (l.feasible) { path(P, l.startIdx, l.endIdx); ctx.strokeStyle = css('--route-casing'); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(); }
      for (const l of route.legs) if (l.feasible) { path(P, l.startIdx, l.endIdx); ctx.strokeStyle = css('--route'); ctx.lineWidth = 2.5; ctx.stroke(); }
      // comms shadow segments on the route: magenta casing, still readable over the route line
      for (const sg of route.shadowSegments || []) {
        path(P, sg.startIdx, sg.endIdx); ctx.strokeStyle = css('--comms-shadow'); ctx.lineWidth = 6; ctx.stroke();
        path(P, sg.startIdx, sg.endIdx); ctx.strokeStyle = sg.exceedsLimit ? css('--danger') : css('--route'); ctx.lineWidth = 1.6; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // infeasible legs: straight dashed line
    if (route) route.legs.forEach((l) => {
      if (l.feasible) return;
      const pts = [start, ...waypoints], a = toScreen(pts[l.from]), b = toScreen(pts[l.to]);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = css('--danger'); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    });
    // stations / waypoints
    waypoints.forEach((p, i) => {
      const [x, y] = toScreen(p), st = route && route.stations && route.stations.find((q) => q.wp === i), late = st && st.afterTurnBack;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = late ? css('--ink-muted') : css('--mars'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '600 11px ' + css('--font-body'); ctx.textAlign = 'center'; ctx.fillText(i + 1, x, y + 4); ctx.textAlign = 'left';
      if (st) label(STATION_TASKS[st.task].label + ' ' + st.minutes + ' min', x + 12, y + 4 + (i % 2 ? 10 : -4));
    });
    // turn-back point
    if (route && route.turnBackIndex > 0) {
      const tp = route.points[route.turnBackIndex], [x, y] = toScreen(tp), ts = route.turnBackStation;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = css('--turnback'); ctx.strokeStyle = css('--route-casing'); ctx.lineWidth = 2;
      ctx.fillRect(-8, -8, 16, 16); ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
      label('TURN BACK ' + (ts ? 'before station ' + ts.n + ' ' : '') + fmtClock(startH + tp.elapsed_s / 3600), x + 14, y - 10);
    }
    // lander (route start) and rover (comms source)
    if (start) {
      const [x, y] = toScreen(start);
      ctx.fillStyle = css('--route-casing'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 10, y + 8); ctx.lineTo(x - 10, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      label('Lander (EVA start)', x + 13, y + 5);
    }
    if (rover) {
      const [x, y] = toScreen(rover);
      ctx.fillStyle = css('--comms-shadow'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.fillRect(x - 7, y - 7, 14, 14); ctx.strokeRect(x - 7, y - 7, 14, 14);
      label('Rover on high ground (comms)', x + 12, y + 4);
    }
  }
  function label(t, x, y) {
    ctx.font = '600 11px ' + css('--font-body'); ctx.lineWidth = 3; ctx.strokeStyle = css('--route-casing'); ctx.strokeText(t, x, y); ctx.fillStyle = '#fff'; ctx.fillText(t, x, y);
  }

  // ---- panel (designer components: tile, chip, badge, button, provLegend) ----
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const head = h('div'); head.innerHTML = '<h3>EVA route planner</h3><div class="mp-sub"></div><p class="mp-hint">Click: add station &middot; drag: move (lander, rover or station) &middot; right-click: remove &middot; wheel: zoom &middot; shift-drag: pan.</p>';
  const out = h('div', 'mp-out'), ctl = h('div', 'mp-ctl');
  ctl.innerHTML = `<label>EVA start (local solar time) <input id="mp-clock" type="time" value="${fmtClock(EVA_START_H)}"></label>
    <label>Suit start level <b id="mp-capv">100%</b><input id="mp-cap" type="range" min="1" max="100" step="1" value="100"></label>`;
  const clear = button('Clear stations', { variant: 'secondary', onClick: () => { waypoints = []; replan(false); } });
  const note = h('p', 'mp-note', 'Model estimates (Pandolf load model, geometric radio line of sight, assumed station times). Not flight data.');
  panel.append(head, out, ctl, clear, provLegend(), note);
  panel.addEventListener('input', (e) => { if (e.target.id === 'mp-cap') { capacityPct = +e.target.value; panel.querySelector('#mp-capv').textContent = capacityPct + '%'; replan(false); } });
  panel.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'mp-clock' && t.value) { const [hh, mm] = t.value.split(':'); startH = +hh + mm / 60; replan(false); }
    if (t.dataset.st !== undefined) {
      const i = +t.dataset.st, w = waypoints[i];
      if (t.dataset.k === 'task') { w.task = t.value; if (STATION_TASKS[t.value]) w.minutes = STATION_TASKS[t.value].minutes; }
      else w.minutes = Math.max(0, Math.min(600, +t.value || 0));
      replan(false);
    }
  });
  function panelUpdate() {
    if (!L) return;
    panel.querySelector('.mp-sub').textContent = `${L.name} · slope limit ${SLOPE_HARD_DEG}°, prefer < ${SLOPE_PREFER_DEG}°`;
    out.replaceChildren();
    const t = route && route.total;
    if (!t) { out.append(h('p', null, 'Add at least one station.')); return; }
    const rs = route.reserve, last = rs && rs.points[rs.points.length - 1], sh = route.shadows || [];
    const endH = last ? startH + route.points.at(-1).elapsed_s / 3600 : startH;
    const tiles = h('div', 'mp-tiles');
    const dist = tile({ label: 'Walking distance', value: Math.round(t.dist_m), unit: 'm', prov: 'measured' }); dist.querySelector('.chip').title = 'Distance over HiRISE DTM terrain (NASA/UArizona); route choice is modelled.';
    const clk = tile({ label: 'EVA length', value: last ? (route.points.at(-1).elapsed_s / 3600).toFixed(1) : '--', unit: 'h', prov: 'modelled' });
    const res = tile({ label: 'Suit reserve at end', value: last ? Math.round(last.remainingFraction * 100) : '--', unit: '%', prov: 'modelled', state: last && last.mustTurnBack ? 'danger' : undefined });
    const worst = sh.reduce((m, s) => Math.max(m, s.duration_s), 0);
    const cm = tile({ label: 'Comms shadow on route', value: sh.length ? Math.round(worst / 60) : 0, unit: sh.length ? 'min longest' : 'min', prov: 'modelled', state: sh.some((s) => s.exceedsLimit) ? 'danger' : sh.length ? 'warn' : undefined });
    tiles.append(dist, clk, res, cm); out.append(tiles);
    const tb = route.turnBackIndex, tp = tb > 0 ? route.points[tb] : null;
    const verdict = h('p', 'mp-res');
    verdict.innerHTML = tp ? `<b class="bad-t">Turn back at ${fmtClock(startH + tp.elapsed_s / 3600)}</b> after ${Math.round(tp.dist_m)} m` + (route.turnBackStation ? ` (before finishing station ${route.turnBackStation.n})` : '') + `: remaining consumables would no longer cover the walk home plus the 20 % buffer.`
      : `Whole plan within budget; end margin ${last ? (last.marginKJ / 1000).toFixed(1) : '--'} MJ. EVA clock ${fmtClock(startH)} to ${fmtClock(endH)}.`;
    out.append(verdict);
    const sec = h('div', 'mp-sec'); sec.append(h('span', 'label', 'Stations'), chip('modelled', 'Assumption: station durations are ours, plausible analog-EVA scale (research/science.md); editable.'), h('span', 'mp-assume', 'durations assumed'));
    out.append(sec);
    const tbl = h('table', 'mp-st');
    waypoints.forEach((w, i) => {
      const st = route.stations.find((q) => q.wp === i), leg = route.legs[i];
      const tr = h('tr', st && st.afterTurnBack ? 'bad' : leg && !leg.feasible ? 'bad' : leg && leg.preferExceeded ? 'warn' : '');
      const sel = h('select'); sel.dataset.st = i; sel.dataset.k = 'task';
      for (const [k, v] of Object.entries({ none: { label: 'Waypoint' }, ...STATION_TASKS })) sel.append(new Option(v.label, k, false, (w.task || 'none') === k));
      const mins = h('input'); mins.type = 'number'; mins.min = 0; mins.max = 600; mins.value = w.minutes || 0; mins.dataset.st = i; mins.dataset.k = 'min';
      const td = (...n) => { const c = h('td'); c.append(...n); return c; };
      tr.append(td(badge(i + 1)), td(sel), td(mins, document.createTextNode(' min')),
        leg && leg.feasible ? td(document.createTextNode(`${Math.round(leg.dist_m)} m, ${st ? fmtClock(startH + st.arrive_s / 3600) : fmtT(leg.time_s)}`)) : td(document.createTextNode('infeasible: ' + (leg ? leg.reason : ''))));
      tbl.append(tr);
    });
    out.append(tbl);
    const seg = h('p', 'mp-res'); seg.innerHTML = `<span class="sw"></span> Comms shadow on route: ` + (sh.length ? sh.length + ' segment(s), longest ' + fmtT(worst) + (sh.some((s) => s.exceedsLimit) ? ' <b class="bad-t">exceeds 10 min limit</b>' : '') : 'none');
    out.append(seg);
  }

  // ---- input ----
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function hit(sx, sy) {
    if (rover) { const [x, y] = toScreen(rover); if (Math.hypot(sx - x, sy - y) < 14) return { kind: 'rover' }; }
    if (start) { const [x, y] = toScreen(start); if (Math.hypot(sx - x, sy - y) < 14) return { kind: 'start' }; }
    for (let i = waypoints.length - 1; i >= 0; i--) { const [x, y] = toScreen(waypoints[i]); if (Math.hypot(sx - x, sy - y) < 11) return { kind: 'wp', i }; }
    return null;
  }
  canvas.addEventListener('contextmenu', (e) => {
    e.preventDefault(); if (!L) return;
    const h = hit(...pos(e)); if (h && h.kind === 'wp') { waypoints.splice(h.i, 1); replan(false); }
  });
  canvas.addEventListener('pointerdown', (e) => {
    if (!L) return; const [sx, sy] = pos(e);
    if (e.button === 1 || (e.button === 0 && e.shiftKey)) { drag = { kind: 'pan', sx, sy, ox: view.ox, oy: view.oy }; canvas.setPointerCapture(e.pointerId); return; }
    if (e.button !== 0) return;
    const h = hit(sx, sy);
    drag = h ? { ...h, moved: false } : { kind: 'new', sx, sy };
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!L) return; const [sx, sy] = pos(e);
    if (!drag) { canvas.style.cursor = hit(sx, sy) ? 'grab' : 'crosshair'; return; }
    if (drag.kind === 'pan') { view.ox = drag.ox + sx - drag.sx; view.oy = drag.oy + sy - drag.sy; draw(); return; }
    if (drag.kind === 'new') return;
    drag.moved = true; const p = toLocal(sx, sy);
    if (drag.kind === 'rover') { rover = p; scheduleReplan(true); } else if (drag.kind === 'start') { start = p; scheduleReplan(false); } else { waypoints[drag.i] = p; scheduleReplan(false); }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!L || !drag) return; const [sx, sy] = pos(e), d = drag; drag = null;
    if (d.kind === 'new' && Math.hypot(sx - d.sx, sy - d.sy) < 5) { waypoints.push({ ...toLocal(sx, sy), task: 'sample', minutes: STATION_TASKS.sample.minutes }); replan(false); }
    else if (d.moved && d.kind === 'rover') replan(true);
  });
  canvas.addEventListener('wheel', (e) => {
    if (!L) return; e.preventDefault(); const [sx, sy] = pos(e), f = Math.exp(-e.deltaY * 0.0015), ns = Math.min(12, Math.max(0.3, view.s * f));
    view.ox = sx - ((sx - view.ox) / view.s) * ns; view.oy = sy - ((sy - view.oy) / view.s) * ns; view.s = ns; draw();
  }, { passive: false });
  addEventListener('resize', () => { if (L && app.get().view === 'map') draw(); });
  app.on((st, prev) => { if (st.view === 'map' && prev.view !== 'map' && L) { fit(); draw(); } });

  // ---- test / automation API ----
  const api = {
    stats: {},
    get layer() { return L; },
    setWaypoints(arr) { waypoints = arr.map((p) => ({ task: 'none', minutes: 0, ...p })); replan(false); },
    setStart(p) { start = { ...p }; replan(false); },
    setClock(h) { startH = h; replan(false); },
    setRover(p) { rover = { ...p }; commsKey = ''; replan(true); },
    setBudget(pct) { capacityPct = pct; replan(false); },
    route: () => route,
    local: (x, z) => L.tf.sceneToLocal(x, z),
  };
  init();
}
