// The 3D view: Access Mars terrain and skyline (real Curiosity imagery), its haze, the rover (NASA's Space
// Exploration Vehicle model),
// the route band on the ground. First person at eye height.
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { getTerrainScene, sceneToThree } from '../../core/terrainScene.js';
import { RADIO, ROVER, CANDIDATES, radioShadowMask, roverField } from '../../core/index.js';
import { steepWallLines } from './steepBorder.js';
import { DISPLAY as D } from './display.js';
import { createSky, skyFog, sunDirection } from './sky.js';

const ACCENT = 0x4fcbff; // --accent in styles/tokens.css

export function createScene3d(host, t) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.append(renderer.domElement);
  const scene = new THREE.Scene();
  // Sky and horizon: the day sky dome (sky.js) behind the Access Mars skyline mesh (background.jpg, from
  // Curiosity's images); the skyline and the ground fade into the haze, which is the sky's horizon colour
  const haze = skyFog();
  scene.background = haze.color;
  scene.fog = new THREE.FogExp2(haze.color, haze.density);
  const sky = createSky();
  scene.add(sky.mesh);
  const cam = new THREE.PerspectiveCamera(D.fovDeg, 1, 0.08, 6000);
  cam.rotation.order = 'YXZ';
  const eye = RADIO.eyeHeightM.value;

  let terrainRoot = null;
  const bands = {};
  const patch = groundPatch(t);
  scene.add(patch);
  // ground cues near the walker (specs/feedback-1.md, Walk: display): steep ground and radio shadow edges.
  // Built once; the fade with distance runs in the shader (no per-frame work)
  const cues = [steepWall(t), radioDots(t)].filter(Boolean);
  for (const c of cues) scene.add(c);
  // the rover: NASA's Space Exploration Vehicle model (public/models/sev.glb), loaded in the background; the
  // simple box model stands in until it is there and stays if it fails to load
  const rover = new THREE.Group();
  rover.rotation.order = 'YXZ';
  const box = roverBox();
  rover.add(box);
  sceneToThree(ROVER.x, t.heightAt(ROVER.x, ROVER.z), ROVER.z, rover.position);
  scene.add(rover);
  const shadow = contactShadow();
  scene.add(shadow);
  for (const l of roverLights()) scene.add(l);
  let sev = null, sevFade = null, firstFrame = true, disposed = false;
  const sevReady = loadSev().then((m) => {
    if (disposed) { disposeTree(m); return; }
    sev = m;
    rover.add(sev);
    // arrived after the first frame: fade it in over the box, no pop
    if (!firstFrame) { sevFade = { t0: performance.now() }; setOpacity(sev, 0); } else rover.remove(box);
  }).catch((e) => console.warn('rover model failed to load, keeping the simple model', e));

  function resize() {
    const w = host.clientWidth || window.innerWidth, h = host.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = '100%'; renderer.domElement.style.height = '100%';
    cam.aspect = w / h; cam.updateProjectionMatrix();
  }
  resize();
  window.addEventListener('resize', resize);

  async function loadTerrain() {
    // the walk's first frame waits for the rover model too, but never longer than D.roverWaitMs
    const [ts] = await Promise.all([getTerrainScene(), Promise.race([sevReady, new Promise((r) => setTimeout(r, D.roverWaitMs))])]);
    terrainRoot = ts.root;
    scene.add(terrainRoot);
    return ts;
  }

  /** Cyan band on the ground along scene points [{x,z}]. */
  function setBand(key, points, visible = true) {
    if (!bands[key]) { bands[key] = band(t, points); scene.add(bands[key]); }
    bands[key].visible = visible;
  }

  /**
   * Park the rover at the start point: heading (scene radians, 0 = north), centre moved `shift` m forward.
   * The body is tilted to the ground under its wheels (front and rear axle, both sides) and set so that no
   * wheel sinks into the walk grid.
   */
  function placeRover(yaw, shift) {
    const fx = Math.sin(yaw), fz = Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
    const x = ROVER.x + fx * shift, z = ROVER.z + fz * shift;
    const g = (a, b) => t.heightAt(x + fx * a + sx * b, z + fz * a + sz * b);
    const aF = D.roverFrontAxleM, aR = D.roverRearAxleM, aM = D.roverMidAxleM, b = D.roverTrackHalfM;
    const front = (g(aF, -b) + g(aF, b)) / 2, rear = (g(aR, -b) + g(aR, b)) / 2;
    const left = (g(aF, -b) + g(aR, -b)) / 2, right = (g(aF, b) + g(aR, b)) / 2;
    const pitch = Math.atan2(front - rear, aF - aR), roll = Math.atan2(right - left, 2 * b);
    const plane = (a, s) => rear + (front - rear) * (a - aR) / (aF - aR) + (right - left) * s / (2 * b);
    let lift = 0; // the lowest point of the tilted plane under a wheel that the ground rises above
    for (const a of [aF, aM, aR]) for (const s of [-b, b]) lift = Math.max(lift, g(a, s) - plane(a, s));
    sceneToThree(x, plane(0, 0) + lift, z, rover.position);
    rover.rotation.set(pitch, -yaw, roll);
    placeShadow(shadow, t, x, z, yaw);
  }

  function setPose(x, z, yaw, pitch) {
    sceneToThree(x, t.heightAt(x, z) + eye, z, cam.position);
    cam.rotation.set(pitch, -yaw, 0);
    cam.updateMatrixWorld();
    sky.follow(cam);
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

  function render() {
    // the steep border's stripes drift slowly (a uniform; the geometry is built once)
    for (const c of cues) if (c.material.uniforms.time) c.material.uniforms.time.value = performance.now() / 1000;
    if (sevFade) {
      const k = Math.min(1, (performance.now() - sevFade.t0) / D.roverFadeMs);
      setOpacity(sev, k);
      if (k >= 1) { sevFade = null; rover.remove(box); setOpacity(sev, 1); }
    }
    firstFrame = false;
    renderer.render(scene, cam);
  }

  function dispose() {
    disposed = true;
    window.removeEventListener('resize', resize);
    if (terrainRoot) scene.remove(terrainRoot); // shared object: leave it intact for other views
    for (const b of Object.values(bands)) { b.geometry.dispose(); b.material.dispose(); }
    patch.geometry.dispose(); patch.material.dispose();
    for (const c of cues) { c.geometry.dispose(); c.material.dispose(); }
    disposeTree(box);
    if (sev) disposeTree(sev);
    shadow.geometry.dispose(); shadow.material.dispose();
    sky.dispose();
    renderer.dispose();
    renderer.domElement.remove();
  }

  return { renderer, scene, cam, loadTerrain, setBand, placeRover, setPose, project, viewDir, render, dispose, resize, cues };
}

