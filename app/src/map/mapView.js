// Map view (2D planner). Placeholder canvas until the planner task lands.
import { app } from '../state.js';

export function mountMap(el) {
  const canvas = document.createElement('canvas');
  el.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  function draw() {
    const w = (canvas.width = el.clientWidth), h = (canvas.height = el.clientHeight);
    const css = getComputedStyle(document.documentElement);
    ctx.fillStyle = css.getPropertyValue('--paper-2'); ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = css.getPropertyValue('--hairline'); ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
    for (let y = 0; y < h; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }
    ctx.fillStyle = css.getPropertyValue('--ink-muted');
    ctx.font = '14px ' + css.getPropertyValue('--font-mono');
    ctx.fillText('MAP PLANNER PLACEHOLDER - ' + app.SITES.find((x) => x.id === app.get().site).name.toUpperCase(), 24, 40);
  }
  addEventListener('resize', draw);
  app.on((st) => { if (st.view === 'map') draw(); });
  draw();
}
