// Intro (specs/x-intro.md): before the first walk of a session, the team's film (part A), then stepping out of
// the rover in the real walk scene (part B), then the helmet display fades in and the controls are handed over.
//   Part A  the film from app/public/egress (preloaded in Go / no-go, ui/introFilm.js); left out when not ready
//   Part B  the live walk camera: fade in from black at the rover hatch, step down to eye height, walk a few
//           metres, turn to the walk's start pose (the sim's x, z, yaw, pitch); helmet frame only
// While it runs, the walk loop neither advances the sim nor draws the HUD (the suit clock and the walk log stand
// still), and every key and click goes to the intro: any key, a click or the Skip button ends it at once.
import { h } from '../../ui/index.js';
import { RADIO, ROVER, isClosedAt } from '../../core/index.js';
import { sceneToThree } from '../../core/terrainScene.js';
import { takeIntroFilm, releaseIntroFilm } from '../../ui/introFilm.js';
import { DISPLAY as D } from './display.js';

// Display settings of the intro: timing and camera path only (no rule, suit or demo values)
const INTRO = {
  durationS: 4,        // part B, from the first frame on black to the start pose
  fadeS: 0.9,          // part B: fade in from black
  moveFromS: 0.25,     // part B: the camera starts moving here ...
  turnFromS: 0.8,      // ... and turns from facing away from the rover to the route from here
  hudFadeMs: 600,      // the helmet display fades in after part B
  // the start: just outside the SEV's side hatch (display.js roverHatch*: centre, height and opening of the door
  // on the model); the eye starts near the top of the opening, ducking out of it
  hatchOutM: 1.62,     // this far out from the rover's long axis (hull and wheels reach 1.54 m)
  hatchHeadM: 0.15,    // the eye this far below the top of the door opening
  clearM: 0.5,         // the path keeps this much outside the rover's footprint (sim.js: footprint plus suit margin)
  startPitchDeg: -9,   // looking slightly down at the step
  filmSlackS: 3,       // part A ends at the latest this long after the film's own length
};

const DEG = Math.PI / 180;
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (v) => { const x = clamp01(v); return x * x * (3 - 2 * x); };
const angleTo = (a, b) => Math.atan2(Math.sin(b - a), Math.cos(b - a));

let seen = false; // the film plays before the first walk of a session only (module flag: a reload is a new session)

/**
 * Camera path of part B for a start pose { x, z } beside the rover: hatch -> one step down and out -> start.
 * Points [{ x, z }] on the ground, smoothed; the rover frame as in sim.js (centre moved roverShiftM forward).
 */
export function introPath(start) {
  const ry = D.roverHeadingDeg * DEG;
  const fwd = { x: Math.sin(ry), z: Math.cos(ry) }, side = { x: Math.cos(ry), z: -Math.sin(ry) };
  const rc = { x: ROVER.x + fwd.x * D.roverShiftM, z: ROVER.z + fwd.z * D.roverShiftM };
  const at = (a, b) => ({ x: rc.x + fwd.x * a + side.x * b, z: rc.z + fwd.z * a + side.z * b });
  const aS = (start.x - rc.x) * fwd.x + (start.z - rc.z) * fwd.z, bS = (start.x - rc.x) * side.x + (start.z - rc.z) * side.z;
  const sgn = bS < 0 ? -1 : 1; // the hatch on the side of the start point
  const halfL = D.roverHalfLenM + D.roverMarginM + INTRO.clearM, halfW = D.roverHalfWidthM + D.roverMarginM + INTRO.clearM;
  const hA = D.roverHatchAlongM;
  const pts = [at(hA, sgn * INTRO.hatchOutM), at(hA, sgn * halfW)];
  // start ahead of or behind the rover and close to its axis: round the corner, never through the body
  if (Math.abs(aS) > halfL - INTRO.clearM && Math.abs(bS) < halfW) pts.push(at(Math.sign(aS) * halfL, sgn * halfW));
  pts.push({ x: start.x, z: start.z });
  // smooth the corners (Chaikin, ends kept); the first leg stays straight out of the hatch
  let p = pts;
  for (let it = 0; it < 3; it++) {
    const q = [p[0], p[1]];
    for (let i = 1; i < p.length - 1; i++) {
      const a = p[i], b = p[i + 1];
      q.push({ x: 0.75 * a.x + 0.25 * b.x, z: 0.75 * a.z + 0.25 * b.z }, { x: 0.25 * a.x + 0.75 * b.x, z: 0.25 * a.z + 0.75 * b.z });
    }
    q.push(p.at(-1));
    p = q;
  }
  const out = [p[0]];
  for (let i = 1; i < p.length; i++) if (Math.hypot(p[i].x - out.at(-1).x, p[i].z - out.at(-1).z) > 1e-3) out.push(p[i]);
  if (out.length < 2) out.push({ x: start.x, z: start.z });
  return { points: out, outYaw: Math.atan2(side.x * sgn, side.z * sgn), stepM: halfW - INTRO.hatchOutM };
}

