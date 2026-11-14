// Step 4 Walk (specs/4-walk.md): first person on the Murray Buttes terrain, through the helmet.
// At every step the helmet answers: from where I stand, can I still get home?
//   sim.js      position, demo clock, suit, warnings, walk log (core numbers only)
//   scene3d.js  terrain, real skyline and haze, rover model, route band
//   hud.js      helmet frame and display
//   look.js     what the reticle points at
// Controls: click for mouse look (pointer lock; without it, hold the button and drag), W A S D to walk, arrow
// keys to turn and look, Shift held fast walk, Shift twice demo speed, F aim and click to jump, E to act,
// esc twice to end the mission.
import './style.css';
import { newWalkLog, simulateWalk, ROVER, RADIO, roverField, spotField } from '../../core/index.js';
import { createSim } from './sim.js';
import { createScene3d } from './scene3d.js';
import { createHud } from './hud.js';
import { lookAt, visiblePoints, rayHit } from './look.js';
import { DISPLAY as D } from './display.js';

let cleanup = null;

// Firefox on Linux keeps the pointer locked by moving the hidden cursor back to the lock point after every
// move; where it cannot (seen under Wayland, and in headless Firefox) movementX/Y come as the offset from the
// lock point, so the view turns one way only. There the view turns by dragging, without a pointer lock.
const UA = typeof navigator === 'undefined' ? '' : navigator.userAgent;
const LOCK_OK = !(/Firefox\//.test(UA) && /Linux/.test(UA) && !/Android/.test(UA));

export default {
  n: 4, id: 'walk', title: 'Walk',
  isComplete: (state) => !!(state.walk && state.walk.ended),

  async mount(el, ctx) {
    let alive = true;
    const disposers = [];
    cleanup = () => { alive = false; while (disposers.length) disposers.pop()(); };
    // the walk starts here: from now on there is no way back to the earlier steps
    if (!ctx.state.walk || ctx.state.walk.ended) ctx.set({ walk: { ...newWalkLog(), started: true } });
    const log = ctx.state.walk;
    const view = el.appendChild(document.createElement('div'));
    view.className = 'walk-view';
    const hudRoot = el.appendChild(document.createElement('div'));
    hudRoot.className = 'walk-layer';
    const hud = createHud(hudRoot);

    const t = await ctx.getTerrain();
    if (!alive) return;
    const route = ctx.state.route;
    if (!route) { hud.setLoading('No route planned. Start from step 1.'); return; }
    hud.setTerrain(t);
    hud.setPlanBroken(ctx.state.plan && ctx.state.plan.brokenRules);
    // cost fields to the rover and the spot: built once here, read every step
    roverField(t); spotField(t, route.spot);
    const sim = createSim(t, route, log);
    const v3 = createScene3d(view, t);
    disposers.push(() => v3.dispose());
    v3.setBand('out', route.out.points, true);
    v3.setBand('back', route.back.points, false);
    v3.placeRover((D.roverHeadingDeg * Math.PI) / 180, D.roverShiftM);

    // ---------- input ----------
    // Mouse look: every movement is added up, none is dropped. With the pointer captured (pointer lock) the
    // movementX/Y of each event; without it (lock refused, not yet granted, or lost) holding the button and
    // dragging turns the view by the cursor's own way (clientX/Y), so the view always turns both ways.
    const keys = new Set();
    let escArmedUntil = 0, unlockedAt = 0, lastShiftAt = 0, shiftDownAt = 0;
    const mouse = { dx: 0, dy: 0 };
    const mode = { demo: false, aim: false, landing: null, jumped: null, jumpedAt: 0 };
    const drag = { on: false, x: 0, y: 0, moved: 0 };
    const isLocked = () => document.pointerLockElement === view;
    const onKeyDown = (e) => {
      if (e.code === 'Escape') { if (mode.aim) { setAim(false); return; } onEsc(); return; }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.repeat && (e.code === 'KeyE' || e.code === 'KeyF' || e.key === 'Shift')) return;
      if (e.code === 'KeyE' || e.code === 'Enter') { act(); return; }
      if (e.code === 'KeyF') { if (!log.ended && !sim.s.modal) setAim(!mode.aim); return; }
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') shiftDownAt = performance.now();
      keys.add(e.code);
      if (sim.s.modal === 'sample' && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) closeSample();
    };
    const onKeyUp = (e) => {
      keys.delete(e.code);
      if (e.code !== 'ShiftLeft' && e.code !== 'ShiftRight') return;
      // Shift tapped twice (two short presses, not a hold for fast walk): demo speed on / off
      const now = performance.now();
      if (now - shiftDownAt > D.tapMaxMs) { lastShiftAt = 0; return; }
      if (now - lastShiftAt < D.doubleTapMs) { mode.demo = !mode.demo; lastShiftAt = 0; } else lastShiftAt = now;
    };
    const onBlur = () => { keys.clear(); drag.on = false; };
    // A real lock holds the cursor still (clientX/Y stay put). Where the cursor keeps moving under the lock, the
    // browser does not hold it (seen in Firefox: movementX/Y then come as the offset from the lock point, so
    // the view turns one way only, and the hidden cursor can stop at the screen edge): the lock is released for
    // this walk and the drag look takes over.
    const lk = { last: null, moved: 0, broken: false };
    const onMouseMove = (e) => {
      if (isLocked()) {
        if (lk.last && (e.clientX !== lk.last.x || e.clientY !== lk.last.y)) lk.moved++;
        lk.last = { x: e.clientX, y: e.clientY };
        if (lk.moved >= D.lockDriftEvents) {
          lk.broken = true;
          drag.x = e.clientX; drag.y = e.clientY;
          document.exitPointerLock();
          return;
        }
        const mx = e.movementX || 0, my = e.movementY || 0;
        mouse.dx += mx; mouse.dy += my;
        if (drag.on) drag.moved += Math.abs(mx) + Math.abs(my);
        return;
      }
      if (!drag.on) return;
      if (!(e.buttons & 1)) { drag.on = false; return; } // released outside the window
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      drag.x = e.clientX; drag.y = e.clientY;
      mouse.dx += dx; mouse.dy += dy;
      drag.moved += Math.abs(dx) + Math.abs(dy);
    };
    function requestLock() {
      if (isLocked() || log.ended || lk.broken || !LOCK_OK || !view.requestPointerLock) return;
      // a refused lock (browser setting, too soon after esc, option not supported) leaves the drag look
      const plain = () => { try { const p = view.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch { /* not allowed */ } };
      try {
        // raw mouse movement where the browser supports it (Chromium); elsewhere the option is ignored or refused
        const p = view.requestPointerLock({ unadjustedMovement: true });
        if (p && p.catch) p.catch((err) => { if (err && err.name === 'NotSupportedError') plain(); });
      } catch { plain(); }
    }
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      drag.on = true; drag.x = e.clientX; drag.y = e.clientY; drag.moved = 0;
      if (!mode.aim) requestLock(); // in aim mode the click jumps: no lock request on it
    };
    const onMouseUp = (e) => {
      if (e.button !== 0 || !drag.on) return;
      drag.on = false;
      if (mode.aim && drag.moved < D.clickMaxPx) jump();
    };
    const onLockChange = () => {
      if (isLocked()) { lk.last = null; lk.moved = 0; return; }
      unlockedAt = performance.now();
      // esc while captured: the browser takes the key to release the pointer; in aim mode that esc cancels the aim
      if (mode.aim) setAim(false);
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onLockChange);
    view.addEventListener('mousedown', onMouseDown);
    disposers.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      if (document.pointerLockElement) document.exitPointerLock();
    });

    function setAim(on) {
      mode.aim = !!on && !log.ended;
      mode.landing = null;
      hud.setAim(mode.aim ? { p: null, ok: false, m: null } : null);
    }
    function jump() {
      const L = mode.landing;
      if (!L || !L.ok) return; // not reachable: the click does nothing
      const r = sim.jumpTo(L.x, L.z);
      if (!r) return;
      mode.jumped = r; mode.jumpedAt = performance.now();
      setAim(false);
      ctx.set({ walk: log });
      if (sim.s.modal === 'empty') hud.showEmpty(log);
    }

    function onEsc() {
      // esc also releases the pointer lock; never end the mission on that same press
      if (performance.now() - unlockedAt < 250 || isLocked()) return;
      if (log.ended) return;
      const now = performance.now();
      if (now < escArmedUntil) { sim.endMission(); finishStep(); return; }
      escArmedUntil = now + 3000;
      hud.setEscArmed(true);
    }
    function act() {
      if (sim.s.modal === 'sample') { closeSample(); return; }
      if (sim.s.modal === 'empty') { finishStep(); return; }
      if (sim.takeSample()) {
        // the photo shown at the spot: the request's real Curiosity photo of this rock type (step 1);
        // logged with the sample so the debrief report shows the same photo
        const rq = ctx.state.request;
        if (rq && rq.photo) Object.assign(log.sample, { photo: rq.photo, photoTitle: rq.photoCaption, photoCredit: rq.photoCredit, photoMeta: rq.photoMeta, photoUrl: rq.photoUrl });
        ctx.set({ walk: log });
        v3.setBand('out', route.out.points, false);
        v3.setBand('back', route.back.points, true);
        if (sim.s.modal === 'sample') hud.showSample(route, log);
        else if (sim.s.modal === 'empty') hud.showEmpty(log);
        return;
      }
      if (sim.endExcursion()) finishStep();
    }
    function closeSample() { sim.s.modal = null; hud.hideModal(); }
    let finished = false;
    function finishStep() {
      if (finished) return;
      finished = true;
      if (document.pointerLockElement) document.exitPointerLock();
      ctx.set({ walk: log });
      ctx.next();
    }
    disposers.push(ctx.onOverlay((open) => { sim.s.paused = open; keys.clear(); }));

    function input() {
      const k = (c) => (keys.has(c) ? 1 : 0);
      return {
        f: k('KeyW') - k('KeyS'),
        r: k('KeyD') - k('KeyA'),
        turn: k('ArrowRight') - k('ArrowLeft'),
        pitch: k('ArrowUp') - k('ArrowDown'),
        fast: !!(k('ShiftLeft') || k('ShiftRight')),
        demo: mode.demo,
      };
    }

    // ---------- simulation ----------
    let acc = 0, lastWarnCount = log.warnings.length, lastBroken = log.brokenRules.length;
    function advance(dtReal) {
      if (mouse.dx || mouse.dy) {
        if (!sim.s.modal && !log.ended) {
          sim.s.yaw += mouse.dx * D.mouseRadPerPx;
          const pm = (D.pitchMaxDeg * Math.PI) / 180;
          sim.s.pitch = Math.max(-pm, Math.min(pm, sim.s.pitch - mouse.dy * D.mouseRadPerPx));
        }
        mouse.dx = mouse.dy = 0;
      }
      acc += Math.min(dtReal, D.maxFrameS);
      const inp = input();
      while (acc >= D.tickS) {
        sim.step(D.tickS, inp);
        acc -= D.tickS;
        if (sim.s.modal === 'empty') { hud.showEmpty(log); acc = 0; break; }
      }
      if (log.warnings.length !== lastWarnCount || log.brokenRules.length !== lastBroken) {
        lastWarnCount = log.warnings.length; lastBroken = log.brokenRules.length;
        ctx.set({ walk: log }); // notable events: let listeners see the log
      }
      if (escArmedUntil && performance.now() > escArmedUntil) { escArmedUntil = 0; hud.setEscArmed(false); }
    }

    // ---------- frame ----------
    let frameNo = 0, look = null, vis = visiblePoints(t, sim.s);
    function frame() {
      const s = sim.s;
      v3.setPose(s.x, s.z, s.yaw, s.pitch);
      const heading = ((((s.yaw * 180) / Math.PI) % 360) + 360) % 360; // 0 = north, 90 = east
      const eye = { x: s.x, y: v3.cam.position.y, z: s.z };
      if (frameNo % 3 === 0) look = lookAt(t, eye, v3.viewDir(), vis);
      if (frameNo % 15 === 0) vis = visiblePoints(t, s);
      frameNo++;
      // aim mode: the landing point under the crosshair, on the ground within reach
      if (mode.aim) {
        const hit = rayHit(t, eye, v3.viewDir(), D.jumpMaxM);
        mode.landing = hit ? { x: hit.x, z: hit.z, ok: sim.canLand(hit.x, hit.z), m: Math.hypot(hit.x - s.x, hit.z - s.z) } : null;
        const L = mode.landing;
        hud.setAim({ p: L ? v3.project(L.x, t.heightAt(L.x, L.z), L.z) : null, ok: !!(L && L.ok), m: L ? L.m : null });
      }
      const jumpedOn = mode.jumped && performance.now() - mode.jumpedAt < D.jumpNoteS * 1000;
      hud.setMode({ fast: s.fast, workW: s.workW, demo: mode.demo, aim: mode.aim, jumped: jumpedOn ? mode.jumped : null });
      // the helmet text first (alert, prompt), so the look card and the markers give way to it in this frame
      hud.update(sim, heading);
      hud.setLook(look);
      const tg = sim.target();
      const tgP = v3.project(tg.x, t.heightAt(tg.x, tg.z) + (tg.kind === 'rover' ? 3.2 : 1.6), tg.z);
      const rvP = v3.project(ROVER.x, t.heightAt(ROVER.x, ROVER.z) + 3.0, ROVER.z);
      hud.setMarks({ ...tg, p: tgP }, rvP, Math.hypot(s.x - ROVER.x, s.z - ROVER.z) < D.lookMaxM,
        vis.map((q) => ({ p: v3.project(q.point.x, Math.max(q.point.y, t.heightAt(q.point.x, q.point.z)) + 0.3, q.point.z), on: q.on })));
      v3.render();
    }

    hud.setLoading('Loading terrain…');
    try { await v3.loadTerrain(); } catch (e) { console.error(e); }
    if (!alive) return;
    hud.setLoading('');

    let raf = 0, last = performance.now(), held = false;
    const loop = (now) => {
      if (!alive) return;
      if (held) { last = now; raf = requestAnimationFrame(loop); return; }
      advance((now - last) / 1000); last = now;
      frame();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    disposers.push(() => cancelAnimationFrame(raf));

    // test and dev hook: drive the walk with the real key state, faster than real time, without rendering
    window.__walk = {
      advance: (seconds, render = false) => { let left = seconds; while (left > 0 && !finished) { const d = Math.min(D.maxFrameS, left); advance(d); left -= d; } if (render && !finished) frame(); return window.__walk.info(); },
      /** Stop (true) or resume (false) the real-time loop, so a test alone moves the clock. */
      hold: (on) => { held = !!on; },
      v3,
      info: () => ({
        x: sim.s.x, z: sim.s.z, yaw: sim.s.yaw, pitch: sim.s.pitch, eyeY: t.heightAt(sim.s.x, sim.s.z) + RADIO.eyeHeightM.value,
        look: look && look.title, points: vis.filter((v) => v.on).map((v) => ({ name: v.point.name, x: v.point.x, y: Math.max(v.point.y, t.heightAt(v.point.x, v.point.z)), z: v.point.z })),
        alert: sim.s.alert, active: Object.keys(sim.s.active).filter((k) => sim.s.active[k]),
        reserveS: sim.s.reserve.seconds, timeLeftS: sim.s.timeLeft.seconds, radio: sim.s.radio, phase: log.phase,
        atTarget: sim.atTarget(), atRover: sim.atRover(), modal: sim.s.modal, ended: log.ended, started: sim.s.started, tS: log.tS,
        distanceM: log.distanceM, lockBroken: lk.broken, demo: mode.demo, aim: mode.aim, landing: mode.landing, locked: isLocked(), workW: sim.s.workW,
        target: sim.target(),
      }),
    };

    disposers.push(() => { delete window.__walk; });
  },

  unmount() { if (cleanup) cleanup(); cleanup = null; },

  /** State after this step is finished, for ?step=5: the planned route walked exactly as planned. */
  async devFixture(state, { getTerrain }) {
    const terrain = await getTerrain();
    return { walk: { ...simulateWalk(terrain, state.route), returned: true } };
  },
};
