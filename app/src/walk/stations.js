// Station cards in the Walk (task 023): real Curiosity photo card when the player is near a named station.
// Station positions come from the Curiosity track (DTM crop pixels) and the measured walk-to-DTM registration in murray.json.
// All named stations lie outside the 128 m walk square (research: Marimba ~500 m N, Quela ~156 m W), so the card also appears
// at the square's edge when a station is within EDGE_RANGE_M, labelled with the distance beyond the edge.
import { loadScience, SCIENCE_BASE } from '../map/science.js';
import { createStationCard } from '../ui/stationCard.js';

export const NEAR_M = 8, EDGE_M = 8, EDGE_RANGE_M = 120, HALF = 64;

/** DTM crop pixel -> walk scene metres (inverse of murray.json transform_walk_to_dtm). */
export function dtmToScene(col, row, t) {
  const th = (t.theta_deg * Math.PI) / 180, e = (col - t.origin_in_dtm_crop_px.col) * t.cell_m, n = (t.origin_in_dtm_crop_px.row - row) * t.cell_m;
  return { x: Math.cos(th) * e - Math.sin(th) * n, z: Math.sin(th) * e + Math.cos(th) * n };
}
/** Station to show for a player at (x, z), or null. Returns {station, dist, inside, beyond}. */
export function pickStation(list, x, z) {
  let best = null;
  const nearEdge = Math.max(Math.abs(x), Math.abs(z)) >= HALF - EDGE_M;
  for (const s of list) {
    const d = Math.hypot(s.x - x, s.z - z), inside = Math.max(Math.abs(s.x), Math.abs(s.z)) <= HALF;
    const ok = inside ? d <= NEAR_M : nearEdge && d <= EDGE_RANGE_M;
    if (ok && (!best || d < best.dist)) best = { station: s, dist: d, inside, beyond: inside ? 0 : Math.max(0, Math.max(Math.abs(s.x), Math.abs(s.z)) - HALF) };
  }
  return best;
}

export function mountStations({ container, state }) {
  const card = createStationCard(container); card.el.classList.add('walk-station');
  let list = [], shown = null, pinned = null, dismissed = new Set(), tick = 0;
  card.el.querySelector('.poi-x').addEventListener('click', () => { if (shown) dismissed.add(shown); shown = null; pinned = null; });
  Promise.all([loadScience(), fetch(SCIENCE_BASE + 'murray.json').then((r) => r.json())]).then(([sci, m]) => {
    const t = { ...m.transform_walk_to_dtm, cell_m: m.dtm.cell_m };
    list = sci.stations.map((s) => ({ ...s, ...dtmToScene(s.col, s.row, t) }));
  }).catch((e) => console.warn('walk stations unavailable', e));
  return {
    update() {
      if (!list.length || pinned || (tick++ % 10)) return;
      const hit = pickStation(list, state.pos.x, state.pos.z);
      const id = hit && hit.station.id;
      if (hit && !dismissed.has(id)) {
        if (shown !== id) { shown = id; card.show({ ...hit.station, note: hit.inside ? hit.station.note : `${hit.station.note}. About ${Math.round(hit.dist)} m from here, beyond the walk area.` }); }
      } else if (!hit) { dismissed.clear(); if (shown) { shown = null; card.hide(); } }
      else if (shown && id !== shown) { shown = null; card.hide(); }
    },
    /** Open the card of the nearest named station from wherever the player is (demo path: no 120 m walk needed). */
    showNearest() {
      if (!list.length) return null;
      let best = null;
      for (const s of list) { const d = Math.hypot(s.x - state.pos.x, s.z - state.pos.z); if (!best || d < best.d) best = { s, d }; }
      const dir = (Math.abs(best.s.z - state.pos.z) > Math.abs(best.s.x - state.pos.x) ? (best.s.z > state.pos.z ? 'north' : 'south') : (best.s.x > state.pos.x ? 'east' : 'west'));
      pinned = shown = best.s.id; dismissed.delete(best.s.id);
      card.show({ ...best.s, note: `${best.s.note}. About ${Math.round(best.d)} m ${dir} of here, outside the 128 m walk area.` });
      return best.s.id;
    },
    hide() { shown = null; pinned = null; card.hide(); },
    get list() { return list; },
  };
}
