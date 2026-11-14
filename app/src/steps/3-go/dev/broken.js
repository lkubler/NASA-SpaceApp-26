// TEST FIXTURE ONLY (not part of the product): a state whose route breaks the slope rule, to try the
// broken-rule path of step 3 (and of steps 4 and 5 via ?step=4&broken=1).
// The target is a test point up the east butte wall, enclosed by ground steeper than the slope rule,
// so the core planner has no rule-keeping route and returns its best route with keepsRules: false.
// It is not a sample candidate and is never shown in the normal journey.
import { planRoute, planNumbers } from '../../../core/index.js';

export const BROKEN_TEST_TARGET = { id: 'TEST-BROKEN', name: 'Test point up the east butte wall', x: 18, z: 4 };

/** State patch as step 2 would write it, but for the test target. */
export function brokenFixture(terrain) {
  const route = planRoute(terrain, BROKEN_TEST_TARGET);
  const plan = planNumbers(terrain, route);
  return { stops: [BROKEN_TEST_TARGET.id], spotId: BROKEN_TEST_TARGET.id, route, plan };
}
