// The 3D terrain (Access Mars Murray Buttes terrain.glb + tiles), loaded once, for Plan and Walk.
// The glb uses 2017 Draco compression that today's three.js DRACOLoader rejects, so we decode it
// with the original decoder shipped by Access Mars (public/draco-old, Apache-2.0).
// Units: the glb root carries a 0.01 scale; the original app undoes it with x100, so do we.
// Frame: the walk grid and all places use scene metres with x = east, z = NORTH (murray.json). In the raw
// glb that frame is mirrored against a real map (scripts/preprocess/README.md). We render it true to the
// map by flipping z: three.js position = (x, y, -z). So in three.js north is -z, east is +x, as usual.
// Always convert with sceneToThree / threeToScene.
// Node names carry the type: TILE (64 textured meshes, 128 x 128 m), SIMPLE (collision), BACKGROUND (4 km skyline).

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { GROUND_RAMP } from './groundColor.js';

const base = () => import.meta.env.BASE_URL || './';

let _decoder = null;
function loadDecoder() {
  if (_decoder) return _decoder;
  _decoder = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = base() + 'draco-old/draco_wasm_wrapper.js';
    s.onerror = () => reject(new Error('draco wrapper failed to load'));
    s.onload = async () => {
      try {
        const wasm = await fetch(base() + 'draco-old/draco_decoder.wasm').then((r) => r.arrayBuffer());
        let mod = null;
        // The Emscripten module is thenable: never resolve a promise with it directly.
        const m = window.DracoDecoderModule({
          wasmBinary: wasm,
          onModuleLoaded: (x) => { mod = x; resolve({ get: () => mod || m }); },
        });
        mod = mod || null;
      } catch (e) { reject(e); }
    };
    document.head.appendChild(s);
  });
  return _decoder;
}

/** Minimal stand-in for three's DRACOLoader: the two methods GLTFLoader calls. */
class OldDracoLoader {
  preload() { loadDecoder(); return this; }
  decodeDracoFile(buffer, callback, attributeIDs, attributeTypes, _cs, onError = () => {}) {
    return loadDecoder().then(({ get }) => {
      const M = get();
      const buf = new M.DecoderBuffer();
      buf.Init(new Int8Array(buffer), buffer.byteLength);
      const dec = new M.Decoder();
      const mesh = new M.Mesh();
      const status = dec.DecodeBufferToMesh(buf, mesh);
      if (status && status.ok && !status.ok()) throw new Error('draco decode failed');
      const geo = new THREE.BufferGeometry();
      const nPts = mesh.num_points();
      for (const name in attributeIDs) {
        const att = dec.GetAttributeByUniqueId(mesh, attributeIDs[name]);
        const nc = att.num_components();
        const arr = new M.DracoFloat32Array();
        dec.GetAttributeFloatForAllPoints(mesh, att, arr);
        const out = new Float32Array(nPts * nc);
        for (let i = 0; i < out.length; i++) out[i] = arr.GetValue(i);
        M.destroy(arr);
        geo.setAttribute(name, new THREE.BufferAttribute(out, nc));
      }
      const nF = mesh.num_faces();
      const idx = new Uint32Array(nF * 3);
      const ia = new M.DracoInt32Array();
      for (let f = 0; f < nF; f++) {
        dec.GetFaceFromMesh(mesh, f, ia);
        idx[3 * f] = ia.GetValue(0); idx[3 * f + 1] = ia.GetValue(1); idx[3 * f + 2] = ia.GetValue(2);
      }
      M.destroy(ia);
      geo.setIndex(new THREE.BufferAttribute(idx, 1));
      M.destroy(mesh); M.destroy(dec); M.destroy(buf);
      callback(geo);
    }).catch(onError);
  }
}

let _scene = null;
/**
 * The terrain as three.js objects, loaded once.
 * @returns {Promise<{ root: THREE.Object3D, tiles: THREE.Mesh[], simple: THREE.Mesh|null, background: THREE.Mesh|null, skyUrl: string }>}
 * root is in three.js metres: use sceneToThree(x, y, z) for grid / place positions. Add root to your scene;
 * it is shared, so clone it (root.clone()) if two views need it at the same time.
 */
