// The missions from Earth, one per site (team decision, Sat 14.11.). Texts and reasons from
// research/research-requests.md (§1, §4, §5). Only Murray Buttes has walkable terrain in this demo; the
// other two are shown, linked to their site, and locked ('soon').
// The Murray request maps to the sample candidates in the core: every candidate is a reachable spot at
// the foot of a butte, at most 3 m from the butte wall (research/walk-targets.md §3). spotId is the spot
// the Plan map preselects; the crew may still pick another.

import { CANDIDATES } from '../../core/index.js';

const SPOTS = CANDIDATES.map((c) => c.id);

export const REQUESTS = [
  {
    id: 'crossbeds',
    site: 'murray',
    kind: 'sample',
    title: 'Sample the cross-bedded sandstone',
    titleLong: 'A sample from the sandstone at the foot of a butte',
    rock: 'Cross-bedded sandstone (Stimson formation)',
    why: 'The cross-beds were laid down by wind-blown dunes after the lakes had gone, and so far their pattern has only been read from rover camera images.',
    whySource: {
      title: 'NASA, PIA21043 "Farewell to Murray Buttes" caption; Banham et al. 2021, JGR Planets, doi 10.1029/2020JE006554',
      url: 'https://science.nasa.gov/resource/farewell-to-murray-buttes-image-3/',
      where: 'research/research-requests.md §1 and §5.3',
    },
    photoId: 'crossbedding_PIA21042',
    candidateIds: SPOTS,
    spotId: 'F1', // preselected on the Plan map: 01 Butte foot, east butte
    place: 'foot of a butte',
  },
  {
    id: 'silica',
    site: 'marias',
    locked: true,
    kind: 'sample',
    title: 'Sample the high-silica rock',
    why: 'Buckskin, drilled here in 2015, held 74 % silica and tridymite, a mineral that forms at high temperature, inside lake mudstone; where it came from is still debated.',
    whySource: {
      title: 'NASA JPL, "NASA Mars Rover Moves Onward After Marias Pass Studies" (19 Aug 2015); "NASA Scientists Discover Unexpected Mineral on Mars" (2016)',
      url: 'https://www.jpl.nasa.gov/news/nasa-scientists-discover-unexpected-mineral-on-mars/',
      where: 'research/research-requests.md §4',
    },
    photo: { src: 'data/missions/marias_PIA20174.jpg', caption: 'Marias Pass, contact of pale mudstone and darker sandstone', meta: 'Curiosity Mastcam, PIA20174', credit: 'NASA/JPL-Caltech/MSSS', url: 'https://images.nasa.gov/details/PIA20174' },
  },
  {
    id: 'lake',
    site: 'pahrump',
    locked: true,
    kind: 'sample',
    title: 'Sample the lake mudstone',
    why: 'Curiosity’s first drill into Mount Sharp, at Confidence Hills, showed that the mountain’s base is finely layered mudstone from long-lived lakes.',
    whySource: {
      title: 'NASA JPL, "NASA’s Curiosity Rover Team Confirms Ancient Lakes on Mars" (8 Oct 2015); PIA19039 Pahrump Hills walkabout',
      url: 'https://www.jpl.nasa.gov/news/nasas-curiosity-rover-team-confirms-ancient-lakes-on-mars/',
      where: 'research/research-requests.md §4',
    },
    photo: { src: 'data/missions/pahrump_PIA18476.jpg', caption: 'Layered rock at Pahrump Hills, the base of Mount Sharp', meta: 'Curiosity Mastcam, PIA18476', credit: 'NASA/JPL-Caltech/MSSS', url: 'https://images.nasa.gov/details/PIA18476' },
  },
];
