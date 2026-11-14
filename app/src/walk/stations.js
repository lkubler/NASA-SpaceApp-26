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
  let list = [], shown = null, dismissed = new Set(), tick = 0;
  card.el.querySelector('.poi-x').addEventListener('click', () => { if (shown) dismissed.add(shown); shown = null; });
  Promise.all([loadScience(), fetch(SCIENCE_BASE + 'murray.json').then((r) => r.json())]).then(([sci, m]) => {
    const t = { ...m.transform_walk_to_dtm, cell_m: m.dtm.cell_m };
    list = sci.stations.map((s) => ({ ...s, ...dtmToScene(s.col, s.row, t) }));
  }).catch((e) => console.warn('walk stations unavailable', e));
  return {
    update() {
      if (!list.length || (tick++ % 10)) return;
      const hit = pickStation(list, state.pos.x, state.pos.z);
      const id = hit && hit.station.id;
      if (hit && !dismissed.has(id)) {
        if (shown !== id) { shown = id; card.show({ ...hit.station, note: hit.inside ? hit.station.note : `${hit.station.note}. About ${Math.round(hit.dist)} m from here, beyond the walk area.` }); }
      } else if (!hit) { dismissed.clear(); if (shown) { shown = null; card.hide(); } }
      else if (shown && id !== shown) { shown = null; card.hide(); }
    },
    hide() { shown = null; card.hide(); },
    get list() { return list; },
  };
}
