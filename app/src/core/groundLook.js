// The ground look of the walk (specs/x-textures.md). The Access Mars photo ground is a photogrammetry
// reconstruction: it is smeared where the rover's cameras saw a face at a grazing angle, grey where there
// is no colour image, brighter or darker from tile to tile, and soft close to the eye. This file prepares
// the tiles once at load and patches their material:
//   - smear: every triangle's world area against its photo (UV) area gives the stretch of the photo; where
//     it is high, the photo is replaced by a calm ground in its own local colour (a coarse mip of the same
//     tile), blended in with soft edges (the stretch is a per-vertex value, interpolated);
//   - grey: no colour image there; the filled ground takes the colour and brightness of the real colour
//     photo around it (a field built from the good colour vertices of all tiles), with the grey's own
//     light and dark kept, instead of one flat colour;
//   - seams: one brightness factor per tile, solved so that the strips on both sides of every tile border
//     agree;
//   - grain: world-space noise on brightness only, gone with distance.
// Nothing here changes a position, a height or a slope. Everything is computed from the textures and
// meshes the walk already loads; nothing is downloaded. The maps (Plan, Go, Debrief) leave uLook at 0 and
// get the unchanged textures.
import * as THREE from 'three';
import { GROUND_LOOK as L } from './groundColor.js';

const TILE_M = 16;      // the tiles are 16 m squares in the walk square (measured, 8 x 8 tiles)
const FIELD_M = 2;      // cell of the local colour field
const SAMPLE_M2 = 0.25; // one sample per about this much ground (m2)
const SAMPLE_PX = 64;   // the photo is read at this size for the vertex colours (a soft sample)

export const SKY = { uSkyMean: { value: new THREE.Color(0.28, 0.17, 0.12) }, uSkyRef: { value: 0.45 } }; // the real photo's mean colour (set at load), for the 4 km skyline
export const LOOK = { uLook: { value: 0 } };
/** The new ground look on (the walk) or off (the maps, the default). */
export function setWalkLook(on) { LOOK.uLook.value = on && READY ? 1 : 0; }
let READY = false; // set once the per-vertex attributes exist; until then (or if preparing fails) the old look stays

const lin2srgb = (c) => Math.pow(Math.max(c, 0), 1 / 2.2);

/** Read the tile photo at SAMPLE_PX x SAMPLE_PX: sRGB 0..1 floats, row 0 = top (flipY is off). */
function readTile(img) {
  const cv = document.createElement('canvas');
  cv.width = cv.height = SAMPLE_PX;
  const cx = cv.getContext('2d', { willReadFrequently: true });
  cx.imageSmoothingEnabled = true; cx.imageSmoothingQuality = 'high';
  cx.drawImage(img, 0, 0, SAMPLE_PX, SAMPLE_PX);
  const d = cx.getImageData(0, 0, SAMPLE_PX, SAMPLE_PX).data;
  const out = new Float32Array(SAMPLE_PX * SAMPLE_PX * 3);
  for (let i = 0, j = 0; i < d.length; i += 4, j += 3) { out[j] = d[i] / 255; out[j + 1] = d[i + 1] / 255; out[j + 2] = d[i + 2] / 255; }
  return out;
}
const satOf = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); return mx > 0.03 ? (mx - mn) / mx : 0; };
const lumOf = (r, g, b) => 0.3 * r + 0.59 * g + 0.11 * b;

/**
 * Compute and attach the per-vertex look attributes on every tile mesh (aSmear, aLocal, aTile).
 * Call once, after the tile textures have loaded and the root's matrices are up to date.
 */
