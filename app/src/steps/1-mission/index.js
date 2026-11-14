// Step 1 Mission (specs/1-mission.md): opening, Gale crater in 3D, the three sites, the two requests
// from Earth, choosing one. Writes state.request (app/README.md).
import './style.css';
import { h, headline, lede, pillButton, labelTag, fmtTimeOfDay, LOCK_SVG } from '../../ui/index.js';
import { ENVIRONMENT } from '../../core/values.js';
import { REQUESTS } from './requests.js';
import { loadGale, craterView, VERTICAL_EXAGGERATION } from './crater.js';

const PHOTO_BASE = 'data/murray/photos/';
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
      el.append(intro);
      el.classList.add('m1--intro');
      const closeOpening = () => {
        openingSeen = true;
        intro.classList.add('is-leaving');
        el.classList.remove('m1--intro');
        setTimeout(() => intro.remove(), 260);
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
        h('span', 'Gale crater · MOLA elevation, ', `${Math.round(meta.km_per_pixel * 1000)} m per pixel `),
        labelTag({ label: 'real', text: `Elevation of Gale crater from the Mars Orbiter Laser Altimeter on Mars Global Surveyor (MOLA MEGDR, 128 pixels per degree), a ${Math.round(meta.width_km)} km square. Site positions from Curiosity's drive path; Mount Sharp is the highest point of the central mound in this grid.`, source: { title: meta.source.title + ' — ' + meta.source.credit, url: meta.source.url } }),
        h('span', ` · height ×${VERTICAL_EXAGGERATION} `),
        labelTag({ label: 'assumption', text: 'Heights are drawn this many times taller than they are, so the crater rim and Mount Sharp are easy to see. Distances across the ground are true to scale.', source: { title: 'Display choice of the team', url: '' } }),
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
      for (const s of meta.sites) {
        const p = view.pointOf(s, 0.05);
        if (s.id === 'murray') {
          murrayBtn = h('button.m1-pin.m1-pin--site.m1-pin--murray', { type: 'button', 'aria-label': 'Select Murray Buttes', onclick: () => selectSite() },
            h('span.m1-pin__dot'), h('span.m1-pin__name', h('span.m1-pin__arrow', '← '), s.name));
          pin(p, murrayBtn);
        } else {
          pin(p, h(`div.m1-pin.m1-pin--site.m1-pin--locked.m1-pin--${s.id}`, { title: `${s.name}: not in this demo` },
            h('span.m1-pin__dot'),
            h('span.m1-pin__name', h('span.m1-pin__lock', { html: LOCK_SVG }), s.name, h('span.m1-pin__note', 'not in this demo'))));
        }
      }
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
          h('div.m1-req__kind.mono', r.kind === 'sample' ? 'One sample' : 'One measurement'),
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
