// Mars on the opening screen: a 3D model (public/models/mars.glb) as a huge disc rising from the
// bottom, as wide as the screen at the bottom with its top at half height, turning slowly.
// zoomToGale() turns Gale crater to the centre (south up, as the crater view looks south) and zooms in.
// Display only; no values.

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const MODEL = (import.meta.env.BASE_URL || './') + 'models/mars.glb';
const SPIN = 0.0006; // rad per frame

// Gale crater on this model's texture, as direction angles in the model frame (y = north pole,
// lon measured from +z toward +x). Found by unrolling the texture to a lon/lat map: Gale shows as the
// dark-floored crater with its dark wind streak to the south at model lon 49.5 deg, lat -5.5 deg;
// Hellas, Syrtis Major and Olympus Mons put model lon + 88 to 92 deg = east longitude, so Gale
// (137.8 E, 5.4 S) fits. Display only.
const GALE_MODEL = { lon: THREE.MathUtils.degToRad(49.5), lat: THREE.MathUtils.degToRad(-5.5) };
const GALE_KM = 154, MARS_R_KM = 3390;

const easeInOut = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = (t) => Math.min(1, Math.max(0, t));

/**
 * The model is a low-poly sphere (~4k vertices), which shows straight edges at this size. Split each
 * triangle into n x n smaller ones (UVs interpolated inside the triangle) and push every vertex onto
 * the unit sphere. Returns a new non-indexed geometry with position, normal and uv.
 */
function smoothSphere(src, n) {
  const g = src.index ? src.toNonIndexed() : src;
  const P = g.attributes.position, U = g.attributes.uv;
  const triCount = P.count / 3, perTri = n * n;
  const pos = new Float32Array(triCount * perTri * 9), uv = new Float32Array(triCount * perTri * 6);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), p = new THREE.Vector3();
  const ta = new THREE.Vector2(), tb = new THREE.Vector2(), tc = new THREE.Vector2();
  let pi = 0, ui = 0;
  // barycentric grid point (i, j) of the current triangle, written to the buffers
  const put = (i, j) => {
    const u = i / n, v = j / n, w = 1 - u - v;
    p.set(0, 0, 0).addScaledVector(a, w).addScaledVector(b, u).addScaledVector(c, v).normalize();
    pos[pi++] = p.x; pos[pi++] = p.y; pos[pi++] = p.z;
    uv[ui++] = ta.x * w + tb.x * u + tc.x * v; uv[ui++] = ta.y * w + tb.y * u + tc.y * v;
  };
  for (let t = 0; t < triCount; t++) {
    a.fromBufferAttribute(P, 3 * t); b.fromBufferAttribute(P, 3 * t + 1); c.fromBufferAttribute(P, 3 * t + 2);
    ta.fromBufferAttribute(U, 3 * t); tb.fromBufferAttribute(U, 3 * t + 1); tc.fromBufferAttribute(U, 3 * t + 2);
    for (let j = 0; j < n; j++) {
      for (let i = 0; i < n - j; i++) {
        put(i, j); put(i + 1, j); put(i, j + 1);
        if (i + j < n - 1) { put(i + 1, j); put(i + 1, j + 1); put(i, j + 1); }
      }
    }
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos.subarray(0, pi), 3));
  out.setAttribute('normal', new THREE.BufferAttribute(pos.slice(0, pi), 3)); // unit sphere: normal = position
  out.setAttribute('uv', new THREE.BufferAttribute(uv.subarray(0, ui), 2));
  return out;
}

