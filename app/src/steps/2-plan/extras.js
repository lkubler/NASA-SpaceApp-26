// Plan step, the parts of the mockup (team design, Sun 15.11.) that are LOOK ONLY for now. Another agent
// builds the functions behind them later; nothing here counts into the plan numbers (core/plan.js).
//   - EVA zone: a frame around the spots and points, the ground outside darker
//   - Rover drive: from the base (Bradbury Landing, north-east, off the map) to the rover, drawn on a
//     plausible way over the terrain; not counted in time, distance or reserve
//   - Walking effort: the route on foot coloured by the slope under it (easy -> hard)
//   - Legend in three groups, map layers with show / hide

import { h, s, labelTag } from '../../ui/index.js';
import { findRoute, isClosedAt } from '../../core/planner.js';
import { ROVER, RULES, RADIO } from '../../core/index.js';

// Bradbury Landing seen from Murray Buttes: 5.1 km east, 6.2 km north (Curiosity waypoints, sol 3 and
// sols 1446-1452; research/data-sites.md), so the rover comes in from the north-east
const BASE_BEARING_DEG = 39;
const BASE_KM = 8;
const CURIOSITY_DRIVE_KM = 10.1; // Curiosity's drive, sol 3 to 1452 (public/data/gale/gale_hrsc.json drive.km)

export const EXTRA_TAGS = {
  drive: { label: 'simulated', text: `The base at Bradbury Landing, Curiosity's landing site, is ${BASE_KM} km north-east in a straight line; Curiosity drove ${CURIOSITY_DRIVE_KM} km to get here. The rover drive is drawn over terrain that keeps the slope rule. A picture only: it does not count into time, distance or reserve yet.`, source: { title: 'Curiosity waypoints, NASA/JPL-Caltech', url: 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json' } },
  relay: { label: 'simulated', text: 'A radio relay the crew sets out, placed by you on open ground where it sees the rover. The device is simulated: a mast with an antenna that repeats the link.', source: { title: 'The team’s design', url: '' } },
  contact: { label: 'model', text: `Contact: a place has contact if it sees the rover, or sees the relay while the relay sees the rover. Line of sight over the terrain grid, antennas at ${RADIO.roverAntennaM.value} m (rover), ${RADIO.relayMastM.value} m (relay, an assumption) and ${RADIO.suitAntennaM.value} m (suit). The method, predicting radio shadow from terrain obstacles, was checked against measurements on Apollo 15.`, source: { title: 'Apollo 15 Mission Report, Supplement 6: Postflight analysis of the EVCS-LM communications link (MSC-05161)', url: 'https://ntrs.nasa.gov/api/citations/19720017533/downloads/19720017533.pdf' } },
  zone: { label: 'model', text: 'The area of this excursion: a frame around the candidate spots and the rover, measured on the walk grid.', source: { title: 'Our walk grid (Access Mars Murray Buttes)', url: '' } },
  effort: { label: 'simulated', text: `The route on foot coloured by the slope under each step, from flat (easy) to ${RULES.slopeMaxDeg.value}° (hard). A stand-in for the walking effort, which comes in a later version.`, source: { title: 'Slope grid of the walk terrain', url: '' } },
};

/** The zone frame in scene metres: around every place of the plan, with a margin. */
export function zoneOf(points, margin = 8) {
  const xs = points.map((p) => p.x), zs = points.map((p) => p.z);
  return { x0: Math.min(...xs) - margin, x1: Math.max(...xs) + margin, z0: Math.min(...zs) - margin, z1: Math.max(...zs) + margin };
}

/**
 * The rover drive: from the visible map edge in the direction of the base to the rover, on the fastest way
 * that keeps the slope rule. The bearing to the base is tried first, then ever wider to either side, until a
 * way over open ground exists. `box` is the visible part in scene metres.
 */
export function roverDriveOf(terrain, box, inset = 4) {
  let fallback = null;
  for (const off of [0, 8, -8, 16, -16, 24, -24, 32, -32, 40, -40, 50, -50, 60, -60]) {
    const b = ((BASE_BEARING_DEG + off) * Math.PI) / 180, dx = Math.sin(b), dz = Math.cos(b);
    const tx = dx > 0 ? (box.x1 - inset - ROVER.x) / dx : dx < 0 ? (box.x0 + inset - ROVER.x) / dx : Infinity;
    const tz = dz > 0 ? (box.z1 - inset - ROVER.z) / dz : dz < 0 ? (box.z0 + inset - ROVER.z) / dz : Infinity;
    const from = { x: ROVER.x + dx * Math.min(tx, tz), z: ROVER.z + dz * Math.min(tx, tz) };
    if (isClosedAt(terrain, from.x, from.z)) continue;
    const r = findRoute(terrain, from, ROVER, { weighted: false }); // a drive, not a walk: no contact weight
    if (r.keepsRules) return { from, points: r.points };
    if (!fallback || r.closedM < fallback.closedM) fallback = { from, points: r.points, closedM: r.closedM };
  }
  return fallback;
}

const mix = (a, b, t) => Math.round(a + (b - a) * t);
/** Light cyan (flat) to deep blue (at the slope limit). */
export function effortColor(slopeDeg) {
  const t = Math.max(0, Math.min(1, slopeDeg / RULES.slopeMaxDeg.value));
  return `rgb(${mix(168, 40, t)}, ${mix(230, 110, t)}, ${mix(255, 255, t)})`;
}

/** The route on foot as short solid pieces, each coloured by its slope. Returns the pieces. */
export function drawEffort(map, profile) {
  const g = map.layer('routes'), out = [];
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1], b = profile[i];
    if (a.x === b.x && a.z === b.z) continue;
    const p = map.project(a.x, a.z), q = map.project(b.x, b.z);
    g.append(s('path', { d: `M${p.px.toFixed(2)} ${p.py.toFixed(2)}L${q.px.toFixed(2)} ${q.py.toFixed(2)}`,
      class: 'map-path plan-effort', stroke: effortColor(Math.max(a.slopeDeg || 0, b.slopeDeg || 0)), 'vector-effect': 'non-scaling-stroke' }));
    out.push(g.lastChild);
  }
  return out; // the pieces, so the route can be drawn in (mapPanel.drawIn)
}

