import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OldDracoLoader } from './oldDraco.js';
import { app } from '../state.js';
import { buildHeightmap as buildHm, provideHeightmap } from '../terrain/heightmap.js';
import { mountHud } from './hud.js';
import { initSky } from './sky.js';
import { mountRoute3d } from './route3d.js';

const BASE = import.meta.env.BASE_URL + 'murray/';
const CELL = 0.5, HALF = 64, N = (HALF * 2) / CELL; // 256 x 256 cells
const EYE = 1.7, BASE_SPEED = 1.4; // m/s, ~5 km/h

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('walk-view').prepend(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xc98e68);
scene.fog = new THREE.FogExp2(0xc98e68, 0.006);
const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.05, 6000);
scene.add(camera);

const hemi = new THREE.HemisphereLight(0xe9b896, 0x6b3a22, 0.9); scene.add(hemi);
const sun = new THREE.DirectionalLight(0xfff0e0, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 300;
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-0.5, 0.55, -0.4).normalize(); // placeholder; real value from Mars24 later
function placeSun() { sun.position.copy(camera.position).addScaledVector(SUN_DIR, 120); sun.target.position.copy(camera.position); sun.target.updateMatrixWorld(); }

let sky; // sky.js: Mars24 sun, sky dome, fog, day/dust controls (created after state)
const state = { tiles: [], ready: false, yaw: 0, pitch: 0, pos: new THREE.Vector3(), eyeY: 0, keys: {}, speed: 0, slope: 0, mult: 1 };
sky = initSky({ scene, sun, hemi, container: document.getElementById('walk-view') });
const hud = mountHud(document.getElementById('hud')), msg = document.getElementById('msg');
let route3d = null;
const stats = { heightmapMs: 0, gridCells: N * N, tris: 0, texLoaded: 0 };

// ---- load ----
function spread(img) { // mean channel spread of a 8x8 downsample; Access Mars greyscale placeholders have ~0
  try { const c = document.createElement('canvas'); c.width = c.height = 8; const g = c.getContext('2d'); g.drawImage(img, 0, 0, 8, 8); const d = g.getImageData(0, 0, 8, 8).data; let m = 0;
    for (let i = 0; i < d.length; i += 4) m += Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]); return m / 64; } catch (e) { return 99; }
}
const tl = new THREE.TextureLoader();
const loader = new GLTFLoader();
loader.setDRACOLoader(new OldDracoLoader());
const t0 = performance.now();
loader.load(BASE + 'terrain.glb', (gltf) => {
  const root = gltf.scene; root.scale.setScalar(100); /* glb root node is scaled 0.01 but geometry is already metres (Access Mars multiplies by 100) */ scene.add(root); root.updateMatrixWorld(true);
  root.traverse((o) => {
    if (!o.isMesh) return;
    let n = o, name = o.name; // metadata lives in the node name (mesh or a parent)
    while (n && !/TYPE_/.test(name)) { n = n.parent; name = n ? n.name : ''; }
    if (/TYPE_TILE/.test(name)) {
      const id = /ID_(\d+)/.exec(name)[1];
      o.visible = false; // hidden until its photo texture arrives
      // Access Mars ships 64-128 px greyscale placeholder tiles where no photo exists: tint them to terrain ochre so they do not read as a grey slab
      const tex = tl.load(BASE + 'tiles/' + id + '.jpg', (t) => { stats.texLoaded++; const sp = spread(t.image); if (sp < 12) o.material.color.setRGB(0.95, 0.42, 0.22); else if (sp < 40) o.material.color.setRGB(1.0, 0.62, 0.42); /* pale grey photo tiles: warm to match the ochre terrain */ o.visible = true; });
      tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      o.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
      // Where the photo mosaic has no colour (grey fill), grade texels towards terrain ochre so no grey slab shows: SIMULATED fill, not data
      o.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <map_fragment>', '#include <map_fragment>\n  { float mx = max(diffuseColor.r, max(diffuseColor.g, diffuseColor.b)), mn = min(diffuseColor.r, min(diffuseColor.g, diffuseColor.b)); float g = 1.0 - smoothstep(0.03, 0.10, (mx - mn) / max(mx, 0.05)); diffuseColor.rgb = mix(diffuseColor.rgb, dot(diffuseColor.rgb, vec3(0.3, 0.59, 0.11)) * vec3(1.35, 0.85, 0.55), g); }'); };
      o.castShadow = true; o.receiveShadow = true;
      state.tiles.push(o);
      stats.tris += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
    } else if (/TYPE_SIMPLE/.test(name)) { o.visible = false; state.simple = o; }
    else if (/TYPE_BACKGROUND/.test(name)) {
      const tex = tl.load(BASE + 'background.jpg'); tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace;
      o.material = new THREE.MeshBasicMaterial({ map: tex, fog: false, color: 0xd8b8a0 });
      state.bg = o;
    } else o.visible = false;
  });
  console.log('glb parsed ms', performance.now() - t0, 'tiles', state.tiles.length);
  const t1 = performance.now();
  buildHeightmap();
  stats.heightmapMs = performance.now() - t1;
  stats.loadMs = t1 - t0;
  const h = groundRaycast(0, 0); state.pos.set(0, h ?? 0, 0);
  state.eyeY = state.pos.y + EYE;
  state.ready = true; msg.style.display = 'none';
  route3d = mountRoute3d({ scene, state, groundRaycast, hAt, container: document.getElementById('walk-view'), eye: EYE }); api.route3d = route3d;
  window.__spike = api; window.__app = api; app.set({ walkReady: true });
}, undefined, (e) => { console.error(e); msg.textContent = 'Load failed: ' + e.message; });

