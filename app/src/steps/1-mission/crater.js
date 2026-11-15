// Gale crater in 3D from NASA's HRSC-derived 3D model of Gale crater, fitted to MOLA (public/data/gale/
// gale_hrsc.*, built by scripts/preprocess/build_gale_hrsc.mjs).
// Units: km. three.js x = east, z = south (so -z = north), y = up.

import * as THREE from 'three';
import { DEMO } from '../../core/values.js';

// display only; stated on screen; the value lives in core/values.js (DEMO.craterHeightFactor)
export const VERTICAL_EXAGGERATION = DEMO.craterHeightFactor.value;

/** Load the grid description, the height grid and the surface colour (scripts/preprocess/build_gale_color.mjs). */
export async function loadGale(base = 'data/gale/', file = 'gale_hrsc.json') {
  const meta = await (await fetch(base + file)).json();
  const [buf, colBuf] = await Promise.all([
    fetch(base + meta.file).then((r) => r.arrayBuffer()),
    meta.color ? fetch(base + meta.color.file).then((r) => r.arrayBuffer()) : null,
  ]);
  const heights = new Int16Array(buf);
  if (heights.length !== meta.cols * meta.rows) throw new Error('gale grid size mismatch');
  const color = colBuf ? new Uint8Array(colBuf) : null;
  if (color && color.length !== meta.color.cols * meta.color.rows * 3) throw new Error('gale colour size mismatch');
  return { meta, heights, color };
}

