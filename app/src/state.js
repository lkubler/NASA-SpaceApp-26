// Shared app state: route (view), site, settings. Tiny pub/sub store, no framework.
const SITES = [{ id: 'murray', name: 'Murray Buttes', walk: true }];
let s = {
  view: 'map', // 'map' | 'walk'
  site: SITES[0].id,
  settings: { units: 'metric', walkbackKm: 2.5, reserve: 0.2 },
  walkReady: false,
};
const subs = new Set();
export const app = {
  SITES,
  get: () => s,
  set(patch) {
    const prev = s;
    s = { ...s, ...patch, settings: { ...s.settings, ...(patch.settings || {}) } };
    subs.forEach((f) => f(s, prev));
  },
  on(f) { subs.add(f); return () => subs.delete(f); },
};
export function viewFromHash() { return location.hash === '#/walk' ? 'walk' : 'map'; }
