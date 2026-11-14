// Step 4 Walk. PLACEHOLDER screen from the frame builder; the step builder replaces it
// (specs/4-walk.md). Only files in this directory may change.
// It shows the shared 3D terrain from the rover, facing the route, and can simulate the walk
// along the planned route so that the Debrief has a walk log.
import './style.css';
import * as THREE from 'three';
import { h, card, pillButton, labelTag } from '../../ui/index.js';
import { getTerrainScene, sceneToThree, ACCESS_MARS_FOG } from '../../core/terrainScene.js';
import { newWalkLog, simulateWalk, ROVER, RADIO, DEMO } from '../../core/index.js';

let cleanup = null;

export default {
  n: 4, id: 'walk', title: 'Walk',
  isComplete: (state) => !!(state.walk && state.walk.ended),

  async mount(el, ctx) {
    // the walk starts here: from now on there is no way back to the earlier steps
    if (!ctx.state.walk) ctx.set({ walk: { ...newWalkLog(), started: true } });
    const canvasWrap = h('div.walk-ph__view');
    const status = h('div.walk-ph__status.mono', 'Loading terrain…');
    const btnSim = pillButton({ text: 'Simulate the walk', onClick: simulate });
    const btnEnd = pillButton({ text: 'E: end excursion', variant: 'go', onClick: () => ctx.next(), disabled: !(ctx.state.walk && ctx.state.walk.ended) });
    el.append(canvasWrap, h('div.walk-ph__panel',
      card({ variant: 'helmet', title: 'Walk (placeholder)', sub: 'Frame placeholder: replace with specs/4-walk.md' ,
        children: h('div', { style: { fontSize: '12px' } }, 'Demo time ', `${DEMO.timeFactor.value}× `, labelTag(DEMO.timeFactor)) }),
      status, btnSim, btnEnd));

    const terrain = await ctx.getTerrain();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
    canvasWrap.append(renderer.domElement);
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(ACCESS_MARS_FOG.color, ACCESS_MARS_FOG.density);
    scene.background = new THREE.Color(ACCESS_MARS_FOG.color);
    const cam = new THREE.PerspectiveCamera(70, 1, 0.1, 5000);
    const resize = () => { const w = canvasWrap.clientWidth, hh = canvasWrap.clientHeight; renderer.setSize(w, hh); cam.aspect = w / hh; cam.updateProjectionMatrix(); };
    resize(); window.addEventListener('resize', resize);
    const eye = RADIO.eyeHeightM.value;
    const spot = ctx.state.route ? ctx.state.route.spot : { x: 10, z: 0 };
    sceneToThree(ROVER.x, terrain.heightAt(ROVER.x, ROVER.z) + eye, ROVER.z, cam.position);
    const target = ctx.state.route ? ctx.state.route.out.points[Math.min(12, ctx.state.route.out.points.length - 1)] : spot;
    cam.lookAt(sceneToThree(target.x, terrain.heightAt(target.x, target.z) + eye * 0.8, target.z));
    let alive = true, raf = 0;
    cleanup = () => { alive = false; cancelAnimationFrame(raf); window.removeEventListener('resize', resize); renderer.dispose(); };
    try {
      const t = await getTerrainScene();
      if (!alive) return;
      scene.add(t.root);
      status.textContent = 'Terrain loaded: ' + t.tiles.length + ' tiles';
    } catch (e) { console.error(e); status.textContent = 'Terrain failed to load'; }
    const loop = () => { if (!alive) return; renderer.render(scene, cam); raf = requestAnimationFrame(loop); };
    loop();

    function simulate() {
      const log = simulateWalk(terrain, ctx.state.route);
      ctx.set({ walk: log });
      btnEnd.disabled = false;
      status.textContent = 'Walk simulated along the planned route';
    }
  },

  unmount() { if (cleanup) cleanup(); cleanup = null; },

  /** State after this step is finished, for ?step=5: the planned route walked exactly as planned. */
  async devFixture(state, { getTerrain }) {
    const terrain = await getTerrain();
    return { walk: simulateWalk(terrain, state.route) };
  },
};