// ---------- ground cues: edge of the closed area (steep) and of the radio shadow ----------
/** A colour token of the shared style sheet (styles/tokens.css), so the 3D cues use the maps' colours. */
function token(name, fallback) {
  const v = typeof document !== 'undefined' ? getComputedStyle(document.documentElement).getPropertyValue(name).trim() : '';
  return new THREE.Color(v || fallback);
}

/**
 * Points on the edge of a grid mask: the midpoint between a masked cell and each of its 4 unmasked
 * neighbours, thinned so that no two points lie closer than `spacing` metres (one pass, a hash grid).
 */
function maskEdge(t, inMask, spacing) {
  const n = t.n, out = [], taken = new Map();
  const key = (x, z) => Math.floor(x / spacing) + ',' + Math.floor(z / spacing);
  const near = (x, z) => {
    const cx = Math.floor(x / spacing), cz = Math.floor(z / spacing);
    for (let a = -1; a <= 1; a++) for (let b = -1; b <= 1; b++) {
      const l = taken.get((cx + a) + ',' + (cz + b));
      if (l && l.some((p) => Math.hypot(p.x - x, p.z - z) < spacing)) return true;
    }
    return false;
  };
  for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
    const i = r * n + c;
    if (!inMask(i)) continue;
    const a = t.centerOf(c, r);
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const cc = c + dc, rr = r + dr;
      if (cc < 0 || rr < 0 || cc >= n || rr >= n || inMask(rr * n + cc)) continue;
      const b = t.centerOf(cc, rr), x = (a.x + b.x) / 2, z = (a.z + b.z) / 2;
      if (near(x, z)) continue;
      const k = key(x, z);
      if (!taken.has(k)) taken.set(k, []);
      taken.get(k).push({ x, z });
      out.push({ x, z });
    }
  }
  return out;
}

