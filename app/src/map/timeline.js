// EVA timeline strip under the map: x = EVA clock. Line 1 suit reserve, line 2 what the best way home needs (+ buffer);
// where they touch is the turn-back (amber, same marker as on the map). Magenta hatched bands = out of contact.
// Station blocks carry their number. Pure view: mapView hands it the route after every replan.
import { buildSeries } from '../model/timeSeries.js';
import { sunAtLtst } from '../model/mars24.js';
import { chip } from '../ui/components.js';
import '../styles/timeline.css';

const css = (n) => getComputedStyle(document.documentElement).getPropertyValue(n).trim();
const fmtClock = (h) => { const m = Math.round((((h % 24) + 24) % 24) * 60); return String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
const OPEN_H = 156, CLOSED_H = 30;
const PAD = { l: 34, r: 8, t: 6, b: 18 };

export function mountTimeline(parent, { onToggle } = {}) {
  const box = document.createElement('div'); box.id = 'eva-strip'; box.hidden = true;
  box.innerHTML = '<div class="ev-h"><b>EVA timeline</b><span class="ev-chip"></span><span class="ev-read"></span><button type="button" class="ev-x" aria-expanded="true">Hide</button></div><canvas></canvas>' +
    '<div class="ev-key"><span><i class="ev-l1"></i>Suit left</span><span><i class="ev-l2"></i>Needed to get home (+20 % buffer)</span><span><i class="ev-hatch"></i>No link</span><span><i class="ev-dia"></i>Leave by</span></div>';
  box.querySelector('.ev-chip').append(chip('modelled', 'Reserve and return cost: Pandolf walking energy on the measured HiRISE terrain; station work and the 20 % buffer are assumptions. Sun elevation: Mars24 (Allison & McEwen), sol 1440.'));
  parent.append(box);
  const cv = box.querySelector('canvas'), read = box.querySelector('.ev-read'), btn = box.querySelector('.ev-x');
  let route = null, ser = null, startH = 8, hoverT = null, open = true;
  try { open = localStorage.getItem('evaStrip') !== '0'; } catch { /* storage may be blocked */ }

  const sync = () => { box.classList.toggle('closed', !open); btn.textContent = open ? 'Hide' : 'Show'; btn.setAttribute('aria-expanded', String(open)); btn.title = open ? 'Collapse the timeline' : 'Show the timeline'; };
  const setOpen = (v) => {
    open = v; sync();
    try { localStorage.setItem('evaStrip', open ? '1' : '0'); } catch { /* ignore */ }
    if (onToggle) onToggle();
    draw();
  };
  btn.addEventListener('click', () => setOpen(!open));
  sync();

  const total = () => ser.t[ser.t.length - 1];

  function draw() {
    if (!open || !ser || !route) return;
    const W = cv.clientWidth, H = cv.clientHeight; if (!W || !H) return; // hidden 0x0 map page
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    const c = cv.getContext('2d'); if (!c) return;
    c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    const { l, r, t, b } = PAD, pw = W - l - r, ph = H - t - b, T = total();
    if (pw < 20 || ph < 20 || !(T > 0)) return;
    const X = (s) => l + (s / T) * pw, Y = (f) => t + (1 - Math.max(0, Math.min(1, f))) * ph;
    const dust = css('--dust') || '#D98B62', mag = css('--comms-shadow'), amber = css('--turnback'), grey = css('--prov-sim'), mono = css('--font-mono');
    c.font = '10px ' + mono;
    // grid: 0 / 50 / 100 %
    c.strokeStyle = 'rgba(255,255,255,.14)'; c.lineWidth = 1; c.textAlign = 'right'; c.textBaseline = 'middle';
    for (const f of [0, 0.5, 1]) { c.beginPath(); c.moveTo(l, Math.round(Y(f)) + 0.5); c.lineTo(l + pw, Math.round(Y(f)) + 0.5); c.stroke(); c.fillStyle = grey; c.fillText(Math.round(f * 100) + '%', l - 4, Y(f)); }
    // clock ticks
    c.textAlign = 'center'; c.textBaseline = 'top';
    const stepH = T / 3600 > 8 ? 2 : 1;
    for (let h = Math.ceil(startH / stepH) * stepH; (h - startH) * 3600 <= T; h += stepH) { const x = X((h - startH) * 3600); c.fillStyle = 'rgba(255,255,255,.14)'; c.fillRect(Math.round(x), t, 1, ph); c.fillStyle = grey; c.fillText(fmtClock(h), x, t + ph + 4); }
    // comms shadow: hatched magenta bands
    const pat = document.createElement('canvas'); pat.width = pat.height = 6;
    const pc = pat.getContext('2d'); pc.strokeStyle = mag; pc.lineWidth = 1.2; pc.beginPath(); pc.moveTo(0, 6); pc.lineTo(6, 0); pc.moveTo(-1, 1); pc.lineTo(1, -1); pc.moveTo(5, 7); pc.lineTo(7, 5); pc.stroke();
    const hatch = c.createPattern(pat, 'repeat');
    for (const sh of route.shadows || []) {
      const x0 = X(sh.start), x1 = X(sh.end);
      c.fillStyle = 'rgba(255,79,160,.16)'; c.fillRect(x0, t, x1 - x0, ph); c.fillStyle = hatch; c.fillRect(x0, t, x1 - x0, ph);
      c.fillStyle = mag; c.fillRect(x0, t, x1 - x0, 2);
    }
    // region where the suit no longer covers the way home
    const N = Math.max(60, Math.round(pw / 2)); c.fillStyle = 'rgba(255,178,36,.2)'; let inBad = false, bx = 0;
    for (let k = 0; k <= N; k++) {
      const s = (k / N) * T, bad = ser.resAt(s) < ser.needAt(s) - 1e-9;
      if (bad && !inBad) { inBad = true; bx = X(s); }
      if ((!bad || k === N) && inBad) { inBad = false; c.fillRect(bx, t, X(s) - bx, ph); }
    }
    // station blocks on the axis
    for (const st of route.stations || []) {
      const x0 = X(st.arrive_s), w = Math.max(12, X(st.depart_s) - x0);
      c.fillStyle = 'rgba(255,255,255,.2)'; c.fillRect(x0, t + ph - 16, w, 16);
      c.strokeStyle = 'rgba(255,255,255,.65)'; c.lineWidth = 1; c.strokeRect(x0 + 0.5, t + ph - 15.5, w - 1, 15);
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = '600 11px ' + mono; c.fillText(String(st.n), x0 + w / 2, t + ph - 8);
    }
    // lines (piecewise linear between the knots: exact)
    const line = (arr, color, wd, dash) => { c.beginPath(); ser.t.forEach((s, i) => { const x = X(s), y = Y(arr[i]); if (i) c.lineTo(x, y); else c.moveTo(x, y); }); c.strokeStyle = color; c.lineWidth = wd; c.setLineDash(dash || []); c.stroke(); c.setLineDash([]); };
    line(ser.need, dust, 2, [5, 3]);
    line(ser.res, '#fff', 2.5);
    // turn-back: amber diamond on the suit line + leave-by label
    const tb = route.turnBack;
    if (tb) {
      const s = tb.leaveElapsed_s, x = X(s), y = Y(ser.resAt(s));
      c.fillStyle = amber; c.strokeStyle = css('--route-casing'); c.lineWidth = 1.5; c.beginPath(); c.moveTo(x, y - 7); c.lineTo(x + 7, y); c.lineTo(x, y + 7); c.lineTo(x - 7, y); c.closePath(); c.fill(); c.stroke();
      const txt = 'Leave by ' + fmtClock(startH + s / 3600); c.font = '600 11px ' + mono;
      const tw = c.measureText(txt).width + 10, lx = Math.max(l, Math.min(x - tw / 2, l + pw - tw)), ly = Math.max(t + 2, y - 28);
      c.fillStyle = amber; c.beginPath(); c.roundRect(lx, ly, tw, 16, 3); c.fill();
      c.fillStyle = '#1C0F0C'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.fillText(txt, lx + 5, ly + 8);
    }
    // hover cursor
    if (hoverT != null) {
      const x = X(hoverT); c.fillStyle = '#fff'; c.fillRect(Math.round(x), t, 1, ph);
      c.beginPath(); c.arc(x, Y(ser.resAt(hoverT)), 3.5, 0, 7); c.fill();
      c.fillStyle = dust; c.beginPath(); c.arc(x, Y(ser.needAt(hoverT)), 3.5, 0, 7); c.fill();
    }
  }

  const readout = () => {
    if (!ser) { read.textContent = ''; return; }
    if (hoverT == null) { const tb = route && route.turnBack; read.textContent = tb ? 'Leave by ' + fmtClock(startH + tb.leaveElapsed_s / 3600) + ' to keep the buffer' : 'Suit covers the way home all EVA'; return; }
    const h = startH + hoverT / 3600, sh = (route.shadows || []).some((s) => hoverT >= s.start && hoverT < s.end), sun = sunAtLtst(((h % 24) + 24) % 24).elevation;
    read.textContent = fmtClock(h) + '  suit ' + Math.round(ser.resAt(hoverT) * 100) + '%  home needs ' + Math.round(ser.needAt(hoverT) * 100) + '%  sun ' + Math.round(sun) + '°' + (sh ? '  NO LINK' : '');
  };
  cv.addEventListener('pointermove', (e) => {
    if (!ser || !cv.clientWidth) return;
    const x = e.clientX - cv.getBoundingClientRect().left, pw = cv.clientWidth - PAD.l - PAD.r;
    hoverT = Math.max(0, Math.min(total(), ((x - PAD.l) / pw) * total())); readout(); draw();
  });
  cv.addEventListener('pointerleave', () => { hoverT = null; readout(); draw(); });
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(() => draw()).observe(box);

  return {
    el: box,
    /** Called by the map after each replan. route = the map's route (reserve, points, stations, shadows, turnBack). */
    update(r, startHour) {
      route = r; startH = startHour; ser = r ? buildSeries(r) : null;
      hoverT = null; box.hidden = !ser; readout(); draw();
    },
    height() { return !ser ? 0 : open ? OPEN_H : CLOSED_H; },
    get open() { return open; },
    setOpen,
  };
}