// ---- heightmap: shared builder (terrain/heightmap.js), published for the Map view ----
let H = new Float32Array(N * N);
function buildHeightmap() {
  const hm = buildHm(state.tiles, { half_m: HALF, cell_m: CELL });
  stats.holes = hm.holes;
  H = hm.data.map((y) => (Number.isNaN(y) ? 0 : y)); // walking wants a number everywhere; Map keeps no-data
  provideHeightmap(hm, { name: 'Access Mars 0.5 m' });
}
function hAt(x, z) { // bilinear
  const fx = (x + HALF) / CELL - 0.5, fz = (z + HALF) / CELL - 0.5;
  const i = Math.max(0, Math.min(N - 2, Math.floor(fx))), j = Math.max(0, Math.min(N - 2, Math.floor(fz)));
  const tx = Math.max(0, Math.min(1, fx - i)), tz = Math.max(0, Math.min(1, fz - j));
  const a = H[j * N + i], b = H[j * N + i + 1], c = H[(j + 1) * N + i], d = H[(j + 1) * N + i + 1];
  return (a * (1 - tx) + b * tx) * (1 - tz) + (c * (1 - tx) + d * tx) * tz;
}
// central difference over a +-1 m baseline (a footstep pair)
function gradient(x, z, s = 1) { return [(hAt(x + s, z) - hAt(x - s, z)) / (2 * s), (hAt(x, z + s) - hAt(x, z - s)) / (2 * s)]; }

// ---- ground height by raycast on the detailed tile meshes ----
const ray = new THREE.Raycaster(), DOWN = new THREE.Vector3(0, -1, 0), ORG = new THREE.Vector3();
function groundRaycast(x, z) {
  ORG.set(x, 200, z); ray.set(ORG, DOWN);
  const hit = ray.intersectObjects(state.tiles, false);
  return hit.length ? hit[0].point.y : null;
}

// ---- input ----
addEventListener('keydown', (e) => { if (app.get().view === 'walk') state.keys[e.code] = true; });
addEventListener('keyup', (e) => { state.keys[e.code] = false; });
msg.addEventListener('click', () => renderer.domElement.requestPointerLock());
app.on((st) => { if (st.view !== 'walk') { state.keys = {}; if (document.pointerLockElement) document.exitPointerLock(); } else if (state.ready) { msg.textContent = 'Click to walk (WASD, mouse, Shift = run, Esc = release)'; msg.style.display = 'flex'; } resize(); });
renderer.domElement.addEventListener('click', () => renderer.domElement.requestPointerLock());
document.addEventListener('pointerlockchange', () => {
  if (!state.ready || app.get().view !== 'walk') return;
  msg.textContent = 'Click to walk (WASD, mouse, Shift = run, Esc = release)';
  msg.style.display = document.pointerLockElement ? 'none' : 'flex';
});
document.addEventListener('mousemove', (e) => {
  if (!document.pointerLockElement) return;
  state.yaw -= e.movementX * 0.0022; state.pitch = Math.max(-1.4, Math.min(1.4, state.pitch - e.movementY * 0.0022));
});
function resize() { const c = renderer.domElement.parentElement; const w = c.clientWidth || innerWidth, h = c.clientHeight || innerHeight; camera.aspect = w / h; camera.updateProjectionMatrix(); renderer.setSize(w, h); }
addEventListener('resize', resize);
resize();

