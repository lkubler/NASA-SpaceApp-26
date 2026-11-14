// Adapter: decodes Access Mars' 2017-era Draco streams with the original decoder shipped in the
// Access Mars repo (Apache-2.0, public/draco-old/draco-decoder.js). Modern three.js DRACOLoader rejects
// these streams ("Unsupported minor version"). Exposes the one method GLTFLoader calls.
import * as THREE from 'three';

let D = null;
let dp = null;
function loadDecoder() {
  if (dp) return dp;
  const base = import.meta.env.BASE_URL + 'draco-old/';
  dp = new Promise((res, rej) => {
    fetch(base + 'draco_decoder.wasm').then((r) => r.arrayBuffer()).then((wasmBinary) => {
      const s = document.createElement('script');
      s.src = base + 'draco_wasm_wrapper.js';
      s.onload = () => { window.DracoDecoderModule({ wasmBinary, onModuleLoaded: (m) => { D = m; res(true); } }); };
      s.onerror = () => rej(new Error('draco wrapper failed to load'));
      document.head.appendChild(s);
    }).catch(rej);
  });
  return dp;
}

function floats(dec, geom, type, comps) {
  const id = dec.GetAttributeId(geom, type);
  if (id === -1) return null;
  const att = dec.GetAttribute(geom, id);
  const arr = new D.DracoFloat32Array();
  dec.GetAttributeFloatForAllPoints(geom, att, arr);
  const n = geom.num_points() * comps, out = new Float32Array(n);
  for (let i = 0; i < n; i++) out[i] = arr.GetValue(i);
  D.destroy(arr);
  return out;
}

export class OldDracoLoader {
  preload() { return loadDecoder(); }
  decodeDracoFile(rawBuffer, callback) {
    return loadDecoder().then(() => {
      const buf = new D.DecoderBuffer();
      buf.Init(new Int8Array(rawBuffer), rawBuffer.byteLength);
      const dec = new D.Decoder();
      const mesh = new D.Mesh();
      const st = dec.DecodeBufferToMesh(buf, mesh);
      if (!st.ok()) throw new Error('Draco decode: ' + st.error_msg());
      D.destroy(buf);
      const g = new THREE.BufferGeometry();
      const nf = mesh.num_faces(), idx = new Uint32Array(nf * 3), ia = new D.DracoInt32Array();
      for (let i = 0; i < nf; i++) { dec.GetFaceFromMesh(mesh, i, ia); idx[i * 3] = ia.GetValue(0); idx[i * 3 + 1] = ia.GetValue(1); idx[i * 3 + 2] = ia.GetValue(2); }
      D.destroy(ia);
      g.setIndex(new THREE.BufferAttribute(idx, 1));
      g.setAttribute('position', new THREE.BufferAttribute(floats(dec, mesh, D.POSITION, 3), 3));
      const nor = floats(dec, mesh, D.NORMAL, 3); if (nor) g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
      const uv = floats(dec, mesh, D.TEX_COORD, 2); if (uv) g.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
      D.destroy(mesh); D.destroy(dec);
      callback(g);
    });
  }
}
