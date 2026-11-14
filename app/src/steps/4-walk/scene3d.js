// The 3D view: Access Mars terrain and skyline (real Curiosity imagery), its haze, the rover model,
// the route band on the ground. First person at eye height.
import * as THREE from 'three';
import { getTerrainScene, sceneToThree, ACCESS_MARS_FOG } from '../../core/terrainScene.js';
import { RADIO, ROVER } from '../../core/index.js';
import { DISPLAY as D } from './display.js';

const ACCENT = 0x4fcbff; // --accent in styles/tokens.css

export function createScene3d(host, t) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  // Sky and horizon: the Access Mars skyline mesh (background.jpg, from Curiosity's images) seen through
  // the scene's own haze; the haze colour is the sky, as in the original Access Mars scene.
  scene.background = new THREE.Color(ACCESS_MARS_FOG.color);
  scene.fog = new THREE.FogExp2(ACCESS_MARS_FOG.color, ACCESS_MARS_FOG.density);
  const cam = new THREE.PerspectiveCamera(D.fovDeg, 1, 0.08, 6000);
  cam.rotation.order = 'YXZ';
  const eye = RADIO.eyeHeightM.value;

  let terrainRoot = null;
  const bands = {};
  const rover = roverModel();
  sceneToThree(ROVER.x, t.heightAt(ROVER.x, ROVER.z), ROVER.z, rover.position);
  scene.add(rover);

  function resize() {
    const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  async function loadTerrain() {
    const ts = await getTerrainScene();
    terrainRoot = ts.root;
    scene.add(terrainRoot);
    return ts;
  }

  /** Cyan band on the ground along scene points [{x,z}]. */
  function setBand(key, points, visible = true) {
    if (!bands[key]) { bands[key] = band(t, points); scene.add(bands[key]); }
    bands[key].visible = visible;
  }

  /** Park the rover at the start point: heading (scene radians, 0 = north), centre moved `shift` m forward. */
  function placeRover(yaw, shift) {
    const x = ROVER.x + Math.sin(yaw) * shift, z = ROVER.z + Math.cos(yaw) * shift;
    sceneToThree(x, t.heightAt(x, z), z, rover.position);
    rover.rotation.y = -yaw;
  }

  function setPose(x, z, yaw, pitch) {
    sceneToThree(x, t.heightAt(x, z) + eye, z, cam.position);
    cam.rotation.set(pitch, -yaw, 0);
    cam.updateMatrixWorld();
  }

  const _v = new THREE.Vector3();
  /** Scene point -> screen pixels { x, y, visible } (relative to the host). */
  function project(x, y, z) {
    sceneToThree(x, y, z, _v).project(cam);
    const w = host.clientWidth, h = host.clientHeight;
    const visible = _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < 1.2 && Math.abs(_v.y) < 1.2;
    return { x: (_v.x + 1) / 2 * w, y: (1 - _v.y) / 2 * h, visible };
  }

  /** View direction in scene axes { x, y, z } (z north). */
  function viewDir() {
    cam.getWorldDirection(_v);
    return { x: _v.x, y: _v.y, z: -_v.z };
  }

  function render() { renderer.render(scene, cam); }

  function dispose() {
    window.removeEventListener('resize', resize);
    if (terrainRoot) scene.remove(terrainRoot); // shared object: leave it intact for other views
    for (const b of Object.values(bands)) { b.geometry.dispose(); b.material.map && b.material.map.dispose(); b.material.dispose(); }
    rover.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { renderer, scene, cam, loadTerrain, setBand, placeRover, setPose, project, viewDir, render, dispose, resize };
}

// ---------- route band ----------
function smooth(points, k = 3) {
  const out = [];
  for (let i = 0; i < points.length; i++) {
    let x = 0, z = 0, n = 0;
    for (let j = Math.max(0, i - k); j <= Math.min(points.length - 1, i + k); j++) { x += points[j].x; z += points[j].z; n++; }
    out.push({ x: x / n, z: z / n });
  }
  if (out.length) { out[0] = { x: points[0].x, z: points[0].z }; out[out.length - 1] = { x: points.at(-1).x, z: points.at(-1).z }; }
  return out;
}

function band(t, points) {
  const p = smooth(points);
  const pos = [], uv = [], idx = [];
  const w = D.bandWidthM / 2, lift = 0.07;
  let along = 0;
  for (let i = 0; i < p.length; i++) {
    const a = p[Math.max(0, i - 1)], b = p[Math.min(p.length - 1, i + 1)];
    let dx = b.x - a.x, dz = b.z - a.z;
    const l = Math.hypot(dx, dz) || 1; dx /= l; dz /= l;
    const nx = -dz, nz = dx;
    if (i) along += Math.hypot(p[i].x - p[i - 1].x, p[i].z - p[i - 1].z);
    for (const sgn of [-1, 1]) {
      const x = p[i].x + nx * w * sgn, z = p[i].z + nz * w * sgn;
      pos.push(x, t.heightAt(x, z) + lift, -z);
      uv.push(sgn < 0 ? 0 : 1, along);
    }
    if (i) { const o = (i - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  // soft edges across the band
  const c = document.createElement('canvas'); c.width = 64; c.height = 1;
  const x = c.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 64, 0);
  gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.25, 'rgba(255,255,255,0.85)');
  gr.addColorStop(0.75, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = gr; x.fillRect(0, 0, 64, 1);
  const tex = new THREE.CanvasTexture(c);
  const m = new THREE.MeshBasicMaterial({
    color: ACCENT, map: tex, transparent: true, opacity: 0.62, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 2;
  return mesh;
}

// ---------- rover model (simple primitives; label: simulated) ----------
function roverModel() {
  const g = new THREE.Group();
  const white = new THREE.MeshLambertMaterial({ color: 0xd9d4cc });
  const grey = new THREE.MeshLambertMaterial({ color: 0x8c8a86 });
  const dark = new THREE.MeshLambertMaterial({ color: 0x3a3836 });
  const add = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => {
    const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
  };
  // body (long axis along -z = forward)
  add(new THREE.BoxGeometry(1.9, 0.75, 2.6), white, 0, 1.05, 0);
  add(new THREE.BoxGeometry(2.1, 0.08, 2.9), grey, 0, 1.46, 0);
  // wheels and rocker arms
  const wheel = new THREE.CylinderGeometry(0.26, 0.26, 0.4, 20);
  for (const sx of [-1, 1]) {
    for (const z of [-1.15, 0, 1.15]) add(wheel, dark, sx * 1.25, 0.26, z, 0, 0, Math.PI / 2);
    add(new THREE.BoxGeometry(0.1, 0.1, 2.5), grey, sx * 1.1, 0.62, 0, 0.12 * sx, 0, 0);
  }
  // mast with head, power unit at the back, arm at the front
  add(new THREE.CylinderGeometry(0.07, 0.09, 1.0, 10), grey, 0.55, 1.95, -1.0);
  add(new THREE.BoxGeometry(0.55, 0.28, 0.32), white, 0.55, 2.55, -1.0);
  add(new THREE.CylinderGeometry(0.28, 0.28, 0.75, 14), dark, 0, 1.15, 1.55, Math.PI / 3, 0, 0);
  add(new THREE.BoxGeometry(0.12, 0.12, 1.1), grey, -0.4, 0.95, -1.75, 0.35, 0, 0);
  // light: only the rover is lit (the terrain carries its own real lighting in the photos)
  const sun = new THREE.DirectionalLight(0xffffff, 2.6); sun.position.set(3, 6, 2); g.add(sun); g.add(sun.target);
  g.add(new THREE.AmbientLight(0xffe6d0, 1.8));
  return g;
}
