#!/usr/bin/env node
// Surface colour of Gale crater for the step 1 crater view, taken from the same NASA Mars 3D model the
// opening shows (app/public/models/mars.glb, NASA/JPL-Caltech), so the globe and the crater match.
//
// The model's colour texture is a cube-map layout on a low-poly sphere. For the crater's lon/lat box
// (gale_hrsc.json bounds) the model's triangles are rasterised in lon/lat and the texture is sampled
// bilinearly at the interpolated texture coordinates. Model longitude + LON_OFFSET = east longitude:
// Gale shows on the texture at model lon 49.5, lat -5.5 (dark floor and the dark wind streak to its
// south); Hellas, Syrtis Major and Olympus Mons agree within 2 degrees.
//
// Writes app/public/data/gale/gale_color.rgb.bin (8-bit RGB, row 0 = north) and adds `color` to
// gale_hrsc.json. Run from the repo root: node scripts/preprocess/build_gale_color.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const GLB = 'app/public/models/mars.glb';
const META = 'app/public/data/gale/gale_hrsc.json';
const OUT = 'app/public/data/gale/gale_color.rgb.bin';
const LON_OFFSET = 137.8 - 49.5; // deg
const LAT_OFFSET = -5.4 - -5.5;  // deg
const OUT_W = 192;               // the texture holds ~6 px per degree; this oversamples it smoothly

// --- glb
const f = readFileSync(GLB);
const jl = f.readUInt32LE(12);
const gl = JSON.parse(f.subarray(20, 20 + jl).toString());
const bin = f.subarray(20 + jl + 8);
function view(i) { const bv = gl.bufferViews[i]; return bin.subarray(bv.byteOffset || 0, (bv.byteOffset || 0) + bv.byteLength); }
function acc(i) {
  const a = gl.accessors[i], src = view(a.bufferView), off = a.byteOffset || 0;
  const nc = { SCALAR: 1, VEC2: 2, VEC3: 3 }[a.type];
  const T = { 5126: Float32Array, 5125: Uint32Array, 5123: Uint16Array }[a.componentType];
  return new T(src.buffer.slice(src.byteOffset + off, src.byteOffset + off + a.count * nc * T.BYTES_PER_ELEMENT));
}
const prim = gl.meshes[0].primitives[0];
const P = acc(prim.attributes.POSITION), UV = acc(prim.attributes.TEXCOORD_0), I = acc(prim.indices);
const mat = gl.materials[prim.material || 0];
const png = view(gl.images[gl.textures[mat.pbrMetallicRoughness.baseColorTexture.index].source].bufferView);

// --- minimal PNG decoder (8-bit RGB/RGBA, not interlaced)
function decodePng(b) {
  let o = 8, w = 0, h = 0, ct = 0; const idat = [];
  while (o < b.length) {
    const len = b.readUInt32BE(o), type = b.toString('ascii', o + 4, o + 8), d = b.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); if (d[8] !== 8 || d[12] !== 0) throw new Error('unsupported PNG'); ct = d[9]; }
    if (type === 'IDAT') idat.push(d);
    o += 12 + len;
  }
  const ch = { 2: 3, 6: 4 }[ct]; if (!ch) throw new Error('unsupported PNG colour type ' + ct);
  const raw = inflateSync(Buffer.concat(idat)), stride = w * ch, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const ft = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= ch ? out[y * stride + x - ch] : 0, up = y ? out[(y - 1) * stride + x] : 0, c = x >= ch && y ? out[(y - 1) * stride + x - ch] : 0;
      let v = line[x];
      if (ft === 1) v += a; else if (ft === 2) v += up; else if (ft === 3) v += (a + up) >> 1;
      else if (ft === 4) { const p = a + up - c, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, ch, data: out };
}
const tex = decodePng(png);
function sample(u, v) { // bilinear, glTF uv (v down)
  const x = Math.min(tex.w - 1.001, Math.max(0, u * tex.w - 0.5)), y = Math.min(tex.h - 1.001, Math.max(0, v * tex.h - 0.5));
  const x0 = Math.floor(x), y0 = Math.floor(y), fx = x - x0, fy = y - y0, res = [0, 0, 0];
  for (let k = 0; k < 3; k++) {
    const q = (xx, yy) => tex.data[(yy * tex.w + xx) * tex.ch + k];
    res[k] = (q(x0, y0) * (1 - fx) + q(x0 + 1, y0) * fx) * (1 - fy) + (q(x0, y0 + 1) * (1 - fx) + q(x0 + 1, y0 + 1) * fx) * fy;
  }
  return res;
}

