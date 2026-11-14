// Sensitivity of the end-of-loop reserve to the model's main assumptions (task 029).
// Re-runs computeReserve on the SAME planned route with one input changed at a time. Nothing is hard-coded:
// every number comes from the model for the route on screen. Pure module (no DOM).
import { computeReserve, DEFAULTS, G_EARTH } from './reserve.js';

/** Reserve fraction (0..1) at the last point of the route for the given parameter overrides. */
export function endReserve(points, params = {}) {
  const r = computeReserve(points, params);
  return r.points.length ? r.points[r.points.length - 1].remainingFraction : NaN;
}

/**
 * @param {object[]} points route points as given to computeReserve (dist_m, elev_m, stationS, time_s, returnKJ...)
 * @param {object} base params already used for the plan (e.g. {capacityKJ})
 * @returns {{base:number, rows:{key:string,label:string,frac:number,delta:number,kind:string}[], spread:{lo:number,hi:number}}}
 *   delta in percentage points against the base. kind: 'assumption' (what we are unsure of) or 'sanity'.
 */
export function reserveSensitivity(points, base = {}) {
  const b = endReserve(points, base);
  const flat = points.map((p) => ({ ...p, elev_m: points[0].elev_m }));
  const off = DEFAULTS.suitVo2OffsetMlKgMin;
  const defs = [
    { key: 'load0', label: 'No carried load (0 kg)', frac: endReserve(points, { ...base, loadKg: 0 }), kind: 'assumption' },
    { key: 'load23', label: `Planning load (${DEFAULTS.loadKg} kg, model default)`, frac: endReserve(points, { ...base, loadKg: DEFAULTS.loadKg }), kind: 'assumption' },
    { key: 'load40', label: 'Heavy load (40 kg)', frac: endReserve(points, { ...base, loadKg: 40 }), kind: 'assumption' },
    { key: 'flat', label: 'Flat terrain (same path, no climbs)', frac: endReserve(flat, base), kind: 'assumption' },
    { key: 'suit-', label: `Suit offset -50 % (${off / 2} ml/kg/min)`, frac: endReserve(points, { ...base, suitVo2OffsetMlKgMin: off * 0.5 }), kind: 'assumption' },
    { key: 'suit+', label: `Suit offset +50 % (${off * 1.5} ml/kg/min)`, frac: endReserve(points, { ...base, suitVo2OffsetMlKgMin: off * 1.5 }), kind: 'assumption' },
    { key: 'earth', label: 'Earth gravity (sanity check, not Mars)', frac: endReserve(points, { ...base, gravity: G_EARTH }), kind: 'sanity' },
  ].map((r) => ({ ...r, delta: (r.frac - b) * 100 }));
  const a = defs.filter((r) => r.kind === 'assumption').map((r) => r.frac);
  return { base: b, rows: defs, spread: { lo: Math.min(...a, b), hi: Math.max(...a, b) } };
}
