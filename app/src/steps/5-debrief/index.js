// Step 5 Debrief (specs/5-debrief.md): did I get home, and how close was it.
// Planned values from state.plan (core planNumbers), actual values from state.walk (core WalkLog).
// Every number comes from the core; a missing field shows "no data".
// Dev aid: ?step=5&outcome=home|broken|lost replaces the walk log once with a test log (fixtures.js).
import './style.css';
import {
  h, s, headline, lede, bigNumber, pillButton, mapPanel, legend, checkItem, labelTag, marker,
  fmtDistance, fmtDuration,
} from '../../ui/index.js';
import { ROVER, spotLabel, spotNumber, ENVIRONMENT, DEMO, RULES } from '../../core/index.js';
import { fixtureWalk } from './fixtures.js';

const NO_DATA = 'no data';
const PHOTOS_URL = 'data/murray/photos/';
// Photo for the report when the walk log has none: Curiosity's own drill sample at the foot of a
// butte in Murray Buttes (credits.json). Never mb2.jpg (an archive portrait, not a Mars image).
const REPORT_PHOTO_ID = 'quela_drill';

let root = null;
let fixtureUsed = false;

const num = (v) => typeof v === 'number' && isFinite(v);
const dur = (s) => (num(s) ? fmtDuration(s) : NO_DATA);
const dist = (m) => (num(m) ? fmtDistance(m) : NO_DATA);

// ---------- labels (text and source for each kind of value) ----------
const T = {
  planDistance: { label: 'model', src: 'WALK_TERRAIN', text: 'Length of the planned round trip, measured on the 0.5 m terrain grid built from Curiosity images.' },
  walkDistance: { label: 'model', src: 'WALK_TERRAIN', text: 'Distance you walked, measured on the same terrain grid.' },
  planTime: { label: 'model', src: 'CON', where: '§4.2.1.3.1.1, p.40', text: 'Planned time outside: walking at NASA’s planning pace plus the work at the spot, in suit time.', moon: true },
  walkTime: { label: 'model', src: 'CON', where: '§4.2.1.3.1.1, p.40', text: 'Time outside on your walk, by the suit clock.' },
  planReserve: { label: 'model', src: 'SCH', where: 'slides 7-8', text: 'Reserve on return in the plan: time left in the suit at the rover, with the way home counted at the walk-back work rate.', moon: true },
  walkReserve: { label: 'model', src: 'SCH', where: 'slides 7-8', text: 'Time left in the suit when you reached the rover, from the suit model and your walk.' },
  closest: { label: 'model', src: 'SCH', where: 'slides 7-8', text: 'The lowest reserve on return during the walk: the moment you were closest to not getting home.' },
  planShadow: { label: 'model', src: 'WALK_TERRAIN', text: 'Planned time without line of sight to the rover at eye height, from the terrain grid.' },
  walkShadow: { label: 'model', src: 'WALK_TERRAIN', text: 'Time you spent without line of sight to the rover at eye height.' },
  spot: { label: 'model', src: 'WALK_TARGETS', text: 'Sample spot at the foot of a butte; its position is derived from the terrain.' },
  warnings: { label: 'model', src: 'WALK_TERRAIN', text: 'Warnings the helmet raised during the walk from the NASA rules; where = distance from the rover and time into the excursion.' },
  suitEmpty: { label: 'simulated', src: 'NONE', text: 'The suit ran out before the rover. The walk ended there; this is a simulation.' },
  where: { label: 'model', src: 'WALK_TERRAIN', text: 'Where it happened: straight-line distance and direction from the rover on the 0.5 m terrain grid, and the suit time into the excursion (demo time).' },
  ended: { label: 'model', src: 'WALK_TERRAIN', text: 'You ended the mission with esc before reaching the rover; where = the point you stopped, measured on the terrain grid.' },
};
const tag = (k) => labelTag(T[k]);

