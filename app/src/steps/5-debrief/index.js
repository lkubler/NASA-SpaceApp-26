// Step 5 Debrief. PLACEHOLDER screen from the frame builder; the step builder replaces it
// (specs/5-debrief.md). Only files in this directory may change.
import './style.css';
import { h, splitLayout, headline, lede, row, pillButton, mapPanel, legend, fmtDistance, fmtDuration } from '../../ui/index.js';
import { ROVER } from '../../core/index.js';

let root = null;

export default {
  n: 5, id: 'debrief', title: 'Debrief',
  isComplete: () => true,

  async mount(el, ctx) {
    root = el;
    const L = splitLayout();
    el.append(L.el);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    const { plan, route, walk } = ctx.state;
    const home = walk && walk.outcome !== 'not-returned';
    const map = mapPanel(terrain, { steep: true });
    L.map.append(map.el, legend([{ kind: 'foot', text: 'Planned' }, { kind: 'walked', text: 'Walked' }, { kind: 'rover', text: 'Rover' }]));
    if (route) map.path([...route.out.points, ...route.back.points], { style: 'foot' });
    if (walk && walk.track.length) map.path(walk.track, { style: 'walked' });
    map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Rover' });
    L.panel.append(
      headline(home ? 'Back home.' : 'Not returned.', { size: 'hero' }),
      lede(home ? 'Placeholder outcome sentence.' : 'The suit ran out before the rover.'),
      h('div', row('Distance', `${fmtDistance(plan.distanceM)} · ${fmtDistance(walk ? walk.distanceM : NaN)}`),
        row('Time', `${fmtDuration(plan.timeS)} · ${fmtDuration(walk ? walk.tS : NaN)}`),
        row('Reserve on return', `${fmtDuration(plan.reserveS)} · ${fmtDuration(walk ? walk.reserveAtHomeS : NaN)}`),
        row('Time in radio shadow', `${fmtDuration(plan.radioShadowS)} · ${fmtDuration(walk ? walk.radioShadowS : NaN)}`)),
      h('div.placeholder-note', 'Frame placeholder: replace with specs/5-debrief.md'),
    );
    L.action.append(pillButton({
      text: 'New mission',
      onClick: () => {
        const id = ctx.state.request && ctx.state.request.id;
        if (id && !ctx.state.requestsDone.includes(id)) ctx.set({ requestsDone: [...ctx.state.requestsDone, id] });
        ctx.newMission();
      },
    }));
  },

  unmount() { root = null; },

  devFixture() { return null; },
};
