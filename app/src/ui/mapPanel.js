// Map panel: the walk square from above, north up, drawn from the same walk grid the visitor walks.
// Rounded panel; scale bar inside. Shaded relief in Mars orange and brown; optional layers:
// too steep (hatched), radio shadow (dotted). Vector layers (routes, markers) in an SVG on top.
// Coordinates: scene metres (x east, z north). project(x, z) -> SVG units (one unit = one grid cell).
//
// Pan and zoom (specs/feedback-1.md, Maps), one behaviour for every map: drag moves the map (limited to the
// site), click zooms in at the pointer, right click zooms out, wheel zooms, + / − / reset buttons, keys
// + − 0 while the pointer is over the map. A drag never counts as a click. The view is one
// { cx, cy, k } (centre in SVG units, zoom factor); k = 1 shows the whole site (or the step's crop).
// The SVG viewBox follows the view, so routes stay sharp; markers (every <g> placed with a translate in a
// layer) are counter-scaled and keep their size; the relief and the hatching are redrawn for the view
// onto a screen-sized canvas, the hatching at a fixed screen size; the scale bar is measured for the view.

import { h, s } from './dom.js';
import { closedMask } from '../core/planner.js';
import { radioShadowMask } from '../core/radio.js';
import { GROUND_RAMP } from '../core/groundColor.js';
import { labelTag } from './label.js';

const RES = 4; // source canvas pixels per grid cell
// view layout only (no physical values): zoom range, step per click / button / key, motion
const ZOOM_MIN = 1, ZOOM_MAX = 6, ZOOM_STEP = 2, ANIM_MS = 220, DRAG_PX = 4, PATTERN_PX = 0.7;
const FADE_CAP_MS = 4000; // fade option: longest wait for reveal() before the map is shown anyway
const NICE_M = [1, 2, 5, 10, 20, 50, 100];
// route drawing (drawIn): length of the draw, width of the uncovering stroke in grid cells (covers every route style)
const DRAW_MS = 600, DRAW_MASK_W = 8;
let drawSeq = 0;
/** Pointer travel (CSS px) before a press counts as a drag, not a click (shared with the steps that drag on a map). */
export const MAP_DRAG_PX = DRAG_PX;

/**
 * @param {Terrain} terrain  from core/terrain.js getTerrain()
 * @param {{ steep?: boolean, shadow?: boolean, scaleM?: number, patterns?: { steep?, shadow? }, patternPx?: number, fade?: boolean }} opts
 *   fade: the map content waits hidden for api.reveal() and then fades in (about 0.3 s).
 *   patterns: factories (ctx) => CanvasPattern for the hatching / dots (default: the shared ones);
 *   patternPx: CSS pixels per pattern pixel.
 *   movable: false = no drag, wheel, click or key zoom; only the + / − buttons zoom about the centre.
 *   resetButton: false = no reset-view button.
 * @returns {{ el, svg, canvas, project, unproject, layer, path, addMarker, setLayers, clearLayer, ... }}
 */