// ---------- helpers ----------
function lmst(tS) {
  const start = ENVIRONMENT.evaStartLmstH.value, sol = ENVIRONMENT.solSeconds.value;
  const hrs = (((start + (tS / sol) * 24) % 24) + 24) % 24;
  const hh = Math.floor(hrs), mm = Math.floor((hrs - hh) * 60);
  return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}
const DIRS = ['north', 'north-east', 'east', 'south-east', 'south', 'south-west', 'west', 'north-west'];
/** "14 m south-east of the rover" for a scene point. */
function fromRover(p) {
  if (!p || !num(p.x) || !num(p.z)) return NO_DATA;
  const dx = p.x - ROVER.x, dz = p.z - ROVER.z, d = Math.hypot(dx, dz);
  if (d < 1) return 'at the rover';
  const deg = ((Math.atan2(dx, dz) * 180) / Math.PI + 360) % 360;
  return `${fmtDistance(d)} ${DIRS[Math.round(deg / 45) % 8]} of the rover`;
}
function outcomeOf(walk, broken) {
  if (!walk) return null;
  let o = walk.outcome;
  if (!o && walk.suitEmpty) o = 'not-returned';
  if (!o && walk.ended) o = 'home';
  // a rule the plan already broke is carried in (specs/3-go.md): home is then home with a broken rule
  if (o === 'home' && broken.length) o = 'home-broken';
  return o || null;
}
/**
 * Broken rules, each rule once: the walk's own (count = how often it was broken on the walk, where = the
 * first time) and any rule the plan broke (carried: true when the walk log does not name it), whatever
 * way the walk ended.
 */
function brokenOf(walk, plan) {
  const out = [];
  for (const b of (walk && walk.brokenRules) || []) {
    const seen = out.find((x) => x.id === b.id);
    if (seen) seen.count++;
    else out.push({ ...b, count: 1, carried: false });
  }
  for (const b of (plan && plan.brokenRules) || []) {
    if (out.some((x) => x.id === b.id)) continue;
    out.push({ id: b.id, name: b.name, x: b.where && b.where.x, z: b.where && b.where.z, count: 0, carried: true });
  }
  return out;
}
const brokenName = (b) => b.name + (b.count > 1 ? ` (${b.count}×)` : b.carried ? ' (in the plan)' : '');
function spotName(id) { return (id && spotLabel(id)) || id || NO_DATA; }
// the map opens framed on the walk (its "reset" view): margin around it, at most this zoom (view layout only)
const HOME_MAX_ZOOM = 3, HOME_MARGIN = 0.18, MARKER_SIZE = 1.25, FOCUS_ZOOM = 2.5;

let _photos = null;
function loadPhotos() {
  if (!_photos) _photos = fetch(PHOTOS_URL + 'credits.json').then((r) => (r.ok ? r.json() : null)).catch(() => null);
  return _photos;
}

