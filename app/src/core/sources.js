// Every document, dataset, tool and code library the app uses.
// Values in values.js point to these keys. The sources page lists all of them.
// Short keys follow research/suit-values.md and research/source-check.md.

import { GROUND_NOTE, GROUND_FILL_NOTE } from './groundColor.js';
export const DOCS = {
  CON: {
    title: 'NASA, Exploration EVA System Concept of Operations, EVA-EXP-0042 Rev B (2020)',
    url: 'https://www.nasa.gov/wp-content/uploads/2017/02/eva-exp-0042_xeva_system_con_ops_rev_b_final_dtd_10192020_ref_doc.pdf',
    moon: true,
  },
  OGI: {
    title: 'Ogilvie, Swartout et al., Mars Spacesuit Mass Requirements, NASA JSC, ICES-2026-127',
    url: 'https://ntrs.nasa.gov/api/citations/20260005410/downloads/Mars_Mass_ICES2026_Presentation_Final.pdf',
  },
  SCH: {
    title: 'Oliver et al., Mars Exploration PLSS Schematic Study, ICES 2026 paper 158',
    url: 'https://ntrs.nasa.gov/api/citations/20260005204/downloads/ICES_Mars_PLSS_Presentation_2026_1.pdf',
  },
  BELL: {
    title: 'Bellcomm memo B70 10028, Apollo 15 EVA Capability and Constraints Envelopes (1970)',
    url: 'https://web.archive.org/web/20190714123032/https://history.nasa.gov/alsj/19790073512_1979073512.pdf',
    moon: true,
  },
  CAR: {
    title: 'Carson, Apollo Portable Life Support System Performance Report, NASA MSC (1972)',
    url: 'https://ntrs.nasa.gov/api/citations/19720019460/downloads/19720019460.pdf',
    moon: true,
  },
  EVR: {
    title: 'Dunn et al., EVA Injury Evidence Report, NASA Human Research Program (2021)',
    url: 'https://ntrs.nasa.gov/api/citations/20220004017/downloads/2021%20EVA%20Injury%20Evidence%20Report%20Final.docx.pdf',
  },
  KIM: {
    title: 'Kim et al., Improving Metabolic Workload Estimation Accuracy for Planning and Analyzing Exploration Traverses, NASA JSC, IEEE EMBC 2024 (Pandolf load-carriage equation)',
    url: 'https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf',
  },
  PANDOLF_ETA: {
    title: 'Pandolf equation, terrain coefficient table (secondary source)',
    url: 'https://en.wikipedia.org/wiki/Pandolf_equation',
  },
  MARSFACT: {
    title: 'NASA NSSDCA, Mars Fact Sheet (surface gravity 3.71 m/s²)',
    url: 'https://nssdc.gsfc.nasa.gov/planetary/factsheet/marsfact.html',
  },
  RAD: {
    title: 'Hassler et al. 2014, Curiosity RAD surface radiation (SwRI release: 0.67 mSv per day at Gale)',
    url: 'https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars',
  },
  REMS: {
    title: 'Curiosity REMS, PDS Atmospheres node, sol 1440 (MSL-M-REMS-5-MODRDR-V1.0)',
    url: 'https://atmos.nmsu.edu/PDS/data/mslrem_1001/DATA/SOL_01418_01514/SOL01440/',
  },
  NEEMO: {
    title: 'Chappell et al., NEEMO 18-20 (Earth-Mars latency 4-22 minutes), NTRS 20150019627',
    url: 'https://ntrs.nasa.gov/citations/20150019627',
  },
  MCBRAYER: {
    title: 'McBrayer et al., communication delay at Mars, NTRS 20220013418',
    url: 'https://ntrs.nasa.gov/citations/20220013418',
  },
  WALK_TERRAIN: {
    title: 'Team research: walk terrain inventory',
    url: 'research/walk-terrain.md',
  },
  WALK_TARGETS: {
    title: 'Team research: sample candidates in the walk square',
    url: 'research/walk-targets.md',
  },
  NONE: {
    title: 'No source: placeholder chosen by the team for the demo',
    url: '',
  },
  TEAM: {
    title: 'Assumption',
    url: '',
  },
};