export function mapPanel(terrain, { steep = true, shadow = false, scaleM = 20, patterns = {}, patternPx = PATTERN_PX, fade = false, movable = true, resetButton = true } = {}) {
  const n = terrain.n;
  // source raster (relief or a step's own ground), one pixel per RES-th of a grid cell; not in the page
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = n * RES;
  // what the page shows: the view of the source, screen sized
  const screen = h('canvas.map__canvas');
  const svg = s('svg', { class: 'map__svg', viewBox: `0 0 ${n} ${n}`, preserveAspectRatio: 'xMidYMid meet' });
  const layers = {};
  for (const name of ['areas', 'routes', 'markers', 'top']) { layers[name] = s('g', { 'data-layer': name }); svg.append(layers[name]); }
  const bar = h('span.map__scale-bar');
  // the scale is measured on the walk grid the map is drawn from
  const scaleTag = labelTag({ label: 'model', text: 'Map scale measured on the 0.5 m walk grid built from the Access Mars terrain of Murray Buttes.', source: { title: 'Our walk grid (Access Mars Murray Buttes, NASA/JPL-Caltech imagery)', url: '', where: '' } });
  const scaleText = document.createTextNode(`${scaleM} m `);
  const scale = h('div.map__scale', bar, h('span.mono', scaleText, scaleTag));
  const north = h('div.map__north.mono', 'N');
  const btn = (cls, title, html, fn) => {
    const b = h(`button.map__btn.map__btn--${cls}`, { type: 'button', title, 'aria-label': title });
    b.innerHTML = html;
    b.addEventListener('click', (e) => { e.stopPropagation(); fn(); });
    return b;
  };
  const controls = h('div.map__zoom',
    btn('in', 'Zoom in (+)', '+', () => zoomBy(ZOOM_STEP)),
    btn('out', 'Zoom out (−)', '−', () => zoomBy(1 / ZOOM_STEP)),
    resetButton && btn('reset', 'Reset view (0)', '<svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true"><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>', () => reset()));
  const el = h(`div.map${movable ? '' : '.map--fixed'}`, screen, svg, scale, north, controls);
  // fade: ground, hatching, routes and markers stay hidden (the frame shows the dark ground tone) until
  // reveal(), then fade in together; revealed anyway after FADE_CAP_MS so a slow ground never hides the map
  let fadeTimer = 0;
  if (fade) {
    el.classList.add('map--fade', 'is-pending');
    fadeTimer = setTimeout(() => api.reveal(), FADE_CAP_MS);
  }

  const state = { steep, shadow };
  let markerK = 1; // marker size factor (a cropped, larger map keeps its markers at a readable size)
  const view = { cx: n / 2, cy: n / 2, k: 1 };
  let home = null;          // null = whole site; else { box: [x0, y0, x1, y1] SVG units, maxK }
  let homeApplied = false;  // the home view is set once the map has a size
  let W = 0, H = 0, s0 = 1; // map box in CSS px; px per SVG unit at k = 1
  const viewFns = [], readyFns = [];
  let ready = false;

  // ---------- masks for the screen-space overlays ----------
  const masks = {};
  function maskCanvas(name) {
    if (masks[name]) return masks[name];
    const mask = name === 'steep' ? closedMask(terrain) : radioShadowMask(terrain);
    const a = document.createElement('canvas'); a.width = a.height = n;
    const ag = a.getContext('2d');
    const id = ag.createImageData(n, n);
    for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
      id.data[4 * ((n - 1 - row) * n + col) + 3] = mask[row * n + col] ? 255 : 0; // north up
    }
    ag.putImageData(id, 0, 0);
    return (masks[name] = a);
  }
  const tmp = document.createElement('canvas');
  const pats = {};

  // ---------- source raster ----------
  canvas.getContext('2d').putImageData(relief(terrain), 0, 0);

  // ---------- view geometry ----------
  const isSlice = () => /slice/.test(svg.getAttribute('preserveAspectRatio') || '');
  function measure() {
    W = el.clientWidth; H = el.clientHeight;
    if (!W || !H) return false;
    s0 = (isSlice() ? Math.max(W, H) : Math.min(W, H)) / n;
    return true;
  }
  /** Keep the visible rectangle inside the site; centre an axis that shows the whole site. */
  function clamp(v) {
    const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, v.k));
    const sc = s0 * k, w = W / sc, hh = H / sc;
    const cx = w >= n ? n / 2 : Math.min(n - w / 2, Math.max(w / 2, v.cx));
    const cy = hh >= n ? n / 2 : Math.min(n - hh / 2, Math.max(hh / 2, v.cy));
    return { cx, cy, k };
  }
  function homeView() {
    if (!home) return { cx: n / 2, cy: n / 2, k: 1 };
    const [x0, y0, x1, y1] = home.box;
    const k = Math.max(ZOOM_MIN, Math.min(home.maxK, W / (s0 * Math.max(x1 - x0, 1e-6)), H / (s0 * Math.max(y1 - y0, 1e-6))));
    return clamp({ cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, k });
  }

  // ---------- drawing the view ----------
  let lastQ = null, lastKey = '';
  function placeAll() {
    const q = markerK / view.k;
    if (q === lastQ) return;
    lastQ = q;
    svg.querySelectorAll('[data-base]').forEach(place);
  }
  /** Transform of one placed element: its place, its screen offset (data-off, SVG units at k = 1), counter-scaled. */
  function place(g) {
    const q = markerK / view.k;
    const off = g.dataset.off ? g.dataset.off.split(' ').map(Number) : null;
    const shift = off ? ` translate(${(off[0] / view.k).toFixed(3)} ${(off[1] / view.k).toFixed(3)})` : '';
    g.setAttribute('transform', `${g.dataset.base}${shift} scale(${q.toFixed(4)})`);
    if (g._leader && off) {
      const [x, y] = g._at;
      g._leader.setAttribute('x2', (x + off[0] / view.k).toFixed(3));
      g._leader.setAttribute('y2', (y + off[1] / view.k).toFixed(3));
    }
  }

  function render() {
    if (!W || !H) return;
    const sc = s0 * view.k, w = W / sc, hh = H / sc;
    const vx = view.cx - w / 2, vy = view.cy - hh / 2;
    svg.setAttribute('viewBox', `${vx.toFixed(4)} ${vy.toFixed(4)} ${w.toFixed(4)} ${hh.toFixed(4)}`);
    placeAll();
    // scale bar: a round length near the length the step asked for at k = 1, measured for this view
    const pxPerM = sc / terrain.cell;
    const want = scaleM * s0 / terrain.cell;
    let m = NICE_M[0];
    for (const c of NICE_M) if (c * pxPerM <= want * 1.25) m = c;
    bar.style.width = `${(m * pxPerM).toFixed(1)}px`;
    scaleText.nodeValue = `${m} m `;
    // raster
    const dpr = window.devicePixelRatio || 1;
    const cw = Math.max(1, Math.round(W * dpr)), ch = Math.max(1, Math.round(H * dpr));
    if (screen.width !== cw || screen.height !== ch) { screen.width = cw; screen.height = ch; }
    const ctx = screen.getContext('2d');
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cw, ch);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // visible part of the site, in SVG units, and where it lands on screen
    const ux0 = Math.max(0, vx), uy0 = Math.max(0, vy), ux1 = Math.min(n, vx + w), uy1 = Math.min(n, vy + hh);
    if (ux1 <= ux0 || uy1 <= uy0) return;
    const dx = (ux0 - vx) * sc, dy = (uy0 - vy) * sc, dw = (ux1 - ux0) * sc, dh = (uy1 - uy0) * sc;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(canvas, ux0 * RES, uy0 * RES, (ux1 - ux0) * RES, (uy1 - uy0) * RES, dx, dy, dw, dh);
    for (const name of ['steep', 'shadow']) {
      if (!state[name]) continue;
      if (tmp.width !== cw || tmp.height !== ch) { tmp.width = cw; tmp.height = ch; }
      const t = tmp.getContext('2d');
      t.globalCompositeOperation = 'source-over';
      t.setTransform(1, 0, 0, 1, 0, 0);
      t.clearRect(0, 0, cw, ch);
      t.setTransform(dpr, 0, 0, dpr, 0, 0);
      const pat = pats[name] || (pats[name] = (patterns[name] || (name === 'steep' ? hatchPattern : dotPattern))(t));
      // the pattern moves with the map and keeps its screen size at every zoom
      if (pat.setTransform && typeof DOMMatrix !== 'undefined') pat.setTransform(new DOMMatrix([patternPx, 0, 0, patternPx, -vx * sc, -vy * sc]));
      t.fillStyle = pat;
      t.fillRect(dx, dy, dw, dh);
      t.globalCompositeOperation = 'destination-in';
      t.imageSmoothingEnabled = false;
      t.drawImage(maskCanvas(name), ux0, uy0, ux1 - ux0, uy1 - uy0, dx, dy, dw, dh);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.drawImage(tmp, 0, 0);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    const key = `${view.cx.toFixed(3)} ${view.cy.toFixed(3)} ${view.k.toFixed(4)}`;
    if (key !== lastKey) { lastKey = key; for (const f of viewFns) f({ ...view }); }
  }

  let frame = 0;
  const schedule = () => { if (!frame) frame = requestAnimationFrame(() => { frame = 0; step(); }); };

  // ---------- motion ----------
  let anim = null; // { from, to, t0, anchor? { sx, sy, ux, uy } }
  function step() {
    if (anim) {
      const e = Math.min(1, (performance.now() - anim.t0) / ANIM_MS);
      const p = 1 - Math.pow(1 - e, 3);
      const k = Math.exp(Math.log(anim.from.k) + (Math.log(anim.to.k) - Math.log(anim.from.k)) * p);
      let cx, cy;
      if (anim.anchor) {
        const { sx, sy, ux, uy } = anim.anchor, sc = s0 * k;
        cx = ux - sx / sc + W / sc / 2; cy = uy - sy / sc + H / sc / 2;
      } else {
        cx = anim.from.cx + (anim.to.cx - anim.from.cx) * p;
        cy = anim.from.cy + (anim.to.cy - anim.from.cy) * p;
      }
      Object.assign(view, clamp({ cx, cy, k }));
      if (e >= 1) { if (!anim.anchor) Object.assign(view, anim.to); anim = null; el.removeAttribute('aria-busy'); }
      else schedule();
    }
    render();
  }
  /** Animate to zoom k (clamped); anchor = screen point (px in the map box) that stays put; else centre (cx, cy). */
  function animateTo(to, anchor) {
    if (!W || !H) return;
    const k = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, to.k));
    let a = null;
    if (anchor) {
      const sc = s0 * view.k;
      a = { sx: anchor.sx, sy: anchor.sy, ux: view.cx + (anchor.sx - W / 2) / sc, uy: view.cy + (anchor.sy - H / 2) / sc };
    }
    const target = a ? { k } : clamp({ cx: to.cx, cy: to.cy, k });
    anim = { from: { ...view }, to: { ...view, ...target }, t0: performance.now(), anchor: a };
    el.setAttribute('aria-busy', 'true'); // the view is moving
    schedule();
  }
  let targetK = 1; // accumulates fast wheel turns
  function zoomBy(f, anchor) {
    const base = anim ? targetK : view.k;
    targetK = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, base * f));
    animateTo({ cx: view.cx, cy: view.cy, k: targetK }, anchor);
  }
  function reset() { const v = homeView(); targetK = v.k; animateTo(v); }

  // ---------- layout ----------
  function layout() {
    if (!measure()) return;
    if (!homeApplied) { Object.assign(view, homeView()); homeApplied = true; }
    else Object.assign(view, clamp(view));
    lastQ = null;
    render();
    if (!ready) { ready = true; readyFns.splice(0).forEach((f) => f()); }
  }
  let ro = null;
  if (typeof ResizeObserver !== 'undefined') { ro = new ResizeObserver(layout); ro.observe(el); }

  // ---------- pointer, wheel, keys ----------
  const local = (e) => { const r = el.getBoundingClientRect(); return { sx: e.clientX - r.left, sy: e.clientY - r.top }; };
  const onMap = (t) => t === screen || svg.contains(t);
  let down = null, dragging = false, eatClick = false;
  el.addEventListener('pointerdown', (e) => {
    eatClick = false;
    if (!movable || e.button !== 0 || !onMap(e.target)) return;
    down = { x: e.clientX, y: e.clientY, cx: view.cx, cy: view.cy, id: e.pointerId };
    dragging = false;
  });
  el.addEventListener('pointermove', (e) => {
    if (!down || e.pointerId !== down.id) return;
    if (e.pointerType === 'mouse' && !(e.buttons & 1)) { endDrag(); return; } // released where we did not see it
    const ddx = e.clientX - down.x, ddy = e.clientY - down.y;
    if (!dragging) {
      if (Math.hypot(ddx, ddy) < DRAG_PX) return;
      dragging = true; anim = null; el.removeAttribute('aria-busy');
      try { el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
      el.classList.add('is-dragging');
    }
    const sc = s0 * view.k;
    Object.assign(view, clamp({ cx: down.cx - ddx / sc, cy: down.cy - ddy / sc, k: view.k }));
    schedule();
  });
  const endDrag = (e) => {
    if (!down || (e && e.pointerId !== down.id)) return;
    if (dragging) eatClick = true;
    try { if (el.hasPointerCapture(down.id)) el.releasePointerCapture(down.id); } catch { /* gone */ }
    down = null; dragging = false;
    el.classList.remove('is-dragging');
  };
  el.addEventListener('pointerup', endDrag);
  el.addEventListener('pointercancel', endDrag);
  el.addEventListener('lostpointercapture', endDrag);
  // a drag never selects or zooms: swallow the click that ends it, before any marker sees it
  el.addEventListener('click', (e) => { if (eatClick) { eatClick = false; e.stopImmediatePropagation(); e.preventDefault(); } }, true);
  el.addEventListener('click', (e) => {
    if (!movable || e.defaultPrevented || !onMap(e.target)) return;
    zoomBy(ZOOM_STEP, local(e));
  });
  el.addEventListener('contextmenu', (e) => {
    if (!movable) return;
    e.preventDefault();
    if (onMap(e.target)) zoomBy(1 / ZOOM_STEP, local(e));
  });
  el.addEventListener('wheel', (e) => {
    if (!movable) return;
    e.preventDefault();
    const d = e.deltaY * (e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? 400 : 1);
    if (!d) return;
    zoomBy(Math.exp(-Math.max(-200, Math.min(200, d)) * 0.0025), local(e));
  }, { passive: false });
  // is the pointer over the map: what lies under the last pointer position (not the captured target)
  let last = null;
  const onMove = (e) => {
    if (!el.isConnected) { if (ready) off(); return; } // once shown and then gone: stop listening
    last = { x: e.clientX, y: e.clientY };
  };
  const onOut = (e) => { if (!e.relatedTarget) last = null; }; // pointer left the window
  const isOver = () => { const t = last && document.elementFromPoint(last.x, last.y); return !!t && el.contains(t); };
  const off = () => {
    window.removeEventListener('keydown', onKey);
    document.removeEventListener('pointermove', onMove, true);
    document.removeEventListener('pointerout', onOut, true);
  };
  document.addEventListener('pointermove', onMove, { capture: true, passive: true });
  document.addEventListener('pointerout', onOut, true);
  const onKey = (e) => {
    if (!el.isConnected) { if (ready) off(); return; } // once shown and then gone: stop listening
    if (!movable || e.ctrlKey || e.metaKey || e.altKey || !isOver()) return;
    if (e.key === '+' || e.key === '=') zoomBy(ZOOM_STEP);
    else if (e.key === '-' || e.key === '_' || e.key === '−') zoomBy(1 / ZOOM_STEP);
    else if (e.key === '0') reset();
    else return;
    e.preventDefault();
  };
  window.addEventListener('keydown', onKey);

  // markers placed by a step's own code (a <g> with a translate only) keep their size too
  const adopt = (node) => {
    if (node.nodeType !== 1 || node.dataset.base || node.tagName.toLowerCase() !== 'g') return;
    const t = node.getAttribute('transform') || '';
    if (/^\s*translate\([^)]*\)\s*$/.test(t)) { node.dataset.base = t.trim(); place(node); }
  };
  if (typeof MutationObserver !== 'undefined') {
    new MutationObserver((list) => { for (const m of list) m.addedNodes.forEach(adopt); })
      .observe(svg, { childList: true, subtree: true });
  }

  const api = {
    el, svg, canvas,
    /** scene metres -> SVG units { px, py } (north up). */
    project(x, z) { return { px: (x - terrain.min) / terrain.cell, py: (terrain.max - z) / terrain.cell }; },
    /** SVG units -> scene metres. */
    unproject(px, py) { return { x: terrain.min + px * terrain.cell, z: terrain.max - py * terrain.cell }; },
    /** Scene metres of a mouse / pointer event on the map. */
    eventToScene(e) {
      const pt = svg.createSVGPoint(); pt.x = e.clientX; pt.y = e.clientY;
      const p = pt.matrixTransform(svg.getScreenCTM().inverse());
      return api.unproject(p.x, p.y);
    },
    layer(name) { return layers[name] || (layers[name] = svg.appendChild(s('g', { 'data-layer': name }))); },
    clearLayer(name) { const g = api.layer(name); while (g.firstChild) g.removeChild(g.firstChild); return g; },
    /** Re-measure after a change of size or crop (the scale bar always follows the view). */
    fitScale() { layout(); },
    /** Redraw the raster after a step painted on `canvas` (its own ground). */
    redraw() { schedule(); },
    /** Size factor for all markers, now and later. */
    setMarkerScale(k) { markerK = k; lastQ = null; placeAll(); },
    /** Toggle the raster layers { steep, shadow }. */
    setLayers(o) { Object.assign(state, o); schedule(); },
    /** Current view { cx, cy, k } (SVG units, zoom); fn(view) after every change of view. */
    get view() { return { ...view }; },
    onView(fn) { viewFns.push(fn); },
    /** fn() once the map has a size and its first view (at once if it has). */
    whenReady(fn) { if (ready) fn(); else readyFns.push(fn); },
    /** The view "reset" returns to: the box of scene points (with a margin, as a fraction of its size), at most zoom maxK; square: false keeps the box's own proportions. */
    setHome(points, { margin = 0.18, maxK = 3, square = true } = {}) {
      const ps = points.filter((p) => p && Number.isFinite(p.x) && Number.isFinite(p.z)).map((p) => api.project(p.x, p.z));
      if (!ps.length) { home = null; } else {
        const xs = ps.map((p) => p.px), ys = ps.map((p) => p.py);
        let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const mx = (x0 + x1) / 2, my = (y0 + y1) / 2;
        // square: the larger side on both axes; else the box as it is (a wide map can then fill its width)
        const hx = (square ? Math.max(x1 - x0, y1 - y0) : x1 - x0) * (0.5 + margin);
        const hy = (square ? Math.max(x1 - x0, y1 - y0) : y1 - y0) * (0.5 + margin);
        x0 = mx - hx; x1 = mx + hx; y0 = my - hy; y1 = my + hy;
        home = { box: [x0, y0, x1, y1], maxK };
      }
      if (W && H) { Object.assign(view, homeView()); homeApplied = true; render(); }
    },
    /** Zoom in / out by factor f about the map centre; reset to the home view. */
    zoomBy(f) { zoomBy(f); },
    reset() { reset(); },
    /** Centre the view on scene x, z, zoomed to at least minK (so the site can move under it). */
    centreOn(x, z, { minK = 2 } = {}) {
      const { px, py } = api.project(x, z);
      targetK = Math.max(view.k, minK);
      animateTo({ cx: px, cy: py, k: targetK });
    },
    /**
     * Draw a marker off its real place by (dx, dy) and join both with a leader line. unit 'px' = screen
     * pixels now, 'map' = SVG units at zoom 1. The offset keeps its screen size at every zoom.
     */
    offsetMarker(g, dx, dy, { unit = 'px', leaderClass = 'map-leader' } = {}) {
      if (!g.dataset.base) return;
      if (unit === 'px' && !s0) return;
      const prev = g.dataset.off ? g.dataset.off.split(' ').map(Number) : [0, 0];
      const f = unit === 'px' ? 1 / s0 : 1;
      const ox = prev[0] + dx * f, oy = prev[1] + dy * f;
      g.dataset.off = `${ox.toFixed(4)} ${oy.toFixed(4)}`;
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(g.dataset.base);
      if (m && !g._leader && leaderClass) {
        g._at = [+m[1], +m[2]];
        g._leader = s('line', { class: leaderClass, x1: m[1], y1: m[2], x2: m[1], y2: m[2], 'vector-effect': 'non-scaling-stroke' });
        g.parentNode.insertBefore(g._leader, g);
      }
      place(g);
    },
    /** fade option: show ground, hatching, routes and markers, fading in together (no-op once shown). */
    reveal() {
      clearTimeout(fadeTimer);
      if (!el.classList.contains('is-pending')) return;
      // two frames: the first paint of the hidden content lands before the fade starts
      requestAnimationFrame(() => requestAnimationFrame(() => el.classList.remove('is-pending')));
    },
    /** Stop listening (the map also stops by itself once it is out of the page). */
    destroy() { off(); if (ro) ro.disconnect(); },
    /**
     * Draw a path of scene points [{x, z}] into a layer.
     * style: 'foot' (cyan dots, the route on foot), 'walked' (white line), 'broken' (red dots), 'shadow' (cyan dots, dimmed)
     */
    path(points, { style = 'foot', layer = 'routes' } = {}) {
      const d = points.map((p, i) => { const q = api.project(p.x, p.z); return (i ? 'L' : 'M') + q.px.toFixed(2) + ' ' + q.py.toFixed(2); }).join('');
      const el = s('path', { d, class: `map-path map-path--${style}`, 'vector-effect': 'non-scaling-stroke' });
      api.layer(layer).append(el);
      return el;
    },
    /**
     * Draw route paths in along their way once (specs/x-transitions.md: a newly chosen route draws along its
     * path): a mask stroke over `points` (scene {x, z} in route order) is uncovered start to end in `ms`, then
     * removed. Only the given path elements are masked, so markers, pan and zoom are not touched. Nothing
     * with reduced motion.
     */
    drawIn(points, els, { ms = DRAW_MS } = {}) {
      els = els.filter(Boolean);
      if (!els.length || points.length < 2) return;
      if (typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      const d = points.map((p, i) => { const q = api.project(p.x, p.z); return (i ? 'L' : 'M') + q.px.toFixed(2) + ' ' + q.py.toFixed(2); }).join('');
      const id = `map-draw-${++drawSeq}`;
      const line = s('path', { d, fill: 'none', stroke: '#fff', 'stroke-width': DRAW_MASK_W, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
      const mask = s('mask', { id, maskUnits: 'userSpaceOnUse', x: -n, y: -n, width: 3 * n, height: 3 * n }, line);
      let defs = svg.querySelector(':scope > defs');
      if (!defs) { defs = s('defs'); svg.prepend(defs); }
      defs.append(mask);
      const len = line.getTotalLength() + DRAW_MASK_W;
      line.style.strokeDasharray = `${len} ${len}`;
      line.style.strokeDashoffset = String(len);
      els.forEach((e) => e.setAttribute('mask', `url(#${id})`));
      const done = () => { els.forEach((e) => { if (e.getAttribute('mask') === `url(#${id})`) e.removeAttribute('mask'); }); mask.remove(); };
      const anim = line.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: ms, easing: 'cubic-bezier(0.4, 0, 0.2, 1)', fill: 'forwards' });
      anim.onfinish = done; anim.oncancel = done;
    },
    /**
     * Put an HTML-like marker at scene x, z. kind: 'number' (text = digits), 'rover' (home square),
     * 'spot' (diamond), 'point' (Access Mars point), 'dot'. Returns the SVG group; add listeners to it.
     */
    addMarker(x, z, { kind = 'number', text = '', selected = false, label = '', layer = 'markers' } = {}) {
      const { px, py } = api.project(x, z);
      const base = `translate(${px.toFixed(2)} ${py.toFixed(2)})`;
      const g = s('g', { class: `map-marker map-marker--${kind}${selected ? ' is-selected' : ''}`, 'data-base': base });
      place(g);
      const R = 6.5;
      if (kind === 'number') {
        g.append(s('circle', { r: R }), s('text', { 'text-anchor': 'middle', dy: '0.35em' }, text));
      } else if (kind === 'rover') {
        g.append(s('rect', { x: -4.5, y: -4.5, width: 9, height: 9, rx: 1 }));
      } else if (kind === 'spot') {
        g.append(s('rect', { x: -4, y: -4, width: 8, height: 8, transform: 'rotate(45)' }));
      } else if (kind === 'point') {
        g.append(s('circle', { r: 3 }));
      } else {
        g.append(s('circle', { r: 2.2 }));
      }
      if (label) g.append(s('text', { class: 'map-marker__label', 'text-anchor': 'middle', y: (kind === 'number' ? R : 6) + 7 }, label));
      api.layer(layer).append(g);
      return g;
    },
  };
  return api;
}

