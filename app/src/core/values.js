// ALL rule, suit, astronaut and demo values of the app, in one place (specs/rules.md "Values").
// No step holds a number of its own: read from here.
//
// Each entry: { value, unit, label, src, where, text, moon? }
//   label: 'real' | 'model' | 'simulated' | 'assumption'   (specs/rules.md "Labels")
//   src:   key into DOCS in sources.js;  where: section / page / slide in that document
//   text:  one or two sentences for the label popover
//   moon:  true when the value comes from lunar planning (specs/rules.md "Moon values")
//   internal: true for planner tuning that is not a mission value; left out of the Sources page table
// Values that research/source-check.md marks unconfirmed carry label 'assumption'.

import { DOCS } from './sources.js';

const BTU_H_TO_W = 0.29307107; // 1 BTU/h in W (unit conversion)

function v(value, unit, label, src, where, text, extra = {}) {
  return { value, unit, label, src, where, text, ...extra };
}

export const RULES = {
  slopeMaxDeg: v(20, '°', 'real', 'CON', '§4.2.1.3 Suit Mobility, p.38; §7.2.14.1, p.103',
    'The design slope of the Artemis suit: walking up, down and across slopes of up to 20°. Steeper ground is closed to the route.',
    { moon: true }),
  distancePlanM: v(2000, 'm', 'real', 'CON', '§4.2.1.3.1, p.40',
    'Planning distance on foot from the safe haven: up to 2 km radial from the lander, from lunar planning.',
    { moon: true }),
  distanceLimitM: v(3500, 'm', 'real', 'OGI', 'slide 9',
    'Limit on foot: a one-hour walk back at the Apollo walk-back speed of 2.2 mph, about 3.5 km.',
    { moon: true }),
  walkBackRateFactor: v(1.2, '×', 'real', 'BELL', 'p.1 assumptions 7 and 8; p.2',
    'The way home is counted at a 20 % higher work rate than normal walking (Apollo practice: 1200 to 1440 BTU/h).',
    { moon: true }),
  secondaryO2H: v(1, 'h', 'real', 'CON', '§4.2.1.1, p.36',
    'One hour of secondary oxygen for emergencies. It is shown but never counted as time left.',
    { moon: true }),
  evaPlannedH: v(6, 'h', 'real', 'CON', '§4.1.4, p.29',
    'An excursion is planned for 6 hours.', { moon: true }),
  evaLimitH: v(8, 'h', 'real', 'CON', '§4.1.4, p.29',
    'An excursion lasts at most 8 hours (6 ± 2 h).', { moon: true }),
};

export const ASTRONAUT = {
  bodyMassKg: v(82, 'kg', 'real', 'OGI', 'slides 2 and 6',
    'Body mass of the average crew member in the Mars suit sizing (50th percentile male).'),
  loadKg: v(23, 'kg', 'real', 'OGI', 'slide 7',
    'Tools and samples carried: 50 lbm, the carry mass in the Mars suit sizing.'),
  suitMassKg: v(104, 'kg', 'real', 'OGI', 'slides 8 and 12',
    'Maximum mass of a Mars suit in the Mars suit mass study (backpack 62 kg, suit 42 kg).'),
  marsG: v(3.71, 'm/s²', 'real', 'MARSFACT', 'surface gravity',
    'Gravity on the surface of Mars. Weights and walking effort use it.'),
  earthG: v(9.81, 'm/s²', 'real', 'MARSFACT', 'Earth standard gravity, for scaling',
    'Earth gravity, used to scale an Earth-measured effort equation to Mars.'),
  paceMS: v(2000 / 3600, 'm/s', 'real', 'CON', '§4.2.1.3.1.1, p.40',
    'Planning pace on foot: about 2 km/h over level ground, from lunar planning.',
    { moon: true }),
  fastPaceFactor: v(1.5, '×', 'assumption', 'NONE', 'Walk: Shift held',
    'Fast walk (Shift held in the Walk): this many times the planning pace, about 3 km/h. The work rate at that speed comes from the effort equation (model), so the suit is used faster per metre.'),
};