// Datasets shown on the sources page.
export const DATA = [
  {
    name: 'Access Mars 3D terrain, Murray Buttes',
    by: 'Google Creative Lab with NASA/JPL-Caltech; built from Curiosity Mastcam and Navcam images (NASA/JPL-Caltech/MSSS)',
    use: 'The terrain you plan on and walk through; the 0.5 m height and slope grids; the sky image; the four Access Mars points and their photos',
    licence: 'Apache-2.0 (code and scene); imagery NASA/JPL-Caltech',
    url: 'https://github.com/googlecreativelab/access-mars',
    note: GROUND_NOTE + ' ' + GROUND_FILL_NOTE,
  },
  {
    name: 'HiRISE elevation model DTEEC_040770_1755_039280_1755_U01 and orthoimage',
    by: 'NASA/JPL/University of Arizona/USGS',
    use: 'Position and orientation of the walk square in Gale crater; check of the slope grid',
    licence: 'PDS public data',
    url: 'https://www.uahirise.org/dtm/',
  },
  {
    name: 'Curiosity waypoints',
    by: 'NASA/JPL-Caltech',
    use: 'Curiosity’s drive path near Murray Buttes; in step 1 the landing site (Bradbury Landing, where we place the base: assumption) and the drive from there to Murray Buttes',
    licence: 'NASA public data',
    url: 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json',
  },
  {
    name: 'Curiosity photos (Mastcam, MAHLI, Navcam)',
    by: 'NASA/JPL-Caltech/MSSS (Mastcam, MAHLI); NASA/JPL-Caltech (Navcam)',
    use: 'Shown in the requests, at the sample spot and in the report: “Sloping buttes and cross-bedded sandstone” (PIA21042, Mastcam, sol 1454, NASA/JPL-Caltech/MSSS); “Layered outcrop at Quela” (Navcam, sol 1455, NASA/JPL-Caltech); “Quela drill hole at the foot of a butte” (MAHLI, sol 1464, NASA/JPL-Caltech/MSSS). Raw frames from the Curiosity raw image archive, with their file ids',
    licence: 'JPL Image Use Policy',
    url: 'https://www.jpl.nasa.gov/imagepolicy',
  },
  {
    name: 'Gale Crater 3D model (STL, from HRSC on ESA Mars Express)',
    by: 'NASA Science 3D Resources; data K. Gwinner, J. Oberst, R. Jaumann, G. Neukum, ESA/DLR/FU Berlin',
    use: 'The 3D view of Gale crater in step 1 (208 x 276 km, 387 m per pixel), with the heights of Murray Buttes, Marias Pass, Pahrump Hills and Mount Sharp; the opening zooms from the globe into it',
    licence: 'NASA 3D Resources, credit as given',
    url: 'https://science.nasa.gov/3d-resources/gale-crater/',
  },
  {
    name: 'Curiosity Mastcam images of Marias Pass and Pahrump Hills (PIA20174, PIA18476)',
    by: 'NASA/JPL-Caltech/MSSS',
    use: 'Photos on the two missions marked "soon" in step 1',
    licence: 'JPL Image Use Policy',
    url: 'https://images.nasa.gov/details/PIA20174',
  },
  {
    name: 'MOLA elevation of Gale crater (MEGDR, 128 pixels per degree, MEGT00N090HB)',
    by: 'NASA/GSFC MOLA Science Team, Mars Global Surveyor; NASA PDS Geosciences Node',
    use: 'Reference for placing the HRSC Gale crater model on the map and converting its heights to metres (fit correlation 0.999)',
    licence: 'NASA PDS, public domain',
    url: 'https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/mgsl_300x/meg128/megt00n090hb.img',
  },
  {
    name: 'Planet Mars, 3D Model (glTF)',
    by: 'NASA/JPL-Caltech, via NASA Science',
    use: 'The planet on the opening screen (mesh smoothed at load time, texture unchanged) and the surface colour of the Gale crater view',
    licence: 'NASA media usage guidelines',
    url: 'https://science.nasa.gov/resource/planet-mars-3d-model/',
  },
  {
    name: 'Space Exploration Vehicle, 3D model (glTF)',
    by: 'NASA/LaRC/Advanced Concepts Lab, via NASA Science 3D Resources',
    use: 'The rover in the walk: textures reduced to 1024 px, mesh simplified to 85,062 triangles and compressed, otherwise unedited; scaled to 4.5 m length at load time (assumption)',
    licence: 'NASA media usage guidelines',
    url: 'https://science.nasa.gov/3d-resources/space-exploration-vehicle/',
  },
  {
    name: 'Sky reference: “Farewell to Murray Buttes (Image 1)” (PIA21041, Mastcam, sol 1454)',
    by: 'NASA/JPL-Caltech/MSSS',
    use: 'Reference only, not copied into the app: the raw-colour daytime sky and haze over Gale crater at Murray Buttes, from which the day sky colours in the walk were picked by eye (model)',
    licence: 'JPL Image Use Policy',
    url: 'https://science.nasa.gov/photojournal/farewell-to-murray-buttes-image-1/',
  },
  {
    name: 'Sky reference: “Mount Sharp Panorama in Raw Colors” (PIA16769, Mastcam, sol 45)',
    by: 'NASA/JPL-Caltech/MSSS',
    use: 'Reference only, not copied into the app: the butterscotch sky of Gale crater in raw colour, brighter towards the sun; the sky there is filled out from the terrain frames, as the caption says (model)',
    licence: 'JPL Image Use Policy',
    url: 'https://www.jpl.nasa.gov/images/pia16769-mount-sharp-panorama-in-raw-colors/',
  },
  {
    name: 'Sky reference: “Rover’s Panorama of Entrance to ‘Murray Buttes’ on Mars” (PIA20765, Mastcam, sol 1421)',
    by: 'NASA/JPL-Caltech/MSSS',
    use: 'Reference only, not copied into the app: the same place in white-balanced colour (the sky looks grey-blue there, as NASA notes for white-balanced frames); kept to show why the walk uses the raw-colour butterscotch sky (model)',
    licence: 'JPL Image Use Policy',
    url: 'https://science.nasa.gov/photojournal/rovers-panorama-of-entrance-to-murray-buttes-on-mars/',
  },
  {
    name: 'Deep Star Maps 2020 (8K, galactic coordinates)',
    by: 'NASA/Goddard Space Flight Center Scientific Visualization Studio; Hipparcos-2, Tycho-2 and Gaia DR2 catalogs (Gaia DR2: ESA/Gaia/DPAC)',
    use: 'The star sky on the opening screen: a 2560 x 1440 crop around the core of the Milky Way',
    licence: 'NASA SVS, credit as given',
    url: 'https://svs.gsfc.nasa.gov/4851',
  },
  {
    name: 'Curiosity RAD radiation dose rate',
    by: 'Hassler et al. 2014, SwRI / NASA',
    use: 'Radiation dose during the excursion',
    licence: 'Published result',
    url: DOCS.RAD.url,
  },
  {
    name: 'Curiosity REMS air temperature, sol 1440',
    by: 'REMS team, Centro de Astrobiología (INTA-CSIC) / NASA, PDS Atmospheres node',
    use: 'Outside temperature in the helmet',
    licence: 'PDS public data',
    url: DOCS.REMS.url,
  },
];

