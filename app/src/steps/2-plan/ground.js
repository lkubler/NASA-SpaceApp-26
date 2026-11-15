// The map ground for step 2: a top-down render of the Access Mars mesh with its own textures
// (the same terrain the visitor walks), and the patterns of the too-steep hatching and the radio-shadow dots
// the shared map lays over it (masks from the core: closedMask, radioShadowMask); nothing is computed here.
import * as THREE from 'three';
import { getTerrainScene, setGreyTint } from '../../core/terrainScene.js';
import { MAP_RES } from '../../ui/mapPanel.js';

let _ground = null;

/** Start the Plan map's ground render early (step 1 calls it on the pick), so the map is there when Plan opens. */
export function prepareGround(terrain) {
  return paintGround(terrain, terrain.n * MAP_RES);
}

/**
 * Orthographic render of the walk square from straight above, north up.
 * Resolves to a canvas of size x size, or null when WebGL is not available.
 */
export function paintGround(terrain, size) {
  if (_ground) return _ground;
  _ground = getTerrainScene().then(({ root, background }) => {
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    } catch (e) {
      return null;
    }
    renderer.setPixelRatio(1);
    renderer.setSize(size, size, false);
    const scene = new THREE.Scene();
    const view = root.clone(); // shares geometry and materials with the walk; never disposed here
    // the 4 km skyline mesh would cover the square from above; the collision mesh is already hidden
    view.traverse((o) => { if (o.isMesh && background && o.material === background.material) o.visible = false; });
    scene.add(view);
    const half = terrain.extent / 2; // the walk square, three.js metres (x east, -z north)
    const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 2000);
    cam.up.set(0, 0, -1);           // screen up = three.js -z = north
    cam.position.set(0, 500, 0);
    cam.lookAt(0, 0, 0);
    // raw textures: composeGround finds the grey (no colour imagery) ground itself and shows the relief there
    setGreyTint(false);
    renderer.render(scene, cam);
    setGreyTint(true);
    const out = document.createElement('canvas');
    out.width = out.height = size;
    out.getContext('2d').drawImage(renderer.domElement, 0, 0);
    renderer.dispose();
    renderer.forceContextLoss();
    return out;
  });
  return _ground;
}

/**
 * Lay the textured render over the shaded relief already on the map canvas. Ground that Curiosity's
 * cameras never saw is grey (or empty) in the Access Mars textures; there the relief of the same
 * terrain shows through, so the map has no grey holes.
 */
export function composeGround(ctx, relief, ground) {
  const W = ctx.canvas.width;
  const g = document.createElement('canvas'); g.width = g.height = W;
  const gc = g.getContext('2d', { willReadFrequently: true });
  gc.drawImage(ground, 0, 0, W, W);
  const t = gc.getImageData(0, 0, W, W).data;
  const out = new ImageData(W, W);
  const r = relief.data, o = out.data;
  const N = W * W;
  const wt = new Float32Array(N), lum = new Float32Array(N);
  let sumL = 0, cnt = 0;
  for (let i = 0, k = 0; i < N; i++, k += 4) {
    const R = t[k], G = t[k + 1], B = t[k + 2];
    const mx = Math.max(R, G, B), mn = Math.min(R, G, B);
    const sat = mx > 8 ? (mx - mn) / mx : 0;
    wt[i] = Math.max(0, Math.min(1, (sat - 0.07) / 0.12)); // 0 = grey or empty, 1 = coloured texture
    lum[i] = 0.3 * R + 0.59 * G + 0.11 * B;
    if (wt[i] > 0.5) { sumL += lum[i]; cnt++; }
  }
  const meanL = cnt ? sumL / cnt : 128;
  // Textured ground: the relief colour carries the texture's light and dark (rocks, sand, ripples),
  // mixed with the texture's own colour, so seen and unseen ground read as one surface.
  const MIX = 0.45;
  for (let i = 0, k = 0; i < N; i++, k += 4) {
    const w = wt[i], f = Math.max(0.45, Math.min(1.7, lum[i] / meanL));
    for (let c = 0; c < 3; c++) {
      const tex = (1 - MIX) * Math.min(255, r[k + c] * f) + MIX * t[k + c];
      o[k + c] = tex * w + r[k + c] * (1 - w);
    }
    o[k + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
}

/** Patterns of the too-steep hatching and the radio-shadow dots (drawn by the shared map at screen size). */
export function hatchPattern(ctx) {
  const c = document.createElement('canvas'); c.width = c.height = 10;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(150, 30, 30, 0.12)'; g.fillRect(0, 0, 10, 10);
  g.strokeStyle = 'rgba(232, 84, 72, 0.95)'; g.lineWidth = 1.6;
  g.beginPath(); g.moveTo(-2, 12); g.lineTo(12, -2); g.moveTo(-2, 2); g.lineTo(2, -2); g.moveTo(8, 12); g.lineTo(12, 8); g.stroke();
  return ctx.createPattern(c, 'repeat');
}

export function dotPattern(ctx) {
  const c = document.createElement('canvas'); c.width = c.height = 8;
  const g = c.getContext('2d');
  g.fillStyle = 'rgba(0, 0, 0, 0.16)'; g.fillRect(0, 0, 8, 8);
  g.fillStyle = 'rgba(240, 160, 70, 0.95)'; g.beginPath(); g.arc(4, 4, 1.15, 0, Math.PI * 2); g.fill();
  return ctx.createPattern(c, 'repeat');
}
