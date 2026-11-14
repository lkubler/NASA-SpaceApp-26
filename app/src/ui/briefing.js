// Cold open (NO SIGNAL) -> mission briefing. Signature moment 1 (docs/design.md section 12). Task 010b.
// Content: Ground Control request for Murray Buttes (notes.md, translated). Facts: research/data-science.md, research/science.md.
import { chip, stateChip, button } from './components.js';
import { loadBar, onTerrainReady } from './loading.js';

function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
const REDUCED = matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLD_MS = REDUCED ? 1200 : 4200;
let played = false;

const REQUEST = [
  ['Objective', 'Measure cross-bedding in the Stimson sandstone to reconstruct wind direction and the shape of ancient dunes. Collect a sample at the foot of a butte.'],
  ['Why here', 'The buttes are erosional remnants of wind-deposited sandstone sitting on Murray mudstone. Curiosity drilled at the foot of a butte at Quela (sols 1464 to 1468).'],
  ['Equipment', 'Camera with scale bar, compass and inclinometer, sample drill.'],
  ['Hazard', 'Fallen blocks at the butte base (obstacles, rockfall zone). The buttes also block the radio line of sight.'],
];
const FACTS = [
  ['Curiosity at Quela', 'sols 1455-1468', 'measured', 'MSL rover waypoints, NASA/JPL'],
  ['Marimba drill site', 'sols 1417-1427', 'measured', 'MSL rover waypoints, NASA/JPL'],
  ['Air temp, sol 1440', '-69 to +5 C', 'measured', 'REMS, NASA / CAB (INTA-CSIC)'],
  ['One-way light time', '4-22 min', 'measured', 'Earth-Mars distance, NASA NTRS'],
];

export function mountBriefing(root) {
  root.innerHTML = '';
  const cold = h('div', 'cold');
  cold.innerHTML = `<div class="cold-hatch"></div>
    <div class="cold-core">
      <div class="cold-pill"><span class="bars"><i></i><i></i><i></i></span><span class="cold-ok">LINK OK</span></div>
      <div class="cold-big" aria-live="polite">LINK OK</div>
      <div class="cold-timer"><span>OUT OF CONTACT</span><b class="cold-t">00:00:00</b></div>
      <p class="cold-sub">Mars is 4 to 22 light-minutes from help. When the radio drops, you walk alone.</p>
    </div>`;
  cold.append(loadBar());
  cold.append(h('div', 'cold-skip', 'Click or press any key to skip'));

  const brief = h('div', 'brief');
  const req = h('section', 'brief-req');
  req.append(h('div', 'brief-kick', 'GROUND CONTROL  /  EVA REQUEST 01 of 01'));
  req.append(h('h1', 'brief-h', 'Murray Buttes'));
  const st = h('div', 'brief-st');
  st.append(stateChip('warn', 'COMMS SHADOW RISK'), h('span', 'brief-loc', 'Gale crater, 4.7 S 137.35 E'));
  req.append(st);
  const dl = h('dl', 'brief-dl');
  REQUEST.forEach(([k, v]) => { dl.append(h('dt', null, k), h('dd', null, v)); });
  req.append(dl);
  const cta = h('div', 'brief-cta');
  const go = button('Plan the EVA', { variant: 'primary', onClick: () => { location.hash = '#/map'; } });
  go.classList.add('brief-go'); go.disabled = true;
  const gs = h('span', 'brief-gs', 'Acquiring terrain...');
  onTerrainReady(() => { go.disabled = false; gs.textContent = 'Terrain ready'; });
  const src = button('Sources', { variant: 'secondary', onClick: () => { location.hash = '#/sources'; } });
  cta.append(go, src, gs);
  req.append(cta);

  const facts = h('aside', 'brief-facts');
  facts.append(h('div', 'brief-kick', 'MISSION CONTEXT'));
  FACTS.forEach(([l, v, kind, s]) => {
    const f = h('div', 'brief-fact');
    f.append(h('span', 'label', l), h('div', 'brief-fv', v));
    const r = h('div', 'brief-fs');
    r.append(chip(kind, s), h('span', null, s));
    f.append(r); facts.append(f);
  });
  brief.append(req, facts);
  root.append(brief, cold);

  // ---- cold open sequence ----
  const pill = cold.querySelector('.cold-pill'), okw = cold.querySelector('.cold-ok'), big = cold.querySelector('.cold-big'), tm = cold.querySelector('.cold-t');
  let t0 = 0, raf = 0, done = false;
  function finish() {
    if (done) return; done = true; cancelAnimationFrame(raf);
    removeEventListener('keydown', finish);
    cold.classList.add('out'); setTimeout(() => cold.remove(), 600);
    root.classList.add('briefed');
  }
  function loop(t) {
    if (!t0) t0 = t;
    const e = t - t0;
    if (e > 900 && !cold.classList.contains('lost')) { cold.classList.add('lost'); pill.classList.add('nosig'); okw.textContent = 'NO SIGNAL'; big.textContent = 'NO SIGNAL'; }
    if (e > 900) { const s = Math.floor((e - 900) / 1000 * 8); const d = (n) => String(n).padStart(2, '0'); tm.textContent = `00:${d(Math.floor(s / 60) % 60)}:${d(s % 60)}`; }
    if (e > COLD_MS) { finish(); return; }
    raf = requestAnimationFrame(loop);
  }
  if (played) { cold.remove(); root.classList.add('briefed'); return; }
  played = true;
  cold.addEventListener('click', finish); addEventListener('keydown', finish);
  raf = requestAnimationFrame(loop);
  window.__skipCold = finish; // test hook
}
