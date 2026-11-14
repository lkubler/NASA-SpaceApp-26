// Map panel: the walk square from above, north up, drawn from the same walk grid the visitor walks.
// Rounded panel; scale bar inside. Shaded relief in Mars orange and brown; optional layers:
// too steep (hatched), radio shadow (dotted). Vector layers (routes, markers) in an SVG on top.
// Coordinates: scene metres (x east, z north). project(x, z) -> SVG units (one unit = one grid cell).

import { h, s } from './dom.js';
import { closedMask } from '../core/planner.js';
import { radioShadowMask } from '../core/radio.js';

const RES = 4; // canvas pixels per grid cell

/**
 * @param {Terrain} terrain  from core/terrain.js getTerrain()
 * @param {{ steep?: boolean, shadow?: boolean, scaleM?: number }} opts
 * @returns {{ el, svg, project, unproject, layer, path, addMarker, setLayers, clearLayer }}
 */
export function mapPanel(terrain, { steep = true, shadow = false, scaleM = 20 } = {}) {
  const n = terrain.n;
  const canvas = h('canvas.map__canvas', { width: n * RES, height: n * RES });
  const svg = s('svg', { class: 'map__svg', viewBox: `0 0 ${n} ${n}`, preserveAspectRatio: 'xMidYMid meet' });
  const layers = {};
  for (const name of ['areas', 'routes', 'markers', 'top']) { layers[name] = s('g', { 'data-layer': name }); svg.append(layers[name]); }
  const bar = h('span.map__scale-bar');
  const scale = h('div.map__scale', bar, h('span.mono', `${scaleM} m`));
  const north = h('div.map__north.mono', 'N');
  const el = h('div.map', canvas, svg, scale, north);
  // Scale bar in screen pixels, so "20 m" covers 20 m on the map at any size, crop (slice) or zoom.
  let zoom = 1;
  let markerK = 1; // marker size factor (a cropped, larger map keeps its markers at a readable size)
  function fitScale() {
    const W = el.clientWidth, H = el.clientHeight;
    if (!W || !H) return;
    const slice = /slice/.test(svg.getAttribute('preserveAspectRatio') || '');
    const pxPerM = ((slice ? Math.max(W, H) : Math.min(W, H)) / terrain.extent) * zoom;
    bar.style.width = `${(pxPerM * scaleM).toFixed(1)}px`;
  }
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitScale).observe(el);

  const state = { steep, shadow };
  draw();

  function draw() {
    const ctx = canvas.getContext('2d');
    ctx.putImageData(relief(terrain), 0, 0);
    if (state.steep) overlay(ctx, closedMask(terrain), hatchPattern(ctx));
    if (state.shadow) overlay(ctx, radioShadowMask(terrain), dotPattern(ctx));
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
    /** Re-measure the scale bar (after a change of crop); zoom k = extra scale of the map layers. */
    fitScale(k) { if (k) zoom = k; fitScale(); },
    /** Size factor for all markers, now and later. */
    setMarkerScale(k) {
      markerK = k;
      svg.querySelectorAll('.map-marker[data-base]').forEach((g) => g.setAttribute('transform', `${g.dataset.base} scale(${k.toFixed(4)})`));
    },
    /** Toggle the raster layers { steep, shadow }. */
    setLayers(o) { Object.assign(state, o); draw(); },
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
     * Put an HTML-like marker at scene x, z. kind: 'number' (text = digits), 'rover' (home square),
     * 'spot' (diamond), 'point' (Access Mars point), 'dot'. Returns the SVG group; add listeners to it.
     */
    addMarker(x, z, { kind = 'number', text = '', selected = false, label = '', layer = 'markers' } = {}) {
      const { px, py } = api.project(x, z);
      const base = `translate(${px.toFixed(2)} ${py.toFixed(2)})`;
      const g = s('g', { class: `map-marker map-marker--${kind}${selected ? ' is-selected' : ''}`, transform: markerK === 1 ? base : `${base} scale(${markerK})`, 'data-base': base });
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
  const dark = [74, 42, 23], light = [214, 142, 94];
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
/** Paint `pattern` where mask[i] = 1 (mask in grid order: row = z from south). */
function overlay(ctx, mask, pattern) {
  const n = Math.sqrt(mask.length) | 0, W = n * RES;
  const m = document.createElement('canvas'); m.width = m.height = W;
  const g = m.getContext('2d');
  g.fillStyle = pattern; g.fillRect(0, 0, W, W);
  const a = document.createElement('canvas'); a.width = a.height = n;
  const ag = a.getContext('2d');
  const id = ag.createImageData(n, n);
  for (let row = 0; row < n; row++) for (let col = 0; col < n; col++) {
    const v = mask[row * n + col];
    const k = 4 * ((n - 1 - row) * n + col); // north up
    id.data[k + 3] = v ? 255 : 0;
  }
  ag.putImageData(id, 0, 0);
  g.globalCompositeOperation = 'destination-in';
  g.imageSmoothingEnabled = false;
  g.drawImage(a, 0, 0, W, W);
  ctx.drawImage(m, 0, 0);
}
