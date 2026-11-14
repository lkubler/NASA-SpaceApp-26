// Autonomy clock bar (HUD and planner panel) and RAD dose counter. Models in model/rad.js.
// Planner hook: import { autonomyBar } from '../ui/autonomy.js'; container.append(autonomyBar()).
import { chip } from './components.js';
import { autonomy, evaDose, doseRate, SPE } from '../model/rad.js';
import { SOL1440_START } from '../model/mars24.js';

function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
const fmt = (m) => (m < 10 ? m.toFixed(1) : String(Math.round(m)));

/** "Earth would hear you in N min . answer in 2N min" bar. millis = scenario date (default: demo sol 1440). */
export function autonomyBar(millis = SOL1440_START) {
  const a = autonomy(millis);
  const b = el('div', 'auto-bar');
  b.append(el('span', 'auto-t', `Earth would hear you in ${fmt(a.oneWayMin)} min · answer in ${fmt(a.roundTripMin)} min`),
    el('span', 'auto-s', 'The crew decides alone'),
    chip('modelled', `One-way light time Earth-Mars, ${a.au.toFixed(2)} AU on the scenario date (Keplerian elements). Range over the cycle: 4-22 min (Chappell et al., NTRS 20150019627).`));
  return b;
}

/** RAD dose counter. Returns {el, update(elapsedS, routeTotalS?)}. */
export function radCounter() {
  const root = el('div', 'rad-cell');
  const l = el('span', 'hud-l', 'EVA dose'), v = el('span', 'hud-v'), s = el('span', 'hud-s');
  const tg = el('button', 'rad-toggle', 'SPE replay: off'); tg.type = 'button'; tg.setAttribute('aria-pressed', 'false');
  const c1 = chip('measured', 'Gale surface rate 0.67 mSv/day (RAD, Hassler 2014) = 0.028 mSv/h, measured by a detector inside the rover looking up. Applied to a person without suit-specific shielding.');
  const c2 = chip('simulated', 'Replay of the 10-12 Sept 2017 solar particle event (Zeitlin et al. 2018): dose rate x2-3 for ~12 h, applied to this EVA.'); c2.hidden = true;
  const warn = el('span', 'rad-warn', '▲ CAUTION: solar particle event, dose rate x' + SPE.multiplier); warn.hidden = true;
  root.append(l, v, s, warn, tg, c1, c2);
  let spe = false, last = [0, 0];
  tg.addEventListener('click', () => { spe = !spe; tg.textContent = 'SPE replay: ' + (spe ? 'on' : 'off'); tg.setAttribute('aria-pressed', String(spe)); c2.hidden = !spe; warn.hidden = !spe; root.dataset.state = spe ? 'warn' : ''; update(...last); });
  function update(elapsedS, routeTotalS) {
    last = [elapsedS, routeTotalS];
    v.textContent = evaDose(elapsedS, { spe }).toFixed(4) + ' mSv';
    let t = doseRate(elapsedS, { spe }).toFixed(3) + ' mSv/h';
    if (routeTotalS) t += ' · route ' + evaDose(routeTotalS, { spe }).toFixed(3);
    s.textContent = t;
  }
  update(0);
  return { el: root, update };
}