// ---- movement ----
const stat = { frames: 0, t: performance.now(), fps: 0 };
let last = performance.now(), maxDiff = 0;
function step(dt) {
  const k = state.keys;
  const fx = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
  const sx = (k.KeyD || k.ArrowRight ? 1 : 0) - (k.KeyA || k.ArrowLeft ? 1 : 0);
  const sinY = Math.sin(state.yaw), cosY = Math.cos(state.yaw);
  let dx = -sinY * fx + cosY * sx, dz = -cosY * fx - sinY * sx;
  const len = Math.hypot(dx, dz);
  const [gx, gz] = gradient(state.pos.x, state.pos.z);
  state.slope = Math.atan(Math.hypot(gx, gz)) * 180 / Math.PI;
  if (len > 0) {
    dx /= len; dz /= len;
    const deg = Math.atan(gx * dx + gz * dz) * 180 / Math.PI; // >0 = uphill in travel direction
    state.mult = deg > 0 ? Math.max(0.25, 1 - 0.0375 * deg) : Math.min(1.15, 1 - 0.01 * deg);
    const sp = BASE_SPEED * (k.ShiftLeft ? 1.8 : 1) * state.mult;
    state.speed = sp;
    state.pos.x = Math.max(-HALF + 1, Math.min(HALF - 1, state.pos.x + dx * sp * dt));
    state.pos.z = Math.max(-HALF + 1, Math.min(HALF - 1, state.pos.z + dz * sp * dt));
  } else state.speed = 0;
  const ry = groundRaycast(state.pos.x, state.pos.z);
  if (ry !== null) { state.pos.y = ry; maxDiff = Math.max(maxDiff, Math.abs(ry - hAt(state.pos.x, state.pos.z))); }
  state.eyeY += (state.pos.y + EYE - state.eyeY) * Math.min(1, dt * 12);
}
function frame(now) {
  requestAnimationFrame(frame);
  if (app.get().view !== 'walk') { last = now; return; }
  const dt = Math.min(0.1, (now - last) / 1000); last = now;
  if (state.ready) {
    step(dt);
    camera.position.set(state.pos.x, state.eyeY, state.pos.z);
    camera.rotation.set(state.pitch, state.yaw, 0, 'YXZ');
    sky.update(camera.position);
    if (route3d) route3d.update(dt, state.slope);
  }
  renderer.render(scene, camera);
  stat.frames++;
  if (now - stat.t > 1000) { stat.fps = stat.frames * 1000 / (now - stat.t); stat.frames = 0; stat.t = now; }
  if (state.ready) hud.update({ slopeDeg: state.slope, speed: state.speed, mult: state.mult, x: state.pos.x, z: state.pos.z });
}
requestAnimationFrame(frame);

// ---- test API (used by the headless check) ----
const api = {
  sky, state, stats, get H() { return H; }, hAt, gradient, groundRaycast, N, CELL, maxDiff: () => maxDiff, fps: () => stat.fps,
  tp(x, z, yaw = 0, pitch = 0) { state.pos.set(x, groundRaycast(x, z) ?? 0, z); state.eyeY = state.pos.y + EYE; state.yaw = yaw; state.pitch = pitch; },
  key(c, v) { state.keys[c] = v; },
  gridVsRay() { let s = 0, mx = 0, n = 0; for (let i = 0; i < 2000; i++) { const x = (Math.random() - 0.5) * 120, z = (Math.random() - 0.5) * 120; const r = groundRaycast(x, z); if (r === null) continue; const d = Math.abs(r - hAt(x, z)); s += d; mx = Math.max(mx, d); n++; } return { meanAbs: s / n, max: mx, n }; },
  simpleVsTiles() {
    if (!state.simple) return null; state.simple.visible = true; state.simple.updateMatrixWorld(true);
    const r = new THREE.Raycaster(); let s = 0, mx = 0, n = 0;
    for (let i = 0; i < 400; i++) {
      const x = (Math.random() - 0.5) * 120, z = (Math.random() - 0.5) * 120;
      r.set(new THREE.Vector3(x, 200, z), DOWN); const h = r.intersectObject(state.simple, false); const hy = groundRaycast(x, z);
      if (h.length && hy !== null) { const d = Math.abs(h[0].point.y - hy); s += d; mx = Math.max(mx, d); n++; }
    }
    state.simple.visible = false; return { meanAbs: s / n, max: mx, n };
  },
  slopeStats() { let mx = 0, s = 0; const a = []; for (let j = 4; j < N - 4; j++) for (let i = 4; i < N - 4; i++) { const x = -HALF + (i + .5) * CELL, z = -HALF + (j + .5) * CELL; const [gx, gz] = gradient(x, z); const d = Math.atan(Math.hypot(gx, gz)) * 180 / Math.PI; a.push(d); } a.sort((p, q) => p - q); return { median: a[a.length >> 1], p95: a[Math.floor(a.length * .95)], max: a[a.length - 1] }; },
};
