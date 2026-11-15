// Step 3 Go / no-go (specs/3-go.md): the plan from step 2 checked against every rule before the walk.
// Reads state.route and state.plan (core planNumbers); writes nothing; numbers only from the core.
import './style.css';
import {
  h, s, headline, lede, bigNumber, pillButton, textLink, mapPanel, labelTag,
  fmtDistance, fmtDuration, fmtDeg, fmtMSv,
} from '../../ui/index.js';
import { ROVER, RULES, ACCESS_MARS_POINTS, getRelay, spotNumber, stopsOf, stopOrdinal } from '../../core/index.js';
import { EXTRA_TAGS, zoneOf, roverDriveOf, drawZone } from '../2-plan/extras.js';
import { paintGround, composeGround, hatchPattern } from '../2-plan/ground.js';
import { heightProfile, ranges } from './profile.js';
import { loadHirise, hiriseSlopeOnRoute } from '../../core/datalines.js';
import { L } from './labels.js';
import { brokenFixture } from './dev/broken.js';
import { preloadIntroFilm } from '../../ui/introFilm.js';

let root = null;
let offResize = null;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five'];
const countWord = (n) => WORDS[n] || String(n);

/** Marker number as the plan map shows it: the candidate's number, else its place in the plan's list (test point 07). */
function numberOfSpot(id, cands = []) {
  const k = cands.findIndex((c) => c.candidate.id === id);
  return spotNumber(id) || (k >= 0 ? String(k + 1).padStart(2, '0') : '·');
}

// row icons: kept (circle with a tick), keep an eye on (triangle), broken (circle with a cross)
const ICON = {
  ok: '<svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M6.2 10.3l2.6 2.6 5-5.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  caution: '<svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true"><path d="M10 2.6l8 14.2H2z" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/><path d="M10 8v4.2" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="10" cy="14.6" r="1" fill="currentColor"/></svg>',
  broken: '<svg viewBox="0 0 20 20" width="1.1em" height="1.1em" aria-hidden="true"><circle cx="10" cy="10" r="8.2" fill="none" stroke="currentColor" stroke-width="1.6"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
};

/** A value with its label tag, in mono. */
const v = (text, spec) => h('span.gorow__v', text, ' ', labelTag(spec));

/**
 * One checklist row per check: tone (ok / caution / broken), a note under the name, "value / limit" on the
 * right and a bar for how much of the limit is used (none where a bar says nothing).
 */
function describe(c, plan) {
  const S = RULES.slopeMaxDeg;
  switch (c.id) {
    case 'slope': {
      const near = c.status !== 'broken' && c.planned >= S.value - 0.05; // shown as the limit itself (20.0°)
      return { tone: c.status === 'broken' ? 'broken' : near ? 'caution' : 'ok',
        note: c.status === 'broken' ? c.text : near ? `at the ${S.value}${S.unit} limit` : '',
        value: v(fmtDeg(c.planned), L.steepest), limit: v(`${S.value}${S.unit}`, S), use: c.planned / S.value,
        at: c.status === 'broken' ? `Too steep from here: ${c.text}` : `Steepest point: ${fmtDeg(c.planned)}` };
    }
    case 'distance': return { tone: c.status,
      note: c.status === 'caution' ? `beyond the ${fmtDistance(c.plan)} plan` : c.status === 'broken' ? `beyond the ${fmtDistance(c.limit)} limit` : '',
      value: v(fmtDistance(c.planned), L.farthest), limit: v(fmtDistance(c.limit), RULES.distanceLimitM), use: c.planned / c.limit,
      at: `Farthest from the rover: ${fmtDistance(c.planned)}` };
    case 'wayHome': return { tone: c.status,
      note: c.status === 'broken' ? 'the suit runs out before the crew is back' : '',
      value: v(`${fmtDuration(c.planned)} left`, L.reserve), limit: v(`> ${fmtDuration(c.limit)}`, RULES.walkBackRateFactor), use: null,
      at: plan.turnBack ? 'Turn-back point: reserve on return reaches zero' : `Back at the rover with ${fmtDuration(c.planned)} reserve` };
    case 'excursion': {
      const over = c.planned - c.plan;
      return { tone: c.status,
        note: c.status === 'broken' ? `over the ${RULES.evaLimitH.value} h limit` : over > 0 ? [`${fmtDuration(over)} over the ${RULES.evaPlannedH.value} h plan `, labelTag(RULES.evaPlannedH)] : '',
        value: v(fmtDuration(c.planned), L.duration), limit: v(`${RULES.evaLimitH.value} h`, RULES.evaLimitH), use: c.planned / c.limit,
        at: `Back at the rover after ${fmtDuration(c.planned)}` };
    }
    case 'shelter': return { tone: c.status,
      note: c.status === 'broken' ? 'too far in time from shelter if a solar storm warning comes' : '',
      value: v(fmtDuration(c.planned), L.shelter), limit: v(fmtDuration(c.limit), RULES.shelterReturnH), use: c.planned / c.limit,
      at: `Farthest in time from the rover: ${fmtDuration(c.planned)} to get back` };
    case 'radio': return { tone: c.planned > 0 ? 'caution' : 'ok',
      note: c.planned > 0 ? 'not a rule, the walk may go on' : 'contact with the rover all the way',
      value: v(c.planned > 0 ? fmtDuration(c.planned) : 'none', L.shadow), limit: h('span.gorow__v', 'no limit'), use: null,
      at: `Longest radio shadow: ${fmtDuration(c.planned)}` };
    default: return { tone: c.status, note: '', value: '', limit: '', use: null, at: c.name };
  }
}

