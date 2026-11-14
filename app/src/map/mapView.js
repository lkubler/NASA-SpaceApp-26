// Map view (2D route planner). Plain canvas + a plain HTML side panel; both are meant to be
// restyled/replaced by the designer (task 006). Logic lives in planner.js and model/*.
// Controls: click = add waypoint, drag a waypoint or the lander to move it, right-click a
// waypoint = remove, wheel = zoom, shift/middle-drag = pan.
import { app } from '../state.js';
import { loadDtm, makeTransform } from '../terrain/dtm.js';
import { loadRegional, makeFrames } from '../terrain/regional.js';
import { buildScenario, snapFlat, QUELA } from './scenario.js';
import { whenHeightmap, slopeGrid } from '../terrain/heightmap.js';
import { planRoute, costGrid, SLOPE_HARD_DEG, SLOPE_PREFER_DEG } from './planner.js';
import { makeHome } from './home.js';
import { computeReserve, DEFAULTS, STATION_TASKS } from '../model/reserve.js';
import { viewshed, HIDDEN, DEFAULT_SHADOW_LIMIT_S, COMMS_SOURCE_NAME, bestRelay } from '../model/comms.js';
import { sunAtLtst } from '../model/mars24.js';
import { tile, chip, badge, button, provLegend } from '../ui/components.js';
import { autonomyBar } from '../ui/autonomy.js';
import { createStationCard } from '../ui/stationCard.js';
import { loadScience, legGrades, routeGrades, slopeStats } from './science.js';
import '../styles/science.css';

