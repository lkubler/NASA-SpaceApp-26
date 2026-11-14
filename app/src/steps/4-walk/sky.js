// The day sky of the walk (specs/x-sky.md): a dome with a soft butterscotch gradient (darker overhead, dusty
// at the horizon, brighter around the sun) and one small sun disc. The sun stands at a fixed place, the same
// direction that lights the rover (display.js sunAzimuthDeg / sunElevationDeg); it never moves.
// The horizon colour is the terrain's haze: skyFog() gives the fog and the cue shaders exactly that colour.
import * as THREE from 'three';
import { sceneToThree, ACCESS_MARS_FOG } from '../../core/terrainScene.js';
import { DISPLAY as D } from './display.js';

/**
 * The haze: colour and density the ground, the skyline and the cues fade into (the sky's horizon colour).
 * The density is the original Access Mars scene's (core/terrainScene.js); only the colour is the sky's.
 */
export function skyFog() {
  return { color: new THREE.Color(D.skyHorizonColor), density: ACCESS_MARS_FOG.density };
}

/** Unit vector from the eye towards the sun, in three.js axes (the one the rover light uses too). */
export function sunDirection(out = new THREE.Vector3()) {
  const az = (D.sunAzimuthDeg * Math.PI) / 180, el = (D.sunElevationDeg * Math.PI) / 180;
  return sceneToThree(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el), out).normalize();
}

/** The dome. Add it to the scene; call follow(camera) every frame so it stays centred on the eye. */
export function createSky() {
  const rad = Math.PI / 180;
  const mat = new THREE.ShaderMaterial({
    uniforms: {
      horizon: { value: new THREE.Color(D.skyHorizonColor) },
      zenith: { value: new THREE.Color(D.skyZenithColor) },
      glow: { value: new THREE.Color(D.skyGlowColor) },
      disc: { value: new THREE.Color(D.sunDiscColor) },
      sunDir: { value: sunDirection() },
      gradientSin: { value: Math.sin(D.skyGradientDeg * rad) },
      glowCos: { value: Math.cos(D.skyGlowWidthDeg * rad) },
      glowStrength: { value: D.skyGlowStrength },
      discRad: { value: D.sunDiscRadiusDeg * rad },
      discSoft: { value: D.sunDiscSoftDeg * rad },
    },
    vertexShader: `
      varying vec3 vDir;
      void main() {
        vDir = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: `
      uniform vec3 horizon, zenith, glow, disc, sunDir;
      uniform float gradientSin, glowCos, glowStrength, discRad, discSoft;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        // elevation: horizon colour at and below the horizon, easing towards the zenith colour
        float t = smoothstep(0.0, gradientSin, max(d.y, 0.0));
        vec3 col = mix(horizon, zenith, t);
        // brighter around the sun: a wide soft glow, falling smoothly to nothing at glowWidth
        float c = dot(d, sunDir);
        float g = smoothstep(glowCos, 1.0, c);
        col = mix(col, glow, glowStrength * g * g);
        // the sun: a small disc, a soft edge, a close halo
        float ang = acos(clamp(c, -1.0, 1.0));
        float halo = exp(-pow(max(ang - discRad, 0.0) / discSoft, 1.2));
        col = mix(col, disc, 0.55 * halo * step(0.0, c));
        col = mix(col, disc, 1.0 - smoothstep(discRad * 0.8, discRad, ang));
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
  });
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(D.skyRadiusM, 48, 24), mat);
  mesh.renderOrder = -1000;
  mesh.frustumCulled = false;
  return {
    mesh,
    follow(cam) { mesh.position.copy(cam.position); },
    dispose() { mesh.geometry.dispose(); mat.dispose(); },
  };
}
