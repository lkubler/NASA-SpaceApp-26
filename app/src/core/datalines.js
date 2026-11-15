// Two more Go / no-go lines (specs/x-datalines.md). Pure functions, no UI.
//  - hiriseSlopeOnRoute: metres of the planned route steeper than the slope rule in the HiRISE elevation model
//  - timeToShelter: the longest time back to the rover from any point of the route
// Rule values come from values.js; the transform and grid format from murray.json (dtm, transform_walk_to_dtm).

import { RULES } from './values.js';

const SAMPLE_M = 0.5; // route sampling step along the path (the walk grid's cell size)

/** Load the HiRISE slope grid next to the walk grids. Resolves { meta, slope } or null if it cannot be read. */
export async function loadHirise(meta, baseUrl) {
  try {
    const base = baseUrl ?? (() => { try { return import.meta.env.BASE_URL || './'; } catch { return './'; } })();
    const r = await fetch(base + 'data/murray/' + meta.dtm.slope_file);
    if (!r.ok) return null;
    return { meta, slope: new Uint8Array(await r.arrayBuffer()) };
  } catch { return null; }
}

/** Walk scene metres (x east, z north) -> position in the HiRISE crop (continuous pixels). */
export function walkToDtm(meta, x, z) {
  const T = meta.transform_walk_to_dtm, cell = meta.dtm.cell_m;
  const t = (T.theta_deg * Math.PI) / 180;
  const east = Math.cos(t) * x + Math.sin(t) * z;
  const north = -Math.sin(t) * x + Math.cos(t) * z;
  return { col: T.origin_in_dtm_crop_px.col + east / cell, row: T.origin_in_dtm_crop_px.row - north / cell };
}

/**
 * The route against the HiRISE slope grid.
 * @param {{ sM:number, x:number, z:number }[]} profile  plan.profile
 * @returns {{ steepM: number, noDataM: number, checkedM: number, steepestDeg: number, at: {sM,x,z}|null, firstSteep: {sM,x,z}|null }}
 *   steepM: metres of the route over the slope rule; noDataM: metres with no HiRISE data (not counted in either);
 *   checkedM: metres that were checked (steepM is part of it; checked + no-data = route length); steepestDeg: steepest HiRISE slope on the checked part
 */
export function hiriseSlopeOnRoute(profile, hirise) {
  const { meta, slope } = hirise;
  const W = meta.dtm.width, Hh = meta.dtm.height, nodata = meta.dtm.slope_nodata, scale = meta.dtm.slope_scale;
  const limit = RULES.slopeMaxDeg.value;
  let steepM = 0, noDataM = 0, checkedM = 0, steepestDeg = 0, at = null, firstSteep = null;
  for (let k = 1; k < profile.length; k++) {
    const a = profile[k - 1], b = profile[k];
    const len = b.sM - a.sM;
    if (!(len > 0)) continue; // work at a stop: same place, no distance
    const n = Math.max(1, Math.round(len / SAMPLE_M)), piece = len / n;
    for (let i = 0; i < n; i++) {
      const f = (i + 0.5) / n;
      const x = a.x + (b.x - a.x) * f, z = a.z + (b.z - a.z) * f;
      const sM = a.sM + len * f;
      const p = walkToDtm(meta, x, z);
      const c = Math.floor(p.col), r = Math.floor(p.row);
      const v = c < 0 || r < 0 || c >= W || r >= Hh ? nodata : slope[r * W + c];
      if (v === nodata) { noDataM += piece; continue; }
      const deg = v * scale;
      checkedM += piece;
      if (deg > steepestDeg) { steepestDeg = deg; at = { sM, x, z }; }
      if (deg > limit) { steepM += piece; if (!firstSteep) firstSteep = { sM, x, z }; }
    }
  }
  return { steepM, noDataM, checkedM, steepestDeg, at, firstSteep };
}

/**
 * Longest time back to the rover from any point of the route, by the fastest way home (the planner's cost
 * field to the rover, passed in as `field`). Same seconds as every other time in the plan (demo time).
 * @returns {{ seconds: number, limitS: number, at: {sM,x,z} }}
 */
export function timeToShelter(terrain, profile, field) {
  let best = { seconds: 0, sM: 0, x: 0, z: 0 };
  for (const p of profile) {
    const s = field.seconds[terrain.indexOf(p.x, p.z)];
    if (s > best.seconds) best = { seconds: s, sM: p.sM, x: p.x, z: p.z };
  }
  return { seconds: best.seconds, limitS: RULES.shelterReturnH.value * 3600, at: { sM: best.sM, x: best.x, z: best.z } };
}