export function getTerrainScene(onProgress) {
  if (_scene) return _scene;
  _scene = new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.setDRACOLoader(new OldDracoLoader());
    loader.load(base() + 'murray/terrain.glb', (gltf) => {
      const root = gltf.scene;
      root.scale.set(root.scale.x * 100, root.scale.y * 100, root.scale.z * -100);
      const tiles = [];
      let simple = null, background = null;
      const manager = new THREE.LoadingManager();
      const done = () => resolve({ root, tiles, simple, background, skyUrl: base() + 'murray/background.jpg' });
      manager.onLoad = done; // all tile textures loaded
      manager.onError = (u) => console.warn('texture failed', u);
      const tl = new THREE.TextureLoader(manager);
      const tex = (url) => {
        const t = tl.load(url);
        t.flipY = false; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
        return t;
      };
      root.traverse((o) => {
        if (!o.isMesh) return;
        const n = (o.name + ' ' + (o.parent ? o.parent.name : '')).toUpperCase();
        if (n.includes('SIMPLE')) { simple = o; o.visible = false; return; }
        // the glb carries no images: textures are the external tiles/<ID>.jpg and background.jpg
        if (n.includes('BACKGROUND')) {
          background = o;
          o.material = new THREE.MeshBasicMaterial({ map: tex(base() + 'murray/background.jpg'), side: THREE.DoubleSide });
          tintGrey(o.material); // the 4 km skyline is grey (no colour imagery) almost everywhere
          return;
        }
        const id = /ID_(\d+)/.exec(n);
        o.material = new THREE.MeshBasicMaterial({ map: id ? tex(base() + 'murray/tiles/' + id[1] + '.jpg') : null, color: id ? 0xffffff : 0x8a5a3a });
        if (id) tintGrey(o.material);
        tiles.push(o);
      });
      root.updateMatrixWorld(true);
    }, onProgress, reject);
  });
  return _scene;
}

// ---------- ground without colour imagery ----------
// Where Curiosity's cameras never saw the ground, the Access Mars tile textures are grey (no colour; in
// the walk square: most of the east, behind the butte mass, the south edge and the north-west corner).
// There the tiles are tinted with the plain ground colour of the maps (GROUND_RAMP), keeping the grey's
// own light and dark: no rock detail is invented. Coloured texture is left as it is. The test for grey
// is the one the Plan map uses (2-plan/ground.js composeGround): saturation 0.07 to 0.19 blends.
const srgb = (c) => new THREE.Color().setRGB(c[0] / 255, c[1] / 255, c[2] / 255, THREE.SRGBColorSpace);
const GREY_TINT = {
  uGreyTint: { value: 1 },
  uGroundDark: { value: srgb(GROUND_RAMP.dark) },
  uGroundLight: { value: srgb(GROUND_RAMP.light) },
};
function tintGrey(material) {
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, GREY_TINT);
    shader.fragmentShader = shader.fragmentShader
      .replace('void main() {', 'uniform float uGreyTint; uniform vec3 uGroundDark, uGroundLight;\nvoid main() {')
      .replace('#include <map_fragment>', `#include <map_fragment>
        {
          vec3 sc = pow(max(diffuseColor.rgb, vec3(0.0)), vec3(1.0 / 2.2)); // back to sRGB for the grey test
          float mx = max(sc.r, max(sc.g, sc.b)), mn = min(sc.r, min(sc.g, sc.b));
          float sat = mx > 0.03 ? (mx - mn) / mx : 0.0;
          float grey = 1.0 - clamp((sat - 0.07) / 0.12, 0.0, 1.0);
          float lum = dot(sc, vec3(0.3, 0.59, 0.11));
          vec3 tint = mix(uGroundDark, uGroundLight, clamp((lum - 0.2) / 0.5, 0.0, 1.0));
          diffuseColor.rgb = mix(diffuseColor.rgb, tint, grey * uGreyTint);
        }`);
  };
  material.customProgramCacheKey = () => 'grey-tint';
}
/** Tint the grey (no colour imagery) ground in the 3D view (on, default) or show the raw textures (off). */
export function setGreyTint(on) { GREY_TINT.uGreyTint.value = on ? 1 : 0; }

/**
 * Haze of the original Access Mars scene (src/js/core/colors.js FogColorHex, terrain-shader fogDensity):
 * exponential-squared fog that fades the 4 km skyline mesh into a light dusty haze.
 * Use as: scene.fog = new THREE.FogExp2(ACCESS_MARS_FOG.color, ACCESS_MARS_FOG.density).
 */
export const ACCESS_MARS_FOG = { color: 0xe1cbb2, density: 0.01 };

/** Scene metres (x east, y up, z north) -> three.js position (z flipped). */
export function sceneToThree(x, y, z, out = new THREE.Vector3()) { return out.set(x, y, -z); }
/** three.js position -> scene metres { x, y, z }. */
export function threeToScene(v) { return { x: v.x, y: v.y, z: -v.z }; }
/** Compass heading in degrees (0 = north, 90 = east) of a three.js direction vector. */
export function headingOf(dir) { return ((Math.atan2(dir.x, -dir.z) * 180) / Math.PI + 360) % 360; }
