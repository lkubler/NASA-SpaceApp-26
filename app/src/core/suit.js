// Suit model (specs/rules.md "Astronaut and suit"). Label: model. Kept simple on purpose.
//
// 1. Work rate W (watts), from slope, load and pace, under Mars gravity:
//      W = W_walk + gs * [ P(G, V, L) - P(0, V0, L0) ]
//      P(G, V, L) = 2.0 (B+L)(L/B)^2 + eta (B+L)(1.5 V^2 + 0.35 V G)       (Pandolf, KIM eq. 1, without the 1.5 B basal term)
//    W_walk = 1200 BTU/h (Apollo planning walking rate, BELL), anchored at the planning pace V0 and
//    load L0; gs = g_Mars / g_Earth scales the Earth-measured locomotion and load terms to Mars.
//    B body mass, L carried load (the suit mass is not added: below 4 km/h suit mass showed no effect,
//    Gernhardt 2008 via research/suit-values.md §1), V speed m/s, G grade in % = 100 tan(slope).
//    Downhill counts as flat (G = 0): conservative, no saving claimed.
// 2. Consumables: oxygen, CO2 removal and cooling water are stored as energy (J) and drawn at W;
//    the battery is stored as time (s) and drawn at 1 s per s (CAR p.49).
// 3. Time left = min over consumables of level / rate at the reference work rate; the display names
//    the consumable that gives the minimum.
// 4. Reserve on return = min over consumables of (level - use on the rest of the plan) / reference rate,
//    with the way home drawn at walkBackRateFactor x its work rate (BELL). This equals
//    "time left minus the time of the way home" when the rates are the reference rates.
// 5. Demo time: one factor F. All suit time = model time x F (walking), so consumption per metre is
//    F times higher. The fixed work time at the spot is already in suit time.

import { RULES, ASTRONAUT, WORK, SUIT, DEMO, ENVIRONMENT, BODY } from './values.js';

export const CONSUMABLES = ['oxygen', 'co2', 'water', 'battery'];

const gs = () => ASTRONAUT.marsG.value / ASTRONAUT.earthG.value;

function pandolfLoco(gradePct, speed, load, body) {
  const k = WORK.pandolf.value, eta = WORK.terrainEta.value, BL = body + load;
  return k.load * BL * (load / body) ** 2 + eta * BL * (k.speed * speed * speed + k.grade * speed * gradePct);
}

/**
 * Work rate in W for walking.
 * @param {number} slopeDeg  signed slope along the direction of travel (+ uphill)
 * @param {number} [speed]   m/s, default planning pace
 * @param {number} [load]    kg, default carried load
 */
export function workRate(slopeDeg, speed = ASTRONAUT.paceMS.value, load = ASTRONAUT.loadKg.value) {
  const body = ASTRONAUT.bodyMassKg.value;
  const G = Math.max(0, 100 * Math.tan((slopeDeg * Math.PI) / 180));
  const ref = pandolfLoco(0, ASTRONAUT.paceMS.value, ASTRONAUT.loadKg.value, body);
  return WORK.walkW.value + gs() * (pandolfLoco(G, speed, load, body) - ref);
}

/** Demo time factor (one value, label assumption). */
export function demoFactor() { return DEMO.timeFactor.value; }

/** Suit seconds to walk a stretch of `metres` at planning pace. */
export function walkSeconds(metres) { return (metres / ASTRONAUT.paceMS.value) * demoFactor(); }

/** Suit seconds of the fixed work at the spot. */
export function spotSeconds() { return DEMO.spotWorkMin.value * 60; }

/** Full levels { oxygen: J, co2: J, water: J, battery: s }. */
export function fullLevels() {
  const c = SUIT.consumables;
  return { oxygen: c.oxygen.value, co2: c.co2.value, water: c.water.value, battery: c.battery.value };
}

/** Use of each consumable: { energyJ, seconds } -> per-consumable amounts. */
export function useOf(energyJ, seconds) {
  return { oxygen: energyJ, co2: energyJ, water: energyJ, battery: seconds };
}

