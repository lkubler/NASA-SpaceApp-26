// Step 1 Mission (specs/1-mission.md): opening, Gale crater in 3D, the three sites, the two requests
// from Earth, choosing one. Writes state.request (app/README.md).
import './style.css';
import { h, headline, lede, pillButton, labelTag, fmtTimeOfDay, LOCK_SVG } from '../../ui/index.js';
import { ENVIRONMENT, DEMO } from '../../core/values.js';
import { REQUESTS } from './requests.js';
import { loadGale, craterView, VERTICAL_EXAGGERATION } from './crater.js';
import { planetView } from './planet.js';

const PHOTO_BASE = 'data/murray/photos/';
// opening -> crater transition: globe zoom (ms), crater fly-in (ms), Gale's share of the screen width at the handoff
const ZOOM_MS = 2600, FLY_MS = 3400, HANDOFF_FILL = 0.11; // speeds meet at the handoff (planet.js, crater.js)
const DELAY = ENVIRONMENT.signalDelayNowMin;

let cleanup = null;
let openingSeen = false; // UI only: the opening shows once per page load

async function loadCredits() {
  try {
    const j = await (await fetch(PHOTO_BASE + 'credits.json')).json();
    return Object.fromEntries(j.photos.map((p) => [p.id, p]));
  } catch (e) { console.error(e); return {}; }
}