/** RGB rows north-first -> RGBA texture (texture v = 0 is the south edge, as the plane's uv). */
function colorTexture(rgb, w, h) {
  const data = new Uint8Array(w * h * 4);
  for (let r = 0; r < h; r++) for (let c = 0; c < w; c++) {
    const i = (r * w + c) * 3, o = ((h - 1 - r) * w + c) * 4;
    data[o] = rgb[i]; data[o + 1] = rgb[i + 1]; data[o + 2] = rgb[i + 2]; data[o + 3] = 255;
  }
  const t = new THREE.DataTexture(data, w, h, THREE.RGBAFormat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.needsUpdate = true;
  return t;
}

/**
 * Build the crater view into `wrap`. Returns { pointOf(site), project(v3) -> {x, y, visible}, setShift(px), render, dispose, onRender(fn) }.
 */
export function craterView(wrap, { meta, heights, color }) {
  const { cols, rows, km_per_pixel: kmpp } = meta;
  const base = meta.elev_min_m;
  const yOf = (m) => ((m - base) / 1000) * VERTICAL_EXAGGERATION;

  // grid sample (bilinear) at fractional pixel coordinates (pixel centres at +0.5, as in gale.json)
  function elevAt(col, row) {
    const c = Math.min(cols - 1, Math.max(0, col - 0.5)), r = Math.min(rows - 1, Math.max(0, row - 0.5));
    const c0 = Math.floor(c), r0 = Math.floor(r), c1 = Math.min(cols - 1, c0 + 1), r1 = Math.min(rows - 1, r0 + 1);
    const fc = c - c0, fr = r - r0, H = (cc, rr) => heights[rr * cols + cc];
    return (H(c0, r0) * (1 - fc) + H(c1, r0) * fc) * (1 - fr) + (H(c0, r1) * (1 - fc) + H(c1, r1) * fc) * fr;
  }
  const xOf = (col) => (col - 0.5 - (cols - 1) / 2) * kmpp;
  const zOf = (row) => (row - 0.5 - (rows - 1) / 2) * kmpp;
  const pointOf = (s, lift = 0) => new THREE.Vector3(xOf(s.col), yOf(elevAt(s.col, s.row)) + lift, zOf(s.row));

  // alpha: during the fly-in from the opening the crater is drawn over the globe (clear alpha 0)
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 1);
  wrap.append(renderer.domElement);

  const scene = new THREE.Scene();
  const FOG_NEAR = 120, FOG_FAR = 340;
  scene.fog = new THREE.Fog(0x000000, FOG_NEAR, FOG_FAR);

  // terrain mesh
  const geo = new THREE.PlaneGeometry((cols - 1) * kmpp, (rows - 1) * kmpp, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, yOf(heights[i]));
  geo.computeVertexNormals();
  // edges fade out (vertex alpha), so the crater blends into the globe on the way in and into black at rest
  const EDGE = 0.12;
  const rgba = new Float32Array(pos.count * 4);
  for (let r = 0, i = 0; r < rows; r++) for (let c = 0; c < cols; c++, i++) {
    const d = Math.min(c / (cols - 1), 1 - c / (cols - 1), r / (rows - 1), 1 - r / (rows - 1)) / EDGE;
    const a = Math.min(1, d), sm = a * a * (3 - 2 * a);
    rgba.set([1, 1, 1, sm], i * 4);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(rgba, 4));
  // surface colour: the NASA Mars model's texture over this box (the same colours as the opening globe)
  const map = color ? colorTexture(color, meta.color.cols, meta.color.rows) : null;
  const mat = new THREE.MeshStandardMaterial({
    color: map ? 0xffffff : 0xc07a4c, map, roughness: 1, metalness: 0, vertexColors: true, transparent: true,
  });
  const terrain = new THREE.Mesh(geo, mat);
  scene.add(terrain);

  // Two lighting setups. REST: low sun from the east (left of the view), so the relief reads as in the
  // mockup; the colour is lifted because the low sun leaves the texture darker. HANDOFF: exactly the
  // opening globe's light at the moment of the handoff (planet.js SUN_ZOOM seen from the top-down,
  // south-up camera: view (x, y, z) = world (-x, z, y)), same colour, no fill, so the flat crater and the
  // globe look the same. The fly-in blends from HANDOFF to REST.
  const sun = new THREE.DirectionalLight(0xfff3e6, 3.0);
  const hemi = new THREE.HemisphereLight(0xffd9b8, 0x1a0c06, 0.4);
  const amb = new THREE.AmbientLight(0xffffff, 0);
  scene.add(sun, hemi, amb);
  const LOOK = {
    rest: { dir: new THREE.Vector3(90, 30, -20).normalize(), sun: 3.0, hemi: 0.4, amb: 0, tint: map ? [1.2, 1.16, 1.12] : [1, 1, 1] },
    handoff: { dir: new THREE.Vector3(0.35, 1, -0.5).normalize(), sun: 3.4, hemi: 0, amb: 0.05, tint: [1, 1, 1] },
  };
  const lookDir = new THREE.Vector3();
  /** 0 = handoff light, 1 = rest light. */
  function setLook(t) {
    const a = LOOK.handoff, b = LOOK.rest, l = (x, y) => x + (y - x) * t;
    sun.position.copy(lookDir.copy(a.dir).lerp(b.dir, t).normalize().multiplyScalar(100));
    sun.intensity = l(a.sun, b.sun); hemi.intensity = l(a.hemi, b.hemi); amb.intensity = l(a.amb, b.amb);
    mat.color.setRGB(l(a.tint[0], b.tint[0]), l(a.tint[1], b.tint[1]), l(a.tint[2], b.tint[2]));
  }
  setLook(1);

  // camera behind the sites (north-west), looking south-east across the crater floor to Mount Sharp
  const sites = Object.fromEntries(meta.sites.map((s) => [s.id, s]));
  const murray = pointOf(sites.murray), sharp = pointOf(meta.mount_sharp);
  const dir = new THREE.Vector3().subVectors(sharp, murray).setY(0);
  const dist = dir.length(); dir.normalize();
  const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 1500);
  const restPos = murray.clone().addScaledVector(dir, -1.45 * dist).setY(murray.y + 1.3 * dist);
  const restTarget = murray.clone().addScaledVector(dir, 0.22 * dist).setY(murray.y); // the sites near the screen middle, Mount Sharp still in view
  const restUp = new THREE.Vector3(0, 1, 0);
  const restDist = restPos.distanceTo(restTarget);
  cam.position.copy(restPos);
  cam.lookAt(restTarget);

  // crater centre (lon/lat of Gale) for the fly-in from orbit
  const B = meta.bounds;
  const galeCentre = pointOf({
    col: ((137.81 - B.lon_west) / (B.lon_east - B.lon_west)) * cols,
    row: ((B.lat_north - -5.37) / (B.lat_north - B.lat_south)) * rows,
  });

  let shift = 0, shiftTo = 0, anim = 0;
  const listeners = new Set();
  let W = 1, Hh = 1;

  function applyView() {
    if (shift) cam.setViewOffset(W, Hh, shift, 0, W, Hh); else cam.clearViewOffset();
    cam.aspect = W / Hh;
    cam.updateProjectionMatrix();
  }
  function resize() {
    W = Math.max(1, wrap.clientWidth); Hh = Math.max(1, wrap.clientHeight);
    renderer.setSize(W, Hh, false);
    applyView();
    render();
  }
  function render() {
    renderer.render(scene, cam);
    listeners.forEach((fn) => fn());
  }
  const ro = new ResizeObserver(resize);
  ro.observe(wrap);
  resize();

  /** Shift the scene left by px (to make room for the side panel), with a slide of dur ms. */
  function setShift(px, dur = 240) {
    shiftTo = px;
    cancelAnimationFrame(anim);
    const from = shift, t0 = performance.now();
    const slow = dur > 240; // a long slide eases in as well, so it starts as gently as it ends
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = slow ? (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2) : 1 - Math.pow(1 - k, 3);
      shift = from + (shiftTo - from) * e;
      applyView(); render();
      if (k < 1) anim = requestAnimationFrame(step);
    };
    anim = requestAnimationFrame(step);
  }

  /** World point -> CSS pixels in `wrap`. */
  function project(v) {
    const p = v.clone().project(cam);
    return { x: (p.x + 1) / 2 * W, y: (1 - p.y) / 2 * Hh, visible: p.z < 1 && p.z > -1 };
  }

  /**
   * Fly in from straight above the crater (south up, Gale spanning `fill` of the width) to the resting
   * view. It starts flat and in the globe's light, so it matches the globe exactly; then the camera sinks,
   * the relief grows, the light turns to the low sun, and the camera tilts toward Mount Sharp. The
   * background stays transparent until the end, so the globe behind shows around the crater.
   * onFrame(kmPerPx, k) gives the ground scale at the screen centre, for the globe to follow.
   */
  let fly = 0;
  function flyIn({ dur = 3200, fill = 0.16, onFrame = null } = {}) {
    const galeKm = 154, tanH = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const h0 = galeKm / fill / (2 * tanH * (W / Hh));       // start height: Gale spans `fill` of the width
    const h1 = restDist * 1.15;                               // height at which the tilt takes over
    const up0 = new THREE.Vector3(0, 0, 1);                   // south at the top of the screen
    const top = new THREE.Vector3(), pos = new THREE.Vector3(), tgt = new THREE.Vector3(), up = new THREE.Vector3(), centreNow = new THREE.Vector3();
    const io = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const c01 = (t) => Math.min(1, Math.max(0, t));
    cancelAnimationFrame(fly);
    renderer.setClearAlpha(0);
    return new Promise((resolve) => {
      const t0 = performance.now();
      const step = (now) => {
        const k = c01((now - t0) / dur);
        // descent on a log scale, fastest at the start (picks up the globe zoom's end speed), then slowing
        const u = c01(k / 0.5), h = Math.exp(Math.log(h0) + (Math.log(h1) - Math.log(h0)) * (1 - Math.pow(1 - u, 1.6)));
        const s = io(c01((k - 0.3) / 0.7));
        const relief = 0.002 + 0.998 * (1 - Math.pow(1 - c01(k / 0.3), 2));
        terrain.scale.y = relief;
        setLook(io(c01((k - 0.12) / 0.7)));
        centreNow.copy(galeCentre).setY(galeCentre.y * relief);
        top.copy(centreNow).setY(centreNow.y + h);
        pos.lerpVectors(top, restPos, s); tgt.lerpVectors(centreNow, restTarget, s); up.lerpVectors(up0, restUp, s).normalize();
        cam.position.copy(pos); cam.up.copy(up); cam.lookAt(tgt);
        const d = pos.distanceTo(tgt), extra = Math.max(0, d - restDist) * 1.5;
        scene.fog.near = FOG_NEAR + extra; scene.fog.far = FOG_FAR + extra;
        render();
        if (onFrame) onFrame((2 * d * tanH) / Hh, k);
        if (k < 1) fly = requestAnimationFrame(step);
        else { terrain.scale.y = 1; setLook(1); renderer.setClearAlpha(1); render(); resolve(); }
      };
      step(t0);
    });
  }

  return {
    pointOf, project, setShift, render, flyIn,
    onRender(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    dispose() {
      cancelAnimationFrame(anim); cancelAnimationFrame(fly); ro.disconnect(); listeners.clear();
      geo.dispose(); mat.dispose(); if (map) map.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
