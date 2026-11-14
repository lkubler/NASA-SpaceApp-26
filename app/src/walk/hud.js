// Walk HUD: visor-style overlay (docs/design.md section 7). DOM only, pointer-events none.
// update({ slopeDeg, speed, mult }) is called per frame by walkView. Reserve and signal come from
// app state keys `reserve` (fraction 0..1, or {fraction}|{pct}) and `comms` ({status:'shadow'|'ok'} or {inShadow})
// when present; otherwise labelled placeholders show.
import { app } from '../state.js';
import { chip } from '../ui/components.js';
import { autonomyBar, radCounter } from '../ui/autonomy.js';
import { routeTotalS, routeElapsedAt } from '../model/rad.js';

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
  const clk = cell('EVA clock', 'modelled'), slope = cell('Slope', 'modelled'), speed = cell('Speed', 'modelled'), res = cell('Reserve', 'modelled'), sig = cell('Signal', 'modelled');
  const gauge = document.createElement('div'); gauge.className = 'hud-gauge';
  const fill = document.createElement('i'); gauge.append(fill);
  res.c.insertBefore(gauge, res.c.lastChild);
  const rad = radCounter();
  bar.append(clk.c, slope.c, speed.c, res.c, sig.c, rad.el);
  const auto = autonomyBar(); auto.classList.add('on-glass', 'auto-hud');
  let evaS = 0, lastT = performance.now();
  const warn = document.createElement('div'); warn.className = 'hud-warn'; warn.hidden = true;
  const hint = document.createElement('div'); hint.className = 'hud-hint'; hint.hidden = true;
  hint.innerHTML = '<b>Your job</b> Walk the planned route. <i class="k-mag"></i> Magenta = no radio link. <i class="k-amb"></i> Amber = turn back.';
  let hintT = 0;
  const showHint = () => { hint.hidden = false; clearTimeout(hintT); hintT = setTimeout(() => { hint.hidden = true; }, 14000); };
  let wasWalk = false;
  app.on((st) => { const w = st.view === 'walk'; if (w && !wasWalk) showHint(); wasWalk = w; });
  root.append(frame, cross, warn, hint, auto, bar);
  const hh = (h) => { const m = Math.round(((h % 24) + 24) % 24 * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };

  function update({ slopeDeg = 0, speed: sp = 0, mult = 1, x = 0, z = 0 } = {}) {
    const st = app.get();
    const now = performance.now(); evaS += Math.min(1, (now - lastT) / 1000); lastT = now; // EVA elapsed = walking time
    const rt = routeTotalS(st.route), tl = st.eva && typeof st.eva.elapsed_s === 'number' ? st.eva : null;
    const re = tl ? tl.elapsed_s : routeElapsedAt(st.route, x, z); // guided time-lapse clock, else route elapsed_s at nearest point, else wall-clock
    const ev = re ?? evaS;
    rad.update(ev, rt);
    const sh0 = st.route && typeof st.route.startHour === 'number' ? st.route.startHour : null;
    clk.v.textContent = sh0 != null ? hh(sh0 + ev / 3600) : 'T+' + Math.floor(ev / 3600) + 'h' + String(Math.floor(ev / 60) % 60).padStart(2, '0');
    clk.s.textContent = (sh0 != null ? 'T+' + Math.floor(ev / 3600) + 'h' + String(Math.floor(ev / 60) % 60).padStart(2, '0') + ' ' : '') + (tl ? 'time-lapse' : 'local solar time');
    clk.c.dataset.state = tl ? 'warn' : '';
    slope.v.textContent = slopeDeg.toFixed(1) + '°';
    slope.s.textContent = Math.round(Math.tan(slopeDeg * Math.PI / 180) * 100) + ' % grade';
    slope.c.dataset.state = slopeDeg >= 20 ? 'danger' : slopeDeg >= 10 ? 'warn' : '';
    speed.v.textContent = sp.toFixed(2);
    speed.s.textContent = 'm/s \u00b7 x' + mult.toFixed(2);
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