// shared fade: full up to fadeFull metres from the eye (horizontal), gone at fadeMax
const FADE_GLSL = `
  uniform float fadeFull, fadeMax;
  float cueFade(vec3 w) { return 1.0 - smoothstep(fadeFull, fadeMax, distance(w.xz, cameraPosition.xz)); }
  // the same haze as the terrain (sky.js skyFog): the colour fades into the sky's horizon colour with distance
  uniform vec3 fogColor; uniform float fogDensity;
  vec3 hazed(vec3 c, vec3 w) { float d = distance(w, cameraPosition); return mix(c, fogColor, 1.0 - exp(-fogDensity * fogDensity * d * d)); }`;
const hazeUniforms = () => { const f = skyFog(); return { fogColor: { value: f.color }, fogDensity: { value: f.density } }; };

/**
 * Steep ground: one low translucent wall along the smoothed outline of the closed ground (steepBorder.js):
 * a crisp bright line at the foot, a fill fading out upwards, faint stripes drifting along it. Depth-tested
 * against the terrain (the hill hides what lies behind it), no depth write, double sided.
 */
function steepWall(t) {
  // the planned routes to every candidate spot keep their open ground (the ways home in the rover's cost
  // field, which the Walk builds before the scene): the border never runs across them
  const home = roverField(t);
  const lines = steepWallLines(t, D, CANDIDATES.map((c) => home.pathFrom(c.x, c.z)));
  if (!lines.length) return null;
  const pos = [], wall = [], idx = [];
  const H = D.steepWallHeightM, B = D.steepWallBelowM;
  for (const { pts, closed } of lines) {
    const p = closed ? [...pts, pts[0]] : pts;
    const o0 = pos.length / 3;
    let along = 0;
    p.forEach((q, k) => {
      if (k) along += Math.hypot(q.x - p[k - 1].x, q.z - p[k - 1].z);
      const y = t.heightAt(q.x, q.z);
      // wall.x: height above the walk grid (m), wall.y: metres along the line
      pos.push(q.x, y - B, -q.z, q.x, y + H, -q.z);
      wall.push(-B, along, H, along);
      if (k) { const o = o0 + (k - 1) * 2; idx.push(o, o + 2, o + 1, o + 1, o + 2, o + 3); }
    });
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('wall', new THREE.Float32BufferAttribute(wall, 2));
  g.setIndex(idx);
  const m = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: token('--steep', '#c2643a') }, fadeFull: { value: D.cueFadeFullM }, fadeMax: { value: D.cueFadeMaxM },
      height: { value: H }, lineM: { value: D.steepLineM }, linePx: { value: D.steepLinePx }, fill: { value: D.steepFillAlpha },
      stripeM: { value: D.steepStripeM }, stripeMS: { value: D.steepStripeMS }, time: { value: 0 }, ...hazeUniforms(),
    },
    vertexShader: `
      attribute vec2 wall; varying vec2 vWall; varying vec3 vW;
      void main() {
        vWall = wall;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float height, lineM, linePx, fill, stripeM, stripeMS, time;
      varying vec2 vWall; varying vec3 vW;
      ${FADE_GLSL}
      void main() {
        float f = cueFade(vW);
        if (f < 0.01) discard;
        float hm = vWall.x;                       // metres above the walk grid
        float px = max(fwidth(hm), 1e-4);         // metres per pixel up the wall
        // crisp line at the foot: a band around the walk grid height, lineM or linePx pixels tall
        float half_ = 0.5 * max(lineM, px * linePx);
        float line = 1.0 - smoothstep(half_ - px * 0.75, half_ + px * 0.75, abs(hm));
        // translucent fill, strongest at the foot, gone at the top (full below the foot, where the
        // Access Mars mesh lies lower than the walk grid)
        float u = clamp(hm / height, 0.0, 1.0);
        float body = fill * pow(1.0 - u, 1.6);
        // a soft glow just above the line, so the foot reads first
        float glow = 0.35 * exp(-max(hm, 0.0) / 0.12);
        // faint vertical stripes drifting along the wall (anti-aliased)
        float s = fract(vWall.y / stripeM - time * stripeMS / stripeM);
        float sw = fwidth(vWall.y / stripeM) + 1e-4;
        float stripe = smoothstep(0.0, sw, s) * (1.0 - smoothstep(0.35, 0.35 + sw, s));
        body *= 0.55 + 0.45 * stripe;
        float a = f * max(line, min(1.0, body + glow));
        if (a < 0.005) discard;
        gl_FragColor = vec4(hazed(mix(color, vec3(1.0, 0.82, 0.66), 0.4 * line), vW), a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 3;
  mesh.userData.count = lines.length;
  return mesh;
}

/** Radio shadow: a dotted line on the ground along the edge of the shadow (no line of sight to the rover). */
function radioDots(t) {
  const shadow = radioShadowMask(t);
  const pts = maskEdge(t, (i) => shadow[i] === 1, D.radioDotSpacingM);
  if (!pts.length) return null;
  const r = D.radioDotRadiusM;
  const pos = new Float32Array(pts.length * 12), uv = new Float32Array(pts.length * 8), idx = new Uint32Array(pts.length * 6);
  pts.forEach((p, k) => {
    [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([u, v], j) => {
      const x = p.x + u * r, z = p.z + v * r;
      pos.set([x, t.heightAt(x, z) + D.radioDotLiftM, -z], k * 12 + j * 3);
      uv.set([u, v], k * 8 + j * 2);
    });
    const o = k * 4;
    idx.set([o, o + 1, o + 2, o, o + 2, o + 3], k * 6);
  });
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  g.setIndex(new THREE.BufferAttribute(idx, 1));
  const m = new THREE.ShaderMaterial({
    uniforms: { color: { value: token('--advisory', '#5b8cff') }, fadeFull: { value: D.cueFadeFullM }, fadeMax: { value: D.cueFadeMaxM }, ...hazeUniforms() },
    vertexShader: `
      varying vec2 vUv; varying vec3 vW;
      void main() {
        vUv = uv;
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform vec3 color; varying vec2 vUv; varying vec3 vW;
      ${FADE_GLSL}
      void main() {
        float d = length(vUv);
        float a = cueFade(vW) * (1.0 - smoothstep(0.75, 1.0, d));
        if (a < 0.01) discard;
        gl_FragColor = vec4(hazed(color, vW), a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.frustumCulled = false;
  mesh.renderOrder = 2;
  mesh.userData.count = pts.length;
  return mesh;
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
  const p = smooth(points, 4);
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
  // soft edges across the band; fades in a few metres ahead of the eye (no wide wedge at the feet) and
  // into the haze far away, like the terrain
  const m = new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(ACCENT) }, opacity: { value: 0.62 },
      near: { value: D.bandFadeNearM }, full: { value: D.bandFadeFullM },
      fogColor: { value: skyFog().color }, fogDensity: { value: skyFog().density },
    },
    vertexShader: `
      varying vec2 vUv; varying float vDepth;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vDepth = -mv.z;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 color; uniform float opacity, near, full, fogDensity; uniform vec3 fogColor;
      varying vec2 vUv; varying float vDepth;
      void main() {
        float edge = smoothstep(0.0, 0.3, vUv.x) * smoothstep(1.0, 0.7, vUv.x);
        float fade = smoothstep(near, full, vDepth);
        float fog = 1.0 - exp(-fogDensity * fogDensity * vDepth * vDepth);
        gl_FragColor = vec4(mix(color, fogColor, fog), opacity * edge * fade);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, side: THREE.DoubleSide,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 2;
  return mesh;
}

// ---------- ground patch over the strip Access Mars has no imagery for (behind and under Curiosity) ----------
function groundPatch(t) {
  const yaw = (D.roverHeadingDeg * Math.PI) / 180;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), rx = Math.cos(yaw), rz = -Math.sin(yaw);
  const step = t.cell / 2, half = D.patchWidthM / 2;
  const nu = Math.ceil((D.patchToM - D.patchFromM) / step), nv = Math.ceil(D.patchWidthM / step);
  const pos = [], col = [], idx = [];
  const base = new THREE.Color(D.patchColor);
  for (let i = 0; i <= nu; i++) {
    const u = D.patchFromM + (i / nu) * (D.patchToM - D.patchFromM);
    for (let j = 0; j <= nv; j++) {
      const v = -half + (j / nv) * D.patchWidthM;
      const x = ROVER.x + fx * u + rx * (v + D.patchRightM), z = ROVER.z + fz * u + rz * (v + D.patchRightM);
      pos.push(x, t.heightAt(x, z) + 0.04, -z);
      // soft rim: fully opaque inside, fading over the last metre on every side
      const a = Math.min(1, (half - Math.abs(v)) / 1, (u - D.patchFromM) / 1, (D.patchToM - u) / 1);
      col.push(base.r, base.g, base.b, Math.max(0, a));
      if (i && j) { const a0 = (i - 1) * (nv + 1) + j - 1, b0 = i * (nv + 1) + j - 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 4));
  g.setIndex(idx);
  const m = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 1;
  return mesh;
}

// ---------- rover ----------
/** Stand-in until the SEV model is loaded, and the fallback if it fails: simple primitives (label: simulated). */
function roverBox() {
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
  return g;
}

/**
 * Light for the rover only (the terrain is unlit: it carries the real light of Curiosity's photos). A sun from
 * D.sunAzimuthDeg / D.sunElevationDeg and a warm sky / ground fill (assumption: display choices).
 */
function roverLights() {
  const sun = new THREE.DirectionalLight(0xfff1e0, D.sunIntensity);
  sun.position.copy(sunDirection()); // the same direction as the sun disc in the sky (sky.js)
  const fill = new THREE.HemisphereLight(0xf3dcc4, 0x9a6a4c, D.fillIntensity);
  return [sun, fill];
}

const SEV_URL = () => (import.meta.env.BASE_URL || './') + 'models/sev.glb';
/**
 * NASA's Space Exploration Vehicle (public/models/sev.glb, mesh compressed with meshopt), scaled to its real
 * length D.roverLengthM, centred on the footprint, wheels on y = 0, front towards local -z like the box.
 */
function loadSev() {
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setMeshoptDecoder(MeshoptDecoder);
    loader.load(SEV_URL(), (gltf) => {
      const m = gltf.scene;
      m.traverse((o) => {
        if (!o.isMesh) return;
        // the file's normal map has strength 0 and its specular map is not needed at this size: one plain
        // textured material (cheaper shader), lit by roverLights
        const src = o.material;
        o.material = new THREE.MeshStandardMaterial({ map: src.map, roughness: D.roverRoughness, metalness: 0, side: THREE.DoubleSide });
        for (const k of ['normalMap', 'specularIntensityMap', 'specularColorMap']) if (src[k] && src[k] !== src.map) src[k].dispose();
        src.dispose();
      });
      const bb = new THREE.Box3().setFromObject(m);
      const size = bb.getSize(new THREE.Vector3()), c = bb.getCenter(new THREE.Vector3());
      const k = D.roverLengthM / size.z;
      // the model's front (cabin windows) looks along its +z: turn it to -z, the rover group's forward
      const inner = new THREE.Group();
      m.position.set(-c.x, -bb.min.y, -c.z);
      inner.add(m);
      inner.scale.setScalar(k);
      inner.rotation.y = Math.PI;
      const outer = new THREE.Group();
      outer.add(inner);
      resolve(outer);
    }, undefined, reject);
  });
}

function setOpacity(obj, k) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    const tr = k < 1;
    if (o.material.transparent !== tr) { o.material.transparent = tr; o.material.needsUpdate = true; }
    o.material.opacity = k;
  });
}

function disposeTree(obj) {
  obj.traverse((o) => {
    if (!o.isMesh) return;
    o.geometry.dispose();
    if (o.material.map) o.material.map.dispose();
    o.material.dispose();
  });
}

/**
 * Soft dark shade on the ground under the rover (contact shadow): a rounded box under the body and a darker
 * spot under each wheel, on a grid that follows the walk grid (placeShadow).
 */
function contactShadow() {
  const nu = 48, nv = 36;
  const hl = D.roverHalfLenM + D.shadowSpreadM, hw = D.roverHalfWidthM + D.shadowSpreadM;
  const ss = THREE.MathUtils.smoothstep;
  const pos = new Float32Array((nu + 1) * (nv + 1) * 3), col = new Float32Array((nu + 1) * (nv + 1) * 4), idx = [];
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = (i / nu) * 2 - 1, v = (j / nv) * 2 - 1, r = Math.pow(u ** 4 + v ** 4, 0.25);
    let a = D.shadowAlpha * (1 - ss(r, 0.55, 1));
    const am = u * hl, bm = v * hw; // metres from the centre, along and across
    for (const ax of [D.roverFrontAxleM, D.roverMidAxleM, D.roverRearAxleM]) for (const sb of [-1, 1]) {
      const d = Math.hypot((am - ax) / 0.55, (bm - sb * D.roverTrackHalfM) / 0.35);
      a = Math.max(a, D.shadowWheelAlpha * (1 - ss(d, 0.4, 1)));
    }
    col.set([0.12, 0.07, 0.04, a], (i * (nv + 1) + j) * 4);
    if (i && j) { const a0 = (i - 1) * (nv + 1) + j - 1, b0 = i * (nv + 1) + j - 1; idx.push(a0, b0, a0 + 1, a0 + 1, b0, b0 + 1); }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  g.setAttribute('color', new THREE.BufferAttribute(col, 4));
  g.setIndex(idx);
  g.userData.grid = { nu, nv };
  const m = new THREE.MeshBasicMaterial({
    vertexColors: true, transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3,
  });
  const mesh = new THREE.Mesh(g, m);
  mesh.renderOrder = 1.5; // over the ground patch, under the route band
  mesh.frustumCulled = false;
  return mesh;
}
function placeShadow(mesh, t, x, z, yaw) {
  const { nu, nv } = mesh.geometry.userData.grid;
  const fx = Math.sin(yaw), fz = Math.cos(yaw), sx = Math.cos(yaw), sz = -Math.sin(yaw);
  const hl = D.roverHalfLenM + D.shadowSpreadM, hw = D.roverHalfWidthM + D.shadowSpreadM;
  const pos = mesh.geometry.attributes.position;
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const a = ((i / nu) * 2 - 1) * hl, b = ((j / nv) * 2 - 1) * hw;
    const px = x + fx * a + sx * b, pz = z + fz * a + sz * b;
    pos.setXYZ(i * (nv + 1) + j, px, t.heightAt(px, pz) + 0.05, -pz);
  }
  pos.needsUpdate = true;
  mesh.geometry.computeBoundingSphere();
}
