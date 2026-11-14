// Terrain loading progress (task 010a). Tracks the /murray/ glb + tile requests via Resource Timing, then flips to 100 % on walkReady.
import { app } from '../state.js';

const EXPECTED = 66; // terrain.glb + 64 tiles + background.jpg
const listeners = new Set();
let pct = 0;

function emit(p) { pct = Math.max(pct, p); listeners.forEach((f) => f(pct, pct >= 1)); }

export function startLoadTracking() {
  const count = () => performance.getEntriesByType('resource').filter((e) => /\/murray\//.test(e.name) && e.responseEnd > 0).length;
  const tick = () => emit(Math.min(0.97, count() / EXPECTED));
  try { new PerformanceObserver(tick).observe({ type: 'resource', buffered: true }); } catch (e) { /* no resource timing: bar only jumps at ready */ }
  tick();
  app.on((st) => { if (st.walkReady) emit(1); });
  if (app.get().walkReady) emit(1);
}

/** Progress bar element, kept in sync through the subscription. */
export function loadBar() {
  const el = document.createElement('div');
  el.className = 'load-bar';
  el.innerHTML = '<div class="load-t"><span class="load-l">TERRAIN LINK</span><span class="load-p">0%</span></div><div class="load-track"><i></i></div><div class="load-s">Access Mars terrain mesh, Murray Buttes (real geometry, photo textures)</div>';
  const fill = el.querySelector('i'), p = el.querySelector('.load-p'), l = el.querySelector('.load-l');
  const f = (v, done) => {
    fill.style.width = (v * 100).toFixed(0) + '%';
    p.textContent = done ? 'READY' : (v * 100).toFixed(0) + '%';
    l.textContent = done ? 'TERRAIN LINK ESTABLISHED' : 'ACQUIRING TERRAIN';
    el.dataset.done = done ? '1' : '';
  };
  listeners.add(f); f(pct, pct >= 1);
  return el;
}

export function onTerrainReady(cb) {
  if (pct >= 1) { cb(); return; }
  const f = (v, done) => { if (done) { listeners.delete(f); cb(); } };
  listeners.add(f);
}
