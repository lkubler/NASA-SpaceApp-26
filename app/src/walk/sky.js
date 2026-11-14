// Sky, sun light, shadows, fog and the day/dust controls for Walk (docs/design.md moments 3 and 4).
// Sun direction: Mars24 (src/model/mars24.js) for Murray Buttes on sol 1440 -> MODELLED.
// Dust: tau presets drive fog / light / sky -> SIMULATED. Scene axes assumption: -Z = north, +X = east
// (glb orientation is undocumented; shadows are right in relative terms, absolute heading is approximate).
import * as THREE from 'three';
import { sunAtLtst } from '../model/mars24.js';
import { chip } from '../ui/components.js';
import '../styles/sky.css';

// tau (880 nm) scenarios: research/sources-validity.md table D (JPL 2018, Chen-Chen, Guzewich 2019, Lemmon et al.)
export const DUST = [
  { id: 'clear', label: 'Clear', tau: 0.5, note: 'Low-dust season, typical Gale (approx.)' },
  { id: 'season', label: 'Dust season', tau: 1.5, note: 'tau 1-2, JPL "average for dust season"' },
  { id: 'regional', label: 'Regional', tau: 3, note: 'Order of Viking / MER 2007 values (low confidence)' },
  { id: 'storm', label: 'Storm 2018', tau: 8.5, note: 'Global storm peak, Mastcam (Lemmon 2019)' },
];
const VIS_CLEAR = 800, VIS_STORM = 120; // metres, docs/design.md moment 4; log-interpolated in tau
const visibility = (tau) => VIS_CLEAR * Math.pow(VIS_STORM / VIS_CLEAR, Math.min(1, Math.max(0, (tau - 0.5) / 8)));
const sstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const C = (h) => new THREE.Color(h);
const PAL = { // butterscotch day, cool twilight, near-black night
  horizonDay: C(0xd9a57a), zenithDay: C(0xa97c63), horizonDusk: C(0x8a5a52), zenithDusk: C(0x2a2030),
  night: C(0x07060b), dust: C(0xc08a60), glow: C(0x6f9bd6),
};

const VERT = 'varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = modelViewMatrix * vec4(position,1.); gl_Position = (projectionMatrix * p).xyww; }';
const FRAG = `
varying vec3 vDir;
uniform vec3 sunDir, cHor, cZen, cGlow, cDust, cNight;
uniform float day, twi, night, dust, sunI;
float hash(vec3 p){ p = fract(p*0.3183099+.1); p *= 17.; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
void main(){
  vec3 d = normalize(vDir);
  float h = clamp(d.y, 0., 1.);
  float mu = dot(d, sunDir);
  vec3 col = mix(cHor, cZen, pow(h, .45));
  // blue-ish glow around the sun at dusk/dawn (Curiosity sunset imagery): small forward-scattering lobe
  float ang = acos(clamp(mu, -1., 1.));
  col += cGlow * twi * (0.9 * exp(-ang * 7.) + 0.25 * exp(-ang * 2.2)) * (1. - dust * .7);
  col *= mix(1., .55 + .45 * smoothstep(-.1, .5, mu), twi);       // warm side away from the sun darkens
  col = mix(col, cDust * mix(.35, 1., day), dust * .75);           // dust: desaturate towards a flat haze
  // sun disc (about 0.35 deg radius on Mars, drawn larger so it reads at video size)
  float disc = smoothstep(cos(.018), cos(.008), mu) * sunI * step(0., d.y + .02);
  col += vec3(1., .93, .82) * disc * 3. + vec3(.55, .65, .9) * disc * twi * 2.;
  // stars fade in below -2 deg sun altitude
  float s = step(.9965, hash(floor(d * 380.))) * night * smoothstep(0., .15, d.y) * (1. - dust);
  col = mix(col, cNight, 0.) + vec3(.9, .9, 1.) * s;
  gl_FragColor = linearToOutputTexel(vec4(col, 1.));
}`;

