// Return-reserve model for the EVA route planner (task 004).
//
// What it does: walks a list of route points {dist_m, elev_m, terrain?} and
// returns, per point, the metabolic rate, cumulative energy and O2 used, what
// is left of the consumables, the cost of walking back to the start along the
// same path, and the turn-back index: the first point where
//   remaining - returnCost < buffer * capacity.
//
// Provenance labels: [measured] = published measurement or NASA figure,
// [modelled] = published equation or our own extension/assumption,
// [simulated] = simulation output. Nothing here is [measured] for Mars itself.
// All outputs are model estimates and must be shown as such.
//
// Model: Pandolf load-carriage equation with Santee et al. 2001 downhill
// correction (NASA JSC uses it for traverse workload, Kim et al., IEEE EMBC 2024,
// https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf).
//   P = 1.5 W + gs * [ 2 (W+L)(L/W)^2 + eta (W+L)(1.5 V^2 + 0.35 V G) ]
//   (G < 0: minus Santee CF = eta [ G (W+L) V / 3.5 - (W+L)(G+6)^2 / W + 25 - V^2 ])
//   W body mass kg, L carried load kg, V m/s, G grade %, eta terrain factor,
//   gs = g / 9.80665 (our extension, see below). The suit offset is added to P.
// Sources and sanity numbers: research/sources-validity.md section 2.
// Return path = same points reversed, so uphill and downhill swap.
// Module is ESM with no dependencies (works in Vite and `node --test`).

export const G_EARTH = 9.80665; // m/s^2 [measured, standard gravity]

// Defaults. Each: value, source, label.
export const DEFAULTS = Object.freeze({
  bodyMassKg: 80, // assumption, average crew member [modelled]
  suitMassKg: 0, // used only if suitMassCounts (see below)
  loadKg: 23, // 50 lbm tool/sample mass, NASA Mars sizing, Ogilvie et al. ICES-2026-127 [measured, NASA planning value]
  gravity: 3.71, // m/s^2, Mars surface [measured]
  speedMs: 3.5 / 3.6, // 2.2 mph planning walkback speed, ICES-2026-127 slide 9 [measured, Apollo-derived]
  // Consumable capacity as energy: 8 h x 1200 BTU/hr planetary EVA sizing
  // average (ICES-2026-127) x 1.05506 kJ/BTU = ~10.1 MJ [modelled from NASA sizing figure].
  capacityKJ: 8 * 1200 * 1.05506,
  bufferFrac: 0.2, // 20 % emergency walkback pad, Apollo (ALSJ 19790073512) [measured, Apollo practice]
  // Suit restriction adds ~14 ml/kg/min VO2 over unsuited walking (Mark III 10 km
  // walkback study, Vos et al. SAE 2007-01-3133; via ICES-2026-127 slides 5-9). [measured, Earth gravity, Mark III]
  suitVo2OffsetMlKgMin: 14,
  // Suit mass 63-308 kg did not change metabolic rate below 4 km/h (Gernhardt
  // et al. SAE 2008-01-1951) [measured, level ground only], so by default suit
  // mass is NOT added to the Pandolf load. Set true for a conservative bound.
  suitMassCounts: false,
  defaultTerrain: 'regolith',
  maxGradePct: 40, // clamp to keep the polynomial in a sane range [modelled]
  speedFloorMs: 0.2, // avoid divide-by-zero [modelled]
});

// Terrain factor eta. Pandolf values: 1.0 blacktop, 1.1 dirt road, 1.2 light
// brush, 1.5 heavy brush (Pandolf et al. 1977; secondary: Wikipedia "Pandolf
// equation"). Mapping to Mars terrain is OUR ASSUMPTION [modelled].
export const TERRAIN_ETA = Object.freeze({
  hardpan: 1.1, // bedrock, pavement-like, ~dirt road
  regolith: 1.2, // default loose regolith, ~light brush
  rubble: 1.4, // blocky ground
  sand: 1.5, // loose sand/dune, ~heavy brush; real sand cost likely higher (unverified)
});

// W per (ml O2/min) = (0.961 + 0.275 RER) BTU/hr per ml/min, the NASA
// conversion in ICES-2026-127; RER 0.85 assumed [modelled]. ~0.350 W per ml/min.
const RER = 0.85;
export const W_PER_ML_MIN = ((0.961 + 0.275 * RER) * 1055.06) / 3600;