export const TOOLS = [
  { name: 'Three.js', use: '3D terrain and walk', licence: 'MIT', url: 'https://threejs.org' },
  { name: 'Vite', use: 'Build tool', licence: 'MIT', url: 'https://vite.dev' },
  { name: 'Vitest', use: 'Unit tests', licence: 'MIT', url: 'https://vitest.dev' },
  { name: 'Draco decoder (2017 build from Access Mars)', use: 'Decodes the compressed terrain mesh', licence: 'Apache-2.0', url: 'https://github.com/google/draco' },
  { name: 'Space Grotesk, Inter, JetBrains Mono (via Fontsource)', use: 'Typefaces', licence: 'SIL Open Font License 1.1', url: 'https://fontsource.org' },
  { name: 'Python with numpy, Pillow, DracoPy', use: 'Offline data preparation', licence: 'BSD / HPND / Apache-2.0', url: 'https://numpy.org' },
  { name: 'Helmet frame image (AI-generated)', use: 'The visor frame in step 4: an AI-generated green-screen image made by the team; the green was keyed out and “AI-generated image” written into the image pixels by our script', licence: 'Generated for this project; no agency branding', url: '' },
  { name: 'Rover egress film (labelled AI-generated)', use: 'The intro film before the walk: the team’s film, rendered with Python/pyrender scripts from a Space Exploration Vehicle rover 3D model on placeholder terrain; cut at the fade to black and marked “AI-generated” in the pixels with FFmpeg', licence: 'Made for this project; no agency branding', url: '' },
  { name: 'glTF Transform and meshoptimizer', use: 'Shrinking the rover model offline (texture resize, mesh simplification, meshopt compression) and decoding it in the app', licence: 'MIT', url: 'https://gltf-transform.dev' },
  { name: 'FFmpeg', use: 'Cutting and re-encoding the intro film (offline)', licence: 'GPL / LGPL', url: 'https://ffmpeg.org' },
  { name: 'Claude Code (Anthropic)', use: 'AI coding agent: research notes, app code, data preparation scripts and unit tests, written under the team’s specs', licence: 'AI tool; output noted in the project description', url: 'https://www.anthropic.com/claude-code' },
];

export const AI_NOTE = [
  'The idea, its direction and every product decision come from the team.',
  'AI coding agents (Claude Code) did research, wrote the app code, the data preparation scripts and the unit tests under the team’s specs. Code and data written with AI help are noted here and in the project description.',
  'The helmet frame image is AI-generated and carries a visible “AI-generated image” mark. No agency logos or mission identifiers appear in generated content.',
];
