// Planned route in the 3D walk: ground-hugging ribbon (magenta where in comms shadow), waypoint and
// turn-back markers, edge arrows where the route leaves the 128 m square, live HUD feed (reserve, comms),
// warnings (slope over 20 deg, entering shadow, turn-back passed), spawn on the route, optional guided walk.
// Route coordinates arrive in DTM local metres; route.toScene(x, y) -> {x, z} converts (mapView). Every route
// field is read defensively: missing reserve/shadows/turnBackIndex just disable that feature.
import * as THREE from 'three';
import * as comms from '../model/comms.js';
import { app } from '../state.js';
import { mountStations } from './stations.js';
import { buildSeries } from '../model/timeSeries.js';

const LAPSE_S = 24; // guided walk: the whole EVA plays in ~24 s of wall time
const STEP = 0.5, HALF = 64, INSET = 0.75, LIFT = 0.14, SLOPE_WARN = 20;

function cssColor(name, fallback) {
  try { const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim(); if (v) return new THREE.Color(v); } catch (e) { /* ignore */ }
  return new THREE.Color(fallback);
}
const inside = (x, z) => Math.abs(x) <= HALF - INSET && Math.abs(z) <= HALF - INSET;

function labelSprite(text, color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  g.fillStyle = '#1a0f0a'; g.beginPath(); g.arc(32, 32, 28, 0, 7); g.fill();
  g.lineWidth = 5; g.strokeStyle = color; g.stroke();
  g.fillStyle = '#fff'; g.font = '700 30px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 32, 34);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, fog: false, depthTest: false, transparent: true }));
  s.scale.setScalar(1.3); s.renderOrder = 10; return s;
}

