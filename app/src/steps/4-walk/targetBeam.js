// Target beacon (specs/feedback-1.md, Walk: display): a thin vertical beam of light in the accent blue at
// the current target, with a soft ring on the ground. Same look as the steep border (a clear core and a
// translucent glow, fading out upwards), visible across the whole site, gone within about 5 m of the walker so it
// never covers the sample spot. Only the current target has one (the caller passes the walk's own target:
// the next stop, then the rover; null: none).
//
// Kept apart from scene3d.js: it takes the haze colour and density as parameters (setFog), the way the route
// band takes them, so the scene can change its sky without touching this file.
import * as THREE from 'three';
import { DISPLAY as D } from './display.js';

const RING_SEGMENTS = 64, RING_STEPS = 10;

/**
 * @param {{ heightAt(x: number, z: number): number }} t  the walk grid
 * @param {{ color: THREE.ColorRepresentation, fogColor: THREE.ColorRepresentation, fogDensity: number }} o
 * @returns {{ group: THREE.Group, setTarget(p: {x: number, z: number} | null): void, update(cam: THREE.PerspectiveCamera, renderer: THREE.WebGLRenderer): void, setFog(color: THREE.ColorRepresentation, density: number): void, dispose(): void }}
 */
export function createBeacon(t, o) {
  const shared = {
    color: { value: new THREE.Color(o.color) },
    fogColor: { value: new THREE.Color(o.fogColor) }, fogDensity: { value: o.fogDensity },
    base: { value: new THREE.Vector3() },       // three.js position of the target on the walk grid
    fadeFull: { value: D.beaconFadeFullM }, fadeGone: { value: D.beaconFadeGoneM }, fogShare: { value: D.beaconFogShare },
  };
  const COMMON = `
    uniform vec3 color, fogColor, base; uniform float fogDensity, fadeFull, fadeGone, fogShare;
    // 1 from fadeFull metres away (horizontal, from the eye to the target) and farther, 0 at fadeGone and closer
    float nearFade() { return smoothstep(fadeGone, fadeFull, distance(base.xz, cameraPosition.xz)); }
    vec3 hazed(vec3 c, float d) { return mix(c, fogColor, fogShare * (1.0 - exp(-fogDensity * fogDensity * d * d))); }`;

  // ---------- the beam: one vertical strip turned to face the eye (a round beam from every side) ----------
  const bg = new THREE.BufferGeometry();
  bg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], 3));
  bg.setAttribute('corner', new THREE.Float32BufferAttribute([-1, 0, 1, 0, -1, 1, 1, 1], 2));
  bg.setIndex([0, 1, 2, 2, 1, 3]);
  const beamMat = new THREE.ShaderMaterial({
    uniforms: {
      ...shared,
      height: { value: D.beaconHeightM }, below: { value: D.beaconBelowM },
      coreM: { value: D.beaconCoreM }, corePx: { value: D.beaconCorePx }, glowM: { value: D.beaconGlowM }, glowAlpha: { value: D.beaconGlowAlpha },
      pxM: { value: 0.001 },                    // metres per pixel at one metre distance (set in update)
    },
    vertexShader: `
      attribute vec2 corner; varying vec2 vUv; varying float vCore, vDist, vHm;
      uniform vec3 base; uniform float height, below, coreM, corePx, glowM, pxM;
      void main() {
        float hm = corner.y * (height + below) - below;      // metres above the walk grid
        vec3 p = base + vec3(0.0, hm, 0.0);
        vec3 toEye = cameraPosition - p;
        vec2 h = toEye.xz;
        vec3 right = length(h) > 1e-3 ? normalize(vec3(h.y, 0.0, -h.x)) : vec3(1.0, 0.0, 0.0);
        float d = length(toEye);
        float core = max(coreM, d * pxM * corePx * 0.5);     // never thinner than corePx pixels
        float half_ = max(glowM, core * 3.0);
        vCore = core / half_; vUv = vec2(corner.x, hm); vDist = d; vHm = hm;
        vec4 w = vec4(p + right * corner.x * half_, 1.0);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float height, glowAlpha;
      varying vec2 vUv; varying float vCore, vDist, vHm;
      ${COMMON}
      void main() {
        float nf = nearFade();
        if (nf < 0.01) discard;
        float u = abs(vUv.x);
        float aa = fwidth(u) + 1e-4;
        // clear core, then a glow falling off to the edge of the strip
        float core = 1.0 - smoothstep(vCore - aa, vCore + aa, u);
        float glow = glowAlpha * pow(1.0 - clamp((u - vCore) / max(1.0 - vCore, 1e-3), 0.0, 1.0), 2.0) * step(vCore, u + aa);
        // strong at the foot, fading out upwards (the top stays soft, no cut)
        float up = 1.0 - smoothstep(0.25, 1.0, max(vHm, 0.0) / height);
        float a = nf * max(core * (0.25 + 0.75 * up), glow * up);
        if (a < 0.005) discard;
        vec3 c = mix(color, vec3(0.82, 0.96, 1.0), 0.45 * core);
        gl_FragColor = vec4(hazed(c, vDist), a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
  });
  const beam = new THREE.Mesh(bg, beamMat);
  beam.frustumCulled = false;
  beam.renderOrder = 4;

  // ---------- the ring on the ground: a flat disc mesh that follows the terrain, the ring itself drawn in the shader ----------
  const R = D.atTargetM, outer = R + 3 * D.beaconRingGlowM;
  const nv = (RING_STEPS + 1) * RING_SEGMENTS;
  const rpos = new Float32Array(nv * 3), ridx = [];
  for (let s = 0; s < RING_STEPS; s++) for (let a = 0; a < RING_SEGMENTS; a++) {
    const a2 = (a + 1) % RING_SEGMENTS, i = s * RING_SEGMENTS + a, j = s * RING_SEGMENTS + a2;
    ridx.push(i, j, i + RING_SEGMENTS, j, j + RING_SEGMENTS, i + RING_SEGMENTS);
  }
  const rg = new THREE.BufferGeometry();
  rg.setAttribute('position', new THREE.BufferAttribute(rpos, 3));
  rg.setIndex(ridx);
  const ringMat = new THREE.ShaderMaterial({
    uniforms: { ...shared, ringR: { value: R }, lineM: { value: D.beaconRingLineM }, glowM: { value: D.beaconRingGlowM }, glowAlpha: { value: D.beaconGlowAlpha } },
    vertexShader: `
      varying vec3 vW;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: `
      uniform float ringR, lineM, glowM, glowAlpha;
      varying vec3 vW;
      ${COMMON}
      void main() {
        float nf = nearFade();
        if (nf < 0.01) discard;
        float r = distance(vW.xz, base.xz);
        float e = abs(r - ringR);
        float aa = fwidth(r) + 1e-4;
        float line = 1.0 - smoothstep(lineM - aa, lineM + aa, e);
        float glow = glowAlpha * exp(-(e * e) / (glowM * glowM));
        float a = nf * max(line * 0.9, glow);
        if (a < 0.005) discard;
        vec3 c = mix(color, vec3(0.82, 0.96, 1.0), 0.4 * line);
        gl_FragColor = vec4(hazed(c, distance(vW, cameraPosition)), a);
        #include <colorspace_fragment>
      }`,
    transparent: true, depthWrite: false, side: THREE.DoubleSide,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
  const ring = new THREE.Mesh(rg, ringMat);
  ring.frustumCulled = false;
  ring.renderOrder = 3;

  const group = new THREE.Group();
  group.visible = false;
  group.add(ring, beam);

  let at = null;
  const _s = new THREE.Vector2();
  return {
    group,
    /** The walk's current target { x, z } (scene metres), or null for none. Does nothing while it is the same one. */
    setTarget(p) {
      if (!p) { group.visible = false; at = null; return; }
      if (at && at.x === p.x && at.z === p.z) return;
      at = { x: p.x, z: p.z };
      const y = t.heightAt(p.x, p.z);
      shared.base.value.set(p.x, y, -p.z);
      for (let s = 0; s <= RING_STEPS; s++) for (let a = 0; a < RING_SEGMENTS; a++) {
        const r = (outer * s) / RING_STEPS, ang = (a / RING_SEGMENTS) * Math.PI * 2;
        const x = p.x + Math.cos(ang) * r, z = p.z + Math.sin(ang) * r;
        rpos.set([x, t.heightAt(x, z) + D.beaconRingLiftM, -z], (s * RING_SEGMENTS + a) * 3);
      }
      rg.attributes.position.needsUpdate = true;
      // the beam strip: four corners, set once in the vertex shader from `base` and `corner`
      group.visible = true;
    },
    /** Once per frame: pixel size for the beam's minimum width. */
    update(cam, renderer) {
      if (!group.visible) return;
      renderer.getDrawingBufferSize(_s);
      beamMat.uniforms.pxM.value = (2 * Math.tan((cam.fov * Math.PI) / 360)) / Math.max(1, _s.y);
    },
    /** Haze colour and density of the scene (the same the route band reads). */
    setFog(color, density) { shared.fogColor.value.set(color); shared.fogDensity.value = density; },
    dispose() { bg.dispose(); beamMat.dispose(); rg.dispose(); ringMat.dispose(); },
  };
}
