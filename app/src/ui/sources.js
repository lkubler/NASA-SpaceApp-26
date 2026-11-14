// Sources panel (task 010c): every dataset, model and code source with provenance chip and link.
import { chip } from './components.js';
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

const GROUPS = [
  ['measured', 'MEASURED', 'Real NASA data, used as published or only resampled.', [
    ['HiRISE DTM DTEEC_040770_1755_039280_1755_U01', 'Terrain elevation, 1 m posts: slope, line of sight, route cost, elevation profile. NASA/JPL/University of Arizona/USGS, PDS.', 'https://www.uahirise.org/dtm/'],
    ['Curiosity waypoints (MSL_waypoints.json)', 'Rover positions at Marimba (sols 1417-1427) and Quela (sols 1455-1468). NASA/JPL MMGIS.', 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json'],
    ['REMS, sol 1440 (MSL-M-REMS-5-MODRDR)', 'Air and ground temperature, pressure at Gale, 24 Aug 2016. REMS, CAB (INTA-CSIC) / NASA, PDS Atmospheres node.', 'https://atmos.nmsu.edu/PDS/data/mslrem_1001/'],
    ['RAD surface dose, 0.67 mSv/day', 'Galactic cosmic ray dose equivalent measured by Curiosity RAD (Hassler et al. 2014). SwRI / NASA release.', 'https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars'],
    ['Access Mars scene, Murray Buttes', 'Walk-view terrain mesh and photo textures from Curiosity Mastcam (NASA/JPL-Caltech/MSSS). Google Creative Lab, Apache-2.0.', 'https://github.com/googlecreativelab/access-mars'],
  ]],
  ['modelled', 'MODELLED', 'Computed by our code from the measured data. Assumptions are labelled in the app.', [
    ['Mars24 sun position', 'Solar elevation and azimuth from the NASA GISS Mars24 algorithm (Allison and McEwen), 2015 update. Checked against the page worked examples.', 'https://www.giss.nasa.gov/tools/mars24/help/algorithm.html'],
    ['Pandolf load-carriage equation with Santee grade correction', 'Metabolic cost of walking by slope and load; method used by NASA JSC for traverse workload (Kim et al., IEEE EMBC 2024). Suit offset and Mars gravity factor are our assumptions.', 'https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf'],
    ['NASA EVA sizing numbers', '8 h EVA, 50 lbm carried mass, 2.2 mph walkback speed, 1200 BTU/hr average (Ogilvie et al., ICES-2026-127). The 15 to 20 degree slope limit is a planning threshold from Apollo experience, not a NASA requirement.', 'https://ntrs.nasa.gov/citations/20260005410'],
    ['Radio line of sight (comms shadow)', 'Viewshed over the DTM from the relay rover parked on high ground, the comms source. The 10 min limit is an assumed mission rule, not a NASA figure.', null],
  ]],
  ['simulated', 'SIMULATED', 'Placeholders, labelled in the UI. No real data behind them yet.', [
    ['Dust haze (tau)', 'Slider-driven fog and visibility. A mission would use orbiter dust opacity plus local weather stations.', null],
    ['Local weather window', 'Simulated forecast. REMS-style stations would feed it in the field.', null],
  ]],
];
const CODE = [
  ['three.js r170 (MIT)', 'https://threejs.org'],
  ['Vite (MIT)', 'https://vitejs.dev'],
  ['Barlow Semi Condensed, IBM Plex Sans, IBM Plex Mono via Fontsource (SIL OFL 1.1)', 'https://fontsource.org'],
];

function link(text, url) { const a = h('a', 'src-a', text); a.href = url; a.target = '_blank'; a.rel = 'noopener'; return a; }

export function mountSources(root) {
  root.innerHTML = '';
  const wrap = h('div', 'src-wrap');
  wrap.append(h('div', 'src-kick', 'DATA AND MODEL SOURCES'), h('h2', 'src-h', 'What is real, what is computed, what is a placeholder'));
  const cols = h('div', 'src-cols');
  GROUPS.forEach(([kind, name, blurb, items], i) => {
    const c = h('section', 'src-col'); c.style.setProperty('--i', i);
    const hd = h('header', 'src-ch'); hd.append(chip(kind), h('span', 'src-cn', name));
    c.append(hd, h('p', 'src-blurb', blurb));
    items.forEach(([t, d, url]) => {
      const it = h('div', 'src-item');
      it.append(h('div', 'src-t', t), h('div', 'src-d', d));
      if (url) it.append(link(url.replace(/^https?:\/\//, '').slice(0, 64), url));
      c.append(it);
    });
    cols.append(c);
  });
  wrap.append(cols);
  const foot = h('div', 'src-foot');
  const code = h('div', 'src-code'); code.append(h('span', 'label', 'CODE AND FONTS'));
  CODE.forEach(([t, u]) => code.append(link(t, u)));
  foot.append(code);
  foot.append(h('div', 'src-ai', '<span class="label">AI USE</span> Built with Claude Code (Anthropic) for research, code and design. The idea, the Ground Control requests and all decisions are the team\'s. No images or video are AI-generated. Full log: docs/ai-use.md in the repository.'));
  foot.append(h('div', 'src-ai', 'No NASA logos or mission insignia are used. Data credit to NASA, JPL, University of Arizona (HiRISE), USGS, CAB/INTA-CSIC (REMS), SwRI (RAD).'));
  wrap.append(foot);
  root.append(wrap);
}