/** Build the planet into `wrap` (fills it). Returns { zoomToGale, dispose }. */
export function planetView(wrap) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  wrap.append(renderer.domElement);

  const scene = new THREE.Scene();
  // orthographic, 1 unit = 1 CSS pixel, origin at the screen centre
  const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1e6);

  // sun from the upper left and a little behind, so the limb is lit and the right side falls into night
  const SUN_IDLE = new THREE.Vector3(-1, 0.55, 0.35), SUN_ZOOM = new THREE.Vector3(-0.35, -0.5, 1);
  const sun = new THREE.DirectionalLight(0xfff3e6, 3.4);
  sun.position.copy(SUN_IDLE);
  scene.add(sun, new THREE.AmbientLight(0xffffff, 0.05));

  const planet = new THREE.Group();   // position + scale (radius in px)
  const orient = new THREE.Group();   // the planet's rotation
  planet.add(orient);
  scene.add(planet);

  // idle orientation: tipped so mid-latitudes show at the top of the disc, turning about the pole
  const qTilt = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0, THREE.MathUtils.degToRad(-12)));
  const qSpin = new THREE.Quaternion(), Y = new THREE.Vector3(0, 1, 0);
  let spinAngle = 0;
  const idleQ = () => qTilt.clone().multiply(qSpin.setFromAxisAngle(Y, spinAngle));
  // Gale facing the viewer, south up: roll pi * tilt to latitude * turn to longitude
  const galeQ = new THREE.Quaternion()
    .setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
    .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), GALE_MODEL.lat))
    .multiply(new THREE.Quaternion().setFromAxisAngle(Y, -GALE_MODEL.lon));

  new GLTFLoader().load(MODEL, (gltf) => {
    if (disposed) return;
    const model = gltf.scene;
    model.updateMatrixWorld(true);
    const centre = new THREE.Box3().setFromObject(model).getCenter(new THREE.Vector3());
    model.traverse((o) => {
      if (!o.isMesh) return;
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
      geo.translate(-centre.x, -centre.y, -centre.z);
      const mat = o.material;
      Object.assign(mat, { metalness: 0, roughness: 1, transparent: false, opacity: 1 });
      mat.needsUpdate = true;
      orient.add(new THREE.Mesh(smoothSphere(geo, 4), mat));
    });
    wrap.classList.add('is-ready');
  }, undefined, (e) => console.error('mars model failed to load', e));

  let W = 1, H = 1, R = 1;
  function resize() {
    W = Math.max(1, wrap.clientWidth); H = Math.max(1, wrap.clientHeight);
    renderer.setSize(W, H, false);
    Object.assign(cam, { left: -W / 2, right: W / 2, top: H / 2, bottom: -H / 2 });
    cam.position.set(0, 0, W * 4);
    cam.updateProjectionMatrix();
    // top of the disc at half height, and wide enough to meet both screen edges at the bottom
    R = (W * W / 4 + H * H / 4) / H;
    planet.scale.setScalar(R);
    if (!zoom) planet.position.set(0, -R, 0);
  }
  const ro = new ResizeObserver(resize);

  let zoom = null; // { t0, dur, q0, zEnd, done, follow }
  function applyZoom(now) {
    if (zoom.follow) { // scale set from outside (crater fly-in); orientation and position stay at Gale
      orient.quaternion.copy(galeQ); planet.position.set(0, 0, 0); sun.position.copy(SUN_ZOOM);
      cam.zoom = zoom.follow; cam.updateProjectionMatrix();
      return;
    }
    const k = clamp01((now - zoom.t0) / zoom.dur);
    // turn and centre in the first 75 %
    const e = easeInOut(clamp01(k / 0.75));
    orient.quaternion.slerpQuaternions(zoom.q0, galeQ, e);
    planet.position.set(0, -R * (1 - e), 0);
    sun.position.lerpVectors(SUN_IDLE, SUN_ZOOM, e);
    // zoom accelerates to the end (k^4 on a log scale): the last, blurry part of the texture passes fast,
    // and the crater fly-in takes over at the same speed (crater.js flyIn)
    cam.zoom = Math.exp(Math.log(zoom.zEnd) * k * k * k * k);
    cam.updateProjectionMatrix();
    if (k >= 1 && zoom.done) { const d = zoom.done; zoom.done = null; d(); }
  }

  let raf = 0, disposed = false;
  function frame(now) {
    if (zoom) applyZoom(now);
    else {
      if (!reduced) spinAngle += SPIN;
      orient.quaternion.copy(idleQ());
    }
    renderer.render(scene, cam);
    raf = requestAnimationFrame(frame);
  }
  ro.observe(wrap);
  resize();
  raf = requestAnimationFrame(frame);

  return {
    /** Hold Gale at the centre with `kmPerPx` kilometres of ground per CSS pixel (after zoomToGale). */
    follow(kmPerPx) { if (zoom) zoom.follow = MARS_R_KM / (kmPerPx * R); },
    /** Turn Gale to the centre and zoom until the crater spans `fill` of the width. Resolves when done. */
    zoomToGale(dur = 2600, fill = 0.16) {
      return new Promise((resolve) => {
        zoom = { t0: performance.now(), dur, q0: orient.quaternion.clone(), zEnd: (fill * W) / (R * GALE_KM / MARS_R_KM), done: resolve };
      });
    },
    dispose() {
      disposed = true;
      cancelAnimationFrame(raf); ro.disconnect();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) {
          for (const k of Object.keys(o.material)) { const t = o.material[k]; if (t && t.isTexture) t.dispose(); }
          o.material.dispose();
        }
      });
      renderer.dispose(); renderer.domElement.remove();
    },
  };
}