export function prepareGroundLook(tiles) {
  const info = [];
  for (const o of tiles) {
    const img = o.material.map && o.material.map.image;
    if (!img || !o.geometry.attributes.uv) continue;
    o.updateWorldMatrix(true, false);
    const g = o.geometry, p = g.attributes.position, uv = g.attributes.uv, idx = g.index, n = p.count;
    const M = o.matrixWorld.elements;
    const wp = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      wp[3 * i] = M[0] * x + M[4] * y + M[8] * z + M[12];
      wp[3 * i + 1] = M[1] * x + M[5] * y + M[9] * z + M[13];
      wp[3 * i + 2] = M[2] * x + M[6] * y + M[10] * z + M[14];
    }
    // stretch of the photo per triangle: the larger singular value of d(world)/d(uv), in tile widths
    // (1 = the photo's own pixel size over flat ground facing the camera), averaged on the vertices by area
    const sumS = new Float32Array(n), sumA = new Float32Array(n);
    for (let f = 0; f < idx.count; f += 3) {
      const a = idx.getX(f), b = idx.getX(f + 1), c = idx.getX(f + 2);
      const e1 = [wp[3 * b] - wp[3 * a], wp[3 * b + 1] - wp[3 * a + 1], wp[3 * b + 2] - wp[3 * a + 2]];
      const e2 = [wp[3 * c] - wp[3 * a], wp[3 * c + 1] - wp[3 * a + 1], wp[3 * c + 2] - wp[3 * a + 2]];
      const u1x = uv.getX(b) - uv.getX(a), u1y = uv.getY(b) - uv.getY(a), u2x = uv.getX(c) - uv.getX(a), u2y = uv.getY(c) - uv.getY(a);
      const det = u1x * u2y - u1y * u2x;
      const cx = e1[1] * e2[2] - e1[2] * e2[1], cy = e1[2] * e2[0] - e1[0] * e2[2], cz = e1[0] * e2[1] - e1[1] * e2[0];
      const area = 0.5 * Math.sqrt(cx * cx + cy * cy + cz * cz);
      let s = 1;
      if (Math.abs(det) > 1e-14) {
        let E = 0, F = 0, G = 0;
        for (let k = 0; k < 3; k++) {
          const pu = (e1[k] * u2y - e2[k] * u1y) / det, pv = (e2[k] * u1x - e1[k] * u2x) / det;
          E += pu * pu; F += pu * pv; G += pv * pv;
        }
        const tr = E + G, d = Math.sqrt(Math.max(0, (E - G) * (E - G) + 4 * F * F));
        s = Math.sqrt((tr + d) / 2) / TILE_M;
      } else s = 99; // a degenerate photo triangle: nothing real to show
      const w = area + 1e-6;
      for (const v of [a, b, c]) { sumS[v] += s * w; sumA[v] += w; }
    }
    const stretch = new Float32Array(n);
    for (let i = 0; i < n; i++) stretch[i] = sumA[i] ? sumS[i] / sumA[i] : 1;
    // the photo colour at each vertex (a soft 64 px sample of its own tile)
    const px = readTile(img);
    // dense samples over the tile (about every 0.5 m): position, soft photo colour, stretch, area weight
    const S = { x: [], z: [], r: [], g: [], b: [], st: [], w: [] };
    const pxAt = (u, v, k) => px[3 * (Math.min(SAMPLE_PX - 1, Math.max(0, Math.floor(v * SAMPLE_PX))) * SAMPLE_PX + Math.min(SAMPLE_PX - 1, Math.max(0, Math.floor(u * SAMPLE_PX)))) + k];
    for (let f = 0; f < idx.count; f += 3) {
      const ia = [idx.getX(f), idx.getX(f + 1), idx.getX(f + 2)];
      const ax = wp[3 * ia[0]], az = wp[3 * ia[0] + 2], bx = wp[3 * ia[1]], bz = wp[3 * ia[1] + 2], cx = wp[3 * ia[2]], cz = wp[3 * ia[2] + 2];
      const areaXZ = Math.abs((bx - ax) * (cz - az) - (bz - az) * (cx - ax)) / 2;
      const m = Math.max(1, Math.min(14, Math.ceil(Math.sqrt(areaXZ / SAMPLE_M2))));
      const wEach = areaXZ / (m * m) + 1e-9;
      for (let i = 0; i < m; i++) for (let j = 0; i + j < m; j++) for (const [du, dv, wm] of (i + j < m - 1 ? [[0.33, 0.33, 1], [0.67, 0.67, 1]] : [[0.33, 0.33, 1]])) {
        const q1 = (i + du) / m, q2 = (j + dv) / m, q0 = 1 - q1 - q2;
        if (q0 < 0) continue;
        const u = q0 * uv.getX(ia[0]) + q1 * uv.getX(ia[1]) + q2 * uv.getX(ia[2]);
        const v = q0 * uv.getY(ia[0]) + q1 * uv.getY(ia[1]) + q2 * uv.getY(ia[2]);
        S.x.push(q0 * ax + q1 * bx + q2 * cx); S.z.push(q0 * az + q1 * bz + q2 * cz);
        S.r.push(pxAt(u, v, 0)); S.g.push(pxAt(u, v, 1)); S.b.push(pxAt(u, v, 2));
        S.st.push(q0 * stretch[ia[0]] + q1 * stretch[ia[1]] + q2 * stretch[ia[2]]); S.w.push(wEach * wm);
      }
    }
    let mx = 1e9, Mx = -1e9, mz = 1e9, Mz = -1e9, lumSum = 0;
    for (let i = 0; i < n; i++) { mx = Math.min(mx, wp[3 * i]); Mx = Math.max(Mx, wp[3 * i]); mz = Math.min(mz, wp[3 * i + 2]); Mz = Math.max(Mz, wp[3 * i + 2]); }
    for (let j = 0; j < px.length; j += 3) lumSum += lumOf(px[j], px[j + 1], px[j + 2]);
    info.push({ o, g, n, wp, stretch, S, vArea: sumA, box: [mx, Mx, mz, Mz], meanLum: lumSum / (px.length / 3) });
  }
  if (!info.length) return;

  // ----- which vertices are real colour photo -----
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
  for (const t of info) { x0 = Math.min(x0, t.box[0]); x1 = Math.max(x1, t.box[1]); z0 = Math.min(z0, t.box[2]); z1 = Math.max(z1, t.box[3]); }
  for (const t of info) {
    const m = t.S.x.length;
    t.S.good = new Uint8Array(m);
    for (let i = 0; i < m; i++) t.S.good[i] = satOf(t.S.r[i], t.S.g[i], t.S.b[i]) > L.goodSat && t.S.st[i] < L.smearFrom && lumOf(t.S.r[i], t.S.g[i], t.S.b[i]) > 0.06 ? 1 : 0;
  }

  // ----- the local colour field: colour of the good photo on a 2 m grid, the gaps filled by diffusion -----
  const NX = Math.ceil((x1 - x0) / FIELD_M) + 1, NZ = Math.ceil((z1 - z0) / FIELD_M) + 1;
  const acc = new Float64Array(NX * NZ * 3), wgt = new Float64Array(NX * NZ);
  let gR = 0, gG = 0, gB = 0, gW = 0;
  for (const t of info) {
    const S = t.S;
    for (let i = 0; i < S.x.length; i++) {
      if (!S.good[i]) continue;
      const cx = Math.min(NX - 1, Math.floor((S.x[i] - x0) / FIELD_M)), cz = Math.min(NZ - 1, Math.floor((S.z[i] - z0) / FIELD_M));
      const w = S.w[i], k = cz * NX + cx;
      acc[3 * k] += S.r[i] * w; acc[3 * k + 1] += S.g[i] * w; acc[3 * k + 2] += S.b[i] * w; wgt[k] += w;
      gR += S.r[i] * w; gG += S.g[i] * w; gB += S.b[i] * w; gW += w;
    }
  }
  if (!gW) return; // no colour photo at all: leave the old look
  const field = new Float32Array(NX * NZ * 3), known = new Uint8Array(NX * NZ);
  for (let k = 0; k < NX * NZ; k++) {
    if (wgt[k] > 0) { known[k] = 1; for (let c = 0; c < 3; c++) field[3 * k + c] = acc[3 * k + c] / wgt[k]; }
    else { field[3 * k] = gR / gW; field[3 * k + 1] = gG / gW; field[3 * k + 2] = gB / gW; }
  }
  const tmp = new Float32Array(field.length);
  const relax = (passes, keep) => {
    for (let it = 0; it < passes; it++) {
      for (let z = 0; z < NZ; z++) for (let x = 0; x < NX; x++) {
        const k = z * NX + x;
        if (keep && known[k]) { for (let c = 0; c < 3; c++) tmp[3 * k + c] = field[3 * k + c]; continue; }
        let s0 = 0, s1 = 0, s2 = 0, m = 0;
        for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const xx = x + dx, zz = z + dz;
          if (xx < 0 || zz < 0 || xx >= NX || zz >= NZ) continue;
          const q = zz * NX + xx; s0 += field[3 * q]; s1 += field[3 * q + 1]; s2 += field[3 * q + 2]; m++;
        }
        tmp[3 * k] = s0 / m; tmp[3 * k + 1] = s1 / m; tmp[3 * k + 2] = s2 / m;
      }
      field.set(tmp);
    }
  };
  relax(120, true);  // gaps take the colour of the real photo around them
  relax(3, false);   // and the whole field is smoothed a little
  const fieldAt = (x, z, out) => {
    const fx = Math.min(NX - 1.001, Math.max(0, (x - x0) / FIELD_M - 0)), fz = Math.min(NZ - 1.001, Math.max(0, (z - z0) / FIELD_M - 0));
    const ix = Math.floor(fx), iz = Math.floor(fz), tx = fx - ix, tz = fz - iz;
    for (let c = 0; c < 3; c++) {
      const a = field[3 * (iz * NX + ix) + c], b = field[3 * (iz * NX + ix + 1) + c], cc = field[3 * ((iz + 1) * NX + ix) + c], d = field[3 * ((iz + 1) * NX + ix + 1) + c];
      out[c] = (a * (1 - tx) + b * tx) * (1 - tz) + (cc * (1 - tx) + d * tx) * tz;
    }
  };

  // ----- one brightness factor per photo tile: the strips on both sides of each border agree -----
  const cellOf = (t) => [Math.round((t.box[0] + t.box[1]) / 2 / TILE_M - 0.5), Math.round((t.box[2] + t.box[3]) / 2 / TILE_M - 0.5)];
  const byCell = new Map();
  for (const t of info) { t.cell = cellOf(t); byCell.set(t.cell.join(','), t); }
  const STRIP = 1.2; // m
  for (const t of info) { // a tile is "grey" when most of it has no colour imagery
    let share = 0, all = 0; for (let i = 0; i < t.S.x.length; i++) { share += t.S.good[i] * t.S.w[i]; all += t.S.w[i]; } t.isGrey = share / all <= 0.25;
  }
  const edgeLum = (t, side) => { // side 0: -x, 1: +x, 2: -z, 3: +z; mean luma within STRIP of that border (good photo; all of a grey tile)
    let s = 0, w = 0;
    const S = t.S;
    for (let i = 0; i < S.x.length; i++) {
      if (!S.good[i] && !t.isGrey) continue;
      const d = side === 0 ? S.x[i] - t.box[0] : side === 1 ? t.box[1] - S.x[i] : side === 2 ? S.z[i] - t.box[2] : t.box[3] - S.z[i];
      if (d > STRIP) continue;
      s += lumOf(S.r[i], S.g[i], S.b[i]) * S.w[i]; w += S.w[i];
    }
    return w > 0.5 ? s / w : null;
  };
  const seams = [];
  for (const t of info) {
    for (const [side, dx, dz, other] of [[1, 1, 0, 0], [3, 0, 1, 2]]) {
      const nb = byCell.get([t.cell[0] + dx, t.cell[1] + dz].join(','));
      if (!nb || nb.isGrey !== t.isGrey) continue; // photo against photo, grey against grey
      const a = edgeLum(t, side), b = edgeLum(nb, other);
      if (a && b) seams.push([t, nb, Math.log(a / b)]);
    }
  }
  for (const t of info) t.gain = 0; // log gain
  for (let it = 0; it < 200; it++) { // Gauss-Seidel: g_a + log(ea) = g_b + log(eb), pulled gently to 0
    for (const t of info) {
      let s = 0, m = 0.05; // the pull to "unchanged"
      for (const [A, B, d] of seams) {
        if (A === t) { s += B.gain - d; m++; } else if (B === t) { s += A.gain + d; m++; }
      }
      t.gain = (s) / m;
    }
  }
  const maxG = Math.log(1 + L.seamMaxGain);
  for (const t of info) t.gain = Math.max(-maxG, Math.min(maxG, t.gain * L.seamStrength));

  // ----- attributes -----
  let gl = 0, gw = 0; // the brightness of the grey tiles overall: the reference that the filled ground's light and dark is measured against
  for (const t of info) if (t.isGrey) { gl += t.meanLum * t.n; gw += t.n; }
  const greyRef = gw ? Math.max(0.05, gl / gw) : 0.45;
  const tmpc = [0, 0, 0];
  for (const t of info) {
    const aSmear = new Float32Array(t.n), aLocal = new Float32Array(t.n * 3), aTile = new Float32Array(t.n * 2);
    // a tile that is mostly grey carries no seam gain (its fill follows the field), and the grey tile's own mean luma normalises its shading
    const gain = Math.exp(t.gain);
    for (let i = 0; i < t.n; i++) {
      aSmear[i] = Math.min(1, Math.max(0, (t.stretch[i] - L.smearFrom) / (L.smearFull - L.smearFrom)));
      fieldAt(t.wp[3 * i], t.wp[3 * i + 2], tmpc);
      aLocal[3 * i] = tmpc[0]; aLocal[3 * i + 1] = tmpc[1]; aLocal[3 * i + 2] = tmpc[2];
      aTile[2 * i] = gain; aTile[2 * i + 1] = greyRef;
    }
    t.g.setAttribute('aSmear', new THREE.BufferAttribute(aSmear, 1));
    t.g.setAttribute('aLocal', new THREE.BufferAttribute(aLocal, 3));
    t.g.setAttribute('aTile', new THREE.BufferAttribute(aTile, 2));
  }
  SKY.uSkyMean.value.setRGB(Math.pow(gR / gW, 2.2), Math.pow(gG / gW, 2.2), Math.pow(gB / gW, 2.2));
  SKY.uSkyRef.value = greyRef;
  READY = true;
}

