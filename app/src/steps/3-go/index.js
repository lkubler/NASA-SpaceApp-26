// Step 3 Go / no-go (specs/3-go.md): the plan from step 2 checked against every rule before the walk.
// Reads state.route and state.plan (core planNumbers); writes nothing; numbers only from the core.
import './style.css';
import {
  h, s, headline, lede, bigNumber, pillButton, textLink, mapPanel, legend, labelTag,
  fmtDistance, fmtDuration, fmtDeg, fmtMSv,
} from '../../ui/index.js';
import { ROVER, RULES, ASTRONAUT, spotNumber, stopsOf, stopOrdinal } from '../../core/index.js';
import { heightProfile, ranges } from './profile.js';
import { L } from './labels.js';
import { brokenFixture } from './dev/broken.js';
import { preloadIntroFilm } from '../../ui/introFilm.js';

let root = null;
let offResize = null;

const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

/** One line "value [label]" for a check. */
function val(text, spec) { return h('span.gocheck__v', text, ' ', labelTag(spec)); }

/** Marker number as the plan map shows it: the candidate's number, else its place in the plan's list (test point 07). */
function numberOfSpot(id, cands = []) {
  const k = cands.findIndex((c) => c.candidate.id === id);
  return spotNumber(id) || (k >= 0 ? String(k + 1).padStart(2, '0') : '·');
}

