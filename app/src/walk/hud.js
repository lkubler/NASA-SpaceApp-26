// Walk HUD: visor-style overlay (docs/design.md section 7). DOM only, pointer-events none.
// update({ slopeDeg, speed, mult }) is called per frame by walkView. Reserve and signal come from
// app state keys `reserve` (fraction 0..1, or {fraction}|{pct}) and `comms` ({status:'shadow'|'ok'} or {inShadow})
// when present; otherwise labelled placeholders show.
import { app } from '../state.js';
import { chip } from '../ui/components.js';

function cell(label, prov) {
  const c = document.createElement('div'); c.className = 'hud-cell';
  const l = document.createElement('span'); l.className = 'hud-l'; l.textContent = label;
  const v = document.createElement('span'); v.className = 'hud-v';
  const s = document.createElement('span'); s.className = 'hud-s';
  c.append(l, v, s, chip(prov));
  return { c, v, s };
}
function frac(r) {
  if (r == null) return null;
  if (typeof r === 'number') return r;
  if (r.fraction != null) return r.fraction;
  if (r.pct != null) return r.pct / 100;
  return null;
}

export function mountHud(root) {
  root.textContent = '';
  const frame = document.createElement('div'); frame.className = 'hud-frame';
  const cross = document.createElement('div'); cross.className = 'hud-cross';
  const bar = document.createElement('div'); bar.className = 'hud-bar on-glass';
  const slope = cell('Slope', 'modelled'), speed = cell('Speed', 'modelled'), res = cell('Reserve', 'modelled'), sig = cell('Signal', 'simulated');
  const gauge = document.createElement('div'); gauge.className = 'hud-gauge';
  const fill = document.createElement('i'); gauge.append(fill);
  res.c.insertBefore(gauge, res.c.lastChild);
  bar.append(slope.c, speed.c, res.c, sig.c);
  const warn = document.createElement('div'); warn.className = 'hud-warn'; warn.hidden = true;
  root.append(frame, cross, warn, bar);

  function update({ slopeDeg = 0, speed: sp = 0, mult = 1 } = {}) {
    const st = app.get();
    slope.v.textContent = slopeDeg.toFixed(1) + '°';
    slope.s.textContent = Math.round(Math.tan(slopeDeg * Math.PI / 180) * 100) + ' % grade';
    slope.c.dataset.state = slopeDeg >= 20 ? 'danger' : slopeDeg >= 10 ? 'warn' : '';
    speed.v.textContent = sp.toFixed(2);
    speed.s.textContent = 'm/s  x' + mult.toFixed(2);
    const f = frac(st.reserve);
    res.v.textContent = f == null ? '--' : Math.round(f * 100) + ' %';
    fill.style.width = (f == null ? 0 : Math.max(0, Math.min(1, f)) * 100) + '%';
    res.c.dataset.state = f == null ? '' : f < 0.2 ? 'danger' : f < 0.4 ? 'warn' : '';
    res.s.textContent = f == null ? 'awaiting route' : 'of suit reserve';
    const cm = st.comms;
    const shadow = !!cm && (cm.status === 'shadow' || cm.inShadow === true);
    sig.v.textContent = !cm ? 'LINK' : shadow ? 'NONE' : 'LINK';
    sig.s.textContent = !cm ? 'placeholder' : shadow ? 'comms shadow' : 'line of sight';
    sig.c.dataset.state = shadow ? 'danger' : '';
    warn.hidden = !shadow;
    if (shadow) warn.textContent = '■ NO SIGNAL';
  }
  return { update, root };
}