export function initSky({ scene, sun, hemi, container, state }) {
  const u = {
    sunDir: { value: new THREE.Vector3(0, 1, 0) }, cHor: { value: new THREE.Color() }, cZen: { value: new THREE.Color() },
    cGlow: { value: PAL.glow }, cDust: { value: PAL.dust }, cNight: { value: PAL.night },
    day: { value: 1 }, twi: { value: 0 }, night: { value: 0 }, dust: { value: 0 }, sunI: { value: 1 },
  };
  const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 16),
    new THREE.ShaderMaterial({ uniforms: u, vertexShader: VERT, fragmentShader: FRAG, side: THREE.BackSide, depthWrite: false, fog: false }));
  dome.frustumCulled = false; dome.renderOrder = -10; scene.add(dome);
  scene.background = null;
  scene.fog = new THREE.FogExp2(0xd9a57a, 0.0025);
  hemi.groundColor.set(0x6b3a22);

  const st = { hour: 9, dustIdx: 0, sun: null, bgMats: null };
  const dir = new THREE.Vector3(), fogCol = new THREE.Color(), tmp = new THREE.Color();

  function compute() {
    const s = sunAtLtst(st.hour), tau = DUST[st.dustIdx].tau;
    const el = s.elevation, az = s.azimuth * Math.PI / 180, e = el * Math.PI / 180;
    dir.set(Math.sin(az) * Math.cos(e), Math.sin(e), -Math.cos(az) * Math.cos(e)); // -Z north, +X east
    const dayK = sstep(-4, 12, el), twi = sstep(-9, -1, el) * (1 - sstep(4, 18, el)), night = 1 - sstep(-9, -2, el);
    const dustK = 1 - Math.exp(-tau / 3.2);                       // 0 clear .. ~.93 storm
    const sinEl = Math.max(Math.sin(e), 0.12);
    const direct = Math.exp(-tau * 0.3 / sinEl) * sstep(-1, 6, el); // Beer-Lambert style direct-beam transmission, labelled model
    st.sun = { ...s, tau, vis: visibility(tau), direct, twi, dayK };
    // palette
    tmp.copy(PAL.horizonDusk).lerp(PAL.horizonDay, dayK); u.cHor.value.copy(tmp).lerp(PAL.night, night * 0.85);
    tmp.copy(PAL.zenithDusk).lerp(PAL.zenithDay, dayK); u.cZen.value.copy(tmp).lerp(PAL.night, night * 0.95);
    u.sunDir.value.copy(dir); u.day.value = dayK; u.twi.value = twi; u.night.value = night; u.dust.value = dustK; u.sunI.value = direct;
    // fog follows the horizon colour, density from visibility (FogExp2: ~2% contrast at 2/density)
    fogCol.copy(u.cHor.value).lerp(PAL.dust.clone().multiplyScalar(0.25 + 0.75 * dayK), dustK * 0.8);
    scene.fog.color.copy(fogCol); scene.fog.density = 1.98 / st.sun.vis;
    // lights
    sun.color.setRGB(1, 0.93 - 0.18 * (1 - sstep(0, 25, el)), 0.84 - 0.34 * (1 - sstep(0, 25, el)));
    sun.intensity = 3.2 * direct; sun.castShadow = direct > 0.02;
    hemi.intensity = 0.06 + 0.9 * dayK * (1 - 0.35 * dustK) + 0.25 * twi;
    hemi.color.copy(u.cHor.value).lerp(new THREE.Color(0xffffff), 0.3);
    // mute the backdrop photo with the light level and haze
    if (!st.bgMats) { st.bgMats = []; scene.traverse((o) => { if (o.isMesh && o.material && o.material.isMeshBasicMaterial && o.material.fog === false) st.bgMats.push(o.material); }); }
    for (const m of st.bgMats) m.color.setRGB(1, 0.84, 0.7).multiplyScalar(0.06 + 0.94 * dayK * (1 - 0.6 * dustK)).lerp(fogCol, Math.min(1, dustK * 1.05));
    ui.sync();
  }

  // ---- controls (DOM; dark glass over the walk view, docs/design.md section 7) ----
  const ui = (() => {
    const root = document.createElement('div'); root.className = 'sky-panel on-glass';
    const mk = (t, c, x) => { const e = document.createElement(t); if (c) e.className = c; if (x != null) e.textContent = x; return e; };
    const h1 = mk('div', 'sky-h'); h1.append(mk('span', 'label', 'Time of sol'), chip('modelled', 'Sun position: NASA GISS Mars24 algorithm, Murray Buttes (4.70 S, 137.36 E), sol 1440, Ls ~210'));
    const time = mk('div', 'sky-time'), sub = mk('div', 'sky-sub');
    const range = mk('input', 'sky-range'); range.type = 'range'; range.min = 0; range.max = 24; range.step = 0.05; range.value = st.hour; range.setAttribute('aria-label', 'Local true solar time');
    range.addEventListener('input', () => { st.hour = +range.value; compute(); });
    const h2 = mk('div', 'sky-h sky-h2'); h2.append(mk('span', 'label', 'Dust (tau)'), chip('simulated', 'Scenario values, not forecasts. Sources: JPL 2018, Lemmon et al. (Mastcam), Guzewich 2019; see research/sources-validity.md'));
    const seg = mk('div', 'sky-seg'); seg.setAttribute('role', 'group');
    const btns = DUST.map((d, i) => { const b = mk('button', 'sky-opt'); b.append(mk('b', null, d.label), mk('span', null, 'tau ' + d.tau)); b.title = d.note; b.addEventListener('click', () => { st.dustIdx = i; compute(); }); seg.append(b); return b; });
    const vis = mk('div', 'sky-vis'), hint = mk('div', 'sky-hint', 'T: sun +1 h   G: next dust scenario   Esc to use the sliders');
    root.append(h1, time, sub, range, h2, seg, vis, hint);
    container.append(root);
    for (const ev of ['keydown', 'keyup', 'mousedown']) root.addEventListener(ev, (e) => e.stopPropagation());
    const fmt = (h) => { const m = Math.round(h * 60) % 1440; return String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); };
    return { root, sync() {
      const s = st.sun; time.textContent = fmt(st.hour) + ' LTST';
      sub.textContent = (s.elevation >= 0 ? 'Sun ' + s.elevation.toFixed(0) + '° up' : 'Sun below horizon') + ' · az ' + s.azimuth.toFixed(0) + '° · Ls ' + s.Ls.toFixed(0) + '°';
      btns.forEach((b, i) => b.classList.toggle('on', i === st.dustIdx)); range.value = st.hour;
      vis.textContent = 'Visibility ~' + Math.round(s.vis) + ' m · direct sun ' + Math.round(s.direct * 100) + ' %';
      vis.dataset.level = s.tau >= 8 ? 'danger' : s.tau >= 3 ? 'warn' : 'ok';
    } };
  })();

  addEventListener('keydown', (e) => {
    if (document.getElementById('walk-view')?.offsetParent === null) return;
    if (e.code === 'KeyT') { st.hour = (Math.floor(st.hour) + 1) % 24; compute(); }
    if (e.code === 'KeyG') { st.dustIdx = (st.dustIdx + 1) % DUST.length; compute(); }
  });
  compute();

  return {
    st, compute, setHour(h) { st.hour = h; compute(); }, setDust(i) { st.dustIdx = i; compute(); },
    /** Call per frame: shadow map follows the camera, light placed along the Mars24 sun direction. */
    update(camPos) { sun.position.copy(camPos).addScaledVector(dir, 120); sun.target.position.copy(camPos); sun.target.updateMatrixWorld(); dome.position.copy(camPos); dome.scale.setScalar(4000); },
  };
}
