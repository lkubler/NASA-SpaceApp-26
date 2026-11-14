// One walking-speed model for the whole app: the planner (time), the reserve model (energy) and the
// 3D walk all import it from here.
// Base speed: 2.2 mph planning walkback speed, NASA ICES-2026-127 slide 9 [measured, Apollo-derived].
// Slope multiplier: our simple rule [modelled, assumption]: -3.75 % speed per degree uphill (floor 25 %),
// +1 % per degree downhill (cap +15 %).
export const WALK_SPEED_MS = 3.5 / 3.6;

/** Walking speed multiplier for slope in travel direction (deg, +uphill). */
export function speedMult(deg) {
  return deg > 0 ? Math.max(0.25, 1 - 0.0375 * deg) : Math.min(1.15, 1 - 0.01 * deg);
}

/** Walking speed in m/s on a given slope (deg, +uphill). */
export function walkSpeed(deg, base = WALK_SPEED_MS) { return base * speedMult(deg); }
