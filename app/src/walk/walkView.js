import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { OldDracoLoader } from './oldDraco.js';
import { app } from '../state.js';

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

scene.add(new THREE.HemisphereLight(0xe9b896, 0x6b3a22, 0.9));
const sun = new THREE.DirectionalLight(0xfff0e0, 3.2);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
const sc = sun.shadow.camera; sc.left = -40; sc.right = 40; sc.top = 40; sc.bottom = -40; sc.near = 1; sc.far = 300;
sun.shadow.bias = -0.0008; sun.shadow.normalBias = 0.05;
scene.add(sun, sun.target);
const SUN_DIR = new THREE.Vector3(-0.5, 0.55, -0.4).normalize(); // placeholder; real value from Mars24 later
function placeSun() { sun.position.copy(camera.position).addScaledVector(SUN_DIR, 120); sun.target.position.copy(camera.position); sun.target.updateMatrixWorld(); }

const state = { tiles: [], ready: false, yaw: 0, pitch: 0, pos: new THREE.Vector3(), eyeY: 0, keys: {}, speed: 0, slope: 0, mult: 1 };
const hud = document.getElementById('hud'), msg = document.getElementById('msg');
const stats = { heightmapMs: 0, gridCells: N * N, tris: 0, texLoaded: 0 };

// ---- load ----
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
      const tex = tl.load(BASE + 'tiles/' + id + '.jpg', () => { stats.texLoaded++; });
      tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
      o.material = new THREE.MeshStandardMaterial({ map: tex, roughness: 1, metalness: 0 });
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
  window.__spike = api; window.__app = api; app.set({ walkReady: true });
}, undefined, (e) => { console.error(e); msg.textContent = 'Load failed: ' + e.message; });

// ---- heightmap: rasterise world-space triangles into a 0.5 m grid (top-most surface wins) ----
const H = new Float32Array(N * N).fill(NaN);
function buildHeightmap() {
  const v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
  for (const m of state.tiles) {
    const pos = m.geometry.attributes.position, idx = m.geometry.index;
    const cnt = idx ? idx.count : pos.count;
    for (let t = 0; t < cnt; t += 3) {
      for (let k = 0; k < 3; k++) v[k].fromBufferAttribute(pos, idx ? idx.getX(t + k) : t + k).applyMatrix4(m.matrixWorld);
      const minx = Math.min(v[0].x, v[1].x, v[2].x), maxx = Math.max(v[0].x, v[1].x, v[2].x);
      const minz = Math.min(v[0].z, v[1].z, v[2].z), maxz = Math.max(v[0].z, v[1].z, v[2].z);
      const i0 = Math.max(0, Math.ceil((minx + HALF) / CELL - 0.5)), i1 = Math.min(N - 1, Math.floor((maxx + HALF) / CELL - 0.5));
      const j0 = Math.max(0, Math.ceil((minz + HALF) / CELL - 0.5)), j1 = Math.min(N - 1, Math.floor((maxz + HALF) / CELL - 0.5));
      const d = (v[1].z - v[2].z) * (v[0].x - v[2].x) + (v[2].x - v[1].x) * (v[0].z - v[2].z);
      if (Math.abs(d) < 1e-9) continue;
      for (let j = j0; j <= j1; j++) for (let i = i0; i <= i1; i++) {
        const x = -HALF + (i + 0.5) * CELL, z = -HALF + (j + 0.5) * CELL;
        const a = ((v[1].z - v[2].z) * (x - v[2].x) + (v[2].x - v[1].x) * (z - v[2].z)) / d;
        const b = ((v[2].z - v[0].z) * (x - v[2].x) + (v[0].x - v[2].x) * (z - v[2].z)) / d;
        const c = 1 - a - b;
        if (a < -1e-6 || b < -1e-6 || c < -1e-6) continue;
        const y = a * v[0].y + b * v[1].y + c * v[2].y;
        const o = j * N + i; if (!(y <= H[o])) H[o] = y;
      }
    }
  }
  let holes = 0; for (let o = 0; o < H.length; o++) if (isNaN(H[o])) { holes++; H[o] = nearest(o); }
  stats.holes = holes;
}
function nearest(o) {
  const i = o % N, j = (o / N) | 0;
  for (let r = 1; r < 6; r++) for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
    const ii = i + di, jj = j + dj; if (ii < 0 || jj < 0 || ii >= N || jj >= N) continue;
    const y = H[jj * N + ii]; if (!isNaN(y)) return y;
  }
  return 0;
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
    placeSun();
  }
  renderer.render(scene, camera);
  stat.frames++;
  if (now - stat.t > 1000) { stat.fps = stat.frames * 1000 / (now - stat.t); stat.frames = 0; stat.t = now; }
  if (state.ready) hud.textContent =
    `SLOPE ${state.slope.toFixed(1)} deg (${(Math.tan(state.slope * Math.PI / 180) * 100).toFixed(0)} %)\n` +
    `SPEED ${state.speed.toFixed(2)} m/s  (x${state.mult.toFixed(2)})\n` +
    `POS   ${state.pos.x.toFixed(1)}, ${state.pos.z.toFixed(1)}  h ${state.pos.y.toFixed(2)} m\n` +
    `FPS   ${stat.fps.toFixed(0)}   heightmap ${N}x${N} @${CELL} m in ${stats.heightmapMs.toFixed(0)} ms`;
}
requestAnimationFrame(frame);

// ---- test API (used by the headless check) ----
const api = {
  state, stats, H, hAt, gradient, groundRaycast, N, CELL, maxDiff: () => maxDiff, fps: () => stat.fps,
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