export const WORK = {
  walkW: v(1200 * BTU_H_TO_W, 'W', 'model', 'BELL', 'p.1 assumption 7 (1200 BTU/h)',
    'Work rate of normal walking on the flat at planning pace, about 350 W (Apollo planning: 1200 BTU/h).',
    { moon: true }),
  spotW: v(1050 * BTU_H_TO_W, 'W', 'model', 'BELL', 'p.1 assumption 5 (1050 BTU/h)',
    'Work rate while working at the sample spot, about 310 W (Apollo planning: 1050 BTU/h).',
    { moon: true }),
  restW: v(700 * BTU_H_TO_W, 'W', 'assumption', 'BELL', 'p.1 assumption 6 (700 BTU/h, LRV riding)',
    'Work rate while standing still on the walk, about 205 W. Our sources give no standing rate; the closest is the Apollo planning rate for riding the rover (700 BTU/h), used here as a stand-in.',
    { moon: true }),
  terrainEta: v(1.2, '', 'assumption', 'PANDOLF_ETA', 'terrain coefficient table',
    'Terrain coefficient of the effort equation for loose, uneven ground. No value for Mars regolith exists.'),
  // Pandolf load-carriage equation coefficients (KIM: MP = 1.5 W + 2.0 (W+L)(L/W)^2 + eta (W+L)(1.5 V^2 + 0.35 V G))
  pandolf: v({ basal: 1.5, load: 2.0, speed: 1.5, grade: 0.35 }, '', 'model', 'KIM', 'equation 1',
    'The effort equation used for traverse workload planning (Pandolf). Slope, load and pace change the work rate around the Apollo value.'),
};

// The four consumables. Oxygen, CO2 removal and cooling water are used in proportion to the
// work rate (CAR p.49: "Metabolic rate ... is the major parameter affecting PLSS duration");
// the battery is used in proportion to time. Capacities are stored as energy (J) or time (s).
const DESIGN_W = 350;     // SCH slide 8: Mars PLSS primary average 350 W
const DESIGN_H = 8;       // SCH slides 7-8: primary 2, 4, 6 or 8 h; we take the 8 h option
// Cooling water: Apollo -7 PLSS feedwater 11.5 lb = 5.2 kg (Wikipedia only, unconfirmed in
// source-check.md, hence 'assumption'); measured use 0.44 kg/h at 273 W (EVR Table 1).
const WATER_KG = 5.2, WATER_USE_KG_H = 0.44, WATER_USE_AT_W = 273;

export const SUIT = {
  designW: v(DESIGN_W, 'W', 'real', 'SCH', 'slide 8',
    'The Mars backpack is sized for an average work rate of 350 W.'),
  designH: v(DESIGN_H, 'h', 'real', 'SCH', 'slides 7-8',
    'The Mars backpack study sizes the primary supply for 2, 4, 6 or 8 hours; we use 8 hours.'),
  consumables: {
    oxygen: v(DESIGN_W * DESIGN_H * 3600, 'J', 'model', 'SCH', 'slides 7-8',
      'Oxygen for 8 hours at 350 W. It is used faster when the work rate is higher.', { name: 'Oxygen', kind: 'energy' }),
    co2: v(DESIGN_W * DESIGN_H * 3600, 'J', 'model', 'SCH', 'slides 7-8',
      'CO2 removal for 8 hours at 350 W. It is used up in step with breathing, like oxygen.', { name: 'CO2 removal', kind: 'energy' }),
    water: v(WATER_KG * WATER_USE_AT_W * 3600 / WATER_USE_KG_H, 'J', 'assumption', 'EVR', 'Table 1 (use rate); capacity from Apollo -7 backpack, unconfirmed',
      'Cooling water: 5.2 kg as in the Apollo 15-17 backpack, used at the measured Apollo rate. The capacity is not confirmed by a source document.',
      { name: 'Cooling water', kind: 'energy', moon: true }),
    battery: v(DESIGN_H * 3600, 's', 'model', 'CAR', 'p.49; duration from SCH slides 7-8',
      'Battery for 8 hours. Its use depends on time, not on effort.', { name: 'Battery', kind: 'time' }),
  },
};

export const RADIO = {
  eyeHeightM: v(1.7, 'm', 'assumption', 'NONE', '',
    'Eye height of the astronaut above the ground: where the camera stands in the walk. The radio line of sight uses the suit antenna height.'),
  suitAntennaM: v(1.83, 'm', 'real', 'APOLLO15_COMM', '§2.1.2, assumption 3 (6 ft)',
    'Height of the suit antenna above the ground in the Apollo 15 prediction of terrain shadowing of the suit radio link. Used for the astronaut end of the line of sight.',
    { moon: true, name: 'Suit antenna height' }),
  roverAntennaM: v(2, 'm', 'real', 'LSRM', '§V (2 m expected on lunar vehicles)',
    'Height of the rover antenna: about 2 m, the height expected on lunar surface vehicles. Radio shadow is geometric line of sight only, no radio physics.',
    { moon: true }),
  relayMastM: v(3, 'm', 'assumption', 'LSRM', '§V (a relay concept uses a 10 m boom; ours is a simple mast)',
    'Height of the antenna on the radio relay the crew can set out. No source gives a height for such a relay; the relay device is simulated.'),
};

