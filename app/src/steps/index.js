// Step registry. Shared file: step builders do not edit it; each step lives in its own directory
// and exports the step interface from its index.js (see app/README.md "How a step registers").
import mission from './1-mission/index.js';
import plan from './2-plan/index.js';
import go from './3-go/index.js';
import walk from './4-walk/index.js';
import debrief from './5-debrief/index.js';

export const STEPS = [mission, plan, go, walk, debrief];
