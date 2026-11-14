// Gale crater in 3D from MOLA elevation (public/data/gale, built by scripts/preprocess/build_gale.py).
// Units: km. three.js x = east, z = south (so -z = north), y = up.

import * as THREE from 'three';
import { DEMO } from '../../core/values.js';

// display only; stated on screen; the value lives in core/values.js (DEMO.craterHeightFactor)
export const VERTICAL_EXAGGERATION = DEMO.craterHeightFactor.value;

/** Load gale.json and the height grid. */
export async function loadGale(base = 'data/gale/') {
  const meta = await (await fetch(base + 'gale.json')).json();
  const buf = await (await fetch(base + meta.file)).arrayBuffer();
  const heights = new Int16Array(buf);
  if (heights.length !== meta.cols * meta.rows) throw new Error('gale grid size mismatch');
  return { meta, heights };
}

/**
 * Build the crater view into `wrap`. Returns { pointOf(site), project(v3) -> {x, y, visible}, setShift(px), render, dispose, onRender(fn) }.
 */
export function craterView(wrap, { meta, heights }) {
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

  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setClearColor(0x000000, 1);
  wrap.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x000000, 90, 260);

  // terrain mesh
  const geo = new THREE.PlaneGeometry((cols - 1) * kmpp, (rows - 1) * kmpp, cols - 1, rows - 1);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, yOf(heights[i]));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color: 0xc98457, roughness: 1, metalness: 0 });
  scene.add(new THREE.Mesh(geo, mat));

  // low sun from the north-east (left of the view), soft sky fill
  const sun = new THREE.DirectionalLight(0xfff1e0, 2.6);
  sun.position.set(80, 38, -60);
  scene.add(sun);
  scene.add(new THREE.HemisphereLight(0xffd9b8, 0x2a140a, 0.5));

  // camera behind the sites (north-west), looking south-east across the crater floor to Mount Sharp
  const sites = Object.fromEntries(meta.sites.map((s) => [s.id, s]));
  const murray = pointOf(sites.murray), sharp = pointOf(meta.mount_sharp);
  const dir = new THREE.Vector3().subVectors(sharp, murray).setY(0);
  const dist = dir.length(); dir.normalize();
  const cam = new THREE.PerspectiveCamera(42, 1, 0.5, 600);
  cam.position.copy(murray).addScaledVector(dir, -0.9 * dist).setY(murray.y + 0.55 * dist);
  const target = murray.clone().addScaledVector(dir, 0.35 * dist).setY(murray.y);
  cam.lookAt(target);

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

  /** Shift the scene left by px (to make room for the side panel), with a short slide. */
  function setShift(px) {
    shiftTo = px;
    cancelAnimationFrame(anim);
    const from = shift, t0 = performance.now(), dur = 240;
    const step = (t) => {
      const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
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

  return {
    pointOf, project, setShift, render,
    onRender(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    dispose() {
      cancelAnimationFrame(anim); ro.disconnect(); listeners.clear();
      geo.dispose(); mat.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