export const ENVIRONMENT = {
  doseMSvPerDay: v(0.67, 'mSv/day', 'real', 'RAD', 'SwRI release of Hassler et al. 2014',
    'Radiation dose rate that Curiosity measured on the surface at Gale crater. Dose during the walk = this rate times the time outside (model).'),
  // Air temperature by local mean solar time, REMS sol 1440 (research/data-science.md §2, hour-bin means)
  airTempK: v([[0, 213.6], [3, 205.9], [5, 206.7], [6, 212.0], [8, 228.8], [10, 246.8], [12, 256.2],
    [14, 272.6], [15, 271.5], [16, 257.6], [18, 238.3], [20, 227.4], [22, 220.7]], 'K', 'real', 'REMS', 'sol 1440, hourly means',
    'Air temperature measured by Curiosity’s weather station at Murray Buttes on sol 1440 (August 2016).'),
  solSeconds: v(88775, 's', 'real', 'MARSFACT', 'length of day 24.6597 h',
    'One Mars solar day, used to advance the local time of day.'),
  evaStartLmstH: v(9, 'h', 'assumption', 'NONE', '',
    'The excursion starts at 09:00 local Mars time.'),
  signalDelayMinMin: v(4, 'min', 'real', 'NEEMO', 'p.2', 'The shortest one-way signal delay between Earth and Mars.'),
  signalDelayMaxMin: v(22, 'min', 'real', 'NEEMO', 'p.2', 'The longest one-way signal delay between Earth and Mars.'),
  signalDelayNowMin: v(18, 'min', 'assumption', 'MCBRAYER', 'abstract and pdf p.10 (15-20 min while the crew is at Mars)',
    'One-way signal delay on the day of this mission, chosen inside the expected range while a crew is at Mars.'),
};

// Tuned with `npm run tune` (scripts/tune.mjs), see app/README.md.
const TIME_FACTOR = 76;

export const DEMO = {
  timeFactor: v(TIME_FACTOR, '×', 'assumption', 'NONE', 'chosen by the team',
    `Demo time: the clock and the suit’s use run ${TIME_FACTOR}× faster than real time.`),
  spotWorkMin: v(20, 'min', 'assumption', 'NONE', '',
    'Fixed time for taking the sample at the spot, counted in time and consumption.'),
  screenSpeedFactor: v(5, '×', 'assumption', 'NONE', 'Walk: Shift tapped twice',
    'Demo speed in the Walk: the visitor moves this many times faster on screen. Movement only: suit time and consumption are counted as a normal walk over the same distance.'),
  craterHeightFactor: v(2.5, '×', 'assumption', 'TEAM', 'vertical exaggeration for readability, chosen by the team',
    'Heights in the 3D view of Gale crater (step 1) are drawn this many times taller than they are, so the crater rim and Mount Sharp are easy to see. Distances across the ground are true to scale.'),
};

// Simulated body readings for the helmet (specs/rules.md: label simulated). No data behind them.
export const BODY = {
  heartRestBpm: v(72, 'bpm', 'simulated', 'NONE', '', 'Heart rate is simulated from the work rate; no data.'),
  heartPerW: v(0.1,'bpm/W', 'simulated', 'NONE', '', 'Heart rate is simulated from the work rate; no data.'),
  coreTempC: v(37.0, '°C', 'simulated', 'NONE', '', 'Core temperature is simulated; no data.'),
  coreTempPerW: v(0.0012, '°C/W', 'simulated', 'NONE', '', 'Core temperature is simulated; no data.'),
  suitPressureKPa: v(29.6, 'kPa', 'simulated', 'NONE', '', 'Suit pressure is simulated; no data.'),
  co2KPa: v(0.4, 'kPa', 'simulated', 'NONE', '', 'CO2 in the helmet is simulated; no data.'),
};

// Places: the home of the crew.
export const HOME = {
  rover: v({ x: 0, z: 0 }, 'm', 'assumption', 'WALK_TERRAIN', '§3 Start point',
    'The parked rover stands at the centre of the walk square, the start point of the Access Mars scene.'),
};

