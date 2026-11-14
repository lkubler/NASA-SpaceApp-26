// The two requests from Earth (specs/1-mission.md "Requests"). Texts and reasons from
// research/research-requests.md (sections 1, 2, 5); photos from public/data/murray/photos/credits.json.
// Each request maps to the sample candidates in the core: every candidate is a reachable spot at the
// foot of a butte, at most 3 m from the butte wall (research/walk-targets.md §3).

import { CANDIDATES } from '../../core/index.js';

const SPOTS = CANDIDATES.map((c) => c.id);

export const REQUESTS = [
  {
    id: 'crossbeds',
    kind: 'sample',
    from: 'Sedimentology team, Earth',
    title: 'A sample from the sandstone at the foot of a butte',
    what: 'One sample of the cross-bedded sandstone of the buttes.',
    rock: 'Cross-bedded sandstone (Stimson formation)',
    why: 'The cross-beds were laid down by wind-blown dunes after the lakes had gone, and so far their pattern has only been read from rover camera images.',
    whySource: {
      title: 'NASA, PIA21043 "Farewell to Murray Buttes" caption; Banham et al. 2021, JGR Planets, doi 10.1029/2020JE006554',
      url: 'https://science.nasa.gov/resource/farewell-to-murray-buttes-image-3/',
      where: 'research/research-requests.md §1 and §5.3',
    },
    photoId: 'crossbedding_PIA21042',
    candidateIds: SPOTS,
    place: 'foot of a butte',
  },
  {
    id: 'radiation',
    kind: 'measurement',
    from: 'Radiation team, Earth',
    title: 'A radiation measurement beside a butte wall',
    what: 'One radiation measurement, standing right next to the wall of a butte.',
    rock: 'Butte wall of sandstone (Stimson formation) as a shield',
    why: 'Curiosity measured a lower radiation dose while parked beside a butte in September 2016, and the team is looking for other places to repeat it.',
    whySource: {
      title: 'NASA JPL, "How NASA’s Curiosity Rover Is Making Mars Safer for Astronauts" (15 Nov 2021; Ehresmann et al. 2021)',
      url: 'https://www.jpl.nasa.gov/news/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/',
      where: 'research/research-requests.md §2 (Butte shielding) and §5.4',
    },
    photoId: 'quela_navcam',
    candidateIds: SPOTS,
    place: 'beside a butte wall',
  },
];