// ---------- the step ----------
export default {
  n: 5, id: 'debrief', title: 'Debrief',
  isComplete: () => true,

  async mount(el, ctx) {
    root = el;
    const terrain = await ctx.getTerrain();
    if (root !== el) return;

    const outParam = ctx.params.get('outcome');
    if (outParam && !fixtureUsed && ctx.state.route) {
      fixtureUsed = true;
      const w = fixtureWalk(terrain, ctx.state.route, outParam);
      if (w) ctx.set({ walk: w });
    }

    const { plan, route, walk } = ctx.state;
    const broken = brokenOf(walk, plan);
    const outcome = outcomeOf(walk, broken);
    const home = outcome === 'home' || outcome === 'home-broken';
    const warnings = (walk && walk.warnings) || [];
    const wCount = walk && Array.isArray(walk.warnings) ? String(warnings.length) : NO_DATA;
    const min = walk && walk.minReserve;
    const empty = walk && walk.suitEmpty;
    // not returned: where the suit ran out, or where the visitor ended the mission (esc)
    const stopAt = empty || (walk && walk.end) || null;
    const stopTag = empty ? 'suitEmpty' : 'ended';

    // ----- map: planned route and walked path together -----
    const map = mapPanel(terrain, { steep: true });
    if (route) map.path([...route.out.points, ...route.back.points], { style: 'foot' });
    if (walk && walk.track && walk.track.length) map.path(walk.track, { style: 'walked' });
    if (empty && num(empty.x)) map.path([empty, ROVER], { style: 'walked' }).setAttribute('class', 'map-path dbf-gap');
    map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Rover' });
    const wms = [];
    const wmOf = new Map(); // warning index -> its map marker
    warnings.forEach((w, i) => {
      if (!num(w.x) || !num(w.z)) return;
      const g = map.addMarker(w.x, w.z, { kind: 'number', text: String(i + 1) });
      g.classList.add('dbf-wm', `dbf-wm--${w.level}`);
      wms.push(g);
      wmOf.set(i, g);
    });
    // the spot above the warning markers, so its number stays readable
    const spotG = route ? map.addMarker(route.spot.x, route.spot.z, { kind: 'number', text: spotNumber(route.spotId) || '·', selected: true }) : null;
    if (min && num(min.x)) {
      const g = map.addMarker(min.x, min.z, { kind: 'dot', label: 'Closest moment', layer: 'top' });
      g.classList.add('dbf-closest');
    }
    const emptyG = empty && num(empty.x) ? map.addMarker(empty.x, empty.z, { kind: 'dot', label: 'Suit empty', layer: 'top' }) : null;
    if (emptyG) emptyG.classList.add('dbf-empty');
    // after layout: markers drawn fully inside the map and warning markers off the spot marker (a leader line
    // joins a moved marker to its real place), then the labels placed clear of the markers
    map.whenReady(() => {
      if (spotG) keepInside(map, spotG);
      for (const g of wms) { keepInside(map, g); if (spotG) moveOff(map, g, spotG); }
      for (const g of [map.svg.querySelector('.dbf-closest'), emptyG]) {
        const lbl = g && g.querySelector('.map-marker__label');
        if (lbl) placeClear(map.svg, lbl);
      }
    });
    map.setMarkerScale(MARKER_SIZE);
    map.setHome([
      ...(route ? [...route.out.points, ...route.back.points] : []),
      ...((walk && walk.track) || []), ...warnings, ROVER, min, empty,
    ].filter((p) => p && num(p.x) && num(p.z)), { margin: HOME_MARGIN, maxK: HOME_MAX_ZOOM });
    const legendItems = [{ kind: 'foot', text: 'Planned' }, { kind: 'walked', text: 'Walked' }, { kind: 'rover', text: 'Rover' },
      { kind: 'selected', text: 'Spot' }, { kind: 'closest', text: 'Closest moment' }];
    if (empty) legendItems.push({ kind: 'empty', text: 'Suit empty' });

    // ----- headline and outcome sentence -----
    const reserveHome = walk && walk.reserveAtHomeS;
    let sentence;
    const reached = num(reserveHome) ? `You reached the rover with ${fmtDuration(reserveHome)} left in the suit` : `You reached the rover (reserve: ${NO_DATA})`;
    if (!walk) sentence = ['No walk log: ', NO_DATA, '.'];
    else if (outcome === 'home') sentence = [`${reached} and kept every rule. `, tag('walkReserve')];
    else if (outcome === 'home-broken') sentence = [`${reached}, but broke ${broken.length > 1 ? broken.length + ' rules' : 'a rule'}: ${broken.map(brokenName).join(', ') || NO_DATA}. `, tag('walkReserve')];
    else if (outcome === 'not-returned' && empty) sentence = [`The suit ran out ${fromRover(empty)}. `, tag('suitEmpty')];
    else if (outcome === 'not-returned') sentence = [stopAt ? `You ended the mission ${fromRover(stopAt)}, before reaching it. ` : `You did not reach the rover (where: ${NO_DATA}). `, tag('ended')];
    else sentence = ['The walk has not ended: ', NO_DATA, '.'];
    if (outcome === 'not-returned' && broken.length) sentence.push(` Broke ${broken.length > 1 ? broken.length + ' rules' : 'a rule'}: ${broken.map(brokenName).join(', ')}.`);

    // ----- big numbers -----
    const nums = h('div.dbf__nums');
    if (outcome === 'not-returned') {
      nums.append(bigNumber({ label: 'Rover was', value: stopAt ? dist(stopAt.roverDistanceM) : NO_DATA, unit: stopAt ? 'away' : '', tone: 'warning', tag: T[stopTag] }));
    } else {
      nums.append(bigNumber({ label: 'Reserve on return', value: dur(reserveHome), tag: T.walkReserve, tone: num(reserveHome) && reserveHome <= 0 ? 'warning' : null }));
    }
    nums.append(
      bigNumber({ label: 'Closest moment', value: min ? dur(min.seconds) : NO_DATA, unit: min && min.name ? min.name.toLowerCase() : '', tag: T.closest, tone: min && min.seconds <= 0 ? 'warning' : null }),
      bigNumber({ label: 'Warnings', value: wCount, tag: T.warnings, tone: warnings.some((w) => w.level === 'warning') ? 'warning' : null }),
    );

    // ----- not returned: where and how far -----
    const lostBox = outcome === 'not-returned' ? h('div.dbf__lost',
      h('div.dbf__lost-title', empty ? 'Suit empty before the rover' : 'Mission ended before the rover'),
      h('div.dbf__lost-text',
        stopAt ? `${fromRover(stopAt)}, ${dur(stopAt.tS)} into the excursion; the rover was ${dist(stopAt.roverDistanceM)} away. ` : `Where: ${NO_DATA}. `,
        tag(stopTag))) : null;

    // ----- planned next to actual -----
    const sample = walk && walk.sample;
    const cell = (value, k) => h('td.dbf__td', h('span.mono', value), ' ', k ? tag(k) : null);
    const cellWrap = (value, k) => { const c = cell(value, k); c.classList.add('dbf__td--wrap'); return c; };
    const tr = (name, a, b) => h('tr', h('th.dbf__th', name), a, b);
    const table = h('table.dbf__table',
      h('thead', h('tr', h('th'), h('th.dbf__col', 'Planned'), h('th.dbf__col', 'Actual'))),
      h('tbody',
        tr('Sample', cell(route ? spotName(route.spotId) : NO_DATA, route ? 'spot' : null), cell(walk ? (sample ? 'taken' : 'not taken') : NO_DATA, null)),
        tr('Distance', cell(dist(plan && plan.distanceM), 'planDistance'), cell(dist(walk && walk.distanceM), 'walkDistance')),
        tr('Time', cell(dur(plan && plan.timeS), 'planTime'), cell(dur(walk && walk.tS), 'walkTime')),
        tr('Reserve on return', cell(dur(plan && plan.reserveS), 'planReserve'),
          outcome === 'not-returned' ? cellWrap('not returned', stopTag) : cell(dur(reserveHome), 'walkReserve')),
        tr('Time in radio shadow', cell(dur(plan && plan.radioShadowS), 'planShadow'), cell(dur(walk && walk.radioShadowS), 'walkShadow')),
      ));
    const pad = Math.round((RULES.walkBackRateFactor.value - 1) * 100);
    // the way-home pad only explains a reserve at the rover: not shown when the crew did not return
    const why = !home ? null : h('div.dbf__why', `The plan counts the way home at a ${pad} % higher work rate, so you can reach the rover with more reserve than planned. `, labelTag(RULES.walkBackRateFactor));
    const demo = h('div.dbf__demo', `Demo time ${DEMO.timeFactor.value}${DEMO.timeFactor.unit}: times are suit time. `, labelTag(DEMO.timeFactor));

    // ----- report to Earth -----
    const report = reportCard(ctx, { sample, walk, outcome });

    // ----- warnings list -----
    const wlist = h('div.dbf__warn',
      h('div.dbf__sec', `Warnings · ${wCount}`, ' ', tag('warnings')),
      warnings.length
        ? h('ol.dbf__wl', warnings.map((w, i) => h(`li.dbf__wi.dbf__wi--${w.level || 'caution'}${wmOf.has(i) ? '.is-link' : ''}`,
          wmOf.has(i) ? { tabindex: '0', role: 'button', title: 'Show on the map', onclick: () => focusWarning(i), onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); focusWarning(i); } } } : null,
          marker(i + 1, { tone: w.level }),
          h('div.dbf__wbody',
            h('div.dbf__wtext', w.text || w.id || NO_DATA),
            h('div.dbf__wwhere.mono', `${fromRover(w)} · ${dur(w.tS)} in `, tag('where'))))))
        : h('div.dbf__none', wCount === '0' ? 'No warnings during the walk.' : NO_DATA));

    // a warning clicked in the list: the map centres on it and both are highlighted
    function focusWarning(i) {
      const w = warnings[i], g = wmOf.get(i);
      if (!w || !g) return;
      map.svg.querySelectorAll('.dbf-wm.is-focus').forEach((x) => x.classList.remove('is-focus'));
      wlist.querySelectorAll('.dbf__wi.is-focus').forEach((x) => x.classList.remove('is-focus'));
      g.classList.add('is-focus');
      g.parentNode.append(g); // above the other markers
      const li = wlist.querySelectorAll('.dbf__wi')[i];
      if (li) li.classList.add('is-focus');
      map.centreOn(w.x, w.z, { minK: FOCUS_ZOOM });
    }

    // ----- checks: each rule kept or broken on the walk -----
    const checks = h('div.dbf__checks');
    const rules = plan && plan.checks ? plan.checks : [];
    const usedBroken = new Set();
    for (const c of rules) {
      if (c.id === 'radio') {
        const s = walk && walk.radioShadowS;
        checks.append(checkItem({ text: c.name, status: num(s) && s > 0 ? 'caution' : 'ok', detail: dur(s), tag: T.walkShadow }));
        continue;
      }
      const b = broken.find((x) => x.id === c.id || x.name === c.name);
      if (b) usedBroken.add(b);
      // way home: broken only when the suit ran out before the rover; a mission ended with esc away from
      // the rover is the "ended early" outcome, not a broken rule; home is home however the walk ended
      const lostWay = c.id === 'wayHome' && outcome === 'not-returned' && !!empty;
      const endedEarly = c.id === 'wayHome' && outcome === 'not-returned' && !empty;
      const status = b || lostWay ? 'broken' : endedEarly ? 'caution' : 'ok';
      const where = b ? fromRover(b) : lostWay && stopAt ? fromRover(stopAt) : endedEarly ? `ended early, ${stopAt ? fromRover(stopAt) : NO_DATA}` : '';
      const times = b && b.count > 1 ? ` · ${b.count}×` : '';
      checks.append(checkItem({ text: c.name, status, detail: where + times + (b && b.carried ? ' (in the plan)' : ''), tag: where && where !== NO_DATA ? T.where : null }));
    }
    for (const b of broken) if (!usedBroken.has(b)) checks.append(checkItem({ text: b.name, status: 'broken', detail: fromRover(b) + (b.count > 1 ? ` · ${b.count}×` : ''), tag: T.where }));

    // ----- main button -----
    const btn = pillButton({
      text: 'New mission', arrow: true,
      onClick: () => {
        const id = ctx.state.request && ctx.state.request.id;
        // only a mission that took the sample and reached the rover finishes the request
        if (id && home && sample && !ctx.state.requestsDone.includes(id)) ctx.set({ requestsDone: [...ctx.state.requestsDone, id] });
        ctx.newMission();
      },
    });

    // no sample photo: the lower block is short, so the left column spreads its blocks over the height
    el.append(h(sample ? 'div.dbf' : 'div.dbf.dbf--short',
      h('section.dbf__main',
        headline(home ? 'Back home.' : 'Not returned.', { size: 'hero' }),
        lede(...sentence),
        lostBox,
        nums,
        h('div.dbf__lower', h('div.dbf__tablewrap', table, why, demo), report)),
      h('aside.dbf__side',
        map.el,
        legend(legendItems),
        wlist),
      h('footer.dbf__foot',
        h('div.dbf__foot-left', h('div.dbf__foot-title', 'Rules on the walk'), checks),
        btn),
    ));
  },

  unmount() { root = null; },

  // Step 5 is the last step: its fixture is never needed by a later step.
  devFixture() { return null; },
};

