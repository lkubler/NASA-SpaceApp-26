// Step 1 Mission (specs/1-mission.md): opening, Gale crater in 3D, the three sites, the two requests
// from Earth, choosing one. Writes state.request (app/README.md).
import './style.css';
import { h, headline, lede, pillButton, labelTag, LOCK_SVG } from '../../ui/index.js';
import { ENVIRONMENT, DEMO } from '../../core/values.js';
import { REQUESTS } from './requests.js';
import { loadGale, craterView, VERTICAL_EXAGGERATION } from './crater.js';
import { planetView } from './planet.js';

const PHOTO_BASE = 'data/murray/photos/';
// opening -> crater transition: globe zoom (ms), crater fly-in (ms), Gale's share of the screen width at the handoff
const ZOOM_MS = 2600, FLY_MS = 3400, HANDOFF_FILL = 0.11; // speeds meet at the handoff (planet.js, crater.js)
const SETTLE_AT = 0.72;       // share of the flight after which the panel and markers start to come in
const DIVE_MS = 700;          // Mission -> Plan: the dive onto Murray Buttes before the page changes
const PLAN_LEGEND_PX = 150;   // height of the legend under the Plan map, for where the map's centre will be
const SETTLE_SHIFT_MS = 1900; // the scene's slide to the left after the flight, slow to match the camera
const DELAY = ENVIRONMENT.signalDelayNowMin;

let cleanup = null;
let openingSeen = false; // UI only: the opening shows once per page load
// crater data, loaded once per page load and kept (a return to step 1 builds the view without waiting for the network)
let galeData = null;
const galeOnce = () => (galeData ||= loadGale().catch((e) => { galeData = null; throw e; }));

/** Resolves true when `img` has loaded and decoded `url`, false if it failed. */
function loadImage(img, url) {
  return new Promise((resolve) => {
    img.onload = () => (img.decode ? img.decode().catch(() => {}) : Promise.resolve()).then(() => resolve(true));
    img.onerror = () => resolve(false);
    img.src = url;
  });
}
const SKY_FIRST_MS = 4000; // the planet model waits for the star sky at most this long (UI only)

async function loadCredits() {
  try {
    const j = await (await fetch(PHOTO_BASE + 'credits.json')).json();
    return Object.fromEntries(j.photos.map((p) => [p.id, p]));
  } catch (e) { console.error(e); return {}; }
}

/** The self-contained request object for the shared state. */
function toRequest(r, credits, sentAt) {
  if (r.photo && typeof r.photo === 'object') { // a mission with its own photo (requests.js)
    const { photo, ...rest } = r;
    return { ...rest, photo: photo.src, photoCredit: photo.credit, photoCaption: photo.caption, photoMeta: photo.meta, photoUrl: photo.url, sentAt, delayMin: DELAY.value };
  }
  const p = credits[r.photoId] || {};
  return {
    ...r,
    photo: PHOTO_BASE + r.photoId + '.jpg',
    photoCredit: p.credit || 'NASA/JPL-Caltech',
    photoCaption: p.title || '',
    photoMeta: p.camera ? `Curiosity ${p.camera.replace(/\s*\(.*\)/, '')}, sol ${p.sol}` : 'Curiosity',
    photoUrl: p.page || p.source_url || '',
    sentAt,
    delayMin: DELAY.value,
  };
}

