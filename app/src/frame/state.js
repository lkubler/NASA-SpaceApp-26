// The shared state: ONE object. Every step reads and writes only this (specs/0-frame.md).
//
// Shape (documented again in app/README.md):
// {
//   step: 1..5,                    // current step (owned by the frame)
//   request: null | Request,       // chosen request from Earth (step 1). Self-contained, see README
//   requestsDone: string[],        // ids of finished requests (step 5 adds one)
//   candidates: CandidatePlan[],   // [{ candidate, route, plan }] from core planAllCandidates (step 2)
//   stops: string[],               // chosen stops in visiting order, 0 to 3 ids, e.g. ['F3', 'F7'] (step 2)
//   spotId: null | string,         // the FIRST stop, e.g. 'F3' (step 2); = stops[0]
//   route: null | Route,           // the round over all stops, core planRound (step 2); see README
//   plan: null | PlanNumbers,      // core planNumbers(route) (step 2; read by 3 and 5)
//   walk: null | WalkLog,          // core newWalkLog(), filled by step 4, read by step 5
// }

const listeners = new Set();

export function initialState() {
  return { step: 1, request: null, requestsDone: [], candidates: [], stops: [], spotId: null, route: null, plan: null, walk: null };
}

export const state = initialState();

/** Merge a patch into the shared state and notify listeners. */
export function setState(patch) {
  Object.assign(state, patch);
  for (const fn of listeners) fn(state);
}

/** Listen to every change. Returns an unsubscribe function. */
export function subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); }

/** New mission: clear everything except the finished requests. */
export function resetMission() {
  const done = state.requestsDone;
  for (const k of Object.keys(state)) delete state[k];
  Object.assign(state, initialState(), { requestsDone: done });
  for (const fn of listeners) fn(state);
}

if (typeof window !== 'undefined') window.__state = state; // dev and test inspection