/** Route on the map in pieces: on foot, in radio shadow (dimmed), over the slope rule (red). */
function drawRoute(map, plan) {
  const pts = plan.profile;
  let cur = null;
  const flush = () => { if (cur && cur.pts.length > 1) map.path(cur.pts, { style: cur.style }); };
  for (let k = 0; k < pts.length; k++) {
    const p = pts[k];
    const style = p.closed ? 'broken' : p.shadow ? 'shadow' : 'foot';
    if (!cur || cur.style !== style) {
      flush();
      cur = { style, pts: k ? [pts[k - 1]] : [] };
    }
    cur.pts.push(p);
  }
  flush();
}

export default {
  n: 3, id: 'go', title: 'Go / no-go',
  isComplete: (state) => !!state.plan,

  async mount(el, ctx) {
    root = el;
    preloadIntroFilm(); // x-intro: the walk's intro film loads while this step is open
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    const { plan, route } = ctx.state;
    if (!plan || !route) { el.append(h('div.go', headline('No route yet.', { size: 'hero' }))); return; }

    const broken = plan.brokenRules.length;
    // several stops (specs/feedback-1.md): the whole round, every stop by number and name in visiting order
    const stops = stopsOf(route);
    const several = stops.length > 1;
    const num = (id) => numberOfSpot(id, ctx.state.candidates);
    const named = stops.map((st) => `${num(st.id)} ${st.name || 'Spot'}`);
    const seq = named.length > 1 ? `${named.slice(0, -1).join(', then ')}, then ${named[named.length - 1]}` : named[0];

    // --- headline, one sentence, five big numbers (each with a short line under it)
    const head = headline(broken ? 'Route breaks a rule.' : 'Route ready.', { size: 'hero' });
    head.dataset.enter = '1'; // x-transitions: entry order of the blocks (styles/frame.css)
    const slope = plan.checks.find((c) => c.id === 'slope');
    const S = RULES.slopeMaxDeg;
    const slopeTone = slope.status === 'broken' ? 'warning' : plan.steepestDeg >= S.value - 0.05 ? 'caution' : null;
    const num5 = (o, sub) => { const b = bigNumber(o); if (sub) b.append(h('div.bignum__sub', sub)); return b; };
    const intro = h('section.go__intro',
      head,
      lede(broken
        ? `On foot from the rover to ${seq} and back. The best ${several ? 'round' : 'route'} breaks ${plural(broken, 'rule')}; every other limit is checked below.`
        : `On foot from the rover to ${seq} and back. Checked against every rule.`,
      h('span.go__demo', ' Demo time ', h('span.mono', `${L.demo.value}${L.demo.unit}`), ' ', labelTag(L.demo))),
      h('div.go__nums', { 'data-enter': 2 },
        num5({ label: 'Distance', value: fmtDistance(plan.distanceM), tag: L.distance }, 'on foot'),
        num5({ label: 'Duration', value: fmtDuration(plan.timeS, { approx: true }), tag: L.duration }, 'suit time'),
        num5({ label: 'Reserve on return', value: fmtDuration(plan.reserveS), tag: L.reserve, tone: plan.reserveS < 0 ? 'warning' : null }, null),
        num5({ label: 'Steepest slope', value: fmtDeg(plan.steepestDeg), tag: L.steepest, tone: slopeTone },
          slope.status === 'broken' ? `over the ${S.value}${S.unit} limit` : slopeTone ? `at the ${S.value}${S.unit} limit` : null),
        num5({ label: 'Radiation dose', value: fmtMSv(plan.radiationMSv), tag: L.radiation }, null),
      ));

    // --- map: the plan's EVA zone, rover drive, relay and handover (look only, as in step 2), the round on foot
    const map = mapPanel(terrain, { steep: true, patterns: { steep: hatchPattern }, patternPx: 0.8, scaleM: 20, fade: true, movable: false, resetButton: false, zoomButtons: false });
    const cands = ctx.state.candidates || [];
    const clampT = (x) => Math.max(terrain.min + 2, Math.min(terrain.max - 2, x));
    const zz = zoneOf([...cands.map((c) => c.candidate), ...stops, ROVER], 6);
    const zone = { x0: clampT(zz.x0), x1: clampT(zz.x1), z0: clampT(zz.z0), z1: clampT(zz.z1) };
    const relayAt = getRelay(); // the relay the visitor placed in the Plan, or none
    // the map shows the EVA zone only: its frame takes the zone's shape, so no darkened ground around it
    map.el.style.aspectRatio = `${Math.max(1, Math.min(1.8, (zone.x1 - zone.x0) / (zone.z1 - zone.z0))).toFixed(3)} / 1`;
    map.setHome([{ x: zone.x0, z: zone.z0 }, { x: zone.x1, z: zone.z1 }], { margin: 0.12, maxK: 3, square: false }); // ground beyond the zone, so stops at its edge stay clear of the faded border
    let groundDone = false, drawn = false;
    const revealWhenReady = () => { if (groundDone && drawn) map.reveal(); };
    const cv = map.canvas.getContext('2d');
    const relief = cv.getImageData(0, 0, map.canvas.width, map.canvas.height);
    paintGround(terrain, map.canvas.width).then((img) => {
      if (root !== el || !img) return;
      composeGround(cv, relief, img);
      map.redraw();
    }).catch((e) => console.warn('top-down terrain render failed, keeping the relief', e))
      .finally(() => { groundDone = true; revealWhenReady(); });

    let driveMemo = null;
    function drawMap() {
      ['areas', 'routes', 'markers'].forEach((n) => map.clearLayer(n));
      drawZone(map, terrain, zone);
      // the rover drive from the base, from the visible map edge to the rover (look only, as in step 2)
      const R = map.el.getBoundingClientRect();
      if (R.width && R.height) {
        // markers and labels about as large on screen as on the plan map (this map is much smaller)
        map.setMarkerScale(Math.max(1, (0.85 * window.innerWidth) / R.width));
        const p0 = map.eventToScene({ clientX: R.left, clientY: R.bottom }), p1 = map.eventToScene({ clientX: R.right, clientY: R.top });
        const key = [p0.x, p1.x, p0.z, p1.z].map((x) => x.toFixed(1)).join(' ');
        if (!driveMemo || driveMemo.key !== key) driveMemo = { key, drive: roverDriveOf(terrain, { x0: clampT(p0.x), x1: clampT(p1.x), z0: clampT(p0.z), z1: clampT(p1.z) }) };
        if (driveMemo.drive) map.path(driveMemo.drive.points, { style: 'rover' });
      }
      if (relayAt) map.addMarker(relayAt.x, relayAt.z, { kind: 'rover', label: 'Relay', layer: 'markers' }).classList.add('go-relay');
      drawRoute(map, plan);
      const ho = map.addMarker(ROVER.x, ROVER.z, { kind: 'point', label: 'Handover', layer: 'markers' });
      ho.classList.add('go-handover');
      ho.append(s('circle', { r: 1.6, class: 'go-handover__dot' }));
      stops.forEach((st, k) => {
        const g = map.addMarker(st.x, st.z, { kind: 'number', text: num(st.id), selected: true });
        if (several) {
          g.append(s('g', { class: 'go-order', transform: 'translate(0 -11.2)' },
            s('rect', { x: -6, y: -3.3, width: 12, height: 6.6, rx: 3.3 }),
            s('text', { 'text-anchor': 'middle', dy: '0.36em' }, stopOrdinal(k + 1))));
        }
      });
      drawn = true;
      revealWhenReady();
    }
    const sw = (k) => h(`span.go-sw.go-sw--${k}`);
    const mapLegend = h('div.go-legend',
      h('span', sw('rover'), 'Rover ', labelTag(EXTRA_TAGS.drive)),
      h('span', sw('foot'), 'On foot'),
      h('span', sw('handover'), 'Handover'),
      h('span', sw('stop'), several ? 'Stops' : 'Stop'),
      relayAt ? h('span', sw('relay'), 'Relay ', labelTag(EXTRA_TAGS.relay)) : null,
      h('span', sw('steep'), 'Too steep ', labelTag(S)));
    // the zone's name above the map; the map's ground fades out towards its edges
    const zoneW = Math.round(zone.x1 - zone.x0), zoneH = Math.round(zone.z1 - zone.z0);
    const frame = h('div.go-frame',
      h('div.go-frame__label', `EVA zone · ${zoneW} × ${zoneH} m `, labelTag(EXTRA_TAGS.zone)),
      map.el);
    const mapBox = h('section.go__map', { 'data-enter': 3 }, frame, mapLegend);

    // --- height profile, the longest radio shadow named in a chip over it
    const radio = plan.checks.find((c) => c.id === 'radio');
    const shadowLabel = radio && radio.planned > 0
      ? h('span', `Radio shadow · up to ${fmtDuration(radio.planned)} `, labelTag(L.shadow)) : 'Radio shadow';
    const prof = heightProfile(plan, several
      ? { stops: plan.stops.map((st) => ({ sM: st.sM, label: num(st.id) })), shadowLabel }
      : { spotName: num(stops[0].id), shadowLabel });
    const profBox = h('section.go__profile', { 'data-enter': 3 }, prof.el);

    // --- route checklist: one row per rule, then the radio shadow (a caution at most, not a rule)
    let active = null;
    const rows = [];
    const order = ['slope', 'distance', 'wayHome', 'excursion', 'shelter', 'radio'];
    const checks = order.map((id) => plan.checks.find((c) => c.id === id)).filter(Boolean);
    for (const c of checks) {
      const d = describe(c, plan);
      const clickable = !!c.where && !(c.id === 'radio' && !plan.radioStretches.length);
      const bar = d.use == null ? null
        : h('span.gorow__bar', h('span.gorow__fill', { style: { width: `${Math.max(2, Math.min(100, d.use * 100)).toFixed(1)}%` } }));
      const b = h(`${clickable ? 'button' : 'div'}.gocheck.gorow.gorow--${d.tone}${c.id === 'radio' ? '.gocaution' : ''}`, clickable ? { type: 'button', 'aria-pressed': 'false' } : null,
        h('span.gorow__icon', { html: ICON[d.tone] || ICON.ok }),
        h('span.gorow__text', h('span.gocheck__name', c.name), d.note ? h('span.gorow__note', d.note) : null),
        h('span.gorow__vals', h('span.gorow__line', d.value, h('span.gorow__sep', ' / '), d.limit), bar));
      if (clickable) b.addEventListener('click', (e) => {
        if (e.target.closest('.vlabel')) return;
        select(active && active.c === c ? null : { c, b, d });
      });
      rows.push({ b, d });
    }
    // slope check against the HiRISE elevation model (specs/x-datalines.md): a caution at most, 0 m reads as ok
    const hirise = await loadHirise(terrain.meta);
    if (root !== el) return;
    if (hirise) {
      const hr = hiriseSlopeOnRoute(plan.profile, hirise);
      const steep = hr.steepM > 0;
      const m = steep && hr.steepM < 10 ? `${hr.steepM.toFixed(1)} m` : fmtDistance(hr.steepM);
      const gap = hr.noDataM > 0.5 ? ` ${fmtDistance(hr.noDataM)} of the route has no HiRISE data.` : '';
      const d = { tone: steep ? 'caution' : 'ok' };
      const b = h(`div.gocheck.gorow.gorow--${d.tone}.gocaution`, null,
        h('span.gorow__icon', { html: ICON[d.tone] || ICON.ok }),
        h('span.gorow__text', h('span.gocheck__name', 'Slope in HiRISE'),
          h('span.gorow__note', (steep ? 'a second elevation model sees steeper ground; not a rule' : 'a second elevation model agrees with the route') + gap)),
        h('span.gorow__vals', h('span.gorow__line', v(steep ? m : '0 m', L.hirise(hr.noDataM)), h('span.gorow__sep', ' / '), h('span.gorow__v', `steeper than ${RULES.slopeMaxDeg.value}${RULES.slopeMaxDeg.unit}`))));
      rows.push({ b, d });
    }
    const brokenN = rows.filter((r) => r.d.tone === 'broken').length;
    const eyeN = rows.filter((r) => r.d.tone === 'caution').length;
    const summary = [brokenN ? `${plural(brokenN, 'rule')} broken` : 'Every rule kept',
      eyeN ? `${countWord(eyeN)} thing${eyeN === 1 ? '' : 's'} to keep an eye on` : null].filter(Boolean).join(' · ');

    function select(sel) {
      if (active) { active.b.classList.remove('is-active'); active.b.setAttribute('aria-pressed', 'false'); }
      active = sel;
      map.clearLayer('top');
      if (!sel) { prof.focus(null); return; }
      sel.b.classList.add('is-active'); sel.b.setAttribute('aria-pressed', 'true');
      const tone = sel.d.tone === 'broken' ? 'warning' : sel.d.tone === 'caution' ? 'caution' : 'accent';
      const { c } = sel;
      let range = null;
      if (c.id === 'radio') {
        const st = plan.radioStretches.reduce((a, b) => (b.seconds > a.seconds ? b : a));
        range = [st.startM, st.endM];
      } else if (c.id === 'slope' && c.status === 'broken') {
        range = ranges(plan.profile, (p) => p.closed).find((r) => r[1] >= c.where.sM) || null;
      }
      if (range) {
        const seg = plan.profile.filter((p) => p.sM >= range[0] && p.sM <= range[1]);
        if (seg.length > 1) map.path(seg, { style: 'foot', layer: 'top' }).classList.add('go-map__hl', `tone-${tone}`);
      }
      const { px, py } = map.project(c.where.x, c.where.z);
      map.layer('top').append(s('g', { class: `go-map__ring tone-${tone}`, transform: `translate(${px.toFixed(2)} ${py.toFixed(2)})` },
        s('circle', { r: 7 }), s('circle', { r: 2 })));
      prof.focus(c.where, sel.d.at, { range, tone });
    }

    const checksBox = h('section.go__checks', { 'data-enter': 4 },
      h('div.go__checkshead', h('span.go__checkstitle', 'Route checklist'), h('span.go__summary', summary)),
      h('div.go__rulechecks', rows.map((r) => r.b)));

    const btn = pillButton({
      text: broken ? `Start with ${plural(broken, 'broken rule')}` : 'Start 3D route demo',
      variant: broken ? 'warn' : 'go', arrow: true,
      onClick: () => ctx.next(),
    });
    const action = h('div.go__action', { 'data-enter': 5 }, textLink('Edit route', () => ctx.back()), btn);

    el.append(h(`div.go${broken ? '.is-broken' : ''}`,
      h('div.go__left', intro, checksBox),
      h('div.go__right', mapBox, profBox, action)));
    requestAnimationFrame(() => { prof.resize(); drawMap(); });
    ctx.flipIn(map.el); // x-transitions: from Plan the map moves here from its large place on the left
    const onResize = () => { prof.resize(); drawMap(); if (active) select(active); };
    window.addEventListener('resize', onResize);
    offResize = () => window.removeEventListener('resize', onResize);
  },

  unmount() { root = null; if (offResize) offResize(); offResize = null; },

  /**
   * Dev jump (?step=4 and later). Step 3 adds nothing to the state. Test aid: &broken=1 swaps in a route
   * that breaks the slope rule (dev/broken.js), so steps 4 and 5 can be tried on the broken-rule path.
   */
  async devFixture(state, { getTerrain, params }) {
    if (params.get('broken') !== '1') return null;
    return brokenFixture(await getTerrain());
  },
};