/** Planned value and limit of each rule check, and the text shown where it occurs. */
function describe(c, plan) {
  switch (c.id) {
    case 'slope': return {
      planned: val(`steepest ${fmtDeg(c.planned)}`, L.steepest),
      limit: val(`limit ${RULES.slopeMaxDeg.value}${RULES.slopeMaxDeg.unit}`, RULES.slopeMaxDeg),
      at: c.status === 'broken' ? `Too steep from here: ${c.text}` : `Steepest point: ${fmtDeg(c.planned)}`,
    };
    case 'distance': return {
      planned: val(`farthest ${fmtDistance(c.planned)}`, L.farthest),
      limit: [val(`plan ${fmtDistance(c.plan)}`, RULES.distancePlanM), val(`limit ${fmtDistance(c.limit)}`, RULES.distanceLimitM)],
      at: `Farthest from the rover: ${fmtDistance(c.planned)}`,
    };
    case 'wayHome': return {
      planned: val(`reserve ${fmtDuration(c.planned)}`, L.reserve),
      limit: val(`limit > ${fmtDuration(c.limit)}, home ${RULES.walkBackRateFactor.unit}${RULES.walkBackRateFactor.value}`, RULES.walkBackRateFactor),
      at: plan.turnBack ? 'Turn-back point: reserve on return reaches zero' : `Back at the rover with ${fmtDuration(c.planned)} reserve`,
    };
    case 'excursion': return {
      planned: val(fmtDuration(c.planned), L.duration),
      limit: [val(`plan ${RULES.evaPlannedH.value} ${RULES.evaPlannedH.unit}`, RULES.evaPlannedH), val(`limit ${RULES.evaLimitH.value} ${RULES.evaLimitH.unit}`, RULES.evaLimitH)],
      at: `Back at the rover after ${fmtDuration(c.planned)}`,
    };
    case 'radio': return {
      planned: c.planned > 0 ? val(`longest ${fmtDuration(c.planned)}`, L.shadow) : val('none on the route', L.shadow),
      limit: h('span.gocheck__v.muted', 'a caution, not a rule'),
      at: `Longest radio shadow: ${fmtDuration(c.planned)}`,
    };
    default: return { planned: '', limit: '', at: c.name };
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
    const spotName = route.spot.name || 'Spot';
    // several stops (specs/feedback-1.md): the whole round, every stop by number and name in visiting order
    const stops = stopsOf(route);
    const several = stops.length > 1;
    const num = (id) => numberOfSpot(id, ctx.state.candidates);
    const seq = stops.map((st) => `${num(st.id)} ${st.name || 'Spot'}`).join(' → ');

    // --- intro and big numbers
    const head = headline(broken ? 'Route breaks a rule.' : 'Route ready.', { size: 'hero' });
    head.dataset.enter = '1'; // x-transitions: entry order of the blocks (styles/frame.css)
    const intro = h('section.go__intro',
      head,
      lede(several
        ? (broken
          ? `The best round, rover → ${seq} → rover, breaks ${plural(broken, 'rule')}. Every other limit is checked below.`
          : `On foot from the rover to ${seq} and back, checked against every rule.`)
        : broken
          ? `The best route to ${spotName.toLowerCase()} breaks ${plural(broken, 'rule')}. Every other limit is checked below.`
          : `Rover to ${spotName.toLowerCase()} on foot and back, checked against every rule.`,
      h('span.go__demo', ' Demo time ', h('span.mono', `${L.demo.value}${L.demo.unit}`), ' ', labelTag(L.demo))),
      h('div.go__nums', { 'data-enter': 2 },
        bigNumber({ label: 'Distance', value: fmtDistance(plan.distanceM), tag: L.distance }),
        bigNumber({ label: 'Duration', value: fmtDuration(plan.timeS, { approx: true }), tag: L.duration }),
        bigNumber({ label: 'Steepest slope', value: fmtDeg(plan.steepestDeg), tag: L.steepest, tone: plan.checks.find((c) => c.id === 'slope').status === 'broken' ? 'warning' : null }),
        bigNumber({ label: 'Reserve on return', value: fmtDuration(plan.reserveS), tag: L.reserve, tone: plan.reserveS < 0 ? 'warning' : null }),
        bigNumber({ label: 'Radiation dose', value: fmtMSv(plan.radiationMSv), tag: L.radiation }),
      ));

    // --- small map: same terrain and route as the plan step
    // fade: ground, route and markers fade in together once drawn (no pop over an empty frame)
    const map = mapPanel(terrain, { steep: true, scaleM: 20, fade: true });
    const wide = plan.profile.every((p) => Math.abs(p.z - ROVER.z) < terrain.extent / 2 / 1.6 - 4);
    if (wide) { map.el.classList.add('go-map--wide'); map.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice'); }
    drawRoute(map, plan);
    map.addMarker(ROVER.x, ROVER.z, { kind: 'rover' });
    stops.forEach((st, k) => {
      const g = map.addMarker(st.x, st.z, { kind: 'number', text: num(st.id), selected: true });
      if (several) {
        g.append(s('g', { class: 'go-order', transform: 'translate(0 -11.2)' },
          s('rect', { x: -6, y: -3.3, width: 12, height: 6.6, rx: 3.3 }),
          s('text', { 'text-anchor': 'middle', dy: '0.36em' }, stopOrdinal(k + 1))));
      }
    });
    const hasShadow = plan.radioStretches.length > 0;
    const mapBox = h('section.go__map', { 'data-enter': 3 }, map.el, legend([
      { kind: 'rover', text: 'Rover' },
      { kind: 'foot', text: 'On foot' },
      { kind: 'selected', text: several ? 'Stops, visiting order' : 'Spot' },
      hasShadow ? { kind: 'go-shadow', text: 'Radio shadow' } : null,
      { kind: 'steep', text: `Steeper than ${RULES.slopeMaxDeg.value}${RULES.slopeMaxDeg.unit}` },
      broken ? { kind: 'go-broken', text: 'Breaks a rule' } : null,
    ].filter(Boolean)));

    // --- height profile
    const prof = heightProfile(plan, several
      ? { stops: plan.stops.map((st) => ({ sM: st.sM, label: `${stopOrdinal(st.order)} · ${num(st.id)} ${st.name}` })) }
      : { spotName });
    const profBox = h('section.go__profile', { 'data-enter': 3 }, prof.el);

    // --- checks: one per rule in the row; the radio shadow is not a rule, so it gets its own "Caution" line
    let active = null;
    const toggle = (b, c, d, status) => (e) => {
      if (e.target.closest('.vlabel')) return;
      select(active && active.c === c ? null : { c, b, d, status });
    };
    const ruleChecks = plan.checks.filter((c) => c.id !== 'radio').map((c) => {
      const d = describe(c, plan);
      const status = c.status;
      const icon = { ok: '✓', caution: '!', broken: '×' }[status] || '';
      const clickable = !!c.where;
      const b = h(`${clickable ? 'button' : 'div'}.gocheck.gocheck--${status}`, clickable ? { type: 'button', 'aria-pressed': 'false' } : null,
        h('span.gocheck__head', h('span.check__icon', icon), h('span.gocheck__name', c.name)),
        status === 'broken' && c.text ? h('span.gocheck__why', c.text) : null,
        h('span.gocheck__vals', d.planned, d.limit),
      );
      if (clickable) b.addEventListener('click', toggle(b, c, d, status));
      return b;
    });

    const radio = plan.checks.find((c) => c.id === 'radio');
    let cautionLine = null;
    if (radio) {
      const d = describe(radio, plan);
      const has = !!radio.where && plan.radioStretches.length > 0;
      cautionLine = h(`${has ? 'button' : 'div'}.gocaution${has ? '' : '.is-none'}`, has ? { type: 'button', 'aria-pressed': 'false' } : null,
        h('span.gocaution__tag', 'Caution'),
        h('span.gocaution__name', radio.name),
        h('span.gocaution__v', d.planned),
        h('span.gocaution__note', has ? 'No contact with the rover. Not a rule: the walk may go on.' : 'Contact with the rover all the way.'),
        has ? h('span.gocaution__show', 'Show on route') : null);
      if (has) cautionLine.addEventListener('click', toggle(cautionLine, radio, d, 'caution'));
    }

    function select(sel) {
      if (active) { active.b.classList.remove('is-active'); active.b.setAttribute('aria-pressed', 'false'); }
      active = sel;
      map.clearLayer('top');
      if (!sel) { prof.focus(null); return; }
      sel.b.classList.add('is-active'); sel.b.setAttribute('aria-pressed', 'true');
      const tone = sel.status === 'broken' ? 'warning' : sel.status === 'caution' ? 'caution' : 'accent';
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

    const suitChecks = h('div.go__suit',
      ['Oxygen full', 'Suit sealed', 'Radio to rover'].map((t) => h('span.gocheck--ok.gosuit', h('span.check__icon', '✓'), t)),
      labelTag(L.suit));

    // crew and suit as the plan counts them, and the reserve oxygen it never counts (specs/rules.md)
    const A = ASTRONAUT, O2 = RULES.secondaryO2H;
    const crew = h('div.go__crew',
      h('span', `Astronaut ${A.bodyMassKg.value} ${A.bodyMassKg.unit} `), labelTag(A.bodyMassKg),
      h('span', ` + load ${A.loadKg.value} ${A.loadKg.unit} `), labelTag(A.loadKg),
      h('i', ' · '), h('span', `Suit ${A.suitMassKg.value} ${A.suitMassKg.unit} `), labelTag(A.suitMassKg),
      h('i', ' · '), h('span', `Secondary oxygen: ${O2.value} ${O2.unit}, not counted in the plan `), labelTag(O2));

    const btn = pillButton({
      text: broken ? `Start with ${plural(broken, 'broken rule')}` : 'Start excursion',
      variant: broken ? 'warn' : 'go', arrow: true,
      onClick: () => ctx.next(),
    });
    const bottom = h('section.go__bottom',
      h('div.go__checks', { 'data-enter': 4 },
        h('div.go__checkshead', h('span.go__checkstitle', broken ? `${plural(broken, 'rule')} broken.` : 'Every rule kept.'), h('span.muted', 'Click a check to see where it occurs on the route.')),
        h('div.go__rulechecks', ruleChecks),
        cautionLine, suitChecks, crew),
      h('div.go__action', { 'data-enter': 5 }, textLink('Edit route', () => ctx.back()), btn));

    el.append(h(`div.go${broken ? '.is-broken' : ''}`, intro, mapBox, profBox, bottom));
    requestAnimationFrame(() => prof.resize());
    map.reveal();
    ctx.flipIn(map.el); // x-transitions: from Plan the map moves here from its large place on the left
    const onResize = () => prof.resize();
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