/**
 * Put a marker label where it covers no other marker or label: right, left, above, below, then further
 * out. Measured after layout; keeps the first clear position (or the last tried).
 */
/** Shift a map marker on screen by (dx, dy) px, with a leader line from its real place (kept at every zoom). */
function shiftMarker(map, g, dx, dy) {
  map.offsetMarker(g, dx, dy, { unit: 'px', leaderClass: 'dbf-leader' });
}
/** Keep a marker fully inside the visible map box, a few pixels in from its edge. */
function keepInside(map, g) {
  const box = map.el.getBoundingClientRect(), r = g.getBoundingClientRect(), pad = 4;
  let dx = 0, dy = 0;
  if (r.left < box.left + pad) dx = box.left + pad - r.left; else if (r.right > box.right - pad) dx = box.right - pad - r.right;
  if (r.top < box.top + pad) dy = box.top + pad - r.top; else if (r.bottom > box.bottom - pad) dy = box.bottom - pad - r.bottom;
  if (dx || dy) shiftMarker(map, g, dx, dy);
}
/** Move a marker off another one (circles apart), away from its centre, staying inside the map. */
function moveOff(map, g, other) {
  const a = g.getBoundingClientRect(), b = other.getBoundingClientRect();
  const ca = { x: (a.left + a.right) / 2, y: (a.top + a.bottom) / 2 }, cb = { x: (b.left + b.right) / 2, y: (b.top + b.bottom) / 2 };
  const need = (a.width + b.width) / 2 + 3, d = Math.hypot(ca.x - cb.x, ca.y - cb.y);
  if (d >= need) return;
  const box = map.el.getBoundingClientRect();
  // away from the other marker; towards the map's middle when they sit on top of each other or at the edge
  let ux = d > 0.5 ? (ca.x - cb.x) / d : -1, uy = d > 0.5 ? (ca.y - cb.y) / d : 0;
  const nx = cb.x + ux * need, ny = cb.y + uy * need;
  if (nx - a.width / 2 < box.left || nx + a.width / 2 > box.right || ny - a.height / 2 < box.top || ny + a.height / 2 > box.bottom) {
    const mx = (box.left + box.right) / 2 - cb.x, my = (box.top + box.bottom) / 2 - cb.y, ml = Math.hypot(mx, my) || 1;
    ux = mx / ml; uy = my / ml;
  }
  shiftMarker(map, g, cb.x + ux * need - ca.x, cb.y + uy * need - ca.y);
}

