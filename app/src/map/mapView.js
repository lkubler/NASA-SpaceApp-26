// Map view (2D route planner). Plain canvas + a plain HTML side panel; both are meant to be
// restyled/replaced by the designer (task 006). Logic lives in planner.js and model/*.
// Controls: click = add waypoint, drag a waypoint or the lander to move it, right-click a
// waypoint = remove, wheel = zoom, shift/middle-drag = pan.
import { app } from '../state.js';
import { loadDtm, makeTransform } from '../terrain/dtm.js';
import { whenHeightmap, slopeGrid } from '../terrain/heightmap.js';
import { planRoute, costGrid, SLOPE_HARD_DEG, SLOPE_PREFER_DEG } from './planner.js';
import { computeReserve, DEFAULTS } from '../model/reserve.js';
import { viewshed, routeShadows, HIDDEN } from '../model/comms.js';

const QUELA = { lon: 137.353006, lat: -4.695202 }; // rover waypoint at the Quela drill site (research/)
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
  let rover = null;
  let capacityPct = 100;
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
    rover = { x: c0.x, y: c0.y }; // lander starts at the Walk view's origin
    fit(); msg = '';
    replan(true); draw(); window.__map = api;
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
    const s = Math.min(w, h) / L.hm.width * 0.96;
    view = { s, ox: (w - L.hm.width * s) / 2, oy: (h - L.hm.height * s) / 2 };
  }

  // ---- planning ----
  function replan(commsToo) {
    const pts = [rover, ...waypoints];
    const cells = pts.map(cellOf);
    const capKJ = DEFAULTS.capacityKJ * (capacityPct / 100);
    route = null;
    if (pts.length > 1) {
      route = planRoute(L.hm, L.slope, cells, { grid: L.grid });
      route.waypoints = waypoints.slice(); route.rover = { ...rover };
      if (route.points.length > 1) {
        const r = computeReserve(route.points.map((p) => ({ dist_m: p.dist_m, elev_m: p.elev_m })), { capacityKJ: capKJ });
        route.reserve = r; route.turnBackIndex = r.turnBackIndex;
      } else route.turnBackIndex = -1;
      route.toScene = L.tf ? (x, y) => L.tf.localToScene(x, y) : null;
      route.layer = L.name;
    }
    if (commsToo) computeComms();
    attachShadows();
    publish();
    panelUpdate(); draw();
  }
  // Route results for the Walk view. `reserve`/`comms` use the shapes walk/hud.js reads.
  function publish() {
    const rs = route && route.reserve, last = rs && rs.points[rs.points.length - 1];
    app.set({
      route, rover: { ...rover },
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
    const { width: W, height: H } = L.hm, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), m = hex(css('--comms-shadow'));
    for (let i = 0; i < vis.length; i++) if (vis[i] === HIDDEN) { const p = i * 4; img.data[p] = m[0]; img.data[p + 1] = m[1]; img.data[p + 2] = m[2]; img.data[p + 3] = 85; }
    g.putImageData(img, 0, 0); comms = c;
    api.stats.viewshedMs = performance.now() - t0;
  }
  function attachShadows() {
    if (route && vis && route.points.length > 1) {
      route.shadows = routeShadows(route.points.map((p) => ({ x: p.x, y: p.y, time_s: p.time_s })), vis, { width: L.hm.width, height: L.hm.height, cellSize_m: cs() });
    } else if (route) route.shadows = [];
  }
  function scheduleReplan(commsToo) {
    if (commsToo) { // viewshed is the slow part: debounce while dragging
      clearTimeout(commsTimer);
      commsTimer = setTimeout(() => { computeComms(); attachShadows(); publish(); panelUpdate(); draw(); }, 160);
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
      label('Quela (drill site)', q[0] + 7, q[1] + 4);
    }
    // route
    if (route && route.points.length > 1) {
      const P = route.points;
      for (const l of route.legs) if (l.feasible) { path(P, l.startIdx, l.endIdx); ctx.strokeStyle = css('--route-casing'); ctx.lineWidth = 5; ctx.lineJoin = 'round'; ctx.stroke(); }
      for (const l of route.legs) if (l.feasible) { path(P, l.startIdx, l.endIdx); ctx.strokeStyle = css('--route'); ctx.lineWidth = 2.5; ctx.stroke(); }
      // comms shadow segments on the route (time -> index)
      for (const s of route.shadows || []) {
        const a = P.findIndex((p) => p.time_s >= s.start), b0 = P.findIndex((p) => p.time_s >= s.end), b = b0 < 0 ? P.length - 1 : b0;
        if (a < 0) continue;
        path(P, a, b); ctx.strokeStyle = css('--comms-shadow'); ctx.lineWidth = 4.5; ctx.stroke();
        path(P, a, b); ctx.strokeStyle = s.exceedsLimit ? css('--danger') : css('--route'); ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]); ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // infeasible legs: straight dashed line
    if (route) route.legs.forEach((l) => {
      if (l.feasible) return;
      const pts = [rover, ...waypoints], a = toScreen(pts[l.from]), b = toScreen(pts[l.to]);
      ctx.beginPath(); ctx.moveTo(...a); ctx.lineTo(...b); ctx.strokeStyle = css('--danger'); ctx.lineWidth = 3; ctx.setLineDash([8, 6]); ctx.stroke(); ctx.setLineDash([]);
    });
    // turn-back point
    if (route && route.turnBackIndex > 0) {
      const [x, y] = toScreen(route.points[route.turnBackIndex]);
      ctx.save(); ctx.translate(x, y); ctx.rotate(Math.PI / 4); ctx.fillStyle = css('--turnback'); ctx.strokeStyle = css('--route-casing'); ctx.lineWidth = 2;
      ctx.fillRect(-7, -7, 14, 14); ctx.strokeRect(-7, -7, 14, 14); ctx.restore();
      label('TURN BACK ' + Math.round(route.points[route.turnBackIndex].dist_m) + ' m', x + 12, y - 8);
    }
    // waypoints
    waypoints.forEach((p, i) => {
      const [x, y] = toScreen(p);
      ctx.beginPath(); ctx.arc(x, y, 8, 0, 7); ctx.fillStyle = css('--mars'); ctx.fill(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.font = '600 10px ' + css('--font-body'); ctx.textAlign = 'center'; ctx.fillText(i + 1, x, y + 3.5); ctx.textAlign = 'left';
    });
    // lander / rover (comms source)
    if (rover) {
      const [x, y] = toScreen(rover);
      ctx.fillStyle = css('--route-casing'); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x, y - 11); ctx.lineTo(x + 10, y + 8); ctx.lineTo(x - 10, y + 8); ctx.closePath(); ctx.fill(); ctx.stroke();
      label('Lander / comms', x + 13, y + 5);
    }
  }
  function label(t, x, y) {
    ctx.font = '600 11px ' + css('--font-body'); ctx.lineWidth = 3; ctx.strokeStyle = css('--route-casing'); ctx.strokeText(t, x, y); ctx.fillStyle = '#fff'; ctx.fillText(t, x, y);
  }

  // ---- panel (plain HTML, replaceable) ----
  panel.addEventListener('input', (e) => { if (e.target.id === 'mp-cap') { capacityPct = +e.target.value; replan(false); } });
  panel.addEventListener('click', (e) => { if (e.target.id === 'mp-clear') { waypoints = []; replan(false); } });
  function panelUpdate() {
    if (!L) return;
    const t = route && route.total, f1 = (n) => n.toFixed(1);
    const legs = route ? route.legs.map((l, i) => `<tr class="${l.feasible ? (l.preferExceeded ? 'warn' : '') : 'bad'}"><td>${i === 0 ? 'Lander' : i}&rarr;${i + 1}</td>${l.feasible
      ? `<td>${Math.round(l.dist_m)} m</td><td>${f1(l.maxSlope_deg)}&deg;</td><td>${fmtT(l.time_s)}</td>` : `<td colspan="3">infeasible: ${l.reason}</td>`}</tr>`).join('') : '';
    const sh = route && route.shadows || [];
    const worst = sh.reduce((m, s) => Math.max(m, s.duration_s), 0);
    let res = '';
    if (route && route.reserve) {
      const tb = route.turnBackIndex;
      res = tb > 0 ? `Turn back after <b>${Math.round(route.points[tb].dist_m)} m</b> (${fmtT(route.points[tb].time_s)}): remaining consumables no longer cover the walk back plus the 20 % buffer.`
        : `Whole route within budget; end margin ${Math.round(route.reserve.points.at(-1).marginKJ / 1000 * 10) / 10} MJ.`;
    }
    panel.innerHTML = `<h3>EVA route planner</h3>
      <div class="mp-sub">${L.name} &middot; slope limit ${SLOPE_HARD_DEG}&deg;, prefer &lt; ${SLOPE_PREFER_DEG}&deg;</div>
      <p class="mp-hint">Click: add waypoint &middot; drag: move &middot; right-click: remove &middot; wheel: zoom &middot; shift-drag: pan. The lander (triangle) is the comms source and the route start.</p>
      ${t ? `<div class="mp-total"><b>${Math.round(t.dist_m)} m</b> &middot; ${fmtT(t.time_s)} &middot; max slope ${f1(t.maxSlope_deg)}&deg;${t.feasible ? '' : ' <span class="bad-t">(infeasible leg)</span>'}</div>
      <table>${legs}</table>
      <p class="mp-res">${res}</p>
      <p class="mp-res"><span class="sw"></span> Comms shadow on route: ${sh.length ? sh.length + ' segment(s), longest ' + fmtT(worst) + (sh.some((s) => s.exceedsLimit) ? ' <b class="bad-t">exceeds 10 min limit</b>' : '') : 'none'}</p>` : '<p>Add at least one waypoint.</p>'}
      <label class="mp-cap">EVA budget at start: <b>${capacityPct}%</b> of 8 h<input id="mp-cap" type="range" min="1" max="100" step="1" value="${capacityPct}"></label>
      <button id="mp-clear">Clear waypoints</button>
      <p class="mp-note">Model estimates (Pandolf load model, geometric radio line of sight); see sources in the project docs.</p>`;
  }

  // ---- input ----
  let drag = null;
  const pos = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
  function hit(sx, sy) {
    if (rover) { const [x, y] = toScreen(rover); if (Math.hypot(sx - x, sy - y) < 14) return { kind: 'rover' }; }
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
    if (drag.kind === 'rover') { rover = p; scheduleReplan(true); } else { waypoints[drag.i] = p; scheduleReplan(false); }
  });
  canvas.addEventListener('pointerup', (e) => {
    if (!L || !drag) return; const [sx, sy] = pos(e), d = drag; drag = null;
    if (d.kind === 'new' && Math.hypot(sx - d.sx, sy - d.sy) < 5) { waypoints.push(toLocal(sx, sy)); replan(false); }
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
    setWaypoints(arr) { waypoints = arr.map((p) => ({ ...p })); replan(false); },
    setRover(p) { rover = { ...p }; commsKey = ''; replan(true); },
    setBudget(pct) { capacityPct = pct; replan(false); },
    route: () => route,
    local: (x, z) => L.tf.sceneToLocal(x, z),
  };
  init();
}
