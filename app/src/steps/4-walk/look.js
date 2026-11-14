// What the reticle points at: an Access Mars point of interest, or a butte wall. Measured on the walk grid.
import { RADIO, ROVER, ACCESS_MARS_POINTS, lineOfSight } from '../../core/index.js';
import { DISPLAY as D } from './display.js';

function firstSentence(text) {
  const parts = text.match(/[^.!?]+[.!?]+/g) || [text];
  return (parts.find((p) => p.trim().length >= 40) || parts[0]).trim();
}

/** Ground rise around (x, z): highest minus lowest ground within the butte radius. */
function relief(t, x, z, R = D.butteRadiusM) {
  let lo = Infinity, hi = -Infinity;
  for (let dx = -R; dx <= R; dx += 1) for (let dz = -R; dz <= R; dz += 1) {
    if (dx * dx + dz * dz > R * R || !t.inside(x + dx, z + dz)) continue;
    const y = t.heightAt(x + dx, z + dz);
    if (y < lo) lo = y; if (y > hi) hi = y;
  }
  return hi - lo;
}

/** Point where the view ray meets the ground, or null (beyond the walk square or the look range). */
export function rayHit(t, eye, dir) {
  for (let m = 0.5; m <= D.lookMaxM; m += t.cell) {
    const x = eye.x + dir.x * m, z = eye.z + dir.z * m, y = eye.y + dir.y * m;
    if (!t.inside(x, z)) return null;
    // the rover model blocks the view
    if (Math.hypot(x - ROVER.x, z - ROVER.z) < D.roverClearM - 0.8 && y < t.heightAt(x, z) + 2.7) return null;
    if (y <= t.heightAt(x, z)) return { x, z, m };
  }
  return null;
}

/** Visible Access Mars points: [{ point, on }] (on = in line of sight from the eye). */
export function visiblePoints(t, at) {
  const eyeH = RADIO.eyeHeightM.value;
  return ACCESS_MARS_POINTS.map((p) => ({
    point: p,
    on: lineOfSight(t, { x: at.x, z: at.z, h: eyeH }, { x: p.x, z: p.z, h: Math.max(0.3, p.y - t.heightAt(p.x, p.z) + 0.3) }),
  }));
}

/**
 * @returns {null | { title, text, size }}
 */
export function lookAt(t, eye, dir, vis) {
  const fmt = (r, d) => `≈ ${Math.round(r)} m high · ${Math.round(d)} m`;
  // Access Mars points first
  const cosMax = Math.cos((D.lookAngleDeg * Math.PI) / 180);
  let best = null;
  for (const v of vis) {
    if (!v.on) continue;
    const p = v.point;
    const py = Math.max(p.y, t.heightAt(p.x, p.z)) + 0.3;
    const dx = p.x - eye.x, dy = py - eye.y, dz = p.z - eye.z, d = Math.hypot(dx, dy, dz);
    if (d > D.lookMaxM || d < 1) continue;
    const c = (dx * dir.x + dy * dir.y + dz * dir.z) / d;
    if (c >= cosMax && (!best || c > best.c)) best = { c, p, d };
  }
  if (best && rayBlockedByRover(t, eye, dir, best.d)) best = null;
  if (best) {
    return { title: best.p.name, text: firstSentence(best.p.text), size: fmt(relief(t, best.p.x, best.p.z), Math.hypot(best.p.x - eye.x, best.p.z - eye.z)) };
  }
  // a butte wall
  const hit = rayHit(t, eye, dir);
  if (!hit || t.slopeAt(hit.x, hit.z) < D.butteWallDeg) return null;
  if (rayBlockedByRover(t, eye, dir, hit.m)) return null;
  if (relief(t, hit.x, hit.z, D.butteNearM) < D.butteMinReliefM) return null;
  const r = relief(t, hit.x, hit.z);
  return { title: 'Butte', text: firstSentence(ACCESS_MARS_POINTS[0].text), size: fmt(r, Math.hypot(hit.x - eye.x, hit.z - eye.z)) };
}

// the rover model's box (scene3d.js roverModel: footprint as in sim.js, about ROVER_TOP_M high)
const ROVER_TOP_M = 2.7;
const RY = (D.roverHeadingDeg * Math.PI) / 180;
const R_FWD = { x: Math.sin(RY), z: Math.cos(RY) }, R_SIDE = { x: Math.cos(RY), z: -Math.sin(RY) };
const R_C = { x: ROVER.x + R_FWD.x * D.roverShiftM, z: ROVER.z + R_FWD.z * D.roverShiftM };
function inRoverBox(t, x, y, z) {
  const a = (x - R_C.x) * R_FWD.x + (z - R_C.z) * R_FWD.z, b = (x - R_C.x) * R_SIDE.x + (z - R_C.z) * R_SIDE.z;
  return Math.abs(a) < D.roverHalfLenM && Math.abs(b) < D.roverHalfWidthM && y < t.heightAt(R_C.x, R_C.z) + ROVER_TOP_M;
}
/** The view ray meets the rover model before `maxM` (the rover wins over anything behind it). */
function rayBlockedByRover(t, eye, dir, maxM = D.lookMaxM) {
  const reach = Math.hypot(eye.x - R_C.x, eye.z - R_C.z) + D.roverHalfLenM + 1;
  for (let m = 0.25; m < Math.min(maxM, reach); m += 0.25) {
    if (inRoverBox(t, eye.x + dir.x * m, eye.y + dir.y * m, eye.z + dir.z * m)) return true;
  }
  return false;
}