function placeClear(svg, lbl) {
  if (!lbl.isConnected) return;
  const others = [...svg.querySelectorAll('.map-marker')].filter((g) => !g.contains(lbl))
    .flatMap((g) => [...g.children]).map((c) => c.getBoundingClientRect()).filter((r) => r.width && r.height);
  const hits = (a) => others.some((b) => a.left < b.right + 2 && a.right > b.left - 2 && a.top < b.bottom + 2 && a.bottom > b.top - 2);
  const tries = [];
  for (const d of [1, 2.2, 3.4]) {
    tries.push(['start', 5 * d, 1.6], ['end', -5 * d, 1.6], ['middle', 0, -5 * d], ['middle', 0, 7 * d]);
  }
  for (const [anchor, x, y] of tries) {
    lbl.setAttribute('text-anchor', anchor); lbl.setAttribute('x', String(x)); lbl.setAttribute('y', String(y));
    if (!hits(lbl.getBoundingClientRect())) return;
  }
  lbl.setAttribute('text-anchor', 'start'); lbl.setAttribute('x', '5'); lbl.setAttribute('y', '1.6');
}

function reportCard(ctx, { sample, walk, outcome }) {
  const photoBox = h('div.dbf__photo');
  const status = h('div.dbf__sent');
  const sendBtn = h('button.dbf__send', { type: 'button' }, 'Send report');
  const delay = ENVIRONMENT.signalDelayNowMin;
  sendBtn.addEventListener('click', () => {
    sendBtn.disabled = true;
    sendBtn.textContent = 'Report sent';
    const at = walk && num(walk.tS) ? `Sent ${lmst(walk.tS)} local Mars time. ` : '';
    status.replaceChildren(h('span', `${at || 'Sent. '}On its way: ${delay.value} ${delay.unit} one-way signal delay `), labelTag(delay));
    status.classList.add('fade-in');
  });

  const lines = sample
    ? [
      h('div.dbf__rrow', h('span.muted', 'Spot '), spotName(sample.spotId), ' ', tag('spot')),
      h('div.dbf__rrow', h('span.muted', 'Time '),
        num(sample.tS) ? `${lmst(sample.tS)} local Mars time, ${fmtDuration(sample.tS)} into the excursion ` : NO_DATA + ' ',
        num(sample.tS) ? labelTag(ENVIRONMENT.evaStartLmstH) : null),
    ]
    : [h('div.dbf__rrow', h('span.muted', 'Sample '), walk ? 'not taken' : NO_DATA)];

  const textBox = h('div.dbf__rtext', ...lines);
  if (sample) {
    const own = sample.photo; // the walk may log the photo it showed at the spot
    loadPhotos().then((data) => {
      const p = own ? { file: String(own).replace(/^.*photos\//, 'photos/'), title: sample.photoTitle || '', credit: sample.photoCredit || 'NASA/JPL-Caltech', camera: sample.photoMeta || '', page: sample.photoUrl || '' }
        : data && data.photos && data.photos.find((x) => x.id === REPORT_PHOTO_ID);
      if (!p || /mb2\.jpg$/.test(p.file || '')) return; // no fitting photo: none
      const src = PHOTOS_URL + String(p.file).replace(/^photos\//, '');
      const caption = own ? `${p.title}: this rock in the Murray Buttes as Curiosity saw it, not this exact spot.` : `${p.title}, Murray Buttes, sol ${p.sol}: Curiosity’s own sample nearby, not this exact spot.`;
      photoBox.append(h('img', { src, alt: p.title || 'Curiosity photo', loading: 'lazy' }));
      textBox.append(
        h('div.dbf__cap', h('span.muted', 'Photo '), caption, ' ', h('span.muted', p.credit || ''), ' ',
          labelTag({ label: 'real', text: `${p.title || ''}${p.camera ? ', ' + p.camera : ''}. Raw image from NASA’s Curiosity rover.`, source: { title: p.credit || 'NASA/JPL-Caltech', url: p.source_url || p.page || '', where: p.file_id || '' } })),
      );
    });
  }

  // close the loop with the request from step 1
  const req = ctx.state.request;
  const doneWord = req && req.kind === 'measurement' ? 'Measurement taken' : 'Sample collected';
  const loop = req ? h('div.dbf__loop',
    h('div.dbf__loopreq', h('span.muted', 'Request '), req.title),
    h('p.dbf__looptext', sample
      ? `${doneWord}. Your report reaches Earth in ${delay.value} min.`
      : `Not done this time. Earth will hear it in ${delay.value} min.`)) : null;

  return h(sample ? 'div.dbf__report' : 'div.dbf__report.dbf__report--empty',
    h('div.dbf__sec', 'Report to Earth'),
    loop,
    h('div.dbf__rbody', photoBox, textBox),
    h('div.dbf__ract', sendBtn, status),
  );
}