/** Darker ground outside the zone, corner brackets, and its name with its size. */
export function drawZone(map, terrain, zone) {
  const n = terrain.n;
  const a = map.project(zone.x0, zone.z1), b = map.project(zone.x1, zone.z0);
  const g = map.layer('areas');
  g.append(s('path', { class: 'plan-zone-dim', 'fill-rule': 'evenodd',
    d: `M-${n} -${n}H${2 * n}V${2 * n}H-${n}Z M${a.px} ${a.py}H${b.px}V${b.py}H${a.px}Z` }));
  const L = Math.min(8, (b.px - a.px) / 6);
  const corner = (x, y, sx, sy) => g.append(s('path', { class: 'plan-zone-corner', 'vector-effect': 'non-scaling-stroke',
    d: `M${x + sx * L} ${y}H${x}V${y + sy * L}` }));
  corner(a.px, a.py, 1, 1); corner(b.px, a.py, -1, 1); corner(a.px, b.py, 1, -1); corner(b.px, b.py, -1, -1);
  const w = Math.round(zone.x1 - zone.x0), hgt = Math.round(zone.z1 - zone.z0);
  const lab = map.addMarker(zone.x0, zone.z1, { kind: 'dot', label: `EVA zone · ${w} × ${hgt} m`, layer: 'top' });
  lab.classList.add('plan-zone-label');
  return { w, h: hgt };
}

/** One hover note for the legend, top right of the cursor (fixed, so the legend's overflow never cuts it). */
let pop = null;
function showPop(text, x, y) {
  if (!pop) { pop = h('div.plan-hoverpop', { role: 'tooltip' }); document.body.append(pop); }
  pop.textContent = text;
  const w = pop.offsetWidth, ph = pop.offsetHeight;
  pop.style.left = Math.min(window.innerWidth - w - 8, x + 14) + 'px';
  pop.style.top = Math.max(8, y - ph - 10) + 'px';
}
export function hidePop() { if (pop) { pop.remove(); pop = null; } }

/** Eye icon (open / crossed out). */
const EYE = '<svg viewBox="0 0 20 20" width="1.15em" height="1.15em" aria-hidden="true"><path d="M1.5 10s3.2-5.5 8.5-5.5S18.5 10 18.5 10s-3.2 5.5-8.5 5.5S1.5 10 1.5 10Z" fill="none" stroke="currentColor" stroke-width="1.5"/><circle cx="10" cy="10" r="2.6" fill="currentColor"/><path class="eye-off" d="M3 17L17 3" stroke="currentColor" stroke-width="1.6"/></svg>';

/**
 * Legend below the map in three groups. layers: [{ key, swatch, name, note, on, tag, disabled }];
 * onToggle(key, on) is called when a layer is shown or hidden. Each layer gets L.set(on) and L.setDisabled(d)
 * so the step can change it from outside (a disabled row is greyed out and its eye does nothing).
 */
export function planLegend({ route, places, layers, onToggle, note }) {
  const item = (sw, text) => h('div.plan-lg__item', h(`span.plan-sw.plan-sw--${sw}`), h('span', text));
  const layerRow = (L) => {
    const btn = h('button.plan-layer__eye', { type: 'button', 'aria-pressed': String(L.on), 'aria-label': `${L.on ? 'Hide' : 'Show'} ${L.name}`, html: EYE });
    const row = h(`div.plan-layer${L.on ? '' : '.is-off'}`, h(`span.plan-sw.plan-sw--${L.swatch}`),
      h('span.plan-layer__name', L.name, L.note ? h('span.plan-layer__note', ` ${L.note}`) : null, L.tag ? [' ', labelTag(L.tag)] : null), btn);
    L.set = (on) => {
      L.on = on;
      row.classList.toggle('is-off', !on);
      btn.setAttribute('aria-pressed', String(on));
      btn.setAttribute('aria-label', `${on ? 'Hide' : 'Show'} ${L.name}`);
    };
    L.setDisabled = (d) => { btn.disabled = d; row.classList.toggle('is-disabled', d); if (!d) hidePop(); };
    // a disabled layer says why on hover: a note top right of the cursor that follows it
    if (L.disabledHint) {
      row.addEventListener('mousemove', (e) => { if (row.classList.contains('is-disabled')) showPop(L.disabledHint, e.clientX, e.clientY); });
      row.addEventListener('mouseleave', hidePop);
    }
    L.setDisabled(!!L.disabled);
    btn.addEventListener('click', () => { L.set(!L.on); onToggle(L.key, L.on); });
    return row;
  };
  return h('div.plan-lg',
    h('div.plan-lg__col', h('div.plan-lg__k', 'Route'), ...route.map(([sw, t]) => item(sw, t))),
    h('div.plan-lg__col', h('div.plan-lg__k', 'Places'), ...places.map(([sw, t]) => item(sw, t))),
    h('div.plan-lg__col.plan-lg__col--layers', h('div.plan-lg__k', 'Map layers'), ...layers.map(layerRow)),
    note ? h('div.plan-lg__note', note) : null);
}