// Planner tuning (algorithm, not a rule): extra cost per metre on ground over the slope limit
// when no rule-keeping route exists, so the best route crosses as little closed ground as possible.
export const PLANNER = {
  // 1e5: one metre of closed ground costs more than any open route in the 128 m square can be long,
  // so the fallback first minimises closed ground, then time.
  steepPenalty: v(1e5, '×', 'model', 'NONE', '', 'Cost multiplier for closed ground in the fallback route.', { internal: true }),
  edgeToleranceM: v(0.1, 'm', 'assumption', 'NONE', '',
    'A point counts as standing on a closed cell only once it is this far inside the cell. A planned diagonal step between two open cells touches the corner of the cells beside it; this tolerance lets the planner and the Walk agree that such a step keeps the slope rule.', { internal: true }),
  contactWeight: v(0.5, '×', 'assumption', 'NONE', '',
    'Extra cost of walking in radio shadow in the route calculation: a metre without contact counts as 1.5 m, so the route prefers ground with contact when the detour is small. It never opens closed ground and never breaks a rule. Distance and time shown are the real ones.'),
  maxStops: v(3, 'stops', 'assumption', 'TEAM', 'chosen by the team',
    'The most sample stops one excursion may plan: rover, up to three stops in the order chosen, rover. One sample and the fixed work time at every stop.'),
};

export const ALL = { RULES, ASTRONAUT, WORK, SUIT, RADIO, ENVIRONMENT, DEMO, BODY, HOME, PLANNER };

// Readable name of each value (Sources page); entries that already carry a name keep it.
const NAMES = {
  RULES: {
    slopeMaxDeg: 'Steepest slope on foot', distancePlanM: 'Planning distance from the rover', distanceLimitM: 'Distance limit on foot',
    walkBackRateFactor: 'Work rate on the way home', secondaryO2H: 'Secondary oxygen', evaPlannedH: 'Planned excursion length',
    evaLimitH: 'Longest excursion',
  },
  ASTRONAUT: {
    bodyMassKg: 'Body mass', loadKg: 'Carried load', suitMassKg: 'Suit mass', marsG: 'Mars gravity', earthG: 'Earth gravity',
    paceMS: 'Walking pace', fastPaceFactor: 'Fast walk speed factor',
  },
  WORK: {
    walkW: 'Work rate walking', spotW: 'Work rate at the spot', restW: 'Work rate standing', terrainEta: 'Terrain coefficient',
    pandolf: 'Effort equation (Pandolf)',
  },
  SUIT: { designW: 'Backpack design work rate', designH: 'Backpack supply time' },
  RADIO: { eyeHeightM: 'Eye height (camera)', suitAntennaM: 'Suit antenna height', roverAntennaM: 'Rover antenna height', relayMastM: 'Relay antenna height' },
  ENVIRONMENT: {
    doseMSvPerDay: 'Radiation dose rate at Gale crater', airTempK: 'Air temperature at Murray Buttes', solSeconds: 'Length of a Mars day',
    evaStartLmstH: 'Excursion start, local Mars time', signalDelayMinMin: 'Shortest signal delay Earth to Mars',
    signalDelayMaxMin: 'Longest signal delay Earth to Mars', signalDelayNowMin: 'Signal delay on mission day',
  },
  DEMO: { timeFactor: 'Demo time factor', spotWorkMin: 'Work time at the spot', craterHeightFactor: 'Crater height factor (step 1 view)',
    screenSpeedFactor: 'Demo speed on screen (movement only)' },
  BODY: {
    heartRestBpm: 'Resting heart rate', heartPerW: 'Heart rate per watt of work', coreTempC: 'Core temperature',
    coreTempPerW: 'Core temperature per watt of work', suitPressureKPa: 'Suit pressure', co2KPa: 'CO2 in the helmet',
  },
  HOME: { rover: 'Rover position' },
  PLANNER: { contactWeight: 'Weight of radio shadow in the route', steepPenalty: 'Cost of closed ground in the fallback route', edgeToleranceM: 'Closed-cell edge tolerance', maxStops: 'Most stops per excursion' },
};
for (const [group, names] of Object.entries(NAMES)) {
  for (const [key, name] of Object.entries(names)) if (ALL[group][key] && !ALL[group][key].name) ALL[group][key].name = name;
}

/** Source document for a value entry: { title, url, where }. */
export function sourceOf(entry) {
  const d = DOCS[entry.src] || DOCS.NONE;
  return { title: d.title, url: d.url, where: entry.where || '' };
}

/** Flat list of all values for the sources page: [{ group, key, entry }]. */
export function listValues() {
  const out = [];
  for (const [group, obj] of Object.entries(ALL)) {
    for (const [key, entry] of Object.entries(obj)) {
      if (key === 'consumables') {
        for (const [k, e] of Object.entries(entry)) out.push({ group, key: k, entry: e });
      } else out.push({ group, key, entry });
    }
  }
  return out;
}