const GLSL_HASH = `
float gk_h(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.yzx + 33.33); return fract((p.x + p.y) * p.z); }
float gk_vn(vec3 p) {
  vec3 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(gk_h(i), gk_h(i + vec3(1,0,0)), f.x), mix(gk_h(i + vec3(0,1,0)), gk_h(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(gk_h(i + vec3(0,0,1)), gk_h(i + vec3(1,0,1)), f.x), mix(gk_h(i + vec3(0,1,1)), gk_h(i + vec3(1,1,1)), f.x), f.y), f.z) * 2.0 - 1.0;
}`;

/**
 * Patch a tile material. With uLook 0 it is exactly the old grey tint (core/terrainScene.js tintGrey); with
 * uLook 1 the walk's ground look. `grey` holds the shared uniforms of the old tint.
 */
export function patchGroundLook(material, grey) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, grey.uniforms, LOOK);
    shader.uniforms.uCalmBias = { value: L.calmBlurLevels };
    shader.uniforms.uGrain = { value: new THREE.Vector4(L.grainNear, L.grainFar, L.grainAmp, L.grainAmpPhoto) };
    shader.vertexShader = shader.vertexShader
      .replace('void main() {', `attribute float aSmear; attribute vec3 aLocal; attribute vec2 aTile;
varying float vSmear; varying vec3 vLocal; varying vec2 vTile; varying vec3 vGPos;
void main() {`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        vSmear = aSmear; vLocal = aLocal; vTile = aTile; vGPos = (modelMatrix * vec4(position, 1.0)).xyz;`);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', `uniform float uGreyTint, uLook, uCalmBias; uniform vec3 uGroundDark, uGroundLight; uniform vec4 uGrain;
varying float vSmear; varying vec3 vLocal; varying vec2 vTile; varying vec3 vGPos;
${GLSL_HASH}
vec3 gk_srgb(vec3 c) { return pow(max(c, vec3(0.0)), vec3(1.0 / 2.2)); }
float gk_sat(vec3 s) { float mx = max(s.r, max(s.g, s.b)), mn = min(s.r, min(s.g, s.b)); return mx > 0.03 ? (mx - mn) / mx : 0.0; }
float gk_blue(vec3 s) { return smoothstep(-0.01, 0.03, s.b - s.r); } // Mars ground is never bluer than red: the blue-grey rims of the colour coverage
float gk_lum(vec3 s) { return dot(s, vec3(0.3, 0.59, 0.11)); }
void main() {`)
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 sc = gk_srgb(diffuseColor.rgb); // back to sRGB for the grey test
          float sat = gk_sat(sc);
          float grey = 1.0 - clamp((sat - 0.07) / 0.12, 0.0, 1.0);
          float lum = gk_lum(sc);
          if (uLook < 0.5) {
            vec3 tint = mix(uGroundDark, uGroundLight, clamp((lum - 0.2) / 0.5, 0.0, 1.0));
            diffuseColor.rgb = mix(diffuseColor.rgb, tint, grey * uGreyTint);
          } else {
            // soft edge of the grey: the same test on a coarse sample of the photo
            vec3 bl = gk_srgb(texture2D(map, vMapUv, uCalmBias).rgb);
            float blSat = gk_sat(bl), blLum = gk_lum(bl);
            float greyBl = max(1.0 - clamp((blSat - 0.07) / 0.12, 0.0, 1.0), gk_blue(bl));
            float greyM = max(max(grey, greyBl), gk_blue(sc));
            float gain = vTile.x;
            vec3 photo = sc * gain;
            // grey ground: the colour and brightness of the real colour photo around it, keeping the grey's own light and dark
            float rel = clamp(lum * gain / vTile.y, 0.55, 1.6);
            vec3 fill = vLocal * rel;
            vec3 fillBl = vLocal * clamp(blLum * gain / vTile.y, 0.55, 1.6);
            vec3 calmPhoto = mix(bl * gain, fillBl, greyBl);
            vec3 res = mix(photo, fill, greyM);
            float calm = vSmear * (1.0 - greyM);
            res = mix(res, calmPhoto, calm);
            float calmAll = clamp(greyM + calm, 0.0, 1.0);
            // fine grain, brightness only, fading with distance and with the pixel footprint
            float d = length(vGPos - cameraPosition);
            float fp = length(fwidth(vGPos));
            float nearK = 1.0 - smoothstep(uGrain.x, uGrain.y, d);
            float n1 = gk_vn(vGPos * 22.0) * (1.0 - smoothstep(0.012, 0.03, fp));
            float n2 = gk_vn(vGPos * 5.5 + 7.0) * (1.0 - smoothstep(0.05, 0.13, fp));
            float amp = mix(uGrain.w, uGrain.z, calmAll);
            float gr = (0.65 * n1 + 0.35 * n2) * amp * nearK;
            res *= 1.0 + gr;
            diffuseColor.rgb = mix(diffuseColor.rgb, pow(max(res, vec3(0.0)), vec3(2.2)), uGreyTint);
          }
        }`);
  };
  material.customProgramCacheKey = () => 'ground-look';
}