export function mountRoute3d({ scene, state, groundRaycast, hAt, container, eye = 1.7 }) {
  const group = new THREE.Group(); scene.add(group);
  const colRoute = cssColor('--route', '#35d0ff'), colShadow = new THREE.Color(0xff2bd6), colTurn = cssColor('--turnback', '#FFB224');
  const warnEl = document.createElement('div'); warnEl.className = 'walk-toast'; warnEl.hidden = true; container.append(warnEl);
  let toastT = 0;
  function toast(text, kind = 'warn', id = '') {
    warnEl.textContent = text; warnEl.dataset.kind = kind; warnEl.dataset.id = id; warnEl.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => { warnEl.hidden = true; }, 4500);
  }

  const stations = mountStations({ container, state });
  const flashEl = document.createElement('div'); flashEl.className = 'walk-flash'; container.append(flashEl);
  function flash() { flashEl.classList.remove('on'); void flashEl.offsetWidth; flashEl.classList.add('on'); }

  let R = null; // built route
  let routeRef = null, lapseT = 0, guided = false, lastIdx = -1, shSince = -1, shToast = false, tbPassed = false, slopeAt = -1e9, pubKey = '';
  const btn = document.createElement('button'); btn.className = 'walk-guide'; btn.textContent = 'Guided walk'; btn.hidden = true;
  container.append(btn);
  const photoBtn = document.createElement('button'); photoBtn.className = 'walk-photo'; photoBtn.type = 'button'; photoBtn.textContent = 'Show station photo'; photoBtn.hidden = true;
  photoBtn.addEventListener('click', (e) => { e.stopPropagation(); stations.showNearest(); });
  container.append(photoBtn);

  function clear() {
    group.traverse((o) => { if (o.geometry && !o.userData.shared) o.geometry.dispose(); if (o.material) { if (o.material.map) o.material.map.dispose(); o.material.dispose(); } });
    group.clear();
  }
  const ground = (x, z) => groundRaycast(x, z) ?? hAt(x, z);

  function build() {
    clear(); R = null; guided = false; shSince = -1; shToast = false; warnEl.hidden = true; btn.textContent = 'Guided walk'; pubKey = ''; if (app.get().eva) app.set({ eva: null });
    const route = app.get().route;
    const P = route && route.points, ts = route && typeof route.toScene === 'function' ? route.toScene : null;
    if (!P || P.length < 2 || !ts) { btn.hidden = true; return; }
    const sc = P.map((p) => ts(p.x, p.y));
    const shadows = route.shadows || [];
    const rs = route.reserve && route.reserve.points, cap = route.reserve && route.reserve.capacityKJ;
    const inSh = P.map((p) => (typeof p.inShadow === 'boolean' ? p.inShadow : shadows.some((s) => p.time_s >= s.start && p.time_s < s.end)));
    const rf = P.map((p, i) => {
      if (typeof p.remaining === 'number') return p.remaining;
      if (typeof p.reserveFraction === 'number') return p.reserveFraction;
      const r = rs && rs[i]; return r && cap ? Math.max(0, Math.min(1, r.remainingKJ / cap)) : null;
    });
    const S = []; // resampled every STEP metres
    for (let i = 0; i < P.length - 1; i++) {
      const a = sc[i], b = sc[i + 1], L = Math.hypot(b.x - a.x, b.z - a.z), n = Math.max(1, Math.ceil(L / STEP));
      for (let k = 0; k < n; k++) { const t = k / n; S.push({ x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, sh: inSh[i], idx: i }); }
    }
    const lp = P.length - 1; S.push({ x: sc[lp].x, z: sc[lp].z, sh: inSh[lp], idx: lp });
    S.forEach((s) => { s.in = inside(s.x, s.z); });

    // ribbon: one mesh, vertex colours, split into runs of in-square samples
    const pos = [], col = [], ind = [], W = 0.17; // thin ribbon: calm cyan at 45 % alpha, magenta only in shadow runs
    let runStart = -1;
    const flush = (end) => {
      if (runStart < 0) return;
      const base = pos.length / 3;
      for (let i = runStart; i < end; i++) {
        const p = S[i], q = S[Math.min(end - 1, i + 1)], o = S[Math.max(runStart, i - 1)];
        let tx = q.x - o.x, tz = q.z - o.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l;
        const nx = -tz * W, nz = tx * W, y = ground(p.x, p.z) + LIFT, c = p.sh ? colShadow : colRoute;
        const al = p.sh ? 0.7 : 0.45; pos.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz); col.push(c.r, c.g, c.b, al, c.r, c.g, c.b, al);
      }
      for (let i = 0; i < end - runStart - 1; i++) { const a = base + i * 2; ind.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
      runStart = -1;
    };
    S.forEach((s, i) => { if (s.in) { if (runStart < 0) runStart = i; } else flush(i); });
    flush(S.length);
    if (pos.length) {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4)); g.setIndex(ind);
      const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.frustumCulled = false; group.add(m);
    }
    // edge arrows where the route crosses the square boundary
    for (let i = 1; i < S.length; i++) {
      if (S[i].in === S[i - 1].in) continue;
      const leaving = S[i - 1].in, p = leaving ? S[i - 1] : S[i];
      const dx = S[i].x - S[i - 1].x, dz = S[i].z - S[i - 1].z, l = Math.hypot(dx, dz) || 1;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.2, 12), new THREE.MeshBasicMaterial({ color: colRoute }));
      cone.position.set(p.x, ground(p.x, p.z) + 2.2, p.z);
      const dir = new THREE.Vector3(leaving ? dx : -dx, 0, leaving ? dz : -dz).divideScalar(l);
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
      group.add(cone);
      const sp = labelSprite(leaving ? 'EXIT' : 'IN', '#' + colRoute.getHexString()); sp.position.set(p.x, ground(p.x, p.z) + 4, p.z); group.add(sp);
    }
    // waypoint + turn-back markers
    const pole = (x, z, h, color, label) => {
      const y = ground(x, z), m = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, h, 6), new THREE.MeshBasicMaterial({ color }));
      m.position.set(x, y + h / 2, z); group.add(m);
      const sp = labelSprite(label, '#' + new THREE.Color(color).getHexString()); sp.position.set(x, y + h + 0.7, z); group.add(sp);
    };
    (route.waypoints || []).forEach((w, i) => { const p = ts(w.x, w.y); if (inside(p.x, p.z)) pole(p.x, p.z, 3, colRoute, String(i + 1)); });
    if (route.start) { const p = ts(route.start.x, route.start.y); if (inside(p.x, p.z)) pole(p.x, p.z, 3, colRoute, 'L'); } // lander
    const tb = route.turnBackIndex;
    if (Number.isInteger(tb) && tb > 0 && tb < P.length && inside(sc[tb].x, sc[tb].z)) {
      pole(sc[tb].x, sc[tb].z, 4.5, colTurn, 'TB');
      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.07, 6, 32), new THREE.MeshBasicMaterial({ color: colTurn }));
      ring.rotation.x = Math.PI / 2; ring.position.set(sc[tb].x, ground(sc[tb].x, sc[tb].z) + 0.2, sc[tb].z); group.add(ring);
    }
    const el = P.map((p) => (typeof p.elapsed_s === 'number' ? p.elapsed_s : typeof p.time_s === 'number' ? p.time_s : null));
    const hasEl = el.every((v) => v != null) && el[el.length - 1] > 0;
    let lastIn = -1; S.forEach((s, i) => { if (s.in) lastIn = i; });
    R = { ser: buildSeries(route), sc, S, rf, inSh, el, hasEl, lastIn, startHour: typeof route.startHour === 'number' ? route.startHour : null, tb: Number.isInteger(tb) ? tb : -1, first: S.findIndex((s) => s.in) };
    btn.hidden = R.first < 0;
    lastIdx = -1; tbPassed = false;
    spawn();
  }

  function spawn() {
    if (!R || R.first < 0 || !state.ready) return;
    const a = R.S[R.first];
    let b = R.S[Math.min(R.S.length - 1, R.first + 6)];
    if (b === a) b = R.S[Math.max(0, R.first - 6)];
    state.pos.set(a.x, ground(a.x, a.z), a.z); state.eyeY = state.pos.y + eye;
    state.yaw = Math.atan2(-(b.x - a.x), -(b.z - a.z)); state.pitch = -0.12;
  }

  function nearest() {
    let bi = 0, bd = Infinity; const px = state.pos.x, pz = state.pos.z;
    for (let i = 0; i < R.sc.length; i++) { const d = (R.sc[i].x - px) ** 2 + (R.sc[i].z - pz) ** 2; if (d < bd) { bd = d; bi = i; } }
    return { i: bi, d: Math.sqrt(bd) };
  }

  function update(dt, slopeDeg = 0) {
    stations.update();
    const cur = app.get().route;
    if (cur !== routeRef) { routeRef = cur; build(); }
    if (!R) return;
    const { i: ni, d } = nearest();
    // Guided walk = time-lapse: the EVA clock runs along the whole route's elapsed_s while the camera walks the visible part,
    // so reserve, dose and signal change visibly within seconds. Free walk: values at the nearest route point.
    let i = ni, eva = null;
    if (guided && R.hasEl) {
      const tot = R.el[R.el.length - 1]; lapseT = Math.min(tot, lapseT + Math.min(dt, 0.1) * tot / LAPSE_S); const te = lapseT;
      let lo = 0, hi = R.el.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (R.el[m] < te) lo = m + 1; else hi = m; }
      i = lo; eva = { elapsed_s: te, startHour: R.startHour, timelapse: true };
    }
    // reserve by TIME (interpolated, also inside a station dwell), not the first route point at or after the clock
    const f = eva && R.ser ? R.ser.resFracAt(eva.elapsed_s) : R.rf[i], sh = R.inSh[i];
    const key = (f == null ? 'n' : Math.round(f * 100)) + (sh ? 's' : 'o') + (eva ? 't' + Math.round(eva.elapsed_s / 30) : '');
    if (key !== pubKey) { // HUD feed, published only on change (hud.js reads app state)
      pubKey = key; const patch = { comms: { status: sh ? 'shadow' : 'ok' }, eva };
      if (f != null) patch.reserve = { fraction: f };
      app.set(patch);
    }
    // toast follows the same sample as the SIGNAL tile (sh); only the toast start is debounced (1 s), and it clears when the shadow ends
    const tnow = performance.now();
    if (sh) {
      if (shSince < 0) shSince = tnow;
      if (!shToast && tnow - shSince > 1000) { shToast = true; toast('Entering comms shadow: no link to the ' + (comms.COMMS_SOURCE_NAME ?? 'relay rover'), 'danger', 'shadow'); }
    } else { shSince = -1; if (shToast) { shToast = false; if (warnEl.dataset.id === 'shadow') warnEl.hidden = true; } }
    if (R.tb > 0 && (guided || d < 12)) {
      if (i >= R.tb && lastIdx >= 0 && lastIdx < R.tb && !tbPassed) { tbPassed = true; toast('TURN-BACK POINT PASSED: reserve no longer covers the walk back', 'turn'); flash(); }
      if (i < R.tb - 3) tbPassed = false;
    }
    lastIdx = i;
    if (slopeDeg >= SLOPE_WARN && performance.now() - slopeAt > 6000) { slopeAt = performance.now(); toast('Slope ' + slopeDeg.toFixed(0) + '° under you: over the ' + SLOPE_WARN + '° limit', 'danger'); }
    if (guided) guide();
  }

  function nearestS() {
    let near = 0, nd = Infinity;
    for (let k = 0; k < R.S.length; k++) { const dd = (R.S[k].x - state.pos.x) ** 2 + (R.S[k].z - state.pos.z) ** 2; if (dd < nd) { nd = dd; near = k; } }
    return near;
  }
  function guide() {
    const near = nearestS();
    const t = Math.min(R.S.length - 1, near + 8);
    if (!R.S[t].in || near >= R.S.length - 2) { stop(); return; }
    const want = Math.atan2(-(R.S[t].x - state.pos.x), -(R.S[t].z - state.pos.z));
    let dy = want - state.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
    state.yaw += dy * 0.12; state.pitch += (-0.12 - state.pitch) * 0.05; state.keys.KeyW = true;
  }
  function stop() { guided = false; state.keys.KeyW = false; btn.textContent = 'Guided walk'; pubKey = ''; if (app.get().eva) app.set({ eva: null }); }
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (guided) { stop(); return; }
    guided = true; lapseT = R.hasEl ? R.el[R.S[R.first].idx] : 0; /* continue from the clock the walk shows: never jump backwards */ btn.textContent = 'Stop guided walk';
    spawn(); lastIdx = -1; shSince = -1; shToast = false; tbPassed = false; // start at the lander so the walk opens with LINK
    if (document.pointerLockElement) document.exitPointerLock();
    const m = document.getElementById('msg'); if (m) m.style.display = 'none';
  });
  app.on((st) => { photoBtn.hidden = st.view !== 'walk'; btn.style.display = st.view === 'walk' && R && R.first >= 0 ? '' : 'none'; if (st.view !== 'walk') { stations.hide(); if (guided) stop(); } });

  return { stations, update, spawn, rebuild: build, toast, seek(frac) { if (R && R.hasEl) lapseT = R.el[R.el.length - 1] * frac; }, tbFrac() { return R && R.hasEl && R.tb > 0 ? R.el[R.tb] / R.el[R.el.length - 1] : null; }, get built() { return R; }, get guided() { return guided; }, setGuided(v) { if (v !== guided) btn.click(); } };
}
