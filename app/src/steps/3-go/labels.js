// Label specs (real / model / simulated / assumption) for the values step 3 shows.
// Every number in the texts is read from core/values.js; this file holds none of its own.
import { RULES, DEMO, ASTRONAUT, ENVIRONMENT } from '../../core/index.js';

const demo = () => `${DEMO.timeFactor.value}${DEMO.timeFactor.unit}`;

export const L = {
  distance: {
    label: 'model', src: 'WALK_TARGETS', where: 'grid method',
    text: 'Length of the planned round trip on foot, measured along the route over the HiRISE-based terrain of the walk square.',
  },
  duration: {
    label: 'model', src: 'CON', where: ASTRONAUT.paceMS.where,
    text: `Walking time at NASA’s planning pace, corrected for slope, plus ${DEMO.spotWorkMin.value} ${DEMO.spotWorkMin.unit} of work at the spot (at every stop of a round). Shown in demo time (${demo()}).`,
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
    text: 'Longest stretch of the route without line of sight to the rover at eye height. Geometric line of sight only, no radio physics. Shown in demo time.',
  },
  suit: {
    label: 'simulated', src: 'NONE', where: '',
    text: 'The suit checks are simulated: there is no suit to read. They stand for the checks a crew runs before leaving the rover.',
  },
  demo: DEMO.timeFactor,
};
