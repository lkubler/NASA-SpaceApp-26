// Shared app state: route (view), site, settings. Tiny pub/sub store, no framework.
const SITES = [{ id: 'murray', name: 'Murray Buttes', walk: true }];
let s = {
  view: 'briefing', // 'briefing' | 'map' | 'walk' | 'sources'
  site: SITES[0].id,
  settings: { units: 'metric', walkbackKm: 2.5, reserve: 0.2 },
  walkReady: false,
  // Planner results (set by the Map view; Walk reads them). Coordinates: DTM local metres (terrain/dtm.js).
  // route = {points:[{x,y,elev_m,dist_m,time_s,slope_deg}], legs, total, waypoints:[{x,y}], reserve,
  //          turnBackIndex, shadows:[{start,end,duration_s,exceedsLimit}], toScene(x,y)->{x,z}} | null
  route: null,
  rover: null, // {x,y} lander/rover in DTM local metres
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
export function viewFromHash() { const v = location.hash.replace('#/', ''); return ['map', 'walk', 'sources', 'briefing'].includes(v) ? v : 'briefing'; }
