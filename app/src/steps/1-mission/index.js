// Step 1 Mission. PLACEHOLDER screen from the frame builder; the step builder replaces it
// (specs/1-mission.md). Only files in this directory may change.
import './style.css';
import { h, splitLayout, headline, lede, card, pillButton, mapPanel, labelTag, fmtTimeOfDay } from '../../ui/index.js';
import { ENVIRONMENT } from '../../core/values.js';

// Placeholder request. Shape of state.request (see app/README.md); the builder supplies the real two.
const PLACEHOLDER_REQUEST = {
  id: 'placeholder-sandstone',
  from: 'Placeholder science team',
  title: 'A sample from the sandstone at the foot of a butte',
  kind: 'sample',
  why: 'Placeholder: why it matters, in one sentence.',
  photo: 'data/murray/photos/crossbedding_PIA21042.jpg',
  photoCredit: 'NASA/JPL-Caltech/MSSS',
  sentAt: null, // ms timestamp, set when the request is shown
  delayMin: ENVIRONMENT.signalDelayNowMin.value,
};

let root = null;

export default {
  n: 1, id: 'mission', title: 'Mission',
  isComplete: (state) => !!state.request,

  async mount(el, ctx) {
    root = el;
    const L = splitLayout();
    el.append(L.el);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    L.map.append(mapPanel(terrain, { steep: false }).el);
    const req = { ...PLACEHOLDER_REQUEST, sentAt: PLACEHOLDER_REQUEST.sentAt || Date.now() - ENVIRONMENT.signalDelayNowMin.value * 60000 };
    const btn = pillButton({ text: 'Plan this mission', onClick: () => ctx.next(), disabled: !ctx.state.request });
    const pick = () => {
      ctx.set({ request: req });
      reqCard.classList.add('is-selected');
      btn.disabled = false;
    };
    const reqCard = card({
      title: req.title, sub: `${req.from} · sent ${fmtTimeOfDay(req.sentAt)}, ${req.delayMin} min signal delay`,
      selected: ctx.state.request && ctx.state.request.id === req.id, onClick: pick,
    });
    L.panel.append(
      headline('Choose your mission.'),
      lede('Placeholder for step 1. Signal delay ', labelTag(ENVIRONMENT.signalDelayNowMin)),
      reqCard,
      h('div.placeholder-note', 'Frame placeholder: replace with specs/1-mission.md'),
    );
    L.action.append(btn);
  },

  unmount() { root = null; },

  /** State after this step is finished, for ?step=N (dev aid). */
  devFixture() {
    return { request: { ...PLACEHOLDER_REQUEST, sentAt: Date.now() - ENVIRONMENT.signalDelayNowMin.value * 60000 } };
  },
};