export default {
  n: 1, id: 'mission', title: 'Mission',
  isComplete: (state) => !!state.request,

  async mount(el, ctx) {
    let alive = true;
    const disposers = [];
    cleanup = () => { alive = false; disposers.forEach((f) => f()); };

    let viewReadyRes, viewSettled = false;
    // true once the crater view is built, false on failure
    const viewReady = new Promise((res) => { viewReadyRes = (v) => { viewSettled = true; res(v); }; });
    const viewWrap = h('div.m1-view');
    const overlay = h('div.m1-overlay');
    const credit = h('div.m1-credit.mono');
    const hero = h('div.m1-hero',
      headline('Choose your mission.'),
      lede('Three missions at real Curiosity sites in Gale crater.'));
    const panel = h('aside.m1-panel', { 'aria-hidden': 'true' });
    el.append(viewWrap, overlay, hero, credit, panel);
    // crater view, its markers and the headline stay hidden until the view is built, then fade and ease in
    // (a return to step 1, e.g. New mission from the Debrief; not the zoom from the opening, which has its own)
    const reveal = () => requestAnimationFrame(() => requestAnimationFrame(() => { if (alive) el.classList.remove('m1--entering'); }));
    let opening = false;

    // --- opening: two sentences before anything else
    // the opening shows once per page load, on the first visit of step 1 (not after the dev jump to a later step)
    if (!openingSeen && !ctx.state.request && !(Number(ctx.params.get('step')) > 1)) {
      opening = true;
      el.classList.add('m1--intro'); // before anything measures the layout, so the headline never shows through
      const begin = pillButton({ text: 'Begin', arrow: true, onClick: () => closeOpening() });
      const intro = h('div.m1-intro',
        h('div.m1-intro__text',
          h('p.m1-intro__line', 'A crew is on Mars, on its own: a signal to Earth takes ',
            h('span.m1-num', `${ENVIRONMENT.signalDelayMinMin.value} to ${ENVIRONMENT.signalDelayMaxMin.value} minutes`),
            ' each way ', labelTag(ENVIRONMENT.signalDelayMaxMin), '.'),
          h('p.m1-intro__line.m1-intro__q', 'Before every step outside, one question: can I still get home?')),
        h('div.m1-intro__action', begin));
      const globe = h('div.m1-globe', { 'aria-hidden': 'true' });
      const skyCredit = h('div.m1-intro__credit.mono', h('span.m1-credit__k', 'Sources'), 'Mars: NASA/JPL-Caltech 3D model ',
        labelTag({ label: 'real', text: 'A 3D model of Mars, with a surface texture from spacecraft imagery. Shown as a backdrop; it turns slowly.', source: { title: 'NASA Science, Planet Mars, 3D Model — NASA/JPL-Caltech', url: 'https://science.nasa.gov/resource/planet-mars-3d-model/' } }),
        h('span.m1-credit__sep', '·'), h('span', 'Stars: NASA/Goddard SVS Deep Star Maps 2020 '),
        labelTag({ label: 'real', text: 'The star field is a real sky map built from the Hipparcos-2, Tycho-2 and Gaia DR2 star catalogs, centred on the core of the Milky Way.', source: { title: 'NASA/Goddard Space Flight Center Scientific Visualization Studio, Deep Star Maps 2020 (Gaia DR2: ESA/Gaia/DPAC)', url: 'https://svs.gsfc.nasa.gov/4851' } }));
      // star sky first (fades in once decoded), then the planet (fades in once its model is on the GPU)
      const sky = h('img.m1-sky', { alt: '', 'aria-hidden': 'true', decoding: 'async' });
      const skyLoaded = loadImage(sky, `${import.meta.env.BASE_URL || './'}sky/milky-way.jpg`).then((ok) => {
        if (ok && alive) sky.classList.add('is-ready');
      });
      const skyFirst = Promise.race([skyLoaded, new Promise((r) => setTimeout(r, SKY_FIRST_MS))]);
      intro.prepend(sky, globe);
      intro.append(skyCredit);
      el.append(intro);
      const planet = planetView(globe, { after: skyFirst });
      let planetGone = false;
      const dropPlanet = () => { if (!planetGone) { planetGone = true; planet.dispose(); } };
      disposers.push(dropPlanet);
      let leaving = false;
      const closeOpening = async () => {
        if (leaving) return;
        leaving = true;
        openingSeen = true;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        // Begin pressed before the crater is built: the opening stays (Begin dimmed) until it is
        if (!viewSettled) { intro.classList.add('is-waiting'); await viewReady; }
        if (!alive) return;
        // the globe is not shown yet, reduced motion, or no crater: no zoom; the opening fades out while
        // the crater (just built) fades and eases in underneath
        if (reduced || !planet.isReady() || !view) {
          el.classList.add('m1--entering');
          intro.classList.add('is-leaving');
          el.classList.remove('m1--intro');
          openPanel();
          setTimeout(() => { dropPlanet(); intro.remove(); }, 500);
          reveal();
          return;
        }
        intro.classList.add('is-zooming');
        // globe turns Gale to the centre and zooms in; then the 3D crater appears over it in the same place
        // and scale, the globe follows the crater camera down, and fades while the camera tilts
        el.classList.add('m1--flying');
        await planet.zoomToGale(ZOOM_MS, HANDOFF_FILL);
        if (!alive) return;
        el.classList.remove('m1--intro');
        el.classList.add('m1--handoff');
        // the last part of the flight, while the camera slows down: the scene starts its slide to the left,
        // and the markers, headline and missions fade in one after another, so nothing pops in at the end
        let settled = false;
        const settle = () => {
          if (settled || !alive) return;
          settled = true;
          intro.style.pointerEvents = 'none';
          el.classList.add('m1--settling');
          el.classList.remove('m1--flying');
          setTimeout(() => { el.classList.remove('m1--settling'); panel.classList.remove('is-gliding'); }, 3600);
          openPanel(false, SETTLE_SHIFT_MS);
        };
        await view.flyIn({
          dur: FLY_MS, fill: HANDOFF_FILL,
          onFrame: (kmPerPx, k) => {
            planet.follow(kmPerPx);
            const f = Math.min(1, Math.max(0, (k - 0.4) / 0.3));
            intro.style.opacity = String(1 - f * f * (3 - 2 * f));
            if (k >= SETTLE_AT) settle();
          },
        });
        dropPlanet(); intro.remove();
        el.classList.remove('m1--handoff');
        settle();
      };
      setTimeout(() => begin.focus(), 50);
    }
    if (!opening) el.classList.add('m1--entering');

    let view = null;
    let panelOpen = false;
    const siteEls = new Map(); // site id -> marker
    let btn = null;
    const pins = [];
    const cardEls = new Map();

    // one Sources line in the footer; the details sit behind the info markers
    function buildCredit(meta) {
      credit.append(
        h('span.m1-credit__k', 'Sources'),
        h('span', 'Gale crater: HRSC (ESA Mars Express), NASA 3D model '),
        labelTag({ label: 'real', text: `Heights of Gale crater from a 3D model made from HRSC stereo images on ESA’s Mars Express (${Math.round(meta.width_km)} × ${Math.round(meta.height_km)} km), converted to metres with MOLA altimetry. Colour from the Mars globe model; site positions from Curiosity’s drive.`, source: { title: meta.source.title + ' — ' + meta.source.credit, url: meta.source.url } }),
        h('span.m1-credit__sep', '·'),
        h('span', `Height ×${VERTICAL_EXAGGERATION} `),
        labelTag(DEMO.craterHeightFactor),
        ...(meta.drive ? [h('span.m1-credit__sep', '·'), h('span', 'Sites and drive: Curiosity waypoints '),
          labelTag({ label: 'real', text: `Positions of Murray Buttes, Marias Pass and Pahrump Hills, and the drive from Bradbury Landing, from Curiosity's waypoints (sols ${meta.drive.sols[0]} to ${meta.drive.sols[1]}).`, source: { title: 'Curiosity waypoints, NASA/JPL-Caltech', url: meta.drive.url } }),
          h('span.m1-credit__sep', '·'), h('span', 'Base at Bradbury Landing '),
          labelTag({ label: 'assumption', text: `There is no base on Mars. We place the crew's base at ${meta.base.name}, where Curiosity landed in August 2012. The position is real (Curiosity's first waypoint), and the line is Curiosity's real drive from there to Murray Buttes, ${meta.drive.km} km as drawn.`, source: { title: 'Curiosity waypoints, NASA/JPL-Caltech', url: meta.drive.url } })] : []),
      );
    }

    // --- markers: three sites and Mount Sharp, projected from real coordinates every render
    function pin(worldPoint, node) { overlay.append(node); pins.push({ p: worldPoint, node }); }
    let drawDrive = null;
    function place() {
      if (drawDrive) drawDrive();
      for (const { p, node } of pins) {
        const q = view.project(p);
        node.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
        node.style.visibility = q.visible ? '' : 'hidden';
      }
    }
    function buildMarkers(meta) {
      pin(view.pointOf(meta.mount_sharp, 0.4), h('div.m1-pin.m1-pin--peak', h('span.m1-pin__peak'), h('span.m1-pin__name', 'Mount Sharp')));
      // The three sites, each at its real place. They lie within 2 km of each other, so their labels sit
      // apart with a thin leader line. Each is linked to its mission card: hovering one lights up the other.
      for (const s of meta.sites) {
        const mission = REQUESTS.find((r) => r.site === s.id);
        const open = mission && !mission.locked;
        const node = h(`${open ? 'button' : 'div'}.m1-pin.m1-site.m1-site--${s.id}${open ? '.m1-site--open' : '.m1-site--soon'}`,
          open ? { type: 'button', 'aria-label': `${s.name}: ${mission.title}`, onclick: () => pickMission(mission.id) } : { title: `${s.name}: coming soon`, onclick: () => mission && notYet(mission.id) },
          h('span.m1-site__dot'), h('span.m1-site__lead'),
          h('span.m1-site__name', s.name, open ? null : h('span.m1-site__soon', 'soon')));
        if (mission) {
          node.addEventListener('mouseenter', () => hot(mission.id, true));
          node.addEventListener('mouseleave', () => hot(mission.id, false));
        }
        siteEls.set(s.id, node);
        pin(view.pointOf(s, 0.05), node);
      }
      if (meta.base && meta.drive) buildBase(meta);
      view.onRender(place);
      place();
    }

    // --- base at Bradbury Landing and Curiosity's drive from there to the sites
    function buildBase(meta) {
      const NS = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(NS, 'svg');
      svg.setAttribute('class', 'm1-drive');
      const glow = document.createElementNS(NS, 'path'), dash = document.createElementNS(NS, 'path');
      glow.setAttribute('class', 'm1-drive__glow'); dash.setAttribute('class', 'm1-drive__dash');
      svg.append(glow, dash);
      overlay.prepend(svg);
      // end the line at the Murray Buttes marker: cut the drive at its point closest to it (the real drive
      // passes the other two sites first and turns back)
      const m = meta.sites.find((t) => t.id === 'murray'), cc = m.col, cr = m.row;
      let cut = 0, best = Infinity;
      meta.drive.points.forEach(([col, row], i) => { const d = (col - cc) ** 2 + (row - cr) ** 2; if (d < best) { best = d; cut = i; } });
      const path = [...meta.drive.points.slice(0, cut + 1), [cc, cr]];
      const pts = path.map(([col, row]) => view.pointOf({ col, row }, 0.03));
      drawDrive = () => {
        const d = pts.map((p, i) => { const q = view.project(p); return `${i ? 'L' : 'M'}${q.x.toFixed(1)} ${q.y.toFixed(1)}`; }).join('');
        glow.setAttribute('d', d); dash.setAttribute('d', d);
      };
      const base = meta.base;
      pin(view.pointOf(base, 0.03), h('div.m1-pin.m1-base',
        h('span.m1-base__ring'), h('span.m1-base__ring'), h('span.m1-base__ring'),
        h('span.m1-base__beam'), h('span.m1-base__core'),
        h('div.m1-base__label',
          h('span.m1-base__name', 'Base'),
          h('span.m1-base__where.mono', `${base.name} · ${meta.drive.km} km drive`))));
    }

    // --- missions panel: one mission per site
    let reqs = [];
    function buildPanel(credits) {
      const sentAt = (ctx.state.request && ctx.state.request.sentAt) || Date.now() - DELAY.value * 60000;
      reqs = REQUESTS.map((r) => toRequest(r, credits, sentAt));
      btn = pillButton({ text: 'Plan this mission', arrow: true, onClick: () => goPlan(), disabled: !ctx.state.request });
      const list = h('div.m1-reqs', { role: 'radiogroup', 'aria-label': 'Missions from Earth' });
      for (const r of reqs) {
        const c = requestCard(r);
        cardEls.set(r.id, c);
        list.append(c);
      }
      panel.append(
        list,
        h('div.m1-panel__action', btn));
      markChosen();
    }

    function requestCard(r) {
      const done = (ctx.state.requestsDone || []).includes(r.id);
      const pick = () => pickMission(r.id);
      const el = h(`div.m1-req${r.locked ? '.is-locked' : ''}`, {
        role: 'radio', tabindex: r.locked ? '-1' : '0', 'aria-checked': 'false', 'aria-disabled': r.locked ? 'true' : 'false',
        onclick: pick, onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } } },
        h('figure.m1-req__photo',
          h('img', { src: r.photo, alt: r.photoCaption, loading: 'lazy' }),
          h('span.m1-req__photoinfo', labelTag({ label: 'real', text: `Real Curiosity photo: ${r.photoCaption}.`, source: { title: `${r.photoMeta} · ${r.photoCredit}`, url: r.photoUrl } }))),
        h('div.m1-req__body',
          h('div.m1-req__site', siteName(r.site), r.locked ? h('span.m1-req__soon', 'Soon') : null, done ? h('span.m1-req__done', 'Done') : null),
          h('div.m1-req__title', r.title),
          h('p.m1-req__why', r.why)),
        h('span.m1-req__info', labelTag({ label: 'real', text: 'The scientific question is real; the message from Earth is part of the story.', source: r.whySource })),
        r.locked ? null : h('span.m1-req__check', { 'aria-hidden': 'true' }));
      el.addEventListener('mouseenter', () => hot(r.id, true));
      el.addEventListener('mouseleave', () => hot(r.id, false));
      el.addEventListener('focus', () => hot(r.id, true));
      el.addEventListener('blur', () => hot(r.id, false));
      el.dataset.id = r.id;
      return el;
    }
    let siteNames = {};
    const siteName = (id) => siteNames[id] || id;

    /** Light up a mission's card and its site marker together. */
    function hot(id, on) {
      const r = reqs.find((x) => x.id === id) || REQUESTS.find((x) => x.id === id);
      if (!r) return;
      const card = cardEls.get(id), site = siteEls.get(r.site);
      if (card) card.classList.toggle('is-hot', on);
      if (site) site.classList.toggle('is-hot', on);
      el.classList.toggle('m1--hot', on);
    }

    /** A click on a site that is not open yet: its card and marker pulse once, the pill says why. */
    const notYetTimers = new Map();
    function notYet(id) {
      const r = REQUESTS.find((x) => x.id === id);
      if (!r) return;
      const card = cardEls.get(id), site = siteEls.get(r.site);
      const pill = card && card.querySelector('.m1-req__soon');
      for (const n of [card, site]) {
        if (!n) continue;
        n.classList.remove('is-notyet');
        void n.offsetWidth; // restart the pulse on a second click
        n.classList.add('is-notyet');
      }
      if (pill) pill.textContent = 'Not available yet';
      clearTimeout(notYetTimers.get(id));
      notYetTimers.set(id, setTimeout(() => {
        for (const n of [card, site]) if (n) n.classList.remove('is-notyet');
        if (pill) pill.textContent = 'Soon';
      }, 2200));
    }
    function pickMission(id) {
      const r = reqs.find((x) => x.id === id);
      if (r && r.locked) { notYet(id); return; }
      if (!r) return;
      ctx.getTerrain(); // start loading the Plan map's ground now, so it is there when the dive lands
      ctx.set({ request: r });
      markChosen();
    }
    function markChosen() {
      const id = ctx.state.request && ctx.state.request.id;
      for (const [k, c] of cardEls) {
        c.classList.toggle('is-selected', k === id);
        c.classList.toggle('is-done', (ctx.state.requestsDone || []).includes(k));
        c.setAttribute('aria-checked', String(k === id));
      }
      const chosen = reqs.find((x) => x.id === id);
      for (const [sid, m] of siteEls) m.classList.toggle('is-selected', !!chosen && chosen.site === sid);
      if (btn) btn.disabled = !id;
    }

    /**
     * Mission -> Plan: the panel, headline and markers fade while the camera dives fast onto Murray Buttes,
     * ending where the Plan map's centre will be; then the page changes (frame/shell.js 'zoom') and the Plan
     * map grows in from there, so the motion carries over. Reduced motion or no crater: the page changes at once.
     */
    let diving = false;
    async function goPlan() {
      if (diving || !ctx.state.request) return;
      if (!view || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { ctx.next(); return; }
      diving = true;
      ctx.getTerrain(); // the Plan map's ground loads during the dive (cached; already asked for on the pick)
      el.classList.add('m1--diving');
      await view.diveTo({ dur: DIVE_MS, at: planMapCentre() });
      if (alive) ctx.next();
    }
    /** Where the Plan map's centre will be, as fractions of the screen: measured on an invisible copy of its layout. */
    function planMapCentre() {
      const probe = h('div.step.step--plan', { style: 'visibility:hidden;pointer-events:none;animation:none', 'aria-hidden': 'true' },
        h('div.split', h('section.split__map', h('div.map', { style: 'flex:1 1 auto' }), h('div', { style: `height:${PLAN_LEGEND_PX}px;flex:none` })), h('aside.split__side')));
      el.parentElement.append(probe);
      const r = probe.querySelector('.map').getBoundingClientRect(), o = el.getBoundingClientRect();
      probe.remove();
      if (!r.width || !o.width) return { x: 0.3, y: 0.42 };
      return { x: (r.left + r.width / 2 - o.left) / o.width, y: (r.top + r.height / 2 - o.top) / o.height };
    }

    /** The panel opens once the crater is in place; the scene slides left so the sites sit in the free half. */
    function openPanel(instant = false, shiftMs = 240) {
      if (panelOpen || !view) return;
      panelOpen = true;
      panel.setAttribute('aria-hidden', 'false');
      if (instant) panel.classList.add('is-fading'); // returning to step 1 with a request: fades in with the crater
      else panel.classList.toggle('is-gliding', shiftMs > 240); // after the flight: the parts come in one by one
      requestAnimationFrame(() => panel.classList.add('is-open'));
      view.setShift(panel.offsetWidth / 2, shiftMs);
    }

    // --- crater view
    try {
      const [gale, credits] = await Promise.all([galeOnce(), loadCredits()]);
      // the previous screen goes first (one painted frame), then the view is built
      if (!opening) await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      if (!alive) return;
      view = craterView(viewWrap, gale);
      disposers.push(() => view.dispose());
      siteNames = Object.fromEntries(gale.meta.sites.map((t) => [t.id, t.name]));
      buildMarkers(gale.meta);
      buildCredit(gale.meta);
      buildPanel(credits);
      if (!el.classList.contains('m1--intro') && !el.classList.contains('m1--flying')) openPanel(!!ctx.state.request);
      viewReadyRes(true);
      if (!opening) reveal();
    } catch (e) {
      console.error(e);
      viewReadyRes(false);
      if (!alive) return;
      credit.replaceChildren('Gale crater elevation data could not be loaded.');
      el.classList.remove('m1--entering');
    }
  },

  unmount() { if (cleanup) cleanup(); cleanup = null; },

  /** State after this step is finished, for ?step=N (dev aid): the first request. */
  async devFixture() {
    const credits = await loadCredits();
    return { request: toRequest(REQUESTS[0], credits, Date.now() - DELAY.value * 60000) };
  },
};
