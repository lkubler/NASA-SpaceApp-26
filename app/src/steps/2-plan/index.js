// Step 2 Plan (specs/2-plan.md). Map left with legend, panel right: headline, cards, legs, totals,
// main button. Every number comes from the core (planAllCandidates / planNumbers, closedMask,
// radioShadowMask); routes are calculated in the browser when the step opens.
// Several stops (specs/feedback-1.md): each click on a spot adds it to the round in the order clicked, up
// to PLANNER.maxStops; a click on a chosen spot removes it; the list reorders (up / down) or clears.
import './style.css';
import { h, s, splitLayout, headline, card, pillButton, mapPanel, legend, marker, row, bigNumber, alertBox, labelTag,
  textLink, fmtDuration, fmtDistance, fmtDeg } from '../../ui/index.js';
import { planAllCandidates, planRound, planNumbers, stopOrdinal, MAX_STOPS, waypointAllowed, waypointsFor, legKeysOf, PLANNER, ROVER, ACCESS_MARS_POINTS, RULES,
  DEMO, HOME, ASTRONAUT, SUIT, DOCS, DATA, sourceOf, spotNumber, getRelay, setRelay, relayAllowed, withRelay, onRelayChange } from '../../core/index.js';
import { paintGround, composeGround, hatchPattern, dotPattern } from './ground.js';
import { BROKEN_TEST_TARGET } from '../3-go/dev/broken.js';
import { GROUND_TAG } from '../../core/groundColor.js';
import { EXTRA_TAGS, zoneOf, roverDriveOf, drawEffort, drawZone, planLegend } from './extras.js';
import { waypointEditor, parseWaypoints } from './waypoints.js';

let root = null;
let cleanup = [];

