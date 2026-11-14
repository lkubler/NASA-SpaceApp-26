// Sources panel (task 010c): every dataset, model and code source with provenance chip and link.
import { chip } from './components.js';
function h(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }

const GROUPS = [
  ['measured', 'MEASURED', 'Real NASA data, used as published or only resampled.', [
    ['HiRISE DTM DTEEC_040770_1755_039280_1755_U01', 'Terrain elevation, 1 m posts: slope, line of sight, route cost, elevation profile. NASA/JPL/University of Arizona/USGS, PDS.', 'https://www.uahirise.org/dtm/'],
    ['HiRISE orthoimage ESP_040770_1755_RED_A_01_ORTHO', 'Map base layer, 0.25 m per pixel, on the same grid as the DTM (resampled only). NASA/JPL/University of Arizona, PDS.', 'https://www.uahirise.org/dtm/'],
    ['Curiosity raw images (Mastcam, MAHLI, Navcam)', 'Six frames from sols 1421-1464 on the station cards, resized only. Credit per NASA/JPL image use policy (only the PIA21042 credit line was checked on its own page).', 'https://www.jpl.nasa.gov/imagepolicy'],
    ['Butte shielding at Quela, RAD', 'Dose about 4 % lower next to a butte at Murray Buttes, sols 1455-1468. Ehresmann et al. 2021, JGR Planets 126(8). Quoted in the app, not used in our dose numbers.', 'https://doi.org/10.1029/2021JE006851'],
    ['Reference: chest X-ray, about 0.1 mSv', 'Used to compare the EVA dose with something familiar. RadiologyInfo.org (RSNA/ACR).', 'https://www.radiologyinfo.org/en/info/safety-xray'],
    ['Reference: Earth background, about 2.4 mSv per year', 'Worldwide average annual effective dose from natural radiation, approximately 2.4 mSv (Canadian Nuclear Safety Commission fact sheet, citing UNSCEAR 2008).', 'https://www.cnsc-ccsn.gc.ca/eng/resources/fact-sheets/natural-background-radiation/'],
    ['Curiosity waypoints (MSL_waypoints.json)', 'Rover drive-end positions and elevations, sols 1414-1475 (dotted line on the map), incl. Marimba and Quela. NASA/JPL MMGIS.', 'https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json'],
    ['REMS, sol 1440 (MSL-M-REMS-5-MODRDR)', 'Air and ground temperature, pressure at Gale, 24 Aug 2016. REMS, CAB (INTA-CSIC) / NASA, PDS Atmospheres node.', 'https://atmos.nmsu.edu/PDS/data/mslrem_1001/'],
    ['RAD surface dose, 0.67 mSv/day', 'Galactic cosmic ray dose equivalent measured by Curiosity RAD (Hassler et al. 2014). SwRI / NASA release.', 'https://www.swri.org/press-release/swri-scientists-publish-first-radiation-measurements-surface-mars'],
    ['Access Mars scene, Murray Buttes', 'Walk-view terrain mesh and photo textures from Curiosity Mastcam (NASA/JPL-Caltech/MSSS). Google Creative Lab, Apache-2.0.', 'https://github.com/googlecreativelab/access-mars'],
  ]],
  ['modelled', 'MODELLED', 'Computed by our code from the measured data. Assumptions are labelled in the app.', [
    ['Mars24 sun position', 'Solar elevation and azimuth from the NASA GISS Mars24 algorithm (Allison and McEwen), 2015 update. Checked against the page worked examples.', 'https://www.giss.nasa.gov/tools/mars24/help/algorithm.html'],
    ['Pandolf load-carriage equation with Santee grade correction', 'Metabolic cost of walking by slope and load; method used by NASA JSC for traverse workload (Kim et al., IEEE EMBC 2024). Suit offset and Mars gravity factor are our assumptions.', 'https://ntrs.nasa.gov/api/citations/20240001423/downloads/IEEE%20EMBC%202024.pdf'],
    ['NASA EVA sizing numbers', '8 h EVA, 50 lbm carried mass, 2.2 mph walkback speed, 1200 BTU/hr average (Ogilvie et al., ICES-2026-127). The 15 to 20 degree slope limit is a planning threshold from Apollo experience, not a NASA requirement.', 'https://ntrs.nasa.gov/citations/20260005410'],
    ['Prior work: SEXTANT', 'MIT planned and evaluated sun-, slope- and walking-energy-aware EVA traverses for Apollo-type crews in 2009 (Johnson 2009, SAE 2009-01-2562). Our tool differs by adding radio line of sight, a true return cost and leave-by times, on HiRISE terrain.', null],
    ['Mars gravity scaling of walking cost', 'Pandolf was fitted at 1 g. We scale its weight-bearing terms by g/g_Earth and keep the basal and suit terms unscaled, which gives a Mars-to-Earth cost ratio of about 0.83 for suited flat walking. The only measurement (Brown et al. 2018, 12 unsuited adults on a lower-body-pressure treadmill at 0.38 g) found 0.68; we treat the plausible range as 0.68 to 1.0 with 0.75 as the working default. Our assumption, shown with a sensitivity table in the app.', null],
    ['Radio line of sight (comms shadow)', 'Viewshed over the DTM from the relay unit parked on high ground, the comms source. The 10 min limit is an assumed mission rule, not a NASA figure.', null],
  ]],
  ['simulated', 'ILLUSTRATIVE INPUTS', 'Adjustable inputs, labelled in the UI. In the field each would be fed by the real source named below.', [
    ['Dust haze (tau)', 'Slider-driven fog and visibility. Planned source: orbiter dust opacity maps plus local weather stations (REMS).', null],
    ['Local weather window', 'Illustrative forecast. Planned source: REMS-style weather stations in the field.', null],
  ]],
];
const CODE = [
  ['three.js r170 (MIT)', 'https://threejs.org'],
  ['Vite (MIT)', 'https://vitejs.dev'],
  ['Barlow Semi Condensed, IBM Plex Sans, IBM Plex Mono via Fontsource (SIL OFL 1.1)', 'https://fontsource.org'],
];

function label(url) { try { const u = new URL(url); const last = decodeURIComponent(u.pathname.split('/').filter(Boolean).pop() || ''); const short = last.length > 28 ? last.slice(0, 26) + '...' : last; return u.hostname.replace(/^www\./, '') + (short ? ' / ' + short : ''); } catch (e) { return url; } }
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
      if (url) it.append(link(label(url), url));
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