// Gravity scaling [modelled, NOT directly sourced]: Pandolf was fitted at 1 g.
// We scale the weight-bearing terms (static load and the whole eta walking/grade
// term) by g/g_earth and leave basal 1.5 W unscaled. First-order assumption;
// Ludlow & Weyand 2017 (J Appl Physiol 123:1288) show economy depends on
// gravitational load but was not fitted at 0.38 g, and suit/joint costs do not
// scale with g (covered by the unscaled suit offset). Present with an uncertainty band.

export function resolveParams(p = {}) {
  const o = { ...DEFAULTS, ...p };
  o.gravityScale = o.gravity / G_EARTH;
  return o;
}

// Metabolic rate in W for walking on a segment of grade gradePct (%).
export function metabolicRateW(gradePct, terrain, params) {
  const o = params && params.gravityScale ? params : resolveParams(params);
  const W = o.bodyMassKg;
  const L = o.loadKg + (o.suitMassCounts ? o.suitMassKg : 0);
  const V = Math.max(o.speedMs, o.speedFloorMs);
  const G = Math.max(-o.maxGradePct, Math.min(o.maxGradePct, gradePct));
  const eta = TERRAIN_ETA[terrain] ?? TERRAIN_ETA[o.defaultTerrain];
  const WL = W + L;
  const stat = 2 * WL * (L / W) ** 2;
  let loaded = stat + eta * WL * (1.5 * V * V + 0.35 * V * G);
  if (G < 0) {
    // Santee et al. 2001 downhill correction, subtracted [modelled]
    loaded -= eta * ((G * WL * V) / 3.5 - (WL * (G + 6) ** 2) / W + (25 - V * V));
  }
  loaded = Math.max(loaded, stat); // downhill never cheaper than static load alone
  const suitW = o.suitVo2OffsetMlKgMin * W * W_PER_ML_MIN;
  return 1.5 * W + o.gravityScale * loaded + suitW;
}

// kJ of energy -> litres of O2 (via W_PER_ML_MIN).
export const o2LitresFromKJ = (kJ) => (kJ * 1000) / W_PER_ML_MIN / 60 / 1000;

// Cost of walking from a to b (b.terrain used); dx horizontal metres.
function segment(dx, dz, terrain, o) {
  if (!(dx > 0)) return { kJ: 0, P: metabolicRateW(0, terrain, o) };
  const P = metabolicRateW((dz / dx) * 100, terrain, o);
  const s = Math.hypot(dx, dz) / Math.max(o.speedMs, o.speedFloorMs);
  return { kJ: (P * s) / 1000, P };
}

/**
 * @param {{dist_m:number, elev_m:number, terrain?:string}[]} points ordered, dist_m increasing
 * @param {object} params overrides of DEFAULTS
 * @returns {{points:object[], turnBackIndex:number, bufferKJ:number, capacityKJ:number, params:object}}
 *  per point: {dist_m, metabolicW, usedKJ, usedO2L, remainingKJ, remainingO2L,
 *              returnCostKJ, marginKJ (= remaining - returnCost - buffer), mustTurnBack}
 *  turnBackIndex: first index where margin < 0, or -1 if never.
 */
export function computeReserve(points, params = {}) {
  const o = resolveParams(params);
  const n = points.length;
  const used = new Array(n).fill(0);
  const back = new Array(n).fill(0);
  const rate = new Array(n).fill(0);
  if (n) rate[0] = metabolicRateW(0, points[0].terrain, o);
  for (let i = 1; i < n; i++) {
    const a = points[i - 1], b = points[i];
    const dx = b.dist_m - a.dist_m, dz = b.elev_m - a.elev_m;
    const fwd = segment(dx, dz, b.terrain, o);
    used[i] = used[i - 1] + fwd.kJ;
    rate[i] = fwd.P;
    back[i] = back[i - 1] + segment(dx, -dz, b.terrain, o).kJ; // reversed direction
  }
  const bufferKJ = o.bufferFrac * o.capacityKJ;
  let turnBackIndex = -1;
  const out = points.map((p, i) => {
    const remainingKJ = o.capacityKJ - used[i];
    const marginKJ = remainingKJ - back[i] - bufferKJ;
    const mustTurnBack = marginKJ < 0;
    if (mustTurnBack && turnBackIndex < 0) turnBackIndex = i;
    return {
      dist_m: p.dist_m,
      metabolicW: rate[i],
      usedKJ: used[i],
      usedO2L: o2LitresFromKJ(used[i]),
      remainingKJ,
      remainingO2L: o2LitresFromKJ(remainingKJ),
      returnCostKJ: back[i],
      marginKJ,
      mustTurnBack,
    };
  });
  return { points: out, turnBackIndex, bufferKJ, capacityKJ: o.capacityKJ, params: o };
}
