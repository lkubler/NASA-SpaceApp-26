// Dev aid: open any step directly with a sensible prefilled state.
//   ?step=3            -> steps 1 and 2 run their devFixture(), then step 3 opens
//   ?step=3&spot=F7    -> fixtures may read extra parameters (here: the spot step 2 picks)
// Each step owns its fixture (steps/<n>-<name>/index.js devFixture), so builders can refine it
// inside their own directory.

import { STEPS } from '../steps/index.js';
import { state, setState } from './state.js';
import { getTerrain } from '../core/terrain.js';

export async function devPrefill(params) {
  const n = Math.max(1, Math.min(STEPS.length, parseInt(params.get('step') || '1', 10) || 1));
  const fx = { params, getTerrain };
  for (let k = 0; k < n - 1; k++) {
    const m = STEPS[k];
    if (!m.devFixture) continue;
    const patch = await m.devFixture(state, fx);
    if (patch) setState(patch);
  }
  return n;
}
