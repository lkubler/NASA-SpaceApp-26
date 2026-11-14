// Step 2 Plan (specs/2-plan.md). Map left with legend, panel right: headline, cards, legs, totals,
// main button. Every number comes from the core (planAllCandidates / planNumbers, closedMask,
// radioShadowMask); routes are calculated in the browser when the step opens.
import './style.css';
import { h, s, splitLayout, headline, card, pillButton, mapPanel, legend, marker, row, bigNumber, alertBox, labelTag,
  fmtDuration, fmtDistance, fmtDeg } from '../../ui/index.js';
import { planAllCandidates, ROVER, ACCESS_MARS_POINTS, RULES, DEMO, HOME, ASTRONAUT, SUIT, DOCS, DATA,
  closedMask, radioShadowMask, sourceOf, spotNumber } from '../../core/index.js';
import { paintGround, composeGround, paintOverlays } from './ground.js';
import { BROKEN_TEST_TARGET } from '../3-go/dev/broken.js';
import { GROUND_TAG } from '../../core/groundColor.js';

let root = null;
let cleanup = [];

// ---------- labels (texts only; the numbers in them are read from the core) ----------
const ACCESS_MARS = DATA[0];
const L = {
  terrain: { label: 'real', text: 'The site from above: the Access Mars 3D terrain of Murray Buttes, built from Curiosity images. It is the same ground you walk in step 4.', source: { title: ACCESS_MARS.name, url: ACCESS_MARS.url } },
  steep: { label: 'model', text: `Ground steeper than ${RULES.slopeMaxDeg.value}° on the slope grid of the same terrain. NASA's suit is built for ${RULES.slopeMaxDeg.value}° at most, so routes do not cross it.`, source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  shadow: { label: 'model', text: 'Ground without a straight line of sight to the rover antenna at eye height. Geometry only, no radio physics. A caution, not a rule.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  spot: { label: 'model', text: 'Position derived from the terrain: a reachable spot at the foot of a butte wall. No Curiosity target lies in this square.', source: { title: DOCS.WALK_TARGETS.title, url: DOCS.WALK_TARGETS.url } },
  point: { label: 'real', text: 'A point of interest of the Access Mars app, with its original text. Not a sample spot.', source: { title: ACCESS_MARS.name, url: ACCESS_MARS.url } },
  distance: { label: 'model', text: 'Length of the route calculated in your browser on the terrain grid: the fastest way that keeps every rule.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  time: { label: 'model', text: 'Route length at NASA\'s planning pace, plus the fixed work at the spot; in demo time.', source: sourceOf(ASTRONAUT.paceMS), moon: true },
  reserve: { label: 'model', moon: true, text: `Time left in the suit when back at the rover, if the crew walks the plan. The way home counts at a ${Math.round((RULES.walkBackRateFactor.value - 1) * 100)} % higher work rate. Set by the consumable that runs out first.`, source: sourceOf(SUIT.designW) },
  slope: { label: 'model', text: 'Steepest ground on the route, from the slope grid of the terrain.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
};

const SPOT_WORK = () => fmtDuration(DEMO.spotWorkMin.value * 60);
/** What the spot is, from its terrain description (walk-targets.md): beside a butte wall or at the foot of a butte. */
const spotPlace = (c) => (/wall/i.test(c.name) && /beside/i.test(c.name) ? 'Beside a butte wall' : 'At the foot of a butte');
/** The task of the chosen request (step 1). */
// map drawing sizes in SVG units (one unit = one grid cell): an Access Mars point is drawn at least
// MARK_CLEAR from a numbered marker's centre (marker radius 6.5 + point radius 3.4 + a gap), and its centre at
// least POINT_INSET inside the visible map edge
const MARK_CLEAR = 11.5;
const POINT_INSET = 5.5;
const taskOf = (r) => (!r ? 'Work at the spot' : r.kind === 'measurement' ? 'One radiation measurement' : 'One sample');

function cheapestId(cands) {
  const pool = cands.some((c) => c.plan.keepsRules) ? cands.filter((c) => c.plan.keepsRules) : cands;
  return pool.reduce((a, b) => (b.plan.timeS < a.plan.timeS ? b : a)).candidate.id;
}

/** Split the route profile into runs of the same kind: 'closed' (rule broken), 'shadow' (radio shadow), 'ok'. */
function runs(profile) {
  const out = [];
  let cur = null;
  for (let i = 1; i < profile.length; i++) {
    const a = profile[i - 1], b = profile[i];
    if (a.x === b.x && a.z === b.z) continue;
    const kind = (a.closed || b.closed) ? 'closed' : (a.shadow || b.shadow) ? 'shadow' : 'ok';
    if (!cur || cur.kind !== kind || cur.leg !== b.leg) { cur = { kind, leg: b.leg, points: [a] }; out.push(cur); }
    cur.points.push(b);
  }
  return out;
}

export default {
  n: 2, id: 'plan', title: 'Plan',
  isComplete: (state) => !!(state.route && state.plan),

  async mount(el, ctx) {
    root = el;
    const Lay = splitLayout();
    el.append(Lay.el);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;

    // ----- map -----
    const map = mapPanel(terrain, { steep: false, shadow: false });
    const tip = h('div.plan-tip', { hidden: true });
    map.el.append(tip);
    // wide map, cropped north and south (slice) only as far as every marker and route stays in view
    map.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const steepMask = closedMask(terrain);
    const shadowMask = radioShadowMask(terrain);
    const cv = map.canvas.getContext('2d');
    const relief = cv.getImageData(0, 0, map.canvas.width, map.canvas.height);
    paintOverlays(cv, steepMask, shadowMask);
    paintGround(terrain, map.canvas.width).then((img) => {
      if (root !== el || !img) return;
      composeGround(cv, relief, img);
      paintOverlays(cv, steepMask, shadowMask);
    }).catch((e) => console.warn('top-down terrain render failed, keeping the relief', e));

    const leg = legend([
      { kind: 'foot', text: 'On foot' },
      { kind: 'radio', text: 'Route in radio shadow' },
      { kind: 'rover', text: ['Rover, home ', labelTag(HOME.rover)] },
      { kind: 'marker', text: ['Candidate spot ', labelTag(L.spot)] },
      { kind: 'cheapest', text: 'Cheapest' },
      { kind: 'point', text: ['Access Mars point ', labelTag(L.point)] },
      { kind: 'steep', text: [`Too steep (> ${RULES.slopeMaxDeg.value}°) `, labelTag(L.steep)] },
      { kind: 'shadow', text: ['Radio shadow ', labelTag(L.shadow)] },
    ], ['Terrain: Access Mars ', labelTag(L.terrain), ' · ground colour ', labelTag(GROUND_TAG)]);
    Lay.map.append(map.el, leg);

    // ----- panel -----
    const cards = h('div.plan-cards');
    const legs = h('div.plan-legs');
    const totals = h('div.plan-totals');
    const demo = h('div.plan-demo', 'Demo time: clock and suit run ', String(DEMO.timeFactor.value), DEMO.timeFactor.unit, ' faster ', labelTag(DEMO.timeFactor));
    const btn = pillButton({ text: 'Confirm route', onClick: () => ctx.next(), disabled: !ctx.state.route });
    const req = ctx.state.request;
    const reqBox = req ? h('div.plan-req',
      h('div.plan-req__kicker.mono', 'Request from Earth · ', req.from || ''),
      h('div.plan-req__title', req.title)) : null;
    Lay.panel.append(headline('Plan your mission.'), reqBox, cards, legs, h('div.plan-spacer'), totals, demo);
    Lay.action.append(btn);

    cards.append(card({ title: 'Calculating routes…', sub: 'Fastest route to every spot that keeps every rule.' }));

    // routes are calculated here, in the browser, when the step opens
    await new Promise((r) => setTimeout(r, 30));
    if (root !== el) return;
    if (!ctx.state.candidates.length) ctx.set({ candidates: planAllCandidates(terrain) });
    // dev aid only (?step=2&broken=1, never reached in the journey): the test point of 3-go/dev/broken.js
    // as an extra candidate 07, to see a route that breaks a rule drawn on the map
    if (ctx.params.get('broken') === '1' && !ctx.state.candidates.some((c) => c.candidate.id === BROKEN_TEST_TARGET.id)) {
      ctx.set({ candidates: [...ctx.state.candidates, ...planAllCandidates(terrain, [BROKEN_TEST_TARGET])] });
    }
    const cands = ctx.state.candidates;
    const numberOf = (id) => spotNumber(id) || String(cands.findIndex((c) => c.candidate.id === id) + 1).padStart(2, '0');
    const cheapest = cheapestId(cands);
    let pinned = null; // Access Mars point whose card is pinned open

    // the widest the map may be: north and south of the rover it must still show every marker and route
    const reach = Math.max(...cands.map(({ candidate: c, route }) => Math.max(Math.abs(c.z),
      ...route.out.points.map((p) => Math.abs(p.z)), ...route.back.points.map((p) => Math.abs(p.z)))),
      ...ACCESS_MARS_POINTS.map((p) => Math.abs(p.z)));
    const maxAspect = (terrain.extent / 2) / Math.min(terrain.extent / 2, reach + 8);
    const fitMap = () => {
      const H = map.el.clientHeight;
      map.el.style.maxWidth = H ? `${Math.round(H * maxAspect)}px` : '';
      map.fitScale();
      // markers keep about the size they have on a square map of this height
      const W = map.el.clientWidth;
      if (W && H) map.setMarkerScale(Math.min(1, H / Math.max(W, H) * 1.15));
    };
    if (typeof ResizeObserver !== 'undefined') {
      const ro = new ResizeObserver(fitMap); ro.observe(Lay.map);
      cleanup.push(() => ro.disconnect());
    }
    fitMap();

    const showTip = (x, z, content, { wide = false } = {}) => {
      const { px, py } = map.project(x, z);
      tip.replaceChildren(...content.filter(Boolean));
      tip.classList.toggle('plan-tip--wide', wide);
      // map units -> pixels inside the map box (the map is cropped, so use the SVG's screen transform)
      const ctm = map.svg.getScreenCTM(), box = map.el.getBoundingClientRect();
      const lx = ctm.a * px + ctm.e - box.left, ly = ctm.d * py + ctm.f - box.top;
      const fx = lx / box.width;
      tip.classList.toggle('plan-tip--below', ly / box.height < 0.3);
      tip.style.left = `${lx.toFixed(1)}px`;
      tip.style.top = `${ly.toFixed(1)}px`;
      tip.style.setProperty('--shift', fx < 0.3 ? '-8%' : fx > 0.7 ? '-96%' : '-50%');
      tip.classList.toggle('is-pinned', !!pinned);
      tip.hidden = false;
    };
    const hideTip = () => { if (!pinned) tip.hidden = true; };

    const select = (id) => {
      const c = cands.find((x) => x.candidate.id === id);
      if (!c) return;
      ctx.set({ spotId: id, route: c.route, plan: c.plan });
      render();
    };

    const pointTip = (p) => [
      h('div.plan-tip__title', p.name, ' ', labelTag(L.point)),
      h('p.plan-tip__text', p.text),
    ];

    // the part of the map grid (SVG units) the cropped (slice) map box shows
    const visibleBox = () => {
      const n = terrain.n, W = map.el.clientWidth, H = map.el.clientHeight;
      if (!W || !H) return { x0: 0, y0: 0, x1: n, y1: n };
      const k = Math.max(W, H) / n, vw = W / k, vh = H / k;
      return { x0: (n - vw) / 2, y0: (n - vh) / 2, x1: (n + vw) / 2, y1: (n + vh) / 2 };
    };

    function drawMap() {
      ['areas', 'routes', 'markers', 'top'].forEach((n) => map.clearLayer(n));
      const sel = cands.find((x) => x.candidate.id === ctx.state.spotId);

      // route of the selected candidate
      if (sel) {
        const rs = runs(sel.plan.profile);
        for (const r of rs) if (r.kind === 'shadow') map.path(r.points, { style: 'radio' });
        // the stretch that breaks a rule is drawn above the spot markers, so it stays visible
        for (const r of rs) map.path(r.points, r.kind === 'closed' ? { style: 'broken', layer: 'top' } : { style: 'foot' });
        for (const b of sel.plan.brokenRules) {
          if (!b.where || b.id === 'slope') continue;
          map.addMarker(b.where.x, b.where.z, { kind: 'dot', label: b.name, layer: 'top' }).classList.add('plan-broken');
        }
      }

      // rover, home
      map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Home' });

      // candidates
      let selG = null;
      cands.forEach(({ candidate: c, plan }, k) => {
        const isSel = c.id === ctx.state.spotId;
        const g = map.addMarker(c.x, c.z, { kind: 'number', text: numberOf(c.id), selected: isSel });
        if (c.id === cheapest) g.prepend(s('circle', { class: 'plan-ring', r: 9.5 }));
        g.classList.add('plan-hit');
        if (c.id === cheapest) g.classList.add('plan-cheapest');
        if (!plan.keepsRules) g.classList.add('plan-breaks');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', `${c.name}, total ${fmtDuration(plan.timeS)}`);
        // the chosen spot is described in the panel: no tip over the map labels for it
        g.addEventListener('mouseenter', () => c.id !== ctx.state.spotId && (pinned = null, showTip(c.x, c.z, [
          h('div.plan-tip__title', marker(numberOf(c.id), { selected: isSel }), ' ', c.name),
          h('div.plan-tip__row', h('span.muted', 'Total time '), h('span.mono', fmtDuration(plan.timeS, { approx: true })), ' ', h('span.vlabel', 'model')),
          c.id === cheapest ? h('div.plan-tip__row.tone-accent', 'Cheapest of the spots') : null,
          !plan.keepsRules ? h('div.plan-tip__row.tone-warning', 'No route keeps every rule') : null,
        ])));
        g.addEventListener('mouseleave', () => { if (!pinned) tip.hidden = true; });
        g.addEventListener('click', (e) => { e.stopPropagation(); pinned = null; tip.hidden = true; select(c.id); });
        if (isSel) selG = g;
      });

      // Access Mars points with their text (on top: the Buttes point sits beside spot 02)
      // Drawn off its real place only to stay readable (a leader line joins both): pushed east or west
      // clear of a numbered marker, and kept fully inside the visible map with a small inset.
      const nums = cands.map(({ candidate: c }) => map.project(c.x, c.z));
      const view = visibleBox();
      for (const p of ACCESS_MARS_POINTS) {
        const q = map.project(p.x, p.z);
        let { px, py } = q;
        for (const m of nums) {
          const dy = py - m.py, need = MARK_CLEAR;
          if (Math.abs(dy) >= need || Math.hypot(px - m.px, dy) >= need) continue;
          const side = px >= m.px ? 1 : -1;
          px = m.px + side * Math.sqrt(need * need - dy * dy);
        }
        px = Math.min(view.x1 - POINT_INSET, Math.max(view.x0 + POINT_INSET, px));
        py = Math.min(view.y1 - POINT_INSET, Math.max(view.y0 + POINT_INSET, py));
        if (Math.hypot(px - q.px, py - q.py) > 0.5) {
          map.layer('top').append(s('line', { class: 'plan-leader', x1: q.px, y1: q.py, x2: px, y2: py }));
        }
        const at = map.unproject(px, py);
        const g = map.addMarker(at.x, at.z, { kind: 'point', label: p.name, layer: 'top' });
        const lab = g.querySelector('.map-marker__label');
        const fx = px / terrain.n;
        // label beside the point, not below, so it stays clear of the numbered markers;
        // raised when another point lies just south of it (Buttes above Monument Valley)
        if (lab) {
          const left = fx > 0.8;
          const crowded = ACCESS_MARS_POINTS.some((q) => q !== p && q.z < p.z && Math.hypot(q.x - p.x, q.z - p.z) < 10);
          lab.setAttribute('text-anchor', left ? 'end' : 'start');
          lab.setAttribute('x', left ? '-5' : '5');
          lab.setAttribute('y', crowded ? '-2' : '1.6');
        }
        g.classList.add('plan-hit');
        g.addEventListener('mouseenter', () => { if (!pinned) showTip(p.x, p.z, pointTip(p), { wide: true }); });
        g.addEventListener('mouseleave', hideTip);
        g.addEventListener('click', (e) => {
          e.stopPropagation();
          if (pinned === p.id) { pinned = null; tip.hidden = true; return; }
          pinned = p.id; showTip(p.x, p.z, pointTip(p), { wide: true });
        });
      }
      // the chosen spot sits above the other markers; the broken stretch stays above all markers
      if (selG) map.layer('top').append(selG);
      const top = map.layer('top');
      for (const el of [...top.querySelectorAll('.map-path--broken')]) top.append(el);
    }

    function renderPanel() {
      const k = cands.findIndex((x) => x.candidate.id === ctx.state.spotId);
      const sel = k >= 0 ? cands[k] : null;
      cards.replaceChildren();
      legs.replaceChildren();
      totals.replaceChildren();
      if (!sel) {
        cards.append(card({ title: 'Choose a spot on the map.', sub: 'Hover a number to see its total time.' }));
      } else {
        const { candidate: c, plan } = sel;
        cards.append(card({
          lead: marker(numberOf(c.id), { selected: true }),
          title: [c.name, ' ', labelTag(L.spot)],
          sub: [spotPlace(c), ' · ', taskOf(ctx.state.request), ', ', SPOT_WORK(), ' ', labelTag(DEMO.spotWorkMin),
            c.id === cheapest ? h('span.tone-accent', ' · cheapest') : null],
          right: [fmtDistance(plan.distanceM), ' ', labelTag(L.distance)],
          selected: true,
        }));
        for (const b of plan.brokenRules) {
          cards.append(alertBox('warning', `Breaks a rule: ${b.name}`, b.text || 'No route to this spot keeps this rule; the best route is shown.'));
        }
      }
      const P = sel && sel.plan;
      const legRows = P ? P.legs : [
        { kind: 'rover', name: 'Rover' }, { kind: 'foot', name: 'On foot' }, { kind: 'spot', name: 'Spot' },
        { kind: 'foot', name: 'On foot' }, { kind: 'rover', name: 'Rover' }];
      legRows.forEach((lg, i) => {
        const lead = h(`span.plan-leg-icon.plan-leg-icon--${lg.kind}`);
        let value = '', tag = null;
        if (P && lg.kind === 'foot') { value = `${fmtDistance(lg.distanceM)} · ${fmtDuration(lg.seconds)}`; tag = L.time; }
        else if (P && lg.kind === 'spot') { value = fmtDuration(lg.seconds); tag = DEMO.spotWorkMin; }
        else if (!P && lg.kind !== 'rover') value = '–';
        const name = lg.kind === 'rover' ? (i === 0 ? 'Rover, home' : 'Rover') : lg.name;
        legs.append(row(name, value, { lead, tag }));
      });
      const slopeBroken = P && P.steepestDeg > RULES.slopeMaxDeg.value;
      const reserve = bigNumber({ label: 'Reserve on return', value: P ? fmtDuration(P.reserveS) : '–', tag: L.reserve, tone: P && P.reserveS < 0 ? 'warning' : null });
      reserve.append(h('div.plan-limiting', P ? `limited by ${P.limitingName.toLowerCase()}` : ' '));
      totals.append(
        bigNumber({ label: 'Total time', value: P ? fmtDuration(P.timeS, { approx: true }) : '–', tag: L.time }),
        reserve,
        bigNumber({ label: 'Steepest slope', value: P ? fmtDeg(P.steepestDeg) : '–', tag: L.slope, tone: P ? (slopeBroken ? 'warning' : 'accent') : null }),
      );
      btn.disabled = !ctx.state.route;
    }

    function render() { drawMap(); renderPanel(); }

    const onDoc = () => { if (pinned) { pinned = null; tip.hidden = true; } };
    document.addEventListener('click', onDoc);
    cleanup.push(() => document.removeEventListener('click', onDoc));

    // keep a previous choice (back from Go / no-go) in step with the fresh candidate list
    if (ctx.state.spotId && !cands.some((c) => c.candidate.id === ctx.state.spotId)) ctx.set({ spotId: null, route: null, plan: null });
    render();
  },

  unmount() { root = null; cleanup.forEach((f) => f()); cleanup = []; },

  /** State after this step is finished, for ?step=N. ?spot=F7 picks another candidate. */
  async devFixture(state, { getTerrain, params }) {
    const terrain = await getTerrain();
    const candidates = planAllCandidates(terrain);
    const id = params.get('spot') || 'F3';
    const c = candidates.find((x) => x.candidate.id === id) || candidates[0];
    return { candidates, spotId: c.candidate.id, route: c.route, plan: c.plan };
  },
};
