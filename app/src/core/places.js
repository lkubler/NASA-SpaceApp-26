// Places in the Murray Buttes walk square. Only from research/walk-targets.md; none invented.
// Scene metres: x = east, z = north, origin = square centre (the parked rover).

import { HOME } from './values.js';

const AM_SRC = 'Access Mars, Murray Buttes markers (googlecreativelab/access-mars, Apache-2.0); photo NASA/JPL-Caltech';
const T_SRC = 'Derived from the terrain: team research on sample spots (butte-foot rule on the 0.5 m walk grid)';

/** Home: the parked rover at the start point. */
export const ROVER = { id: 'rover', name: 'Rover', ...HOME.rover.value };

/**
 * Sample candidates: reachable spots at the foot of the buttes (walk-targets.md "Candidate spots", kind T).
 * pathM / climbM / shadowShare: the research's own grid-method numbers, kept for reference and tests.
 * Rock type is not in our data: the mesh has no rock-type layer (walk-targets.md §3).
 */
export const CANDIDATES = [
  { id: 'F1', name: 'Butte foot, east butte', x: 13.25, z: -0.25, kind: 'terrain', pathM: 13.8, climbM: 2.16, shadowShare: 0 },
  { id: 'F2', name: 'Beside the east butte wall, 9 m north', x: 12.25, z: 8.75, kind: 'terrain', pathM: 15.5, climbM: 0.62, shadowShare: 0 },
  { id: 'F3', name: 'Foot of the south ridge', x: -1.75, z: -27.75, kind: 'terrain', pathM: 29.2, climbM: 4.16, shadowShare: 0 },
  { id: 'F4', name: 'Foot of the south-west wall', x: -20.75, z: -30.25, kind: 'terrain', pathM: 42.0, climbM: 5.29, shadowShare: 0 },
  { id: 'F5', name: 'Foot of the north-east butte mass', x: 26.75, z: 31.25, kind: 'terrain', pathM: 42.1, climbM: 0.40, shadowShare: 0 },
  { id: 'F7', name: 'East side, behind the butte mass', x: 59.75, z: 1.75, kind: 'terrain', pathM: 68.9, climbM: 3.98, shadowShare: 0.56 },
].map((c) => ({ ...c, label: 'model', source: T_SRC, note: 'Position derived from the terrain' }));

/**
 * The four Access Mars points of interest (walk-targets.md §1). Not sample spots.
 * x, y, z: marker position in scene metres as in Access Mars. reach: nearest reachable cell (walk-targets.md §2).
 * text: card text, verbatim from Access Mars. photo: local copy of the Access Mars card image, or null.
 * The Bruce Murray card photo (mb2.jpg) is an archive portrait, not a Mars image, and is not used.
 */
export const ACCESS_MARS_POINTS = [
  {
    id: 'A1', name: 'Buttes', x: 13.8, y: 1.2, z: 6.9, reach: { x: 12.75, z: 7.75 },
    photo: null, photoNote: '',
    text: 'These are the Murray Buttes. Buttes are steep, knob-like rock formations. The largest one here is about as tall as a three-story building. These buttes served as Curiosity’s entryway to its main destination: Mount Sharp.',
  },
  {
    id: 'A2', name: 'Monument Valley', x: 21, y: 6.2, z: 3.7, reach: { x: 15.25, z: 1.75 },
    photo: null, photoNote: '',
    text: 'These buttes are similar to ones you’d find on Earth, formed when wind erodes ancient sandstone. Scientists have compared the region to Monument Valley.',
  },
  {
    id: 'A3', name: 'Bruce Murray', x: -10.56, y: 1.8, z: -12.9, reach: { x: -10.75, z: -12.75 },
    photo: null, photoNote: '',
    text: 'The Murray Buttes are named after the late Bruce Murray, a Caltech planetary scientist and director of the Jet Propulsion Laboratory. He worked on the first missions to Mars and laid the groundwork for future Mars exploration.',
  },
  {
    id: 'A4', name: 'Interference', x: -63.5, y: -3.9, z: 35.2, reach: { x: -63.25, z: 35.25 },
    photo: null, photoNote: '',
    text: 'The buttes are beautiful, but are sometimes tall enough to block the signal between Curiosity and the Mars orbiters that fly overhead. That can temporarily reduce the amount of data that Curiosity can send back to Earth.',
  },
].map((p) => ({ ...p, kind: 'access-mars', label: 'real', source: AM_SRC }));

export function candidateById(id) { return CANDIDATES.find((c) => c.id === id) || null; }
/** The visible number of a spot, as on the Plan map: '01'..'06' (CANDIDATES order). Internal ids stay F1..F7. */
export function spotNumber(id) { const k = CANDIDATES.findIndex((c) => c.id === id); return k < 0 ? '' : String(k + 1).padStart(2, '0'); }
/** The one visible label of a spot in every step: number and name, e.g. '06 East side, behind the butte mass'. */
export function spotLabel(id) { const c = candidateById(id); return c ? `${spotNumber(id)} ${c.name}` : ''; }
