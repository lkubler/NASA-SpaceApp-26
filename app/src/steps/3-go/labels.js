// Label specs (real / model / simulated / assumption) for the values step 3 shows.
// Every number in the texts is read from core/values.js; this file holds none of its own.
import { RULES, DEMO, ASTRONAUT, ENVIRONMENT } from '../../core/index.js';

const demo = () => `${DEMO.timeFactor.value}${DEMO.timeFactor.unit}`;

export const L = {
  distance: {
    label: 'model', src: 'WALK_TARGETS', where: 'grid method',
    text: 'Length of the planned round trip on foot, measured along the route over the Access Mars terrain of the walk square.',
  },
  duration: {
    label: 'model', src: 'CON', where: ASTRONAUT.paceMS.where,
    text: `Walking time at the planning pace, corrected for slope, plus ${DEMO.spotWorkMin.value} ${DEMO.spotWorkMin.unit} of work at the spot (at every stop of a round). Shown in demo time (${demo()}).`,
    moon: true,
  },
  steepest: {
    label: 'model', src: 'WALK_TERRAIN', where: 'walk grid slope',
    text: `Steepest ground on the route, from the slope of the 0.5 m terrain grid. The rule allows ${RULES.slopeMaxDeg.value}${RULES.slopeMaxDeg.unit}.`,
  },
  reserve: {
    label: 'model', src: RULES.walkBackRateFactor.src, where: RULES.walkBackRateFactor.where,
    text: `Time left in the suit when the crew is back at the rover, with the way home counted at ${RULES.walkBackRateFactor.value}${RULES.walkBackRateFactor.unit} the normal work rate. Shown in demo time (${demo()}).`,
    moon: true,
  },
  radiation: {
    label: 'model', src: ENVIRONMENT.doseMSvPerDay.src, where: ENVIRONMENT.doseMSvPerDay.where,
    text: `Curiosity’s measured dose rate on the surface (${ENVIRONMENT.doseMSvPerDay.value} ${ENVIRONMENT.doseMSvPerDay.unit}) times the time outside.`,
  },
  farthest: {
    label: 'model', src: 'WALK_TARGETS', where: 'grid method',
    text: 'Largest straight-line distance from the rover anywhere on the route.',
  },
  shadow: {
    label: 'model', src: 'WALK_TERRAIN', where: 'line of sight on the walk grid',
    text: 'Longest stretch of the route without line of sight to the rover, suit antenna to rover antenna (or to the relay, if one is placed). Geometric line of sight only, no radio physics. Shown in demo time.',
  },
  shelter: {
    label: 'model', src: RULES.shelterReturnH.src, where: RULES.shelterReturnH.where,
    text: `Longest time back to the rover from any point of the route, on the fastest way home. In demo time (${demo()}).`,
  },
  /** Slope check against HiRISE; noDataM: metres of the route that the elevation model does not cover. */
  hirise: (noDataM = 0) => ({
    label: 'model', src: 'HIRISE', where: 'DTEEC_040770_1755_039280_1755_U01',
    text: `The route is planned on the Access Mars terrain. HiRISE is an independent elevation model of the same ground at ${ENVIRONMENT.hiriseCellM.value} ${ENVIRONMENT.hiriseCellM.unit} spacing, and the two are aligned to about ${ENVIRONMENT.hiriseAlignM.value} ${ENVIRONMENT.hiriseAlignM.unit}. This line counts the metres of the route where the HiRISE slope is steeper than the ${RULES.slopeMaxDeg.value}${RULES.slopeMaxDeg.unit} slope rule. It is a caution, never a broken rule: a few metres can come from the alignment.`
      + (noDataM > 0.5 ? ` Part of this route (${Math.round(noDataM)} m) has no HiRISE data and is not counted.` : ''),
  }),
  suit: {
    label: 'simulated', src: 'NONE', where: '',
    text: 'The suit checks are simulated: there is no suit to read. They stand for the checks a crew runs before leaving the rover.',
  },
  demo: DEMO.timeFactor,
};