/** The self-contained request object for the shared state. */
function toRequest(r, credits, sentAt) {
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

const simulatedMsg = {
  label: 'simulated',
  text: 'The message itself is part of the demo; the science question behind it is real (see the reason below).',
  source: { title: 'research/research-requests.md, section 5 (wording by the team)', url: '' },
};

export default {
  n: 1, id: 'mission', title: 'Mission',
  isComplete: (state) => !!state.request,

  async mount(el, ctx) {
    let alive = true;
    const disposers = [];
    cleanup = () => { alive = false; disposers.forEach((f) => f()); };

    const viewWrap = h('div.m1-view');
    const overlay = h('div.m1-overlay');
    const credit = h('div.m1-credit.mono');
    const hero = h('div.m1-hero',
      headline('Choose your mission.'),
      lede('Three sites in Gale crater that Curiosity explored. Select one.'));
    const panel = h('aside.m1-panel', { 'aria-hidden': 'true' });
    el.append(viewWrap, overlay, hero, credit, panel);

    // --- opening: two sentences before anything else
    if (!openingSeen && !ctx.state.request) {
      const begin = pillButton({ text: 'Begin', arrow: true, onClick: () => closeOpening() });
      const intro = h('div.m1-intro',
        h('div.m1-intro__text',
          h('p.m1-intro__line', 'A crew is on Mars, on its own: a signal to Earth takes ',
            h('span.m1-num', `${ENVIRONMENT.signalDelayMinMin.value} to ${ENVIRONMENT.signalDelayMaxMin.value} minutes`),
            ' each way ', labelTag(ENVIRONMENT.signalDelayMaxMin), '.'),
          h('p.m1-intro__line.m1-intro__q', 'Before every step outside, one question: can I still get home?')),
        h('div.m1-intro__action', begin));
      const globe = h('div.m1-globe', { 'aria-hidden': 'true' });
      const skyCredit = h('div.m1-intro__credit.mono', 'Mars: NASA/JPL-Caltech 3D model ',
        labelTag({ label: 'real', text: 'NASA’s 3D model of Mars, with a surface texture from spacecraft imagery. Shown as a backdrop; it turns slowly.', source: { title: 'NASA Science, Planet Mars, 3D Model — NASA/JPL-Caltech', url: 'https://science.nasa.gov/resource/planet-mars-3d-model/' } }),
        h('span', ' · Stars: NASA/Goddard SVS Deep Star Maps 2020 '),
        labelTag({ label: 'real', text: 'The star field is a real sky map built from the Hipparcos-2, Tycho-2 and Gaia DR2 star catalogs, centred on the core of the Milky Way.', source: { title: 'NASA/Goddard Space Flight Center Scientific Visualization Studio, Deep Star Maps 2020 (Gaia DR2: ESA/Gaia/DPAC)', url: 'https://svs.gsfc.nasa.gov/4851' } }));
      intro.style.backgroundImage = `url(${import.meta.env.BASE_URL || './'}sky/milky-way.jpg)`;
      intro.prepend(globe);
      intro.append(skyCredit);
      el.append(intro);
      const planet = planetView(globe);
      let planetGone = false;
      const dropPlanet = () => { if (!planetGone) { planetGone = true; planet.dispose(); } };
      disposers.push(dropPlanet);
      el.classList.add('m1--intro');
      let leaving = false;
      const closeOpening = async () => {
        if (leaving) return;
        leaving = true;
        openingSeen = true;
        const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (reduced || !view) { // plain fade
          intro.classList.add('is-leaving');
          el.classList.remove('m1--intro');
          setTimeout(() => { dropPlanet(); intro.remove(); }, 260);
          return;
        }
        // globe turns Gale to the centre and zooms in; then the 3D crater appears over it in the same place
        // and scale, the globe follows the crater camera down, and fades while the camera tilts
        intro.classList.add('is-zooming');
        el.classList.add('m1--flying');
        await planet.zoomToGale(ZOOM_MS, HANDOFF_FILL);
        if (!alive) return;
        el.classList.remove('m1--intro');
        el.classList.add('m1--handoff');
        await view.flyIn({
          dur: FLY_MS, fill: HANDOFF_FILL,
          onFrame: (kmPerPx, k) => {
            planet.follow(kmPerPx);
            const f = Math.min(1, Math.max(0, (k - 0.4) / 0.3));
            intro.style.opacity = String(1 - f * f * (3 - 2 * f));
          },
        });
        dropPlanet(); intro.remove();
        el.classList.remove('m1--handoff');
        if (alive) el.classList.remove('m1--flying');
      };
      setTimeout(() => begin.focus(), 50);
    }

    let view = null;
    let siteSelected = false;
    let murrayBtn = null;
    let btn = null;
    const pins = [];
    const cardEls = new Map();

    function buildCredit(meta) {
      credit.append(
        h('span', 'Gale crater · HRSC elevation (ESA Mars Express) via NASA 3D model, ', `${Math.round(meta.km_per_pixel * 1000)} m per pixel `),
        labelTag({ label: 'real', text: `Elevation of Gale crater from NASA's printable 3D model, made from stereo images of the HRSC camera on ESA's Mars Express; ${Math.round(meta.width_km)} × ${Math.round(meta.height_km)} km. We placed it on the map and converted it to metres by fitting it to MOLA laser altimetry (correlation ${meta.fit.r}). Surface colour from the same NASA Mars 3D model as the opening globe (low resolution, about 6 pixels per degree). Site positions from Curiosity's drive path; Mount Sharp is the highest point of the central mound in this grid.`, source: { title: meta.source.title + ' — ' + meta.source.credit, url: meta.source.url } }),
        h('span', ` · height ×${VERTICAL_EXAGGERATION} `),
        labelTag(DEMO.craterHeightFactor),
      );
    }

    // --- markers: three sites and Mount Sharp, projected from real coordinates every render
    function pin(worldPoint, node) { overlay.append(node); pins.push({ p: worldPoint, node }); }
    function place() {
      for (const { p, node } of pins) {
        const q = view.project(p);
        node.style.transform = `translate(${q.x.toFixed(1)}px, ${q.y.toFixed(1)}px)`;
        node.style.visibility = q.visible ? '' : 'hidden';
      }
    }
    function buildMarkers(meta) {
      pin(view.pointOf(meta.mount_sharp, 0.4), h('div.m1-pin.m1-pin--peak', h('span.m1-pin__peak'), h('span.m1-pin__name', 'Mount Sharp')));
      // The three sites lie within 2 km of each other, a few pixels apart at this scale: one ring at their
      // centre, the sites spread on it in their real directions (view looks south: west is on the right).
      const pts = meta.sites.map((s) => view.pointOf(s, 0.05));
      const centre = pts.reduce((a, p) => a.add(p), pts[0].clone().multiplyScalar(0)).multiplyScalar(1 / pts.length);
      const cluster = h('div.m1-pin.m1-cluster', { title: 'The three sites lie within 2 km of each other; spread out here so they can be read.' },
        h('span.m1-cluster__ring'));
      for (const s of meta.sites) {
        if (s.id === 'murray') {
          murrayBtn = h('button.m1-site.m1-site--murray', { type: 'button', 'aria-label': 'Select Murray Buttes', onclick: () => selectSite() },
            h('span.m1-site__dot'), h('span.m1-site__name', h('span.m1-site__arrow', '← '), s.name));
          cluster.append(murrayBtn);
        } else {
          cluster.append(h(`div.m1-site.m1-site--locked.m1-site--${s.id}`, { title: `${s.name}: not in this demo` },
            h('span.m1-site__dot'),
            h('span.m1-site__name', h('span.m1-site__lock', { html: LOCK_SVG }), s.name)));
        }
      }
      pin(centre, cluster);
      view.onRender(place);
      place();
    }

    // --- requests panel
    function buildPanel(credits) {
      const sentAt = (ctx.state.request && ctx.state.request.sentAt) || Date.now() - DELAY.value * 60000;
      const reqs = REQUESTS.map((r) => toRequest(r, credits, sentAt));
      btn = pillButton({ text: 'Plan this mission', arrow: true, onClick: () => ctx.next(), disabled: !ctx.state.request });
      const list = h('div.m1-reqs');
      for (const r of reqs) {
        const c = requestCard(r, () => choose(r));
        cardEls.set(r.id, c);
        list.append(c);
      }
      panel.append(
        h('div.m1-panel__head',
          h('div.m1-panel__kicker.mono', 'Murray Buttes · requests from Earth'),
          h('p.m1-panel__lede', 'Any answer from Earth takes at least ', h('span.mono', `${DELAY.value} min`), ' ', labelTag(DELAY),
            ' to arrive, so the crew plans this excursion alone. Choose one request.')),
        list,
        h('div.m1-panel__action', btn));
      markChosen();
    }

    function requestCard(r, onPick) {
      const received = r.sentAt + r.delayMin * 60000;
      const el = h(`div.card.m1-req`, { role: 'button', tabindex: '0', 'aria-pressed': 'false', onclick: onPick,
        onkeydown: (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(); } } },
        h('figure.m1-req__photo',
          h('img', { src: r.photo, alt: r.photoCaption, loading: 'lazy' }),
          h('figcaption.mono', r.photoMeta, h('br'), r.photoCredit, ' ', labelTag({ label: 'real', text: `Real Curiosity photo: ${r.photoCaption}.`, source: { title: `${r.photoMeta}, ${r.photoCredit}`, url: r.photoUrl } }))),
        h('div.m1-req__body',
          h('div.m1-req__from.mono', h('span', r.from), labelTag(simulatedMsg)),
          h('div.m1-req__kind.mono', r.kind === 'sample' ? 'One sample' : 'One measurement',
            (ctx.state.requestsDone || []).includes(r.id) ? h('span.m1-req__done', '✓ Done') : null),
          h('div.m1-req__title', r.title),
          h('p.m1-req__why', r.why, ' ', labelTag({ label: 'real', text: 'The reason comes from published Curiosity science.', source: r.whySource })),
          h('div.m1-req__signal.mono',
            h('span', `Sent ${fmtTimeOfDay(r.sentAt)}`), h('span.m1-req__sep', '·'),
            h('span', `received ${fmtTimeOfDay(received)}`), h('span.m1-req__sep', '·'),
            h('span', `${r.delayMin} min delay `), labelTag(DELAY))));
      el.dataset.id = r.id;
      return el;
    }

    function choose(r) {
      ctx.set({ request: r });
      markChosen();
    }
    function markChosen() {
      const id = ctx.state.request && ctx.state.request.id;
      for (const [k, c] of cardEls) {
        c.classList.toggle('is-selected', k === id);
        c.classList.toggle('is-done', (ctx.state.requestsDone || []).includes(k));
        c.setAttribute('aria-pressed', String(k === id));
      }
      if (btn) btn.disabled = !id;
    }

    function selectSite(instant = false) {
      if (siteSelected) return;
      siteSelected = true;
      murrayBtn.classList.add('is-selected');
      murrayBtn.setAttribute('aria-pressed', 'true');
      el.classList.add('m1--site');
      panel.setAttribute('aria-hidden', 'false');
      if (instant) panel.classList.add('no-anim');
      requestAnimationFrame(() => panel.classList.add('is-open'));
      view.setShift(panel.offsetWidth / 2);
    }

    // --- crater view
    try {
      const [gale, credits] = await Promise.all([loadGale(), loadCredits()]);
      if (!alive) return;
      view = craterView(viewWrap, gale);
      disposers.push(() => view.dispose());
      buildMarkers(gale.meta);
      buildCredit(gale.meta);
      buildPanel(credits);
      if (ctx.state.request) selectSite(true);
    } catch (e) {
      console.error(e);
      if (!alive) return;
      credit.replaceChildren('Gale crater elevation data could not be loaded.');
    }
  },

  unmount() { if (cleanup) cleanup(); cleanup = null; },

  /** State after this step is finished, for ?step=N (dev aid): the first request. */
  async devFixture() {
    const credits = await loadCredits();
    return { request: toRequest(REQUESTS[0], credits, Date.now() - DELAY.value * 60000) };
  },
};