// ---------- labels (texts only; the numbers in them are read from the core) ----------
const ACCESS_MARS = DATA[0];
const L = {
  terrain: { label: 'model', text: 'The site from above: the Access Mars 3D terrain of Murray Buttes, reconstructed from rover and orbiter images. It is the same ground you walk on.', source: { title: ACCESS_MARS.name, url: ACCESS_MARS.url } },
  steep: { label: 'model', text: `Ground steeper than ${RULES.slopeMaxDeg.value}° on the slope grid of the same terrain. The suit is built for ${RULES.slopeMaxDeg.value}° at most, so routes do not cross it.`, source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  shadow: { label: 'model', text: 'Ground without a straight line of sight to the rover antenna, suit antenna to rover antenna. Geometry only, no radio physics. A caution, not a rule.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  spot: { label: 'model', text: 'Position derived from the terrain: a reachable spot at the foot of a butte wall. No Curiosity target lies in this square.', source: { title: DOCS.WALK_TARGETS.title, url: DOCS.WALK_TARGETS.url } },
  point: { label: 'real', text: 'A point of interest of the Access Mars app, with its original text. Not a sample spot.', source: { title: ACCESS_MARS.name, url: ACCESS_MARS.url } },
  distance: { label: 'model', text: 'Length of the route calculated in your browser on the terrain grid: the fastest way that keeps every rule.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  time: { label: 'model', text: 'Route length at the planning pace, plus the fixed work at the spot; in demo time.', source: sourceOf(ASTRONAUT.paceMS), moon: true },
  reserve: { label: 'model', moon: true, text: `Time left in the suit when back at the rover, if the crew walks the plan. The way home counts at a ${Math.round((RULES.walkBackRateFactor.value - 1) * 100)} % higher work rate. Set by the consumable that runs out first.`, source: sourceOf(SUIT.designW) },
  slope: { label: 'model', text: 'Steepest ground on the route, from the slope grid of the terrain.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  waypoint: { label: 'model', text: 'A point you set that the route must pass. No sample and no work there; the legs on either side are planned again by the same rules.', source: { title: DOCS.WALK_TERRAIN.title, url: DOCS.WALK_TERRAIN.url } },
  leg: { label: 'model', text: 'One leg of the round: length of the fastest way that keeps every rule, and its walking time at the planning pace, in demo time.', source: sourceOf(ASTRONAUT.paceMS), moon: true },
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
    Lay.map.dataset.enter = '3'; Lay.action.dataset.enter = '4'; // x-transitions: entry order of the blocks
    el.append(Lay.el);
    // while the terrain loads: the empty map frame in the dark ground tone, not a blank column
    const placeholder = h('div.map.plan-map-wait');
    Lay.map.append(placeholder);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    placeholder.remove();

    // ----- map -----
    // too steep (hatched) and radio shadow (dotted) are drawn by the shared map at screen size, so they
    // stay right at every zoom; the ground under them is this step's own render
    // fade: ground, hatching and markers appear together once the ground is painted and the markers drawn
    // the map stays where it opens (on the EVA zone): no dragging, no zooming, no buttons for it
    const map = mapPanel(terrain, { steep: true, shadow: true, patterns: { steep: hatchPattern, shadow: dotPattern }, patternPx: 0.8, fade: true, movable: false, resetButton: false, zoomButtons: false });
    let groundDone = false, drawnOnce = false;
    const revealWhenReady = () => { if (groundDone && drawnOnce) map.reveal(); };
    const tip = h('div.plan-tip', { hidden: true });
    map.el.append(tip);
    // wide map, cropped north and south (slice) only as far as every marker and route stays in view
    map.svg.setAttribute('preserveAspectRatio', 'xMidYMid slice');
    const cv = map.canvas.getContext('2d');
    const relief = cv.getImageData(0, 0, map.canvas.width, map.canvas.height);
    paintGround(terrain, map.canvas.width).then((img) => {
      if (root !== el || !img) return;
      composeGround(cv, relief, img);
      map.redraw();
    }).catch((e) => console.warn('top-down terrain render failed, keeping the relief', e))
      .finally(() => { groundDone = true; revealWhenReady(); });

    // map layers the visitor can show or hide (walking effort: look only, see extras.js)
    const show = { steep: true, shadow: true, effort: true };
    // Compare: show the radio shadow and the route's stretches without contact as they are without the relay
    let comparing = false;
    const compareBtn = h('button.plan-compare', { type: 'button', onclick: () => toggleCompare() }, 'Compare without relay');
    compareBtn.disabled = true;
    const leg = planLegend({
      route: [['rover-line', 'Rover drive'], ['foot', 'On foot'], ['handover', 'Handover to foot']],
      places: [['marker', ['Candidate spot ', labelTag(L.spot)]], ['selected', 'Chosen stop'], ['waypoint', ['Waypoint ', labelTag(L.waypoint)]], ['cheapest', 'Cheapest'],
        ['point', ['Access Mars point ', labelTag(L.point)]], ['relay', ['Radio relay ', labelTag(EXTRA_TAGS.relay)]]],
      layers: [
        { key: 'steep', swatch: 'steep', name: 'Too steep to walk', note: `> ${RULES.slopeMaxDeg.value}°`, on: true, tag: L.steep },
        { key: 'shadow', swatch: 'shadow', name: 'No radio contact', note: '· no contact with the rover', on: true, tag: L.shadow, extra: compareBtn },
        { key: 'effort', swatch: 'effort', name: 'Walking effort', note: 'easy → hard', on: true, tag: EXTRA_TAGS.effort },
      ],
      onToggle: (key, on) => {
        show[key] = on;
        if (key === 'steep' || key === 'shadow') map.setLayers({ [key]: on });
        else drawMap();
      },
    });
    // terrain credit inside the map, bottom left
    map.el.append(h('div.plan-terrain', 'Terrain: Access Mars ', labelTag(L.terrain), ' · ground colour ', labelTag(GROUND_TAG)));
    // where the rover comes from: the base, far off the map to the north-east
    map.el.append(h('div.plan-basehint', h('span.plan-basehint__k', 'Base'), ' Bradbury Landing · 8 km ', h('span.plan-basehint__arrow', '↗'), ' ', labelTag(EXTRA_TAGS.drive)));
    Lay.map.append(map.el, leg);
    ctx.flipIn(map.el); // x-transitions: back from Go / no-go the map moves here from its small place

    // ----- panel -----
    const cards = h('div.plan-cards', { 'data-enter': 2 });
    // the radio relay: placed on the map by the visitor, one click; "Move" places it again, "Remove" takes it away
    const relaySub = h('div.card__sub');
    const relayMove = h('button.plan-relay__move', { type: 'button', onclick: () => togglePlacing() }, 'Place');
    const relayRemove = h('button.plan-relay__move.plan-relay__remove', { type: 'button', onclick: () => { setRelay(null); } }, 'Remove');
    const relayCard = h('div.card.plan-relay', { 'data-enter': 2 },
      h('span.plan-relay__mark'),
      h('div.card__body', h('div.card__title', 'Radio relay ', labelTag(EXTRA_TAGS.relay), ' ', labelTag(EXTRA_TAGS.contact)), relaySub),
      relayMove, relayRemove);
    const legs = h('div.plan-legs');
    const totals = h('div.plan-totals', { 'data-enter': 2 });
    const demo = h('div.plan-demo', 'Demo time: clock and suit run ', String(DEMO.timeFactor.value), DEMO.timeFactor.unit, ' faster ', labelTag(DEMO.timeFactor));
    const btn = pillButton({ text: 'Confirm route', onClick: () => ctx.next(), disabled: !ctx.state.route });
    const req = ctx.state.request;
    // the goal is set by the request from step 1; this step only plans the route to it
    const reqBox = req ? h('div.plan-goal', { title: req.titleLong || req.title },
      h('span.plan-goal__k', 'Murray Buttes'), h('span.plan-goal__sep', '·'), h('span.plan-goal__v', req.title)) : null;
    // one short line that says what a click does now (and why a click did nothing)
    const hint = h('div.plan-hint', { role: 'status', 'aria-live': 'polite', tabindex: '-1' });
    const head = headline('Plan your mission.');
    head.dataset.enter = '1';
    /** Screen-reader message (reorder / remove). */
    const live = h('div.plan-sr', { 'aria-live': 'polite', role: 'status' });
    const announce = (msg) => { live.textContent = ''; requestAnimationFrame(() => { live.textContent = msg; }); };
    Lay.panel.append(reqBox, head, hint, cards, relayCard, legs, h('div.plan-spacer'), totals, demo);
    Lay.panel.append(live);
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
    let cands = ctx.state.candidates;
    const numberOf = (id) => spotNumber(id) || String(cands.findIndex((c) => c.candidate.id === id) + 1).padStart(2, '0');
    let cheapest = cheapestId(cands);
    let pinned = null; // Access Mars point whose card is pinned open
    // look-only extras (extras.js): the zone around every place of the plan, a relay on its high ground
    const clampT = (v) => Math.max(terrain.min + 2, Math.min(terrain.max - 2, v));
    const zz = zoneOf([...cands.map((c) => c.candidate), ROVER], 6);
    const zone = { x0: clampT(zz.x0), x1: clampT(zz.x1), z0: clampT(zz.z0), z1: clampT(zz.z1) };
    // the map opens on the EVA zone, so the zone fills it and the rover drive runs out of the picture
    map.setHome([{ x: zone.x0, z: zone.z0 }, { x: zone.x1, z: zone.z1 }], { margin: 0.02, maxK: 3, square: false });

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
    // the tip belongs to a place on the map: it closes when the map moves or zooms
    map.onView(() => { pinned = null; tip.hidden = true; });

    // ----- the stops of the round (shared state: stops, spotId = stops[0], route, plan) -----
    const candOf = (id) => cands.find((x) => x.candidate.id === id) || null;
    const stopIds = () => (ctx.state.stops && ctx.state.stops.length ? [...ctx.state.stops] : ctx.state.spotId ? [ctx.state.spotId] : []);
    // one stop: the candidate's own route and numbers, exactly as before; several: planned leg by leg (cached)
    // waypoints (specs/x-waypoints.md): kept per leg; only those of legs the round still has count
    const rounds = new Map();
    const alts = new Map(); // the same rounds planned without the relay (Compare, and the second time without contact)
    const curWps = () => ctx.state.waypoints || {};
    const roundOf = (ids, wpsAll = curWps()) => {
      const wps = waypointsFor(ids, wpsAll);
      if (ids.length === 1 && !wps) { const c = candOf(ids[0]); return { route: c.route, plan: c.plan }; }
      const key = ids.join('>') + (wps ? JSON.stringify(wps) : '');
      if (!rounds.has(key)) {
        if (rounds.size > 200) rounds.delete(rounds.keys().next().value); // cache size only
        const route = planRound(terrain, ids.map((id) => candOf(id).candidate), wps);
        rounds.set(key, { route, plan: planNumbers(terrain, route) });
      }
      return rounds.get(key);
    };
    /** The round over ids planned as if no relay stood: its plan has the time without contact without the relay. */
    const altOf = (ids) => {
      if (!getRelay()) return roundOf(ids);
      const wps = waypointsFor(ids, curWps());
      const key = ids.join('>') + (wps ? JSON.stringify(wps) : '');
      if (!alts.has(key)) {
        alts.set(key, withRelay(null, () => {
          const route = planRound(terrain, ids.map((id) => candOf(id).candidate), wps);
          return { route, plan: planNumbers(terrain, route) };
        }));
      }
      return alts.get(key);
    };
    let notice = null, noticeTimer = 0; // a short message after a click that could not add a stop
    cleanup.push(() => clearTimeout(noticeTimer));
    /** A click on a look-only control (relay, compare): a short note in the hint line. */
    function later(msg) {
      notice = msg;
      clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => { notice = null; renderHint(); }, 4000);
      renderHint();
      hint.classList.remove('is-flash'); void hint.offsetWidth; hint.classList.add('is-flash');
    }
    const setStops = (ids) => {
      notice = null;
      editor.deselect();
      // the waypoints of legs the new round no longer has are dropped; "Clear" (no stops) drops them all
      const wps = waypointsFor(ids, curWps()) || {};
      if (!ids.length) ctx.set({ stops: [], waypoints: {}, spotId: null, route: null, plan: null });
      else { const r = roundOf(ids, wps); ctx.set({ stops: ids, waypoints: wps, spotId: ids[0], route: r.route, plan: r.plan }); }
      render();
    };
    /** New waypoints for the current round: the legs are planned again; the route is redrawn without the draw-in. */
    const setWaypoints = (wps) => {
      const ids = stopIds();
      if (!ids.length) return;
      const t0 = performance.now();
      const keep = waypointsFor(ids, wps) || {};
      const r = roundOf(ids, keep);
      ctx.set({ waypoints: keep, route: r.route, plan: r.plan });
      const planMs = performance.now() - t0;
      quietDraw = true;
      render();
      // dev and test inspection only (like window.__state)
      if (typeof window !== 'undefined') window.__planTiming = { planMs, totalMs: performance.now() - t0, waypoints: Object.values(keep).reduce((a, l) => a + l.length, 0) };
    };
    /** A click on a spot: add it as the next stop, or remove it if it is chosen. */
    const toggle = (id) => {
      if (!candOf(id)) return;
      const ids = stopIds();
      if (ids.includes(id)) return setStops(ids.filter((x) => x !== id));
      if (ids.length >= MAX_STOPS) {
        notice = `Already ${MAX_STOPS} stops, the most. To add this one, remove a stop first.`;
        clearTimeout(noticeTimer);
        noticeTimer = setTimeout(() => { notice = null; renderHint(); }, 5000);
        renderHint();
        hint.classList.remove('is-flash'); void hint.offsetWidth; hint.classList.add('is-flash');
        return;
      }
      setStops([...ids, id]);
    };

    const pointTip = (p) => [
      h('div.plan-tip__title', p.name, ' ', labelTag(L.point)),
      h('p.plan-tip__text', p.text),
    ];

    const tipRow = (label, value, tone = null) => h(`div.plan-tip__row${tone ? '.tone-' + tone : ''}`,
      h('span.muted', label), h('span.mono', value));
    /**
     * Hover on a spot: what a click does, and what the spot costs. Not chosen: its own round trip and, with
     * stops chosen, the round with this spot added (a preview of the next click). Chosen: its place in the order.
     */
    const spotTip = (c, plan, order) => {
      const ids = stopIds();
      const title = h('div.plan-tip__title', marker(numberOf(c.id), { selected: order > 0 }), ' ', c.name);
      if (order > 0) {
        return [title,
          h('div.plan-tip__row.tone-accent', `${stopOrdinal(order)} stop of ${ids.length}`),
          h('div.plan-tip__row.muted', 'Click to remove it from the route')];
      }
      const own = [
        tipRow(ids.length ? 'On its own ' : 'Total time ', fmtDuration(plan.timeS, { approx: true })),
        ids.length ? null : tipRow('Reserve on return ', fmtDuration(plan.reserveS), plan.reserveS < 0 ? 'warning' : null),
        c.id === cheapest ? h('div.plan-tip__row.tone-accent', 'Cheapest of the spots') : null,
        !plan.keepsRules ? h('div.plan-tip__row.tone-warning', 'No route keeps every rule') : null,
      ];
      if (!ids.length) return [title, ...own, h('div.plan-tip__row.muted', 'Click to plan this spot')];
      if (ids.length >= MAX_STOPS) {
        return [title, ...own, h('div.plan-tip__row.tone-advisory', `${MAX_STOPS} stops chosen: remove one to add this spot`)];
      }
      const next = roundOf([...ids, c.id]).plan, now = ctx.state.plan;
      const more = next.timeS - now.timeS;
      return [title,
        h('div.plan-tip__row.tone-accent', `Click to add as ${stopOrdinal(ids.length + 1)} stop`),
        tipRow('Round ', `${fmtDuration(next.timeS, { approx: true })} (+${fmtDuration(more)})`),
        tipRow('Reserve on return ', fmtDuration(next.reserveS), next.reserveS < 0 ? 'warning' : null),
        ...next.brokenRules.map((b) => h('div.plan-tip__row.tone-warning', `Round breaks a rule: ${b.name}`)),
        ...own];
    };

    // the part of the map grid (SVG units) the cropped (slice) map box shows
    const visibleBox = () => {
      const n = terrain.n, W = map.el.clientWidth, H = map.el.clientHeight;
      if (!W || !H) return { x0: 0, y0: 0, x1: n, y1: n };
      const k = Math.max(W, H) / n, vw = W / k, vh = H / k;
      return { x0: (n - vw) / 2, y0: (n - vh) / 2, x1: (n + vw) / 2, y1: (n + vh) / 2 };
    };

    let drawnPlan; // the route last drawn: a newly chosen one draws in along its path (x-transitions), not a redraw
    let quietDraw = false; // a waypoint edit: the route changes in place, no draw-in on every release
    let driveMemo = null;
    const editor = waypointEditor({
      map, terrain, isAllowed: (x, z) => waypointAllowed(terrain, x, z),
      getRoute: () => ctx.state.route, getIds: stopIds, getWaypoints: curWps,
      onChange: (wps) => setWaypoints(wps), onStart: () => { pinned = null; tip.hidden = true; },
      onSelect: () => drawMap(),
    });
    cleanup.push(() => editor.destroy());
    function drawMap() {
      ['areas', 'routes', 'markers', 'top'].forEach((n) => map.clearLayer(n));
      const ids = stopIds();
      // Compare shows the round as it would be without the relay; the numbers in the panel stay the real ones
      const sel = ids.length ? { plan: comparing && getRelay() ? altOf(ids).plan : ctx.state.plan } : null;
      const fresh = !quietDraw && drawnPlan !== undefined && sel && sel.plan && sel.plan !== drawnPlan;
      quietDraw = false;
      drawnPlan = (sel && sel.plan) || null;

      // EVA zone (look only): darker ground outside, corner brackets, its size
      drawZone(map, terrain, zone);
      // rover drive from the base (look only): a white line from the map edge towards the base to the rover
      const vb = visibleBox(), p0 = map.unproject(vb.x0, vb.y1), p1 = map.unproject(vb.x1, vb.y0);
      // the same visible box gives the same drive: planned once per box, not on every redraw (a waypoint drag redraws often)
      const boxKey = [p0.x, p1.x, p0.z, p1.z].map((v) => v.toFixed(2)).join(' ');
      if (!driveMemo || driveMemo.key !== boxKey) driveMemo = { key: boxKey, drive: roverDriveOf(terrain, { x0: p0.x, x1: p1.x, z0: p0.z, z1: p1.z }) };
      const drive = driveMemo.drive;
      // the base itself is 8 km away and never drawn: the drive just runs off the map edge towards it
      if (drive) map.path(drive.points, { style: 'rover' });
      // the radio relay the visitor placed (hidden while comparing: that view is without it)
      const rl = getRelay();
      if (rl && !comparing) map.addMarker(rl.x, rl.z, { kind: 'rover', label: 'Relay', layer: 'top' }).classList.add('plan-relay-mark');

      // the round over the chosen stops
      if (sel && sel.plan) {
        const rs = runs(sel.plan.profile);
        const paths = [];
        for (const r of rs) if (r.kind === 'shadow') paths.push(map.path(r.points, { style: 'radio' }));
        // walking effort on: the route as one line coloured by the slope under it; off: cyan dots
        if (show.effort) paths.push(...drawEffort(map, sel.plan.profile.filter((q) => !q.closed)));
        // the stretch that breaks a rule is drawn above the spot markers, so it stays visible
        for (const r of rs) {
          if (r.kind === 'closed') paths.push(map.path(r.points, { style: 'broken', layer: 'top' }));
          else if (!show.effort) paths.push(map.path(r.points, { style: 'foot' }));
        }
        if (fresh) map.drawIn(sel.plan.profile, paths);
        for (const b of sel.plan.brokenRules) {
          if (!b.where || b.id === 'slope') continue;
          map.addMarker(b.where.x, b.where.z, { kind: 'dot', label: b.name, layer: 'top' }).classList.add('plan-broken');
        }
        // the route line can be dragged: a drag on it makes a waypoint there (above the route, below the markers)
        editor.drawHits();
      }

      // the rover: where the crew hands over from the drive to foot
      const ho = map.addMarker(ROVER.x, ROVER.z, { kind: 'point', label: 'Handover', layer: 'top' });
      ho.classList.add('plan-handover');
      ho.append(s('circle', { r: 1.6, class: 'plan-handover__dot' }));

      // candidates; a chosen one is filled cyan and carries its visiting order ("1st") beside its own number
      const selGs = [];
      cands.forEach(({ candidate: c, plan }) => {
        const order = ids.indexOf(c.id) + 1;
        const isSel = order > 0;
        const g = map.addMarker(c.x, c.z, { kind: 'number', text: numberOf(c.id), selected: isSel });
        if (c.id === cheapest) g.prepend(s('circle', { class: 'plan-ring', r: 9.5 }));
        if (isSel) {
          g.append(s('g', { class: 'plan-order', transform: 'translate(0 -11.2)' },
            s('rect', { x: -6, y: -3.3, width: 12, height: 6.6, rx: 3.3 }),
            s('text', { 'text-anchor': 'middle', dy: '0.36em' }, stopOrdinal(order))));
        }
        g.classList.add('plan-hit');
        if (c.id === cheapest) g.classList.add('plan-cheapest');
        if (!plan.keepsRules) g.classList.add('plan-breaks');
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', isSel
          ? `${numberOf(c.id)} ${c.name}, ${stopOrdinal(order)} stop. Click to remove it.`
          : `${numberOf(c.id)} ${c.name}, total ${fmtDuration(plan.timeS)} on its own. Click to ${ids.length ? 'add it as a stop' : 'plan it'}.`);
        g.addEventListener('mouseenter', () => { pinned = null; showTip(c.x, c.z, spotTip(c, plan, order)); });
        g.addEventListener('mouseleave', () => { if (!pinned) tip.hidden = true; });
        g.addEventListener('click', (e) => { e.stopPropagation(); pinned = null; tip.hidden = true; toggle(c.id); });
        if (isSel) selGs.push(g);
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
        // drawn at its real place, then moved off by a screen offset that keeps its size at every zoom
        const g = map.addMarker(p.x, p.z, { kind: 'point', label: p.name, layer: 'top' });
        if (Math.hypot(px - q.px, py - q.py) > 0.5) map.offsetMarker(g, px - q.px, py - q.py, { unit: 'map', leaderClass: 'plan-leader' });
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
      // the chosen spots sit above the other markers; the broken stretch stays above all markers
      for (const g of selGs) map.layer('top').append(g);
      const top = map.layer('top');
      for (const el of [...top.querySelectorAll('.map-path--broken')]) top.append(el);
      // the waypoints on top of everything, so each can be grabbed and removed
      if (sel && sel.plan) editor.drawWaypoints();
    }

    function renderHint() {
      const ids = stopIds();
      hint.classList.toggle('is-notice', !!notice);
      if (!notice) hint.classList.remove('is-flash');
      let text;
      if (notice) text = notice;
      else if (!ids.length) text = 'Click a spot on the map to plan the route there and back.';
      else if (ids.length === 1) text = `Click spots to add stops (up to ${MAX_STOPS}). Drag the route to shape it.`;
      else if (ids.length < MAX_STOPS) text = `Click a spot for a ${stopOrdinal(ids.length + 1)} stop. Drag a stop to reorder.`;
      else text = `${MAX_STOPS} stops, the most per excursion. Drag a stop to reorder.`;
      hint.textContent = text;
    }

    /**
     * The list of a round with several stops: every leg with distance and time. A stop row shows a drag handle
     * (reorder) and × (remove) on hover or focus; the handle also moves the stop with ↑ / ↓. Only stop rows move.
     */
    function stopList(P, ids) {
      // after a change the list is drawn anew: the keyboard focus goes back to the same control
      const refocus = (key) => {
        const b = legs.querySelector(`[data-ctl="${key}"]`) || hint;
        b.focus();
      };
      const nameOf = (id) => (candOf(id) && candOf(id).candidate.name) || numberOf(id);
      const reorder = (from, to, key) => {
        if (to < 0 || to >= ids.length || to === from) return;
        const next = [...ids];
        const [id] = next.splice(from, 1);
        next.splice(to, 0, id);
        setStops(next);
        announce(`${nameOf(id)} moved to ${stopOrdinal(to + 1)}`);
        if (key) refocus(key);
      };
      const out = [];
      P.legs.forEach((lg, i) => {
        if (lg.kind === 'rover' && i === 0) {
          out.push(row('Handover', '', { lead: h('span.plan-leg-icon.plan-leg-icon--handover') }), relayRow());
        } else if (lg.kind === 'rover') {
          // the way to clear sits at the end of the list, on the last row
          out.push(h('div.row', h('span.row__lead', h('span.plan-leg-icon.plan-leg-icon--handover')), h('span.row__label', 'Back at the rover'),
            clearLink()));
        } else if (lg.kind === 'foot') {
          const lp = P.legPlans[(i - 1) / 2];
          out.push(...footRows(lg, lp, L.leg));
        } else {
          const k = lg.order - 1, id = ids[k];
          const grip = h('button.plan-grip', { type: 'button', 'aria-label': `Reorder ${nameOf(id)}`, title: 'Drag to reorder (or ↑ ↓)', 'data-ctl': `${id}-grip`,
            html: '<svg viewBox="0 0 10 16" width="0.7em" height="1.1em" aria-hidden="true"><g fill="currentColor"><circle cx="2.5" cy="3" r="1.4"/><circle cx="7.5" cy="3" r="1.4"/><circle cx="2.5" cy="8" r="1.4"/><circle cx="7.5" cy="8" r="1.4"/><circle cx="2.5" cy="13" r="1.4"/><circle cx="7.5" cy="13" r="1.4"/></g></svg>' });
          const x = h('button.plan-x', { type: 'button', 'aria-label': `Remove ${nameOf(id)}`, title: 'Remove stop', 'data-ctl': `${id}-x` }, '×');
          const r = h('div.row.plan-stop', { 'data-stop': String(k) },
            grip,
            h('span.plan-stop__ord.mono', stopOrdinal(lg.order)),
            h('span.row__label.plan-stop__name', marker(numberOf(id), { selected: true }), h('span.plan-stop__text', lg.name)),
            // the work at the stop (taking the sample), named so it does not read as a walk
            h('span.row__value.mono', h('span.plan-stop__k', 'sampling '), fmtDuration(lg.seconds), ' ', labelTag(DEMO.spotWorkMin)),
            x);
          x.addEventListener('click', (e) => {
            e.stopPropagation();
            setStops(ids.filter((v) => v !== id));
            announce(`${nameOf(id)} removed`);
            const next = legs.querySelector('.plan-x') || hint;
            next.focus();
          });
          grip.addEventListener('keydown', (e) => {
            if (e.key !== 'ArrowUp' && e.key !== 'ArrowDown') return;
            e.preventDefault();
            reorder(k, k + (e.key === 'ArrowUp' ? -1 : 1), `${id}-grip`);
          });
          grip.addEventListener('pointerdown', (e) => dragStop(e, r, k, (to) => reorder(k, to, null)));
          out.push(r);
        }
      });
      return out;
    }

    /**
     * Drag a stop row by its handle: the row follows the pointer, a cyan line shows where it would go; on
     * release the stops are reordered (onDrop(newIndex)), or nothing changes when it lands where it was.
     */
    function dragStop(e, rowEl, from, onDrop) {
      if (e.button !== 0) return;
      e.preventDefault();
      const grip = e.currentTarget;
      grip.setPointerCapture(e.pointerId);
      const rows = [...legs.querySelectorAll('.plan-stop')];
      const line = h('div.plan-dropline');
      legs.append(line);
      const box = () => legs.getBoundingClientRect();
      const y0 = e.clientY;
      let to = from;
      rowEl.classList.add('is-dragging');
      legs.classList.add('is-sorting');
      const move = (ev) => {
        rowEl.style.transform = `translateY(${ev.clientY - y0}px)`;
        // large drop zones: each stop owns the list from halfway to the stop above to halfway to the stop below
        // (the legs on foot between them included); the dragged stop takes the place of the stop under the pointer
        const cs = rows.map((r) => { const q = r.getBoundingClientRect(); return q.top + q.height / 2; });
        to = 0;
        for (let i = 0; i < cs.length - 1; i++) if (ev.clientY > (cs[i] + cs[i + 1]) / 2) to = i + 1;
        rows.forEach((r, i) => r.classList.toggle('is-target', i === to && to !== from));
        const tb = rows[to].getBoundingClientRect();
        line.style.top = `${(to > from ? tb.bottom + 1 : tb.top - 3) - box().top + legs.scrollTop}px`;
        line.classList.toggle('is-on', to !== from);
      };
      const end = () => {
        grip.removeEventListener('pointermove', move);
        grip.removeEventListener('pointerup', end);
        grip.removeEventListener('pointercancel', end);
        rowEl.classList.remove('is-dragging');
        rows.forEach((r) => r.classList.remove('is-target'));
        legs.classList.remove('is-sorting');
        rowEl.style.transform = '';
        line.remove();
        if (to !== from) onDrop(to);
      };
      grip.addEventListener('pointermove', move);
      grip.addEventListener('pointerup', end);
      grip.addEventListener('pointercancel', end);
    }
    /** "Clear": removes all stops and waypoints. */
    const clearLink = () => h('span.plan-clear', textLink('Clear', () => { setStops([]); hint.focus(); }));
    /**
     * The rows of one leg on foot: one row, or with waypoints one row per part and a small unnamed point
     * between them (specs/x-waypoints.md "Panel").
     */
    function footRows(lg, lp, tag) {
      const tone = lp && !lp.keepsRules ? 'warning' : null;
      // a part shorter than 1 m or 1 min reads "< 1 m" / "< 1 min", not "0 m · 0 min" (display only)
      const foot = (m, sec) => row('On foot', `${m < 1 ? '< 1 m' : fmtDistance(m)} · ${sec < 60 ? '< 1 min' : fmtDuration(sec)}`, { lead: h('span.plan-leg-icon.plan-leg-icon--foot'), tag, tone });
      if (!lp || !lp.parts) return [foot(lg.distanceM, lg.seconds)];
      const out = [];
      lp.parts.forEach((pt, j) => {
        if (j) out.push(h('div.row.plan-via', { 'aria-label': 'Waypoint' }, h('span.row__lead', h('span.plan-leg-icon.plan-leg-icon--via')), h('span.row__label', 'Waypoint ', labelTag(L.waypoint))));
        out.push(foot(pt.distanceM, pt.seconds));
      });
      return out;
    }

    /** Base and the rover drive (look only: not counted in the totals), above the round. */
    const driveRows = () => [
      row('Base', 'Bradbury Landing · 8 km', { lead: h('span.plan-leg-icon.plan-leg-icon--rover') }),
      row('Rover', h('span.muted', 'drive, not counted'), { lead: h('span.plan-leg-icon.plan-leg-icon--drive'), tag: EXTRA_TAGS.drive }),
    ];
    /** The relay in the list: placed or not. */
    const relayRow = () => row('Relay', h('span.muted', getRelay() ? 'placed' : 'not placed'), { lead: h('span.plan-leg-icon.plan-leg-icon--relay'), tag: EXTRA_TAGS.relay });

    function renderPanel() {
      const ids = stopIds();
      const P = ids.length ? ctx.state.plan : null;
      cards.replaceChildren();
      legs.replaceChildren();
      totals.replaceChildren();
      legs.classList.toggle('is-round', ids.length > 1);
      cards.classList.toggle('is-round', ids.length > 1);
      renderHint();
      if (!P) {
        cards.append(card({ title: 'Choose a spot on the map.', sub: 'Hover a number to see its total time.' }));
      } else if (ids.length === 1) {
        const { candidate: c } = candOf(ids[0]);
        cards.append(card({
          lead: marker(numberOf(c.id), { selected: true }),
          title: [c.name, ' ', labelTag(L.spot)],
          sub: [spotPlace(c), ' · ', taskOf(ctx.state.request), ', ', SPOT_WORK(), ' ', labelTag(DEMO.spotWorkMin),
            c.id === cheapest ? h('span.tone-accent', ' · cheapest') : null],
          right: [fmtDistance(P.distanceM), ' ', labelTag(L.distance)],
          selected: true,
        }));
      } else {
        // one line: the stops in order and the length of the whole round (work time per stop: in the list)
        cards.append(card({
          lead: h('span.plan-round-n.mono', String(ids.length)),
          title: [`Round with ${ids.length} stops `, h('span.plan-round-seq.mono', ids.map(numberOf).join(' → '))],
          right: [fmtDistance(P.distanceM), ' ', labelTag(L.distance)],
          selected: true,
        }));
        cards.lastChild.classList.add('plan-round');
      }
      if (P) {
        for (const b of P.brokenRules) {
          cards.append(alertBox('warning', `Breaks a rule: ${b.name}`, b.text || (ids.length > 1
            ? 'No way on this round keeps this rule; the best route is shown.'
            : 'No route to this spot keeps this rule; the best route is shown.')));
        }
      }
      legs.append(...driveRows());
      if (P && ids.length > 1) legs.append(...stopList(P, ids));
      else {
        const legRows = P ? P.legs : [
          { kind: 'rover', name: 'Rover' }, { kind: 'foot', name: 'On foot' }, { kind: 'spot', name: 'Spot' },
          { kind: 'foot', name: 'On foot' }, { kind: 'rover', name: 'Rover' }];
        legRows.forEach((lg, i) => {
          const lead = h(`span.plan-leg-icon.plan-leg-icon--${lg.kind}`);
          let value = '', tag = null;
          if (P && lg.kind === 'foot') { value = `${fmtDistance(lg.distanceM)} · ${fmtDuration(lg.seconds)}`; tag = L.time; }
          else if (P && lg.kind === 'spot') { value = [h('span.plan-stop__k', 'sampling '), fmtDuration(lg.seconds)]; tag = DEMO.spotWorkMin; }
          else if (!P && lg.kind !== 'rover') value = '–';
          if (lg.kind === 'rover') {
            // with waypoints, "Clear" removes them and the stop
            const wpsSet = i > 0 && P && waypointsFor(ids, curWps());
            legs.append(wpsSet
              ? h('div.row', h('span.row__lead', h('span.plan-leg-icon.plan-leg-icon--handover')), h('span.row__label', 'Back at the rover'), clearLink())
              : row(i === 0 ? 'Handover' : 'Back at the rover', '', { lead: h('span.plan-leg-icon.plan-leg-icon--handover') }));
            if (i === 0) legs.append(relayRow());
            return;
          }
          if (P && lg.kind === 'foot') { legs.append(...footRows(lg, P.legPlans[(i - 1) / 2], tag)); return; }
          legs.append(row(lg.name, value, { lead, tag }));
        });
      }
      // four totals in a 2 x 2 grid, each with the limit it is held against
      const slopeBroken = P && P.steepestDeg > RULES.slopeMaxDeg.value;
      const total = (label, value, sub, tag, tone = null) => {
        const b = bigNumber({ label, value, tone });
        // the last word and the info marker stay together when the header wraps
        const cut = label.lastIndexOf(' ');
        b.querySelector('.bignum__label').replaceChildren(label.slice(0, cut + 1),
          h('span.plan-nowrap', label.slice(cut + 1), ' ', labelTag(tag)));
        b.append(h('div.plan-limiting', sub));
        return b;
      };
      totals.append(
        total('Reserve on return', P ? fmtDuration(P.reserveS) : '–', P ? `limited by ${P.limitingName.toLowerCase()}` : ' ', L.reserve, P && P.reserveS < 0 ? 'warning' : null),
        total(ids.length > 1 ? 'EVA time, round' : 'EVA time', P ? fmtDuration(P.timeS, { approx: true }) : '–', `max. ${RULES.evaPlannedH.value} h planned`, L.time),
        total('Without radio', P ? fmtDuration(P.radioShadowS || 0) : '–',
          P && getRelay() ? `with relay · ${fmtDuration(altOf(ids).plan.radioShadowS || 0)} without` : 'a caution, no limit', L.shadow, P && P.radioShadowS > 0 ? 'caution' : null),
        total('Steepest part', P ? fmtDeg(P.steepestDeg) : '–', `max. ${RULES.slopeMaxDeg.value}°`, L.slope, P ? (slopeBroken ? 'warning' : 'accent') : null),
      );
      btn.disabled = !ctx.state.route;
    }

    function render() { drawMap(); renderPanel(); renderRelayCard(); }

    // ----- the relay: place, move, remove; everything that depends on contact is calculated again -----
    let placing = false;
    function renderRelayCard() {
      const rl = getRelay();
      relayMove.textContent = placing ? 'Click the map' : rl ? 'Move' : 'Place';
      relayMove.classList.toggle('is-on', placing);
      relayRemove.hidden = !rl;
      compareBtn.disabled = !rl;
      compareBtn.textContent = comparing ? 'Back to with relay' : 'Compare without relay';
      if (rl) {
        const P = ctx.state.plan;
        relaySub.textContent = P ? `Placed · ${fmtDuration(P.radioShadowS || 0)} without radio on this route` : 'Placed · choose a spot to see its effect';
      } else relaySub.textContent = 'Not placed · it must see the rover, on open ground';
    }
    function togglePlacing() {
      placing = !placing;
      map.el.classList.toggle('is-placing', placing);
      if (!placing) tip.hidden = true;
      else { notice = 'Click the map to set the relay. It must see the rover and stand on open ground.'; clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice = null; renderHint(); }, 5000); renderHint(); }
      renderRelayCard();
    }
    function toggleCompare() {
      if (!getRelay()) return;
      comparing = !comparing;
      map.refreshShadow({ withoutRelay: comparing });
      quietDraw = true;
      render();
    }
    /** The relay was placed, moved or removed: shadow, candidates, the chosen round and its numbers are calculated again. */
    function recalc() {
      comparing = false;
      rounds.clear(); alts.clear();
      map.refreshShadow();
      cands = planAllCandidates(terrain);
      cheapest = cheapestId(cands);
      const ids = stopIds().filter((id) => candOf(id));
      if (ids.length) { const r = roundOf(ids); ctx.set({ candidates: cands, route: r.route, plan: r.plan }); }
      else ctx.set({ candidates: cands });
      quietDraw = true;
      render();
    }
    cleanup.push(onRelayChange(() => recalc()));
    const placeAt = (e) => {
      const p = map.eventToScene(e);
      return { ok: relayAllowed(terrain, p.x, p.z), p };
    };
    // a click while placing sets the relay there (before the map's own click handlers see it)
    map.el.addEventListener('click', (e) => {
      if (!placing) return;
      e.stopPropagation(); e.preventDefault();
      const { ok, p } = placeAt(e);
      if (!ok) {
        notice = 'The relay can not stand there: it must see the rover, on ground the suit can walk on.';
        clearTimeout(noticeTimer); noticeTimer = setTimeout(() => { notice = null; renderHint(); }, 4000);
        renderHint(); hint.classList.remove('is-flash'); void hint.offsetWidth; hint.classList.add('is-flash');
        return;
      }
      placing = false; map.el.classList.remove('is-placing'); tip.hidden = true;
      notice = null;
      setRelay(p);
    }, true);
    map.el.addEventListener('pointermove', (e) => {
      if (!placing) return;
      const { ok, p } = placeAt(e);
      showTip(p.x, p.z, [h(`div.plan-tip__row.${ok ? 'tone-accent' : 'tone-warning'}`, ok ? 'The relay can stand here' : 'Not here: no line of sight to the rover, or too steep')]);
    });

    const onDoc = () => { if (pinned) { pinned = null; tip.hidden = true; } };
    document.addEventListener('click', onDoc);
    cleanup.push(() => document.removeEventListener('click', onDoc));

    // keep a previous choice (back from Go / no-go) in step with the fresh candidate list
    const kept = stopIds();
    if (kept.some((id) => !candOf(id))) ctx.set({ stops: [], waypoints: {}, spotId: null, route: null, plan: null });
    else if (kept.length && !(ctx.state.stops && ctx.state.stops.length)) ctx.set({ stops: kept });
    // first visit: the spot that fits the request (requests.js spotId) is the first stop; the crew may change it
    if (!stopIds().length && req && req.spotId && candOf(req.spotId)) {
      const r = roundOf([req.spotId]);
      ctx.set({ stops: [req.spotId], spotId: req.spotId, route: r.route, plan: r.plan });
    }
    render();
    drawnOnce = true;
    revealWhenReady();
  },

  unmount() { root = null; cleanup.forEach((f) => f()); cleanup = []; },

  /**
   * State after this step is finished, for ?step=N. ?spot=F7 picks another candidate; ?stops=F3,F7,F1 a round
   * of up to PLANNER.maxStops stops in that order (dev aid for the steps after this one).
   */
  async devFixture(state, { getTerrain, params }) {
    const terrain = await getTerrain();
    const candidates = planAllCandidates(terrain);
    const ids = (params.get('stops') || '').split(',').filter((id) => candidates.some((x) => x.candidate.id === id)).slice(0, PLANNER.maxStops.value);
    const pick = ids.length ? ids : [(candidates.find((x) => x.candidate.id === (params.get('spot') || 'F3')) || candidates[0]).candidate.id];
    // &waypoints=0:x,z;1:x,z (specs/x-waypoints.md "Dev jump"): leg index, scene metres
    const wps = waypointsFor(pick, parseWaypoints(params.get('waypoints'), legKeysOf(pick), (x, z) => waypointAllowed(terrain, x, z)));
    if (ids.length > 1 || wps) {
      const route = planRound(terrain, pick.map((id) => candidates.find((x) => x.candidate.id === id).candidate), wps);
      return { candidates, stops: pick, waypoints: wps || {}, spotId: pick[0], route, plan: planNumbers(terrain, route) };
    }
    const c = candidates.find((x) => x.candidate.id === pick[0]);
    return { candidates, stops: [c.candidate.id], waypoints: {}, spotId: c.candidate.id, route: c.route, plan: c.plan };
  },
};
