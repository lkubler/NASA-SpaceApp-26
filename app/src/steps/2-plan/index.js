// Step 2 Plan. PLACEHOLDER screen from the frame builder; the step builder replaces it
// (specs/2-plan.md). Only files in this directory may change.
import './style.css';
import { h, splitLayout, headline, card, pillButton, mapPanel, legend, marker, fmtDuration, fmtDistance } from '../../ui/index.js';
import { planAllCandidates, ROVER, ACCESS_MARS_POINTS } from '../../core/index.js';

let root = null;

function choose(state, id) {
  const c = state.candidates.find((x) => x.candidate.id === id);
  return c ? { spotId: id, route: c.route, plan: c.plan } : {};
}

export default {
  n: 2, id: 'plan', title: 'Plan',
  isComplete: (state) => !!(state.route && state.plan),

  async mount(el, ctx) {
    root = el;
    const L = splitLayout();
    el.append(L.el);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    if (!ctx.state.candidates.length) ctx.set({ candidates: planAllCandidates(terrain) });
    const map = mapPanel(terrain, { steep: true });
    L.map.append(map.el, legend([{ kind: 'foot', text: 'On foot' }, { kind: 'rover', text: 'Rover' }, { kind: 'steep', text: 'Too steep' }, { kind: 'point', text: 'Access Mars point' }]));
    map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Rover' });
    for (const p of ACCESS_MARS_POINTS) map.addMarker(p.x, p.z, { kind: 'point', label: p.name, layer: 'areas' });
    const btn = pillButton({ text: 'Confirm route', onClick: () => ctx.next(), disabled: !ctx.state.route });
    const list = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px' } });

    const render = () => {
      map.clearLayer('routes'); map.clearLayer('markers');
      map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Rover' });
      list.replaceChildren();
      ctx.state.candidates.forEach(({ candidate: c, route, plan }, k) => {
        const sel = ctx.state.spotId === c.id;
        const g = map.addMarker(c.x, c.z, { kind: 'number', text: String(k + 1).padStart(2, '0'), selected: sel });
        g.style.cursor = 'pointer';
        g.addEventListener('click', () => { ctx.set(choose(ctx.state, c.id)); render(); });
        if (sel) map.path(route.out.points, { style: 'foot' });
        list.append(card({
          lead: marker(k + 1, { selected: sel }), title: c.name,
          sub: `${fmtDuration(plan.timeS, { approx: true })} · reserve ${fmtDuration(plan.reserveS)} (${plan.limitingName})`,
          right: fmtDistance(plan.distanceM), selected: sel,
          onClick: () => { ctx.set(choose(ctx.state, c.id)); render(); },
        }));
      });
      btn.disabled = !ctx.state.route;
    };
    render();
    L.panel.append(headline('Plan your mission.'), list, h('div.placeholder-note', 'Frame placeholder: replace with specs/2-plan.md'));
    L.action.append(btn);
  },

  unmount() { root = null; },

  /** State after this step is finished, for ?step=N. ?spot=F7 picks another candidate. */
  async devFixture(state, { getTerrain, params }) {
    const terrain = await getTerrain();
    const candidates = planAllCandidates(terrain);
    const id = params.get('spot') || 'F3';
    const c = candidates.find((x) => x.candidate.id === id) || candidates[0];
    return { candidates, spotId: c.candidate.id, route: c.route, plan: c.plan };
  },
};
