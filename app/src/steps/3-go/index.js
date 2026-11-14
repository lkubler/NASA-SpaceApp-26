// Step 3 Go / no-go. PLACEHOLDER screen from the frame builder; the step builder replaces it
// (specs/3-go.md). Only files in this directory may change.
import './style.css';
import { h, splitLayout, headline, bigNumber, checkItem, pillButton, textLink, mapPanel, fmtDistance, fmtDuration, fmtDeg, fmtMSv } from '../../ui/index.js';
import { ROVER, DEMO } from '../../core/index.js';

let root = null;

export default {
  n: 3, id: 'go', title: 'Go / no-go',
  isComplete: (state) => !!state.plan,

  async mount(el, ctx) {
    root = el;
    const L = splitLayout();
    el.append(L.el);
    const terrain = await ctx.getTerrain();
    if (root !== el) return;
    const { plan, route } = ctx.state;
    const map = mapPanel(terrain, { steep: true });
    L.map.append(map.el);
    map.path(route.out.points, { style: plan.keepsRules ? 'foot' : 'broken' });
    map.addMarker(ROVER.x, ROVER.z, { kind: 'rover', label: 'Rover' });
    map.addMarker(route.spot.x, route.spot.z, { kind: 'spot' });
    const nums = h('div', { style: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' } },
      bigNumber({ label: 'Distance', value: fmtDistance(plan.distanceM) }),
      bigNumber({ label: 'Duration', value: fmtDuration(plan.timeS, { approx: true }), tag: DEMO.timeFactor }),
      bigNumber({ label: 'Steepest slope', value: fmtDeg(plan.steepestDeg) }),
      bigNumber({ label: 'Reserve on return', value: fmtDuration(plan.reserveS) }),
      bigNumber({ label: 'Radiation', value: fmtMSv(plan.radiationMSv) }),
    );
    const checks = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '6px' } },
      plan.checks.map((c) => checkItem({ text: c.name, status: c.status })));
    const broken = plan.brokenRules.length;
    L.panel.append(headline(broken ? 'Route breaks a rule.' : 'Route ready.', { size: 'hero' }), nums, checks,
      h('div.placeholder-note', 'Frame placeholder: replace with specs/3-go.md'));
    L.action.append(
      textLink('Edit route', () => ctx.back()),
      pillButton({ text: broken ? `Start with ${broken} broken rule${broken > 1 ? 's' : ''}` : 'Start excursion', variant: broken ? 'warn' : 'go', arrow: true, onClick: () => ctx.next() }),
    );
  },

  unmount() { root = null; },

  devFixture() { return null; },
};
