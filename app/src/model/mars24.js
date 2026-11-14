// Mars24 sun position (Allison & McEwen 2000, 2015 update; NASA GISS Mars24 algorithm page).
// Steps A-2..D-6 as listed in research/data-science.md section 3. Pure functions, no DOM.
// Angles in degrees; longitude is planetographic degrees WEST (east longitude E -> 360 - E).
const R = Math.PI / 180, D = 180 / Math.PI;
const mod = (a, n) => ((a % n) + n) % n;
const PBS = [[0.0071, 2.2353, 49.409], [0.0057, 2.7543, 168.173], [0.0039, 1.1177, 191.837], [0.0037, 15.7866, 21.736], [0.0021, 2.1354, 15.704], [0.0020, 2.4694, 95.528], [0.0018, 32.8493, 49.095]];
export const SOL_MS = 1.0274912517 * 86400000;
export const MURRAY = { latDeg: -4.6957, lonE: 137.3556 }; // Murray Buttes, Gale crater

/** Sun state at a Unix time (ms). ttMinusUtc seconds (64.184 after 2017). */
export function sunAt(millis, latDeg, lonW, ttMinusUtc = 64.184) {
  const jdUt = 2440587.5 + millis / 8.64e7;
  const jdTt = jdUt + ttMinusUtc / 86400;
  const dt = jdTt - 2451545.0;
  const M = 19.3871 + 0.52402073 * dt;
  const aFms = 270.3871 + 0.524038496 * dt;
  let pbs = 0; for (const [A, t, p] of PBS) pbs += A * Math.cos((0.985626 * dt / t + p) * R);
  const nuM = (10.691 + 3.0e-7 * dt) * Math.sin(M * R) + 0.623 * Math.sin(2 * M * R) + 0.050 * Math.sin(3 * M * R) + 0.005 * Math.sin(4 * M * R) + 0.0005 * Math.sin(5 * M * R) + pbs;
  const Ls = mod(aFms + nuM, 360);
  const eotDeg = 2.861 * Math.sin(2 * Ls * R) - 0.071 * Math.sin(4 * Ls * R) + 0.002 * Math.sin(6 * Ls * R) - nuM;
  const mst = mod(24 * ((jdTt - 2451549.5) / 1.0274912517 + 44796.0 - 0.0009626), 24);
  const lmst = mod(mst - lonW / 15, 24);
  const ltst = mod(lmst + eotDeg / 15, 24);
  const lamS = mst * 15 + eotDeg + 180;
  const dec = Math.asin(0.42565 * Math.sin(Ls * R)) * D + 0.25 * Math.sin(Ls * R);
  const H = (lonW - lamS) * R, ph = latDeg * R, de = dec * R;
  const Z = Math.acos(Math.sin(de) * Math.sin(ph) + Math.cos(de) * Math.cos(ph) * Math.cos(H));
  const az = mod(Math.atan2(Math.sin(H), Math.cos(ph) * Math.tan(de) - Math.sin(ph) * Math.cos(H)) * D, 360);
  return { Ls, eotHours: eotDeg / 15, mst, lmst, ltst, declination: dec, elevation: 90 - Z * D, azimuth: az };
}

/** Start of REMS sol 1440 (LMST ~0 at Murray Buttes), the demo sol. Ls ~210. */
export const SOL1440_START = Date.UTC(2016, 7, 24, 3, 55, 50);

/** Sun at a local TRUE solar time (hours 0..24) on the demo sol. */
export function sunAtLtst(hour, latDeg = MURRAY.latDeg, lonE = MURRAY.lonE, base = SOL1440_START) {
  const lonW = 360 - lonE; let ms = base + hour / 24 * SOL_MS;
  for (let i = 0; i < 4; i++) { const s = sunAt(ms, latDeg, lonW); let d = hour - s.ltst; d = mod(d + 12, 24) - 12; ms += d / 24 * SOL_MS; }
  return { ms, ...sunAt(ms, latDeg, lonW) };
}

/** Sun direction (unit vector) in the walk scene frame. Scene: +x east, +y up, +z NORTH (mirrored), rotated
 *  thetaDeg=2.4 (task 002 NCC fit): east = cos t x + sin t z, north = -sin t x + cos t z. Inverse used here. */
export function sunSceneDir(azDeg, elDeg, thetaDeg = 2.4) {
  const a = azDeg * R, e = elDeg * R, t = thetaDeg * R;
  const E = Math.sin(a) * Math.cos(e), N = Math.cos(a) * Math.cos(e);
  return [Math.cos(t) * E - Math.sin(t) * N, Math.sin(e), Math.sin(t) * E + Math.cos(t) * N];
}