/** New levels after drawing `workW` for `suitSeconds`. Levels never go below 0. */
export function consume(levels, workW, suitSeconds) {
  const e = workW * suitSeconds;
  return {
    oxygen: Math.max(0, levels.oxygen - e),
    co2: Math.max(0, levels.co2 - e),
    water: Math.max(0, levels.water - e),
    battery: Math.max(0, levels.battery - suitSeconds),
  };
}

/** Level of each consumable as 0..1. */
export function fractions(levels) {
  const c = SUIT.consumables, out = {};
  for (const k of CONSUMABLES) out[k] = levels[k] / c[k].value;
  return out;
}

/** Display name of a consumable key. */
export function consumableName(key) { return SUIT.consumables[key].name; }

function rateOf(key, workW) { return key === 'battery' ? 1 : workW; }

/**
 * Time left: the consumable that runs out first at work rate workW (default: normal walking).
 * @returns {{ seconds: number, limiting: string, name: string }}
 */
export function timeLeft(levels, workW = WORK.walkW.value) {
  let best = Infinity, lim = 'oxygen';
  for (const k of CONSUMABLES) {
    const t = levels[k] / rateOf(k, workW);
    if (t < best) { best = t; lim = k; }
  }
  return { seconds: best, limiting: lim, name: consumableName(lim) };
}

/**
 * Reserve on return. `ahead` is what the plan still needs:
 *   { energyJ, seconds }          for the part at normal rate (rest of the way out, work at the spot)
 *   { homeEnergyJ, homeSeconds }  for the way home at normal rate (multiplied here by the walk-back factor)
 * @returns {{ seconds: number, limiting: string, name: string, levelsAtHome: object }}
 */
export function reserveOnReturn(levels, ahead) {
  const f = RULES.walkBackRateFactor.value;
  const e = (ahead.energyJ || 0) + f * (ahead.homeEnergyJ || 0);
  const s = (ahead.seconds || 0) + (ahead.homeSeconds || 0);
  const use = useOf(e, s);
  const atHome = {};
  for (const k of CONSUMABLES) atHome[k] = levels[k] - use[k];
  let best = Infinity, lim = 'oxygen';
  for (const k of CONSUMABLES) {
    const t = atHome[k] / rateOf(k, WORK.walkW.value);
    if (t < best) { best = t; lim = k; }
  }
  return { seconds: best, limiting: lim, name: consumableName(lim), levelsAtHome: atHome };
}

/** Radiation dose (mSv) for suit seconds outside: Curiosity's measured rate x time (model). */
export function doseMSv(suitSeconds) {
  return (ENVIRONMENT.doseMSvPerDay.value / 86400) * suitSeconds;
}

/** Outside air temperature (°C) at suit seconds after the start, from REMS sol 1440 (real data, interpolated). */
export function outsideTempC(suitSeconds) {
  const table = ENVIRONMENT.airTempK.value;
  // LMST hour advances 24 per sol.
  let h = (ENVIRONMENT.evaStartLmstH.value + (suitSeconds / ENVIRONMENT.solSeconds.value) * 24) % 24;
  let k = 0;
  while (k < table.length - 1 && table[k + 1][0] <= h) k++;
  const [h0, t0] = table[k];
  const [h1, t1] = k + 1 < table.length ? table[k + 1] : [table[0][0] + 24, table[0][1]];
  const t = t0 + ((t1 - t0) * (h - h0)) / (h1 - h0);
  return t - 273.15;
}

/** Simulated body readings for the helmet (label simulated). */
export function bodyReadings(workW) {
  return {
    heartBpm: BODY.heartRestBpm.value + BODY.heartPerW.value * Math.max(0, workW - WORK.spotW.value),
    coreTempC: BODY.coreTempC.value + BODY.coreTempPerW.value * Math.max(0, workW - WORK.walkW.value),
    suitPressureKPa: BODY.suitPressureKPa.value,
    co2KPa: BODY.co2KPa.value,
  };
}