/** Point at arc length d along points, and the total length. */
function along(points, d) {
  let left = d;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i], l = Math.hypot(b.x - a.x, b.z - a.z);
    if (left <= l || i === points.length - 1) { const f = l ? clamp01(left / l) : 1; return { x: a.x + (b.x - a.x) * f, z: a.z + (b.z - a.z) * f }; }
    left -= l;
  }
  return { ...points.at(-1) };
}
const lengthOf = (points) => points.slice(1).reduce((s, b, i) => s + Math.hypot(b.x - points[i].x, b.z - points[i].z), 0);

/**
 * @param {HTMLElement} el      the walk step's element
 * @param {HTMLElement} hudRoot the helmet layer (frame and display)
 * @param {object} ctx          the frame's step context
 * @returns {{ ready(api), frame(now): boolean, stop() }}
 *   ready({ v3, sim, t }) once the scene is loaded; frame(now) true while the intro draws the frame itself
 */
export function createIntro(el, hudRoot, ctx) {
  const devJump = ctx.params.get('step') === '4';
  const first = !seen; // later walks: no film, only stepping out of the rover (part B)
  const want = !devJump || ctx.params.get('intro') === '1';
  seen = true;
  if (!want) { releaseIntroFilm(); return { ready() {}, frame: () => false, stop() {} }; }

  const reduce = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const layer = h('div.walk-intro');
  el.insertBefore(layer, hudRoot);
  const skipBtn = h('button.walk-intro__skip.mono', { type: 'button' }, 'Skip');
  el.append(skipBtn);
  const frameImg = hudRoot.querySelector('.walk-frame');
  hudRoot.classList.add('is-intro');
  let phase = 'a'; // a: film, hold: black with the loading state, b: stepping out, hud: display fades in, done
  const setPhase = (p) => { phase = p; el.dataset.intro = p; };
  setPhase('a');

  let api = null, video = null, filmTimer = 0, hudTimer = 0, paused = false;
  let path = null, len = 0, start = null, tB = null, warm = 0, pausedAt = 0;

  // ---------- input: every key and click goes to the intro (the step bar and dialogs keep theirs) ----------
  const onKeyDown = (e) => {
    // the walk never sees a key; a dialog or the sources page takes its keys before this (capture, own element)
    e.stopPropagation();
    if (paused) return;
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
    skip();
  };
  const onKeyUp = (e) => e.stopPropagation();
  const onPointer = (e) => { e.preventDefault(); e.stopPropagation(); skip(); };
  document.addEventListener('keydown', onKeyDown);
  document.addEventListener('keyup', onKeyUp);
  layer.addEventListener('pointerdown', onPointer);
  skipBtn.addEventListener('pointerdown', onPointer);
  skipBtn.addEventListener('click', skip);
  const offOverlay = ctx.onOverlay((open) => {
    paused = open;
    if (video) {
      clearTimeout(filmTimer);
      if (open) video.pause();
      else { armFilmTimer(); video.play().catch(() => endA()); }
    }
    if (open) pausedAt = performance.now();
    else if (tB !== null) tB += performance.now() - pausedAt; // part B stands still while paused
  });

  // test hook: the phase and the camera path of part B
  window.__intro = { get phase() { return phase; }, path: null, skip };

  // ---------- part A: the film ----------
  const film = first ? takeIntroFilm() : null;
  if (film) {
    video = film;
    video.className = 'walk-intro__film';
    layer.append(video);
    try { video.currentTime = 0; } catch { /* not seekable yet */ }
    video.addEventListener('ended', endA, { once: true });
    video.addEventListener('error', endA, { once: true });
    armFilmTimer();
    const p = video.play();
    if (p && p.catch) p.catch(() => endA());
  } else endA();

  function armFilmTimer() {
    clearTimeout(filmTimer);
    filmTimer = setTimeout(endA, (Math.max(0, (video.duration || 10) - (video.currentTime || 0)) + INTRO.filmSlackS) * 1000);
  }
  function removeFilm() {
    clearTimeout(filmTimer);
    if (video) { video.removeEventListener('ended', endA); video.removeEventListener('error', endA); video.remove(); video = null; }
    releaseIntroFilm();
  }
  function endA() {
    if (phase !== 'a') return;
    removeFilm();
    if (api) startB(); else { setPhase('hold'); hudRoot.classList.add('is-intro-hold'); }
  }

  // ---------- part B: stepping out ----------
  function startB() {
    hudRoot.classList.remove('is-intro-hold');
    const s = api.sim.s;
    start = { x: s.x, z: s.z, yaw: s.yaw, pitch: s.pitch };
    const ip = introPath(start);
    path = ip; len = lengthOf(ip.points);
    tB = null; warm = 0;
    if (frameImg) frameImg.style.opacity = '0';
    setPhase('b');
    window.__intro.path = ip.points;
  }

  /** Camera of part B at u seconds: { x, z, y, yaw, pitch }. */
  function poseAt(u) {
    const { t } = api, eye = RADIO.eyeHeightM.value;
    if (reduce) return { x: start.x, z: start.z, y: t.heightAt(start.x, start.z) + eye, yaw: start.yaw, pitch: start.pitch };
    const m = smooth((u - INTRO.moveFromS) / (INTRO.durationS - INTRO.moveFromS)) * len;
    const p = along(path.points, m);
    // the step down from the hatch to eye height above the ground, while leaving the hatch
    const up = (D.roverHatchUpM + D.roverHatchRadiusM - INTRO.hatchHeadM - eye) * (1 - smooth(m / path.stepM));
    const k = smooth((u - INTRO.turnFromS) / (INTRO.durationS - INTRO.turnFromS));
    return {
      x: p.x, z: p.z, y: t.heightAt(p.x, p.z) + eye + up,
      yaw: path.outYaw + angleTo(path.outYaw, start.yaw) * k,
      pitch: INTRO.startPitchDeg * DEG + (start.pitch - INTRO.startPitchDeg * DEG) * k,
    };
  }

  function drawB(now) {
    const { v3 } = api;
    // first two frames on full black: shaders and textures warm up where nobody sees a hitch
    if (tB === null) { if (warm++ < 2) { place(poseAt(0)); v3.render(); return; } tB = now; }
    const u = paused ? (pausedAt - tB) / 1000 : (now - tB) / 1000;
    if (u >= INTRO.durationS) {
      // the walk's own start pose, exactly as the walk draws it (scene3d setPose)
      v3.setPose(start.x, start.z, start.yaw, start.pitch);
      v3.render();
      layer.style.opacity = '0';
      if (frameImg) frameImg.style.opacity = '';
      handOver(true);
      return;
    }
    place(poseAt(u));
    v3.render();
    const fade = smooth(u / INTRO.fadeS);
    layer.style.opacity = String(1 - fade);
    if (frameImg) frameImg.style.opacity = String(fade);
  }
  function place(q) {
    const cam = api.v3.cam;
    sceneToThree(q.x, q.y, q.z, cam.position);
    cam.rotation.set(q.pitch, -q.yaw, 0);
    cam.updateMatrixWorld();
  }

  // ---------- hand over ----------
  function handOver(fadeHud) {
    if (phase === 'done' || phase === 'hud') return;
    if (!fadeHud) { finish(); return; }
    setPhase('hud');
    skipBtn.remove(); // its corner belongs to the display now (ground legend)
    hudRoot.classList.add('is-intro-out');
    hudRoot.classList.remove('is-intro');
    hudTimer = setTimeout(finish, INTRO.hudFadeMs);
  }
  function skip() {
    if (phase === 'done') return;
    finish();
  }
  function finish() {
    if (phase === 'done') return;
    setPhase('done');
    cleanup();
  }
  function cleanup() {
    removeFilm();
    clearTimeout(hudTimer);
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
    offOverlay();
    layer.remove(); skipBtn.remove();
    hudRoot.classList.remove('is-intro', 'is-intro-hold', 'is-intro-out');
    if (frameImg) frameImg.style.opacity = '';
    delete el.dataset.intro;
  }

  return {
    /** The scene is loaded and the sim has its start pose. */
    ready(a) {
      api = a;
      if (phase === 'hold') startB();
    },
    /** Called first in every walk frame: true while the intro draws (the sim and the HUD wait). */
    frame(now) {
      if (phase === 'a' || phase === 'hold') return true;
      if (phase === 'b') { drawB(now); return phase === 'b'; }
      return false;
    },
    /** The step unmounts (step bar, dialog): stop the film, remove the layer and the listeners. */
    stop() { if (phase !== 'done') { setPhase('done'); cleanup(); } delete window.__intro; },
  };
}