// Comms source: ONE name everywhere (COMMS_SOURCE_NAME in model/comms.js): a relay rover parked on high ground.
// Geometric line of sight from its 2 m antenna [assumption]. The lander is not the source and must see the relay.
// Default relay position: parked beside the lander (a plausible first guess; it sees little of the loop).
// "Move relay to high ground" searches the DTM for the position that keeps the crew in contact best.
const EVA_START_H = 8.5; // EVA clock start, local true solar time [assumption]
const fmtClock = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
// Default scenario (map/scenario.js): lander at site B ~2.5 km from Quela, five stations, a ~6 km EVA; the walk home is
// 45-55 min, a real share of the suit. Planning runs on the 5 m regional grid (terrain/regional.js); the 1 km grid and
// orthoimage give the detail inside the walk area.
const DTM_BASE_URL = (import.meta.env?.BASE_URL ?? '/') + 'data/murray/';
const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const hex = (c) => { const v = parseInt(c.replace('#', ''), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; };
const fmtT = (s) => (s >= 3600 ? Math.floor(s / 3600) + ' h ' : '') + Math.floor((s % 3600) / 60) + ' min ' + Math.round(s % 60) + ' s';

export function mountMap(el) {
  const canvas = document.createElement('canvas');
  const panel = document.createElement('div'); panel.id = 'map-panel';
  el.append(canvas, panel);
  const card = createStationCard(el);
  const ctx = canvas.getContext('2d');

  // ---- data + derived layers ----
  let L = null; // {hm, slope, meta, name, tf, grid, base, shade}
  let waypoints = []; // local metres [{x,y}]
  let rover = null, start = null; // rover = comms source (relay), start = lander = EVA start and end (loop)
  let home = null, homeKey = '', draggingStart = false; // home = best-path-home field (map/home.js)
  let shadowLimit_s = DEFAULT_SHADOW_LIMIT_S; // assumed mission rule, editable in the panel
  let capacityPct = 100, startH = EVA_START_H;
  let route = null, vis = null, comms = null; // comms = overlay canvas
  let view = { s: 1, ox: 0, oy: 0 }; // screen = cell * s + o   (cells of the DTM grid)
  let msg = 'Loading HiRISE DTM...';
  let sci = null, ortho = null; // science layers: Curiosity track + station photos; HiRISE orthoimage
  const layers = { ortho: true, hazards: false, track: true };

  // The planning layer L is the 5 m regional grid (frame: regional local metres). Fallbacks keep the map alive:
  // regional missing -> the 1 km DTM (frame offset 0); both missing -> the Access Mars grid.
  let tf1 = null, frames = null, orthoD = null; // tf1 = 1 km-frame transform; frames = regional <-> 1 km frame; orthoD = 1 km detail orthoimage
  const cs1 = () => (L.meta1 ? L.meta1.dtm.cell_m : cs());
  async function init() {
    let reg = null, d1 = null;
    try { d1 = await loadDtm(); } catch (e) { console.warn('1 km DTM unavailable', e); }
    try { reg = await loadRegional(DTM_BASE_URL); } catch (e) { console.warn('regional DTM unavailable, using the 1 km grid', e); }
    if (reg && d1) {
      L = reg; L.meta1 = d1.meta; frames = makeFrames(reg.meta, d1.meta.dtm.cell_m); tf1 = makeTransform(d1.meta);
      const o = frames.off, h2 = tf1.walkHalf_m;
      L.tf = { // regional-frame transform; walk-view coordinates go through tf1 (1 km frame)
        sceneToLocal: (x, z) => frames.fromCrop(tf1.sceneToLocal(x, z)), localToScene: (px, py) => tf1.localToScene(px - o.x, py - o.y),
        lonLatToLocal: (a, b) => frames.fromCrop(tf1.lonLatToLocal(a, b)), walkHalf_m: h2,
      };
    } else if (d1) {
      L = d1; L.meta1 = d1.meta; frames = makeFrames({ relation_to_1km_grid: { col_offset: 0, row_offset: 0 } }, d1.meta.dtm.cell_m); tf1 = makeTransform(d1.meta); L.tf = tf1;
    } else { // fallback layer: the Access Mars grid built by the Walk view
      const { hm } = await whenHeightmap(); L = { hm, slope: slopeGrid(hm), meta: null, name: 'Access Mars 0.5 m' };
    }
    L.grid = costGrid(L.hm, L.slope);
    L.base = renderBase(L);
    L.hazard = renderHazard(L);
    if (L.meta1) { // HiRISE orthoimage (regional 5 m, plus the 1 km detail at 2x resolution) and Curiosity's real traverse; all optional
      ortho = new Image(); ortho.onload = () => draw(); ortho.src = DTM_BASE_URL + (reg ? 'regional_ortho.jpg' : 'ortho_2048.jpg');
      if (reg) { orthoD = new Image(); orthoD.onload = () => draw(); orthoD.src = DTM_BASE_URL + 'ortho_2048.jpg'; }
      loadScience().then((s) => { sci = s; sci.slopes = slopeStats(legGrades(s.track.points, cs1()), SLOPE_HARD_DEG); panelUpdate(); draw(); }).catch((e) => console.warn('science layers unavailable', e));
    }
    if (L.tf) {
      const sc = buildScenario(L, L.tf, frames);
      start = sc.start; rover = sc.rover; waypoints = sc.waypoints;
    } else {
      const c0 = { x: L.hm.width * L.hm.cellSize_m / 2, y: L.hm.height * L.hm.cellSize_m / 2 };
      start = { x: c0.x, y: c0.y }; rover = { x: c0.x, y: c0.y - 300 };
    }
    fit(); msg = '';
    replan(true); draw(); window.__map = api;
  }
  // position of a 1 km-grid point (col,row) in the map frame (science layers are stored in 1 km-grid cells)
  const cropPt = (col, row) => (frames ? frames.cropCell(col, row) : { x: col * cs(), y: row * cs() });

  // Slope hazard overlay for the orthoimage: amber above the preferred slope, red above the hard limit
  function renderHazard({ hm, slope }) {
    const { width: W, height: H } = hm, cv = document.createElement('canvas'); cv.width = W; cv.height = H;
    const g = cv.getContext('2d'), img = g.createImageData(W, H), o = img.data, warn = hex(css('--warn')), bad = hex(css('--danger'));
    for (let k = 0; k < W * H; k++) {
      const sd = slope[k]; if (!(sd > SLOPE_PREFER_DEG)) continue;
      const c = sd > SLOPE_HARD_DEG ? bad : warn, p = k * 4; o[p] = c[0]; o[p + 1] = c[1]; o[p + 2] = c[2]; o[p + 3] = sd > SLOPE_HARD_DEG ? 150 : 90;
    }
    g.putImageData(img, 0, 0); return cv;
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
      else if (sd > SLOPE_HARD_DEG) { R = R * 0.62 + bad[0] * 0.38; G = G * 0.62 + bad[1] * 0.38; B = B * 0.62 + bad[2] * 0.38; }
      else if (sd > SLOPE_PREFER_DEG) { R = R * 0.9 + warn[0] * 0.1; G = G * 0.9 + warn[1] * 0.1; B = B * 0.9 + warn[2] * 0.1; }
      o[p] = R; o[p + 1] = G; o[p + 2] = B; o[p + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }

  // ---- coordinates ----
  const cs = () => L.hm.cellSize_m;
  const toScreen = (p) => [(p.x / cs()) * view.s + view.ox, (p.y / cs()) * view.s + view.oy];
  const toLocal = (sx, sy) => ({ x: ((sx - view.ox) / view.s) * cs(), y: ((sy - view.oy) / view.s) * cs() });
  const inGrid = (p) => p.x >= 0 && p.y >= 0 && p.x < L.hm.width * cs() && p.y < L.hm.height * cs();
  const cellOf = (p) => [Math.min(L.hm.width - 1, Math.max(0, Math.floor(p.x / cs()))), Math.min(L.hm.height - 1, Math.max(0, Math.floor(p.y / cs())))];
  function fit() {
    const w = canvas.width = el.clientWidth, h = canvas.height = el.clientHeight;
    // frame the working area (lander, rover, stations) in the space right of the side panel; whole DTM if there is none
    const pts = [start, rover, ...waypoints].filter(Boolean);
    if (pts.length < 2) { const s = Math.min(w, h) / L.hm.width * 0.96; view = { s, ox: (w - L.hm.width * s) / 2, oy: (h - L.hm.height * s) / 2 }; return; }
    const pad = 60, x0 = Math.min(...pts.map((p) => p.x)) - pad, x1 = Math.max(...pts.map((p) => p.x)) + pad, y0 = Math.min(...pts.map((p) => p.y)) - pad, y1 = Math.max(...pts.map((p) => p.y)) + pad;
    const left = w > 800 ? 470 : 0, aw = w - left - (w > 800 ? 170 : 20), ah = h - 60;
    const s = Math.min(aw / ((x1 - x0) / cs()), ah / ((y1 - y0) / cs()));
    view = { s, ox: left + (aw - ((x1 - x0) / cs()) * s) / 2 - (x0 / cs()) * s, oy: 30 + (ah - ((y1 - y0) / cs()) * s) / 2 - (y0 / cs()) * s };
  }

  // ---- planning ----
  function homeFor() {
    const key = cellOf(start).join(',');
    if (!home || (homeKey !== key && !draggingStart)) { home = makeHome(L.hm, L.grid, cellOf(start), {}); homeKey = key; }
    return home;
  }
  // Sunrise/sunset on the demo sol (Mars24, local true solar time); the EVA must end before sunset [modelled]
  let sunHours = null;
  function sunWindow() {
    if (sunHours) return sunHours;
    let rise = 6, set = 18;
    for (let h = 3; h < 12; h += 0.1) if (sunAtLtst(h).elevation > 0) { rise = h; break; }
    for (let h = 12; h < 23; h += 0.1) if (sunAtLtst(h).elevation < 0) { set = h; break; }
    return (sunHours = { rise, set });
  }
  function replan(commsToo) {
    const pts = [start, ...waypoints, start]; // a loop: the last leg walks home
    const cells = pts.map(cellOf);
    const capKJ = DEFAULTS.capacityKJ * (capacityPct / 100);
    route = null;
    if (waypoints.length) {
      const hm = homeFor();
      route = planRoute(L.hm, L.slope, cells, { grid: L.grid });
      route.waypoints = waypoints.slice(); route.rover = { ...rover }; route.start = { ...start };
      route.shadowLimit_s = shadowLimit_s;
      const P = route.points;
      // stations sit at the end point of each feasible leg (the last leg is the walk home, no station)
      route.stations = [];
      for (const l of route.legs) {
        const w = waypoints[l.to - 1];
        if (l.feasible && w && w.task && w.task !== 'none' && w.minutes > 0) {
          P[l.endIdx].stationS = w.minutes * 60;
          route.stations.push({ n: l.to, wp: l.to - 1, idx: l.endIdx, task: w.task, short: w.short, minutes: w.minutes });
        }
      }
      if (P.length > 1) {
        // true return cost: the best path home from each point on the same cost grid, not the outbound path reversed
        const rin = P.map((p) => { const [c, r] = cellOf(p); return { dist_m: p.dist_m, elev_m: p.elev_m, stationS: p.stationS, time_s: p.time_s, returnKJ: hm.returnKJ(c, r), returnS: hm.returnS(c, r) }; });
        const r = computeReserve(rin, { capacityKJ: capKJ });
        route.reserve = r; route.turnBackIndex = r.turnBackIndex; route.turnBack = r.turnBack;
        P.forEach((p, i) => { const q = r.points[i]; p.elapsed_s = q.elapsed_s; p.remainingFraction = q.remainingFraction; p.metabolicW = q.metabolicW; p.returnKJ = q.returnCostKJ; p.returnS = rin[i].returnS; });
        route.startHour = startH;
        const tb = r.turnBack;
        if (tb) {
          tb.clockH = startH + tb.leaveElapsed_s / 3600;
          route.turnBackStation = tb.kind === 'station' ? route.stations.find((s) => s.idx === tb.index) || null : route.stations.find((s) => s.idx > tb.index) || null;
          const [c, rr] = cellOf(P[tb.index]); route.homeFromTurnBack = hm.path(c, rr).map(([cc, r2]) => ({ x: (cc + 0.5) * cs(), y: (r2 + 0.5) * cs() }));
        } else { route.turnBackStation = null; route.homeFromTurnBack = null; }
        for (const st of route.stations) {
          const q = P[st.idx]; st.arrive_s = q.elapsed_s - st.minutes * 60; st.depart_s = q.elapsed_s; st.remainingFraction = q.remainingFraction;
          st.homeMin = q.returnS / 60; st.homePct = (q.returnKJ / capKJ) * 100;
          st.afterTurnBack = !!tb && (st.idx > tb.index || (tb.kind === 'station' && st.idx === tb.index));
        }
        const end = P[P.length - 1], sw = sunWindow(), endH = startH + end.elapsed_s / 3600;
        route.night = { rise: sw.rise, set: sw.set, endH, afterSunset: endH > sw.set, beforeSunrise: startH < sw.rise };
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
  // The Walk view works in the 1 km frame (x,y metres east/south of the 1 km grid's NW corner; points outside the grid are
  // negative or too large and get clipped there). Internally the map uses the regional frame, so publish a translated copy.
  const toWalk = (p) => (frames ? frames.toCrop(p) : { ...p });
  function walkRoute() {
    if (!route || !frames) return route;
    const sh = (p) => ({ ...p, ...toWalk(p) });
    return { ...route, points: route.points.map(sh), waypoints: route.waypoints.map(sh), start: toWalk(route.start), rover: toWalk(route.rover),
      homeFromTurnBack: route.homeFromTurnBack && route.homeFromTurnBack.map(toWalk), toScene: tf1 ? (x, y) => tf1.localToScene(x, y) : null };
  }
  function publish() {
    const rs = route && route.reserve, last = rs && rs.points[rs.points.length - 1];
    app.set({
      route: walkRoute(), rover: toWalk(rover), start: toWalk(start),
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
    // mask only (alpha = hidden cells along the route corridor); draw() fills it with a screen-space hatch so it stays crisp at any zoom
    if (near) for (let k = 0; k < W * H; k++) if (vis[k] === HIDDEN && near[k * 4 + 3] > 0) { const p = k * 4; d[p] = m[0]; d[p + 1] = m[1]; d[p + 2] = m[2]; d[p + 3] = 255; }
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
      const seg = { startIdx: i0, endIdx: i1, start: start_s, end: endT, duration_s, exceedsLimit: duration_s > shadowLimit_s, limit_s: shadowLimit_s };
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
    placed = [];
    for (const q of [...waypoints, start, rover].filter(Boolean)) { const [x, y] = toScreen(q); placed.push([x - 12, y - 14, 24, 26]); } // icons first: labels dodge them
    const W = L.hm.width, H = L.hm.height;
    ctx.imageSmoothingEnabled = view.s < 1.5;
    const useOrtho = layers.ortho && ortho && ortho.complete && ortho.naturalWidth;
    ctx.drawImage(useOrtho ? ortho : L.base, view.ox, view.oy, W * view.s, H * view.s);
    // zoom blend: the 1 km HiRISE detail (1 m/px, 2 px per metre of the file) fades in over the regional image
    const a = Math.min(1, Math.max(0, (view.s - 1.1) / 1.3));
    if (useOrtho && orthoD && orthoD.complete && orthoD.naturalWidth && a > 0 && frames) {
      const q = toScreen(frames.off), k = (1024 * cs1() / cs()) * view.s;
      ctx.save(); ctx.globalAlpha = a; ctx.imageSmoothingEnabled = true; ctx.drawImage(orthoD, q[0], q[1], k, k); ctx.restore();
    }
    if (layers.hazards && useOrtho) ctx.drawImage(L.hazard, view.ox, view.oy, W * view.s, H * view.s);
    if (comms) drawComms(W, H);
    // walk square outline
    if (L.tf) {
      const h2 = L.tf.walkHalf_m, c = [[-h2, -h2], [h2, -h2], [h2, h2], [-h2, h2]].map(([x, z]) => toScreen(L.tf.sceneToLocal(x, z)));
      ctx.beginPath(); c.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); ctx.closePath();
      ctx.strokeStyle = css('--hud-text'); ctx.lineWidth = 1.5; ctx.setLineDash([5, 4]); ctx.stroke(); ctx.setLineDash([]);
      label('3D walk area', c[0][0] + 4, c[0][1] - 5);
      if (!sci) {
        const q = toScreen(L.tf.lonLatToLocal(QUELA.lon, QUELA.lat));
        ctx.fillStyle = css('--hud-text'); ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 7); ctx.fill();
        if (!waypoints.some((w) => Math.hypot(toScreen(w)[0] - q[0], toScreen(w)[1] - q[1]) < 16)) label('Quela (drill site)', q[0] + 7, q[1] + 4);
      }
    }
    // Curiosity's real traverse (MEASURED): dotted line through drive-end positions with sol labels
    if (sci && layers.track) drawTrack();
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
      const pts = [start, ...waypoints, start], a = toScreen(pts[l.from]), b = toScreen(pts[l.to]);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = css('--danger'); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    });
    // way home from the turn-back point (best path on the cost grid), then the turn-back marker on the route
    if (route && route.turnBack && route.homeFromTurnBack && route.homeFromTurnBack.length > 1) {
      path(route.homeFromTurnBack, 0, route.homeFromTurnBack.length - 1); ctx.strokeStyle = css('--turnback'); ctx.lineWidth = 2.5; ctx.setLineDash([7, 5]); ctx.stroke(); ctx.setLineDash([]);
    }
    if (route && route.turnBack) {
      const tb = route.turnBack, tp = route.points[tb.index], [x, y] = toScreen(tp), ts = route.turnBackStation;
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = css('--turnback'); ctx.strokeStyle = css('--route-casing'); ctx.lineWidth = 2;
      ctx.fillRect(-8, -8, 16, 16); ctx.strokeRect(-8, -8, 16, 16); ctx.restore();
      label(tb.kind === 'station' ? `LEAVE STATION ${ts ? ts.n : ''} BY ${fmtClock(tb.clockH)}` : `TURN BACK BY ${fmtClock(tb.clockH)}`, x + 14, y - 10, { accent: true });
    }
    // stations / waypoints
    waypoints.forEach((p, i) => {
      const [x, y] = toScreen(p), st = route && route.stations && route.stations.find((q) => q.wp === i), late = st && st.afterTurnBack;
      ctx.beginPath(); ctx.arc(x, y, 9, 0, 7); ctx.fillStyle = late ? css('--ink-muted') : css('--mars'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '600 11px ' + css('--font-body'); ctx.textAlign = 'center'; ctx.fillText(i + 1, x, y + 4); ctx.textAlign = 'left';
      if (st) label((p.short || STATION_TASKS[st.task].label) + (view.s < 1.3 ? '' : ' ' + st.minutes + ' min'), x + 12, y + 4);
    });
    if (sci && layers.track) drawStations();
    // lander (route start) and rover (comms source)
    if (start) {
      const [x, y] = toScreen(start);
      ctx.fillStyle = css('--route-casing'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 10, y + 8); ctx.lineTo(x - 10, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      label('Lander (EVA start and end)', x + 13, y + 5);
    }
    if (rover) {
      const [x, y] = toScreen(rover);
      ctx.fillStyle = css('--comms-shadow'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.fillRect(x - 7, y - 7, 14, 14); ctx.strokeRect(x - 7, y - 7, 14, 14);
      label(COMMS_SOURCE_NAME.charAt(0).toUpperCase() + COMMS_SOURCE_NAME.slice(1) + ' (comms)', x + 12, y + 4);
    }
    if (sci && layers.track) drawSolLabels();
  }
  let hatch = null, tmp = null;
  function drawComms(W, H) {
    if (!hatch) {
      const t = document.createElement('canvas'); t.width = t.height = 8; const g = t.getContext('2d');
      g.strokeStyle = css('--comms-shadow'); g.lineWidth = 2; g.beginPath(); g.moveTo(-1, 9); g.lineTo(9, -1); g.moveTo(-1, 1); g.lineTo(1, -1); g.moveTo(7, 9); g.lineTo(9, 7); g.stroke();
      hatch = ctx.createPattern(t, 'repeat');
    }
    if (!tmp) tmp = document.createElement('canvas');
    if (tmp.width !== canvas.width || tmp.height !== canvas.height) { tmp.width = canvas.width; tmp.height = canvas.height; }
    const g = tmp.getContext('2d'); g.clearRect(0, 0, tmp.width, tmp.height);
    g.globalAlpha = 0.18; g.fillStyle = css('--comms-shadow'); g.fillRect(0, 0, tmp.width, tmp.height); g.globalAlpha = 1;
    g.fillStyle = hatch; g.fillRect(0, 0, tmp.width, tmp.height);
    g.globalCompositeOperation = 'destination-in'; g.imageSmoothingEnabled = true; g.drawImage(comms, view.ox, view.oy, W * view.s, H * view.s); g.globalCompositeOperation = 'source-over';
    ctx.drawImage(tmp, 0, 0);
  }
  function drawTrack() {
    const pts = sci.track.points.map((p) => ({ ...p, ...cropPt(p.col, p.row) })).filter(inGrid), sc = (p) => toScreen(p), mc = css('--prov-measured');
    ctx.beginPath(); pts.forEach((p, i) => { const [x, y] = sc(p); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); });
    ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(28,15,12,.85)'; ctx.lineWidth = 5; ctx.stroke();
    ctx.strokeStyle = mc; ctx.lineWidth = 2.2; ctx.setLineDash([2, 5]); ctx.lineCap = 'round'; ctx.stroke(); ctx.setLineDash([]); ctx.lineCap = 'butt';
    for (const p of pts) { const [x, y] = sc(p); ctx.fillStyle = mc; ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); }
  }
  // Sol labels go last and only where they do not collide with a station, route or lander label (or each other):
  // far fewer, and never on top of "Quela" or "3D walk area".
  function drawSolLabels() {
    const pts = sci.track.points.map((p) => ({ ...p, ...cropPt(p.col, p.row) })).filter(inGrid);
    ctx.font = '600 10px ' + css('--font-mono'); ctx.textAlign = 'left';
    const marks = [...waypoints, start, ...sci.stations.map((st) => cropPt(st.col, st.row))].filter(Boolean).map(toScreen);
    let last = null;
    for (const p of pts) {
      const [x, y] = toScreen(p), t = 'sol ' + p.sol, w = ctx.measureText(t).width + 8, r = [x + 5, y - 15, w, 13];
      if (last && Math.hypot(x - last[0], y - last[1]) < 64) continue;
      if (marks.some(([mx, my]) => Math.hypot(mx - x, my - y) < 26)) continue;
      if (placed.some((q) => r[0] < q[0] + q[2] && r[0] + r[2] > q[0] && r[1] < q[1] + q[3] && r[1] + r[3] > q[1])) continue;
      last = [x, y]; placed.push(r);
      ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(28,15,12,.9)'; ctx.strokeText(t, x + 6, y - 5); ctx.fillStyle = '#fff'; ctx.fillText(t, x + 6, y - 5);
    }
  }
  function drawStations() {
    for (const st of sci.stations) {
      const [x, y] = toScreen(cropPt(st.col, st.row));
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 7); ctx.strokeStyle = css('--prov-measured'); ctx.lineWidth = 2.5; ctx.setLineDash([4, 3]); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = css('--prov-measured'); ctx.beginPath(); ctx.arc(x, y, 3.5, 0, 7); ctx.fill();
      if (!waypoints.some((w) => Math.hypot(toScreen(w)[0] - x, toScreen(w)[1] - y) < 28)) label(st.name + ' (photo)', x + 12, y + 3, { dx: 14 });
    }
  }
  // Labels sit on a dark pill and dodge each other: try offsets around the anchor, keep the first free one.
  let placed = [];
  function label(t, x, y, o = {}) {
    ctx.font = '600 11px ' + css('--font-body');
    const w = ctx.measureText(t).width + 10, hh = 16, dx = o.dx ?? 12, up = o.pri ? 1 : 0;
    const cands = [[dx, -2], [dx, 14], [dx, -18], [-w - dx + 2, -2], [-w - dx + 2, 14], [-w / 2, -22], [-w / 2, 22], [dx, 30], [dx, -34]];
    for (let k = 2; k <= 7; k++) cands.push([dx + 4, -2 + 17 * k], [dx + 4, -2 - 17 * k], [-w - dx - 2, -2 + 17 * k], [-w - dx - 2, -2 - 17 * k]); // crowded: stack further out
    let pick = cands[0];
    for (const c of cands) { const r = [x + c[0] - 3, y + c[1] - 12, w, hh]; if (!placed.some((q) => r[0] < q[0] + q[2] && r[0] + r[2] > q[0] && r[1] < q[1] + q[3] && r[1] + r[3] > q[1])) { pick = c; break; } }
    const rx = x + pick[0] - 3, ry = y + pick[1] - 12; placed.push([rx, ry, w, hh]);
    ctx.fillStyle = o.accent ? 'rgba(255,178,36,.95)' : 'rgba(28,15,12,.82)';
    ctx.beginPath(); ctx.roundRect(rx, ry, w, hh, 3); ctx.fill();
    ctx.fillStyle = o.accent ? '#1C0F0C' : '#fff'; ctx.textAlign = 'left'; ctx.fillText(t, rx + 5, ry + 12);
  }

  // ---- on-map key: layer toggles, legend (magenta hatch, amber turn-back), credit ----
  const key = document.createElement('div'); key.className = 'map-key';
  key.innerHTML = `<div class="mk-h">Layers</div>
    <label><input type="checkbox" data-layer="ortho" checked> HiRISE orthoimage (off: shaded terrain)</label>
    <label><input type="checkbox" data-layer="hazards"> Slope hazards (amber &gt; ${SLOPE_PREFER_DEG}&deg;, red &gt; ${SLOPE_HARD_DEG}&deg;)</label>
    <label><input type="checkbox" data-layer="track" checked> Curiosity track and photo stations</label>
    <div class="mk-h">Key</div>
    <div class="mk-r"><i class="mk-hatch"></i> Comms shadow (no radio link)</div>
    <div class="mk-r"><i class="mk-diamond"></i> Turn-back / leave-by point</div>
    <div class="mk-r"><i class="mk-route"></i> Planned route</div>
    <div class="mk-r"><i class="mk-track"></i> Curiosity drive, labelled by sol</div>
    <div class="mk-r"><i class="mk-ring"></i> Station photo: click</div>
    <div class="mk-c"></div>`;
  key.querySelector('.mk-c').append(chip('measured', 'HiRISE orthoimage ESP_040770_1755 and DTM DTEEC_040770_1755_039280_1755_U01, NASA/JPL/University of Arizona. Curiosity track: NASA/JPL MMGIS waypoints.'), document.createTextNode(' HiRISE image: NASA/JPL/University of Arizona'));
  el.append(key);
  key.addEventListener('change', (e) => { const k = e.target.dataset.layer; if (k) { layers[k] = e.target.checked; if (k === 'track' && !e.target.checked) card.hide(); draw(); } });

  // ---- panel (designer components: tile, chip, badge, button, provLegend) ----
  const h = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const head = h('div'); head.innerHTML = '<h3>EVA route planner</h3><div class="mp-sub"></div><div class="mp-job">Walk out from a lander 2.5 km away and back. Click the map to add stations; get home with 20 % suit left.</div>';
  const ctl = h('div', 'mp-ctl');
  ctl.innerHTML = `<label>EVA start (local solar time) <input id="mp-clock" type="time" value="${fmtClock(EVA_START_H)}"></label>
    <label>Suit start level <b id="mp-capv">100%</b><input id="mp-cap" type="range" min="1" max="100" step="1" value="100"></label>`;
  const tilesBox = h('div'), verdictBox = h('div'), stBody = h('div'), valBody = h('div', 'mp-val'), moreDyn = h('div');
  const clear = button('Clear stations', { variant: 'secondary', onClick: () => { waypoints = []; replan(false); } });
  const fixBtn = button('Move relay to high ground', { variant: 'primary', onClick: () => moveRelay() });
  const btnRow = h('div', 'mp-btns'); btnRow.append(fixBtn, clear);
  let relayNote = '';
  const note = h('p', 'mp-note', 'Model estimates (Pandolf load model, geometric radio line of sight, assumed station times). Not flight data.');
  const auto = autonomyBar(); auto.classList.add('auto-panel');
  const hint = h('p', 'mp-hint'); hint.innerHTML = 'Click the map: add station &middot; drag: move lander, relay or station &middot; right-click: remove &middot; wheel: zoom &middot; shift-drag: pan &middot; click a ring: Curiosity photo.';
  const fold = (title, body, open, id) => { const d = h('details', 'mp-fold'); d.id = id; d.open = !!open; d.append(h('summary', null, title), body); return d; };
  const more = h('div'); more.append(hint, auto, moreDyn, provLegend(), note);
  panel.append(head, ctl, tilesBox, verdictBox, btnRow, fold('Stations: tasks and times', stBody, window.innerHeight >= 800, 'mp-f-st'), fold('Check against Curiosity and RAD data', valBody, false, 'mp-f-val'), fold('Comms rule, light time, legend, hints', more, false, 'mp-f-more'));
  panel.addEventListener('input', (e) => { if (e.target.id === 'mp-cap') { capacityPct = +e.target.value; panel.querySelector('#mp-capv').textContent = capacityPct + '%'; replan(false); } });
  panel.addEventListener('change', (e) => {
    const t = e.target;
    if (t.id === 'mp-limit') { shadowLimit_s = Math.max(1, Math.min(240, +t.value || 10)) * 60; replan(false); return; }
    if (t.id === 'mp-clock' && t.value) { const [hh, mm] = t.value.split(':'); startH = +hh + mm / 60; replan(false); }
    if (t.dataset.st !== undefined) {
      const i = +t.dataset.st, w = waypoints[i];
      if (t.dataset.k === 'task') { w.task = t.value; if (STATION_TASKS[t.value]) w.minutes = STATION_TASKS[t.value].minutes; }
      else w.minutes = Math.max(0, Math.min(600, +t.value || 0));
      replan(false);
    }
  });
  // Search the DTM for the relay position with the least time out of contact (lander must see it) and move it there.
  function moveRelay() {
    if (!L || !route) return;
    const P = route.points, idx = new Set([0, P.length - 1]);
    for (let i = 0; i < P.length; i += Math.max(1, Math.round(35 / cs()) * 2)) idx.add(i);
    route.stations.forEach((st) => idx.add(st.idx));
    const samples = [...idx].sort((p, q) => p - q).map((i) => ({ x: P[i].x, y: P[i].y, from_s: P[i].elapsed_s - (P[i].stationS || 0), to_s: P[i].elapsed_s }));
    const xs = P.map((p) => p.x), ys = P.map((p) => p.y), pad = 200, step = Math.max(20, Math.round(80 / cs()) * cs()), cands = [], W = L.hm.width;
    for (let y = Math.max(0, Math.min(...ys) - pad); y <= Math.min(L.hm.height * cs() - 1, Math.max(...ys) + pad); y += step)
      for (let x = Math.max(0, Math.min(...xs) - pad); x <= Math.min(W * cs() - 1, Math.max(...xs) + pad); x += step) {
        const [c, r] = cellOf({ x, y }); if (L.slope[r * W + c] <= SLOPE_HARD_DEG) cands.push({ x, y });
      }
    cands.sort((p, q) => Math.hypot(p.x - rover.x, p.y - rover.y) - Math.hypot(q.x - rover.x, q.y - rover.y));
    const was = Math.max(0, ...(route.shadows || []).map((sg) => sg.duration_s));
    const best = bestRelay(L.hm, samples, cands, { mustSee: start });
    if (!best) { relayNote = 'No position found that sees the lander.'; panelUpdate(); return; }
    rover = { x: best.x, y: best.y }; commsKey = ''; replan(true);
    const now = Math.max(0, ...(route.shadows || []).map((sg) => sg.duration_s));
    relayNote = `Relay moved ${Math.round(Math.hypot(best.x - start.x, best.y - start.y))} m from the lander: longest time out of contact ${Math.round(was / 60)} min to ${Math.round(now / 60)} min.`;
    panelUpdate();
  }
  function panelUpdate() {
    if (!L) return;
    panel.querySelector('.mp-sub').textContent = `${L.name} · slope limit ${SLOPE_HARD_DEG}°, prefer < ${SLOPE_PREFER_DEG}° · click map to add stations`;
    for (const e of [tilesBox, verdictBox, stBody, moreDyn]) e.replaceChildren();
    const t = route && route.total;
    valBody.replaceChildren(); validationPanel(valBody);
    if (!t) { verdictBox.append(h('p', 'mp-res', 'Add at least one station.')); return; }
    const rs = route.reserve, P = route.points, last = rs && rs.points[rs.points.length - 1], sh = route.shadows || [], tb = route.turnBack, buf = DEFAULTS.bufferFrac;
    const endH = last ? startH + P.at(-1).elapsed_s / 3600 : startH, night = route.night;
    const tiles = h('div', 'mp-tiles');
    const dist = tile({ label: 'Distance', value: t.dist_m >= 1000 ? (t.dist_m / 1000).toFixed(1) : Math.round(t.dist_m), unit: t.dist_m >= 1000 ? 'km' : 'm', prov: 'modelled' }); dist.querySelector('.chip').title = 'Route length computed on measured HiRISE DTM terrain (NASA/UArizona); route choice is modelled.';
    const clk = tile({ label: 'EVA length', value: last ? (P.at(-1).elapsed_s / 3600).toFixed(1) : '--', unit: 'h', prov: 'modelled', state: night && (night.afterSunset || night.beforeSunrise) ? 'warn' : undefined });
    // reserve at the lander, coloured by margin against the 20 % buffer; the sentence below says why (same numbers)
    const endFrac = last ? last.remainingFraction : 0;
    const res = tile({ label: 'Reserve at lander', value: last ? Math.round(endFrac * 100) : '--', unit: '% (buffer ' + Math.round(buf * 100) + ')', prov: 'modelled', state: tb || endFrac < buf ? 'danger' : endFrac < buf + 0.05 ? 'warn' : undefined });
    const worst = sh.reduce((m, s) => Math.max(m, s.duration_s), 0);
    const cm = tile({ label: 'Comms shadow', value: sh.length ? Math.round(worst / 60) : 0, unit: sh.length ? 'min longest' : 'min', prov: 'modelled', state: sh.some((s) => s.exceedsLimit) ? 'danger' : sh.length ? 'warn' : undefined });
    tiles.append(dist, clk, res, cm); tilesBox.append(tiles);
    // One story, three places (tile, this sentence, map label): same clock time, same station, reserve against the buffer.
    const verdict = h('p', 'mp-res'), ts = route.turnBackStation, endPct = Math.round(endFrac * 100), bufPct = Math.round(buf * 100);
    if (tb && tb.kind === 'station') {
      verdict.innerHTML = `<b class="bad-t">Leave station ${ts ? ts.n : ''} by ${fmtClock(tb.clockH)}.</b> As planned, the loop ends with ${endPct} % of the suit, below the ${bufPct} % buffer. You can work ${Math.round(tb.workS / 60)} of ${ts ? ts.minutes : '?'} min there; the best way home is ${Math.round(tb.returnS / 60)} min and ${Math.round((tb.returnKJ / rs.capacityKJ) * 100)} % of the suit.`;
    } else if (tb) {
      verdict.innerHTML = `<b class="bad-t">Turn back by ${fmtClock(tb.clockH)}</b> after ${Math.round(P[tb.index].dist_m)} m` + (ts ? `, on the way to station ${ts.n}` : '') + `. As planned, the loop ends with ${endPct} % of the suit, below the ${bufPct} % buffer; past this point the suit no longer covers the best way home (${Math.round(tb.returnS / 60)} min) plus the buffer.`;
    } else {
      verdict.innerHTML = `Whole loop within budget: back at the lander at ${fmtClock(endH)} with ${endPct} % of the suit left (buffer ${bufPct} %). EVA ${fmtClock(startH)} to ${fmtClock(endH)}.`;
    }
    verdictBox.append(verdict);
    if (night && (night.afterSunset || night.beforeSunrise)) {
      const w = h('p', 'mp-res'); w.innerHTML = `<b class="bad-t">${night.afterSunset ? `Sunset is at ${fmtClock(night.set)}: this EVA ends at ${fmtClock(night.endH)} in the dark.` : `Sunrise is at ${fmtClock(night.rise)}: this EVA starts in the dark.`}</b> <span class="mp-assume">Sun from Mars24, sol 1440 (modelled).</span>`;
      verdictBox.append(w);
    }
    if (relayNote) verdictBox.append(h('p', 'mp-assume', relayNote));
    const sec = h('div', 'mp-sec'); sec.append(chip('modelled', 'Assumption: station durations are ours, plausible analog-EVA scale (research/science.md); editable.'), h('span', 'mp-assume', 'durations assumed, editable'));
    stBody.append(sec);
    const tbl = h('table', 'mp-st');
    waypoints.forEach((w, i) => {
      const st = route.stations.find((q) => q.wp === i), leg = route.legs[i];
      const tr = h('tr', st && st.afterTurnBack ? 'bad' : leg && !leg.feasible ? 'bad' : leg && leg.preferExceeded ? 'warn' : '');
      const sel = h('select'); sel.dataset.st = i; sel.dataset.k = 'task';
      for (const [k, v] of Object.entries({ none: { label: 'Waypoint' }, ...STATION_TASKS })) sel.append(new Option(v.label, k, false, (w.task || 'none') === k));
      const mins = h('input'); mins.type = 'number'; mins.min = 0; mins.max = 600; mins.value = w.minutes || 0; mins.dataset.st = i; mins.dataset.k = 'min';
      const td = (...n) => { const c = h('td'); c.append(...n); return c; };
      tr.append(td(badge(i + 1)), td(sel), td(mins, document.createTextNode(' min')),
        leg && leg.feasible ? td(document.createTextNode(`${Math.round(leg.dist_m)} m, ${st ? fmtClock(startH + st.arrive_s / 3600) : fmtT(leg.time_s)}` + (st ? `, home ${Math.round(st.homeMin)} min / ${Math.round(st.homePct)} %` : ''))) : td(document.createTextNode('infeasible: ' + (leg ? leg.reason : ''))));
      if (w.short) tr.title = w.short;
      tbl.append(tr);
    });
    stBody.append(tbl);
    const homeLeg = route.legs[route.legs.length - 1];
    if (homeLeg && homeLeg.feasible && waypoints.length) stBody.append(h('p', 'mp-assume', `Last leg home: ${Math.round(homeLeg.dist_m)} m. "home" = best path to the lander from that station, not the outbound path reversed. Amber = slope above ${SLOPE_PREFER_DEG}°; red = after the turn-back point or infeasible.`));
    const seg = h('p', 'mp-res'); seg.innerHTML = `<span class="sw"></span> Comms shadow on route (${COMMS_SOURCE_NAME}): ` + (sh.length ? sh.length + ' segment(s), longest ' + fmtT(worst) + (sh.some((s) => s.exceedsLimit) ? ` <b class="bad-t">exceeds assumed ${Math.round(shadowLimit_s / 60)} min mission rule</b>` : '') : 'none');
    moreDyn.append(seg);
    const lim = h('label', 'mp-assume'); lim.innerHTML = `Assumed mission rule: max min out of contact <input id="mp-limit" type="number" min="1" max="240" value="${Math.round(shadowLimit_s / 60)}" style="width:4em"> (our assumption, not a NASA figure)`;
    moreDyn.append(lim);
  }
  // Validation (jury change 5, cheapest honest version): slopes Curiosity really drove vs. our limits, plus one sourced shielding fact.
  function validationPanel(box) {
    const add = (html) => { const p = h('p', 'mp-vp'); p.innerHTML = html; box.append(p); return p; };
    const sec = h('div', 'mp-sec'); sec.append(chip('measured', 'Curiosity waypoint positions and elevations, NASA/JPL MMGIS.'), h('span', 'mp-assume', 'real Curiosity track'));
    box.append(sec);
    const c = sci && sci.slopes;
    if (c) add(`Between drive ends 5 to 76 m apart (sols 1414-1475, ${c.n} legs), Curiosity's net grade was median ${c.median.toFixed(1)}&deg; and at most ${c.max.toFixed(1)}&deg;, from the rover's own elevation at each drive end. Local slopes along each drive are not recorded.`);
    else add('Curiosity track loading...');
    const r = route && route.points.length > 1 ? slopeStats(routeGrades(route.points, 40), SLOPE_HARD_DEG) : null;
    if (r) add(`Our planned loop, same measure over 40 m stretches: median ${r.median.toFixed(1)}&deg;, at most ${r.max.toFixed(1)}&deg; (modelled). Steepest single cell on it: ${route.total.maxSlope_deg.toFixed(0)}&deg; against our ${SLOPE_HARD_DEG}&deg; suited-crew limit. Curiosity has its own limits, so this shows comparable terrain, not that our route is validated.`);
    add('<b>Shielding by terrain:</b> parked against a butte at Quela (sols 1455-1468), Curiosity\'s RAD instrument measured a dose about 4 % lower than in the open (NASA release; Ehresmann et al. 2021). Not applied to our dose numbers.');
    const src = h('p', 'mp-assume'); src.innerHTML = 'Source: <a href="https://doi.org/10.1029/2021JE006851" target="_blank" rel="noopener">Ehresmann et al. 2021, JGR Planets 126(8)</a>';
    box.append(src);
  }

  // ---- input ----
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function hit(sx, sy) {
    if (rover) { const [x, y] = toScreen(rover); if (Math.hypot(sx - x, sy - y) < 14) return { kind: 'rover' }; }
    if (start) { const [x, y] = toScreen(start); if (Math.hypot(sx - x, sy - y) < 14) return { kind: 'start' }; }
    for (let i = waypoints.length - 1; i >= 0; i--) { const [x, y] = toScreen(waypoints[i]); if (Math.hypot(sx - x, sy - y) < 11) return { kind: 'wp', i }; }
    const pi = poiAt(sx, sy, 16); if (pi) return { kind: 'poi', st: pi };
    return null;
  }
  function poiAt(sx, sy, r) {
    if (!sci || !layers.track) return null;
    let best = null;
    for (const st of sci.stations) { const [x, y] = toScreen(cropPt(st.col, st.row)), d = Math.hypot(sx - x, sy - y); if (d < r && (!best || d < best.d)) best = { d, st }; }
    return best && best.st;
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
    if (drag.kind === 'new' || drag.kind === 'poi') return;
    drag.moved = true; const p = toLocal(sx, sy);
    if (drag.kind === 'rover') { rover = p; scheduleReplan(true); } else if (drag.kind === 'start') { start = p; draggingStart = true; scheduleReplan(false); } else { waypoints[drag.i] = p; scheduleReplan(false); }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!L || !drag) return; const [sx, sy] = pos(e), d = drag; drag = null;
    if (d.kind === 'poi' && !d.moved) { card.show(d.st); return; }
    if (d.kind === 'wp' && !d.moved) { const pi = poiAt(...toScreen(waypoints[d.i]), 24); if (pi) card.show(pi); } // a planned station on a photo site
    if (d.kind === 'new' && Math.hypot(sx - d.sx, sy - d.sy) < 5) { waypoints.push({ ...toLocal(sx, sy), task: 'sample', minutes: STATION_TASKS.sample.minutes }); replan(false); }
    else if (d.moved && d.kind === 'rover') replan(true);
    else if (d.moved && d.kind === 'start') { draggingStart = false; replan(true); }
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
    moveRelay,
    setShadowLimitMin(m) { shadowLimit_s = m * 60; replan(false); },
    get relay() { return rover; },
    route: () => route,
    stationScreen(id) { const st = sci && sci.stations.find((q) => q.id === id); if (!st) return null; const [x, y] = toScreen(cropPt(st.col, st.row)), r = canvas.getBoundingClientRect(); return [x + r.left, y + r.top]; },
    local: (x, z) => L.tf.sceneToLocal(x, z),
    walkScreen() { const q = toScreen(L.tf.sceneToLocal(0, 0)), r = canvas.getBoundingClientRect(); return [q[0] + r.left, q[1] + r.top]; },
  };
  init();
}