// --- rasterise in lon/lat over the crater box
const meta = JSON.parse(readFileSync(META, 'utf8'));
const B = meta.bounds;
const OUT_H = Math.round(OUT_W * meta.rows / meta.cols);
let cx = 0, cy = 0, cz = 0; const n = P.length / 3;
for (let i = 0; i < n; i++) { cx += P[3 * i]; cy += P[3 * i + 1]; cz += P[3 * i + 2]; }
cx /= n; cy /= n; cz /= n;
const DEG = 180 / Math.PI;
// model vertex -> output pixel coordinates (east lon, lat)
function px(i) {
  const x = P[3 * i] - cx, y = P[3 * i + 1] - cy, z = P[3 * i + 2] - cz, r = Math.hypot(x, y, z);
  const lon = Math.atan2(x, z) * DEG + LON_OFFSET, lat = Math.asin(y / r) * DEG + LAT_OFFSET;
  return [((lon - B.lon_west) / (B.lon_east - B.lon_west)) * OUT_W, ((B.lat_north - lat) / (B.lat_north - B.lat_south)) * OUT_H];
}
const img = Buffer.alloc(OUT_W * OUT_H * 3), hit = new Uint8Array(OUT_W * OUT_H);
for (let t = 0; t < I.length; t += 3) {
  const v = [I[t], I[t + 1], I[t + 2]].map((i) => [...px(i), UV[2 * i], UV[2 * i + 1]]);
  const xs = v.map((q) => q[0]), ys = v.map((q) => q[1]);
  if (Math.max(...xs) < 0 || Math.min(...xs) > OUT_W || Math.max(...ys) < 0 || Math.min(...ys) > OUT_H) continue;
  if (Math.max(...xs) - Math.min(...xs) > OUT_W * 20) continue; // across the date line
  const [a, b, c] = v, det = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
  if (Math.abs(det) < 1e-9) continue;
  for (let y = Math.max(0, Math.floor(Math.min(...ys))); y <= Math.min(OUT_H - 1, Math.ceil(Math.max(...ys))); y++) {
    for (let x = Math.max(0, Math.floor(Math.min(...xs))); x <= Math.min(OUT_W - 1, Math.ceil(Math.max(...xs))); x++) {
      const X = x + 0.5, Y = y + 0.5;
      const l1 = ((b[1] - c[1]) * (X - c[0]) + (c[0] - b[0]) * (Y - c[1])) / det, l2 = ((c[1] - a[1]) * (X - c[0]) + (a[0] - c[0]) * (Y - c[1])) / det, l3 = 1 - l1 - l2;
      if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) continue;
      const col = sample(l1 * a[2] + l2 * b[2] + l3 * c[2], l1 * a[3] + l2 * b[3] + l3 * c[3]);
      const o = (y * OUT_W + x) * 3; img[o] = col[0]; img[o + 1] = col[1]; img[o + 2] = col[2]; hit[y * OUT_W + x] = 1;
    }
  }
}
const missing = hit.length - hit.reduce((s, v) => s + v, 0);
if (missing) throw new Error(missing + ' pixels not covered');
writeFileSync(OUT, img);
meta.color = {
  file: 'gale_color.rgb.bin', format: '8-bit RGB, row 0 = north edge, same bounds as the height grid', cols: OUT_W, rows: OUT_H,
  src: 'Colour texture of the NASA/JPL-Caltech Mars 3D model (models/mars.glb), sampled over these bounds; about 6 texture pixels per degree',
  lon_offset_deg: LON_OFFSET, lat_offset_deg: +LAT_OFFSET.toFixed(2),
};
writeFileSync(META, JSON.stringify(meta, null, 1) + '\n');
console.log(`wrote ${OUT_W} x ${OUT_H} colour grid`);