const _relief = new WeakMap();
function relief(t) {
  if (!_relief.has(t)) _relief.set(t, buildRelief(t));
  return _relief.get(t);
}
function buildRelief(t) {
  const n = t.n, W = n * RES;
  const img = new ImageData(W, W);
  const H = t.height, cell = t.cell;
  // light from the north-west, 40° above the horizon (as the HiRISE hillshade in scripts/preprocess)
  const az = (315 * Math.PI) / 180, alt = (40 * Math.PI) / 180;
  const lx = Math.sin(az) * Math.cos(alt), lz = Math.cos(az) * Math.cos(alt), ly = Math.sin(alt);
  const { dark, light } = GROUND_RAMP;
  for (let py = 0; py < W; py++) {
    const z = t.max - (py + 0.5) / RES * cell;
    for (let px = 0; px < W; px++) {
      const x = t.min + (px + 0.5) / RES * cell;
      const dx = (t.heightAt(x + cell, z) - t.heightAt(x - cell, z)) / (2 * cell);
      const dz = (t.heightAt(x, z + cell) - t.heightAt(x, z - cell)) / (2 * cell);
      // normal (-dx, 1, -dz) in (east, up, north)
      const len = Math.hypot(dx, 1, dz);
      let sh = (-dx * lx + ly - dz * lz) / len;
      sh = Math.max(0, Math.min(1, 0.15 + 0.95 * sh));
      const k = 4 * (py * W + px);
      img.data[k] = dark[0] + (light[0] - dark[0]) * sh;
      img.data[k + 1] = dark[1] + (light[1] - dark[1]) * sh;
      img.data[k + 2] = dark[2] + (light[2] - dark[2]) * sh;
      img.data[k + 3] = 255;
    }
  }
  return img;
}

function hatchPattern(ctx) {
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(150, 70, 35, 0.35)'; g.fillRect(0, 0, 8, 8);
  g.strokeStyle = 'rgba(235, 150, 105, 0.9)'; g.lineWidth = 1.2;
  g.beginPath(); g.moveTo(-2, 10); g.lineTo(10, -2); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(6, 10); g.lineTo(10, 6); g.stroke();
  return ctx.createPattern(c, 'repeat');
}
function dotPattern(ctx) {
  const c = document.createElement('canvas'); c.width = c.height = 6;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0, 0, 0, 0.25)'; g.fillRect(0, 0, 6, 6);
  g.fillStyle = 'rgba(255, 255, 255, 0.75)'; g.beginPath(); g.arc(3, 3, 0.9, 0, Math.PI * 2); g.fill();
  return ctx.createPattern(c, 'repeat');
}
