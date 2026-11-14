// Autonomy clock (Earth-Mars light time) and EVA radiation dose. Pure functions, no DOM.
// Light time: MODELLED from JPL approximate Keplerian elements (Standish, valid 1800-2050) for Earth-Moon barycentre and Mars.
// Dose: MEASURED Gale surface rate (Hassler 2014, SwRI/NASA release) 0.67 mSv/day, per Earth hour 0.0279 mSv/h.
// SPE: SIMULATED replay of the 10-12 Sept 2017 event (Zeitlin et al. 2018): dose rate x2-3 for ~12 h.
const R = Math.PI / 180, AU_KM = 149597870.7, C_KMS = 299792.458;
// [a AU, a/cy, e, e/cy, I deg, I/cy, L deg, L/cy, varpi deg, varpi/cy, node deg, node/cy]
const EL = {
  earth: [1.00000261, 0.00000562, 0.01671123, -0.00004392, -0.00001531, -0.01294668, 100.46457166, 35999.37244981, 102.93768193, 0.32327364, 0, 0],
  mars: [1.52371034, 0.00001847, 0.09339410, 0.00007882, 1.84969142, -0.00813131, -4.55343205, 19140.30268499, -23.94362959, 0.44441088, 49.55953891, -0.29257343],
};
function helio(el, T) {
  const [a0, a1, e0, e1, i0, i1, L0, L1, w0, w1, n0, n1] = el;
  const a = a0 + a1 * T, e = e0 + e1 * T, I = (i0 + i1 * T) * R, L = L0 + L1 * T, w = w0 + w1 * T, Om = (n0 + n1 * T) * R;
  let M = (((L - w) % 360) + 540) % 360 - 180; M *= R;
  let E = M + e * Math.sin(M); for (let k = 0; k < 8; k++) E -= (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E), om = w * R - Om;
  const c = Math.cos, s = Math.sin;
  return [(c(om) * c(Om) - s(om) * s(Om) * c(I)) * xp + (-s(om) * c(Om) - c(om) * s(Om) * c(I)) * yp,
    (c(om) * s(Om) + s(om) * c(Om) * c(I)) * xp + (-s(om) * s(Om) + c(om) * c(Om) * c(I)) * yp,
    s(om) * s(I) * xp + c(om) * s(I) * yp];
}
/** Earth-Mars distance in AU at a Unix time (ms). */
export function earthMarsAU(millis) {
  const T = (2440587.5 + millis / 8.64e7 - 2451545.0) / 36525;
  const e = helio(EL.earth, T), m = helio(EL.mars, T);
  return Math.hypot(e[0] - m[0], e[1] - m[1], e[2] - m[2]);
}
/** One-way light time in minutes. */
export function lightTimeMin(millis) { return earthMarsAU(millis) * AU_KM / C_KMS / 60; }
/** Autonomy numbers: oneWay and roundTrip in minutes (Earth hears you in N, answer in 2N, plus ~0 processing). */
export function autonomy(millis) { const n = lightTimeMin(millis); return { oneWayMin: n, roundTripMin: 2 * n, au: earthMarsAU(millis) }; }

export const GCR_MSV_PER_DAY = 0.67;
export const GCR_MSV_PER_H = GCR_MSV_PER_DAY / 24;
export const SPE = { multiplier: 2.5, multRange: [2, 3], durationH: 12 };

/** Cumulative dose in mSv after elapsedS seconds of EVA. With spe=true the SPE multiplier applies for the first
 *  SPE.durationH hours of the EVA (replay: EVA starts at event onset), GCR rate afterwards. */
export function evaDose(elapsedS, { spe = false, mult = SPE.multiplier } = {}) {
  const h = Math.max(0, elapsedS) / 3600;
  if (!spe) return h * GCR_MSV_PER_H;
  const hi = Math.min(h, SPE.durationH);
  return (hi * mult + (h - hi)) * GCR_MSV_PER_H;
}
/** Current dose rate in mSv/h. */
export function doseRate(elapsedS, { spe = false, mult = SPE.multiplier } = {}) {
  return spe && elapsedS / 3600 < SPE.durationH ? GCR_MSV_PER_H * mult : GCR_MSV_PER_H;
}

/** Total EVA seconds of a planned route (last point elapsed_s incl. station dwell; falls back to time_s). 0 if none. */
export function routeTotalS(route) {
  const P = route && route.points; if (!P || !P.length) return 0;
  const l = P[P.length - 1]; return l.elapsed_s ?? l.time_s ?? 0;
}
/** EVA elapsed seconds at the route point nearest to scene position (x, z); null without a usable route. */
export function routeElapsedAt(route, x, z) {
  const P = route && route.points; if (!P || !P.length || typeof route.toScene !== "function") return null;
  let best = Infinity, e = null;
  for (const p of P) { const s = route.toScene(p.x, p.y), d = (s.x - x) ** 2 + (s.z - z) ** 2; if (d < best) { best = d; e = p.elapsed_s ?? p.time_s ?? null; } }
  return e;
}