/**
 * The 4 km skyline mesh is grey almost everywhere. With uLook 1 its grey is filled with the mean colour of the
 * real colour photo (so it matches the ground in front of it instead of the maps' plainer orange); uLook 0 is the old tint.
 */
export function patchSkylineLook(material, grey) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, grey.uniforms, LOOK, SKY);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uGreyTint, uLook; uniform vec3 uGroundDark, uGroundLight, uSkyMean; uniform float uSkyRef;\nvoid main() {')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 sc = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2));
          float mx = max(sc.r, max(sc.g, sc.b)), mn = min(sc.r, min(sc.g, sc.b));
          float sat = mx > 0.03 ? (mx - mn) / mx : 0.0;
          float grey = 1.0 - clamp((sat - 0.07) / 0.12, 0.0, 1.0);
          float lum = dot(sc, vec3(0.3, 0.59, 0.11));
          if (uLook > 0.5) grey = max(grey, smoothstep(-0.01, 0.03, sc.b - sc.r));
          vec3 tint = mix(uGroundDark, uGroundLight, clamp((lum - 0.2) / 0.5, 0.0, 1.0));
          if (uLook > 0.5) tint = uSkyMean * clamp(lum / uSkyRef, 0.55, 1.6);
          diffuseColor.rgb = mix(diffuseColor.rgb, tint, grey * uGreyTint);
        }`);
  };
  material.customProgramCacheKey = () => 'skyline-look';
}
