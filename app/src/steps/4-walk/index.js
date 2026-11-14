// Step 4 Walk (specs/4-walk.md): first person on the Murray Buttes terrain, through the helmet.
// At every step the helmet answers: from where I stand, can I still get home?
//   sim.js      position, demo clock, suit, warnings, walk log (core numbers only)
//   scene3d.js  terrain, real skyline and haze, rover model, route band
//   hud.js      helmet frame and display
//   look.js     what the reticle points at
// Controls: click for mouse look (pointer lock; without it, free look: the cursor turns the view, resting at an edge
// keeps turning, and holding the button and dragging turns it too), W A S D to walk, arrow
// keys to turn and look, Shift held fast walk, Shift twice demo speed, F aim and click to jump, E to act,
// esc twice to end the mission.
import './style.css';
import { newWalkLog, simulateWalk, ROVER, RADIO, roverField, spotField, stopsOf } from '../../core/index.js';
import { createSim } from './sim.js';
import { createScene3d } from './scene3d.js';
import { createHud } from './hud.js';
import { lookAt, visiblePoints, rayHit } from './look.js';
import { DISPLAY as D } from './display.js';
import { createTapHold } from './taphold.js';
import { createIntro } from './intro.js'; // x-intro

let cleanup = null;

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
    const intro = createIntro(el, hudRoot, ctx); // x-intro: film now, stepping out once the scene is loaded
    disposers.push(() => intro.stop());

    const t = await ctx.getTerrain();
    if (!alive) return;
    const route = ctx.state.route;
    if (!route) { hud.setLoading('No route planned. Start from step 1.'); return; }
    hud.setTerrain(t);
    hud.setTask(ctx.state.request && ctx.state.request.title);
    hud.setPlanBroken(ctx.state.plan && ctx.state.plan.brokenRules);
    // cost fields to the rover and to every stop: built once here, read every step
    roverField(t); for (const st of stopsOf(route)) spotField(t, st);
    const sim = createSim(t, route, log);
    // the steep border keeps its corridors open along the legs of a round too (steepBorder.js); one stop:
    // its legs are the candidate routes already kept open, the border as before
    const roundLegs = route.legs && route.legs.length > 2 ? route.legs.map((l) => l.cells) : [];
    const v3 = createScene3d(view, t, { keepOpen: roundLegs });
    disposers.push(() => v3.dispose());
    // the route band: the leg to the current target only (the next stop, then the rover); it switches
    // after each sample and when "Turn back now" skips the remaining stops
    let bandKey = null;
    const showBand = () => {
      const lg = sim.leg();
      if (lg.key === bandKey) return;
      if (bandKey) v3.setBand(bandKey, null, false);
      v3.setBand(lg.key, lg.points, true);
      bandKey = lg.key;
    };
    showBand();
    v3.placeRover((D.roverHeadingDeg * Math.PI) / 180, D.roverShiftM);

    // ---------- input ----------
    // Mouse look, three modes; every movement is added up, none is dropped for being large.
    //   locked     pointer lock held: the movementX/Y of each event turn the view, no button held
    //   free look  no lock (not clicked yet, refused, released with esc, or the lock check below tripped): the
    //              plain cursor movement over the walk view (clientX/Y differences) turns it, no button held;
    //              while the cursor rests in an edge zone the view keeps turning that way at a steady rate, so
    //              it turns all the way round both ways although the cursor stops at the screen edge
    //   drag       no lock, button held: the cursor's way turns the view, also beyond the walk view
    const keys = new Set();
    let escArmedUntil = 0, unlockedAt = 0;
    const shift = createTapHold({ tapMaxMs: D.tapMaxMs, doubleTapMs: D.doubleTapMs, repeatGapMs: D.repeatGapMs });
    const mouse = { dx: 0, dy: 0 };
    const mode = { demo: false, aim: false, landing: null, jumped: null, jumpedAt: 0 };
    const drag = { on: false, moved: 0 };
    // free look: the last cursor point over the view (null: the next move only records it); the edge zone the
    // cursor rests in (-1 / 0 / 1); edge turning only once the cursor has been away from the edges, so a cursor
    // left at the edge by the step before does not spin the view on its own
    const free = { last: null, edgeX: 0, edgeY: 0, armed: false };
    // A real lock holds the cursor still (clientX/Y stay put). Where the cursor keeps moving under the lock, the
    // browser does not hold it (movementX/Y may then come as the offset from the lock point, so the view turns
    // one way only, and the hidden cursor stops at the screen edge): the lock is released for this walk and the
    // free look takes over. The offsets are not turned back into steps by differencing: they stop at the
    // screen edge as well, so only a visible cursor with edge zones turns the view all the way round.
    // A second check: movementX/Y that look like offsets, not steps (lockOffsetEvents events in a row, all the
    // same way and each at least lockOffsetPx) also release the lock. Between the lock request and the lock the
    // cursor's own way does not turn the view (the cursor may be moved there by the browser, not the visitor).
    const lk = { last: null, moved: 0, run: 0, runX: 0, runY: 0, broken: '', refused: false, selfExit: false, pendingUntil: 0 };
    const isLocked = () => document.pointerLockElement === view;
    const lookMode = () => (isLocked() ? 'locked' : drag.on ? 'drag' : 'free look');

    // ?mousedebug=1: a dev readout of the mouse look (never shown without the parameter)
    const dbg = ctx.params && ctx.params.get('mousedebug') === '1'
      ? { el: el.appendChild(Object.assign(document.createElement('pre'), { className: 'walk-mdebug' })), mx: null, my: null, cx: null, cy: null, n: 0, t0: performance.now(), eps: 0, yawMouse: 0, yawEdge: 0 }
      : null;

    // when the key event happened (not when it was handled: a slow frame may hand several over at once)
    const evTime = (e) => (e.timeStamp > 0 && e.timeStamp <= performance.now() ? e.timeStamp : performance.now());
    const onKeyDown = (e) => {
      if (e.code === 'Escape') { if (mode.aim) { setAim(false); return; } onEsc(); return; }
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { shift.keyDown(evTime(e), e.repeat); return; }
      if (e.repeat && (e.code === 'KeyE' || e.code === 'KeyF')) return;
      if (e.code === 'KeyE' || e.code === 'Enter') { act(); return; }
      if (e.code === 'KeyF') { if (!log.ended && !sim.s.modal) setAim(!mode.aim); return; }
      keys.add(e.code);
      if (sim.s.modal === 'sample' && ['KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) closeSample();
    };
    const onKeyUp = (e) => {
      // Shift held: fast walk; tapped twice (two short presses): demo speed on / off (taphold.js)
      if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') { shift.keyUp(evTime(e)); return; }
      keys.delete(e.code);
    };
    const freeOut = () => { free.last = null; free.edgeX = free.edgeY = 0; };
    const onBlur = () => { keys.clear(); shift.reset(); drag.on = false; freeOut(); };
    const onMouseMove = (e) => {
      if (dbg) { dbg.mx = e.movementX; dbg.my = e.movementY; dbg.cx = e.clientX; dbg.cy = e.clientY; dbg.n++; }
      if (isLocked()) {
        if (lk.last && (e.clientX !== lk.last.x || e.clientY !== lk.last.y)) lk.moved++;
        lk.last = { x: e.clientX, y: e.clientY };
        const ox = e.movementX || 0, oy = e.movementY || 0;
        if (Math.abs(ox) < D.lockOffsetPx) { lk.run = 0; lk.runX = lk.runY = 0; }
        else if (Math.sign(ox) === Math.sign(lk.run)) lk.run += Math.sign(ox);
        else { lk.run = Math.sign(ox); lk.runX = lk.runY = 0; }
        if (lk.run) { lk.runX += ox; lk.runY += oy; }
        if (lk.moved >= D.lockDriftEvents || Math.abs(lk.run) >= D.lockOffsetEvents) {
          lk.broken = lk.moved >= D.lockDriftEvents ? 'cursor moved under the lock' : 'offsets, not steps'; lk.selfExit = true;
          // offsets: the turn of that run was not the visitor's, take it back (this event was not added yet)
          if (lk.run) { mouse.dx -= lk.runX - ox; mouse.dy -= lk.runY - oy; }
          freeOut(); free.armed = false;
          document.exitPointerLock();
          return;
        }
        const mx = e.movementX || 0, my = e.movementY || 0;
        mouse.dx += mx; mouse.dy += my;
        if (drag.on) drag.moved += Math.abs(mx) + Math.abs(my);
        return;
      }
      if (drag.on && !(e.buttons & 1)) drag.on = false; // released outside the window
      const r = view.getBoundingClientRect();
      // over the walk view: the 3D view or the helmet display (not the intro layer, a dialog or the step bar)
      const over = (view.contains(e.target) || hudRoot.contains(e.target)) && e.clientX >= r.left && e.clientX < r.right && e.clientY >= r.top && e.clientY < r.bottom;
      if (!over && !drag.on) { freeOut(); return; }
      if (free.last && performance.now() >= lk.pendingUntil) {
        const dx = e.clientX - free.last.x, dy = e.clientY - free.last.y;
        mouse.dx += dx; mouse.dy += dy;
        if (drag.on) drag.moved += Math.abs(dx) + Math.abs(dy);
      }
      free.last = { x: e.clientX, y: e.clientY };
      const zx = Math.max(D.edgeZoneMinPx, r.width * D.edgeZoneFrac), zy = Math.max(D.edgeZoneMinPx, r.height * D.edgeZoneFrac);
      const ex = e.clientX < r.left + zx ? -1 : e.clientX >= r.right - zx ? 1 : 0;
      const ey = e.clientY < r.top + zy ? -1 : e.clientY >= r.bottom - zy ? 1 : 0;
      if (!ex && !ey) free.armed = true;
      free.edgeX = over && free.armed ? ex : 0;
      free.edgeY = over && free.armed ? ey : 0;
    };
    // the error event of a request whose promise is still out (Chromium: the raw movement option refused, plain
    // request follows) is not a refusal; the promise says so itself
    const onLockError = () => { if (performance.now() >= lk.pendingUntil) lk.refused = true; };
    const refused = () => { lk.refused = true; lk.pendingUntil = 0; };
    function requestLock() {
      if (isLocked() || log.ended || lk.broken || !view.requestPointerLock) return;
      lk.pendingUntil = performance.now() + D.lockPendingMs;
      // a refused lock (browser setting, too soon after esc, option not supported) leaves the free look
      const plain = () => {
        try { const p = view.requestPointerLock(); if (p && p.catch) p.catch(refused); } catch { refused(); }
      };
      try {
        // raw mouse movement where the browser supports it (Chromium); elsewhere the option is ignored or refused
        const p = view.requestPointerLock({ unadjustedMovement: true });
        if (p && p.catch) p.catch((err) => { if (err && err.name === 'NotSupportedError') plain(); else refused(); });
      } catch { plain(); }
    }
    const onMouseDown = (e) => {
      if (e.button !== 0) return;
      e.preventDefault();
      drag.on = true; drag.moved = 0;
      if (!isLocked()) free.last = { x: e.clientX, y: e.clientY };
      if (!mode.aim) requestLock(); // in aim mode the click jumps: no lock request on it
    };
    const onMouseUp = (e) => {
      if (e.button !== 0 || !drag.on) return;
      drag.on = false;
      if (mode.aim && drag.moved < D.clickMaxPx) jump();
    };
    const onLockChange = () => {
      if (isLocked()) { lk.last = null; lk.moved = 0; lk.run = 0; lk.runX = lk.runY = 0; lk.refused = false; lk.pendingUntil = 0; free.edgeX = free.edgeY = 0; return; }
      unlockedAt = performance.now();
      free.last = null; // the cursor comes back elsewhere: no jump of the view
      // esc while captured: the browser takes the key to release the pointer; in aim mode that esc cancels the aim
      // (not when the lock check released the lock itself)
      if (mode.aim && !lk.selfExit) setAim(false);
      lk.selfExit = false;
    };
    const root = document.documentElement;
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    document.addEventListener('mousemove', onMouseMove);
    root.addEventListener('mouseleave', freeOut);
    window.addEventListener('mouseup', onMouseUp);
    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    view.addEventListener('mousedown', onMouseDown);
    disposers.push(() => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('mousemove', onMouseMove);
      root.removeEventListener('mouseleave', freeOut);
      window.removeEventListener('mouseup', onMouseUp);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      if (document.pointerLockElement) document.exitPointerLock();
    });
    function showDebug() {
      if (!dbg) return;
      const now = performance.now();
      if (now - dbg.t0 >= 1000) { dbg.eps = Math.round((dbg.n * 1000) / (now - dbg.t0)); dbg.n = 0; dbg.t0 = now; }
      const deg = (r) => ((r * 180) / Math.PI).toFixed(1);
      dbg.el.textContent = [
        `mouse look   ${lookMode()}`,
        `lock check   ${lk.broken ? `TRIPPED (${lk.broken})` : 'ok'}${lk.refused ? ' · lock refused' : ''}`,
        `movementX/Y  ${dbg.mx} / ${dbg.my}`,
        `clientX/Y    ${dbg.cx} / ${dbg.cy}`,
        `events/s     ${dbg.eps}`,
        `yaw mouse    ${deg(dbg.yawMouse)}°   edge ${deg(dbg.yawEdge)}°`,
        `edge zone    x ${free.edgeX} y ${free.edgeY}${free.armed ? '' : ' (not armed)'}`,
      ].join('\n');
    }

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
        showBand();
        if (sim.s.modal === 'sample') hud.showSample(sim, log);
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
        fast: shift.held(performance.now()),
        demo: mode.demo,
      };
    }

    // ---------- simulation ----------
    let acc = 0, lastWarnCount = log.warnings.length, lastBroken = log.brokenRules.length;
    function advance(dtReal) {
      if (mouse.dx || mouse.dy) {
        if (!sim.s.modal && !log.ended) {
          sim.s.yaw += mouse.dx * D.mouseRadPerPx;
          if (dbg) dbg.yawMouse += mouse.dx * D.mouseRadPerPx;
          const pm = (D.pitchMaxDeg * Math.PI) / 180;
          sim.s.pitch = Math.max(-pm, Math.min(pm, sim.s.pitch - mouse.dy * D.mouseRadPerPx));
        }
        mouse.dx = mouse.dy = 0;
      }
      // free look: the cursor rests in an edge zone, the view keeps turning that way
      if ((free.edgeX || free.edgeY) && !isLocked() && !sim.s.modal && !sim.s.paused && !log.ended) {
        const dt = Math.min(dtReal, D.maxFrameS), rad = Math.PI / 180;
        const dyaw = free.edgeX * D.edgeTurnDegS * rad * dt;
        sim.s.yaw += dyaw;
        if (dbg) dbg.yawEdge += dyaw;
        const pm = D.pitchMaxDeg * rad;
        sim.s.pitch = Math.max(-pm, Math.min(pm, sim.s.pitch - free.edgeY * D.edgePitchDegS * rad * dt));
      }
      acc += Math.min(dtReal, D.maxFrameS);
      if (shift.takeToggles(performance.now()) % 2) mode.demo = !mode.demo;
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
      showBand();
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
      hud.setLookMode(isLocked() ? 'locked' : lk.broken || lk.refused ? 'free' : 'click');
      if (dbg && frameNo % 4 === 0) showDebug();
      // the fast walk chip shows for as long as Shift is held (fast walk does nothing at demo speed)
      hud.setMode({ fast: shift.held(performance.now()) && !mode.demo, workW: s.workW, demo: mode.demo, aim: mode.aim, jumped: jumpedOn ? mode.jumped : null });
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
    intro.ready({ v3, sim, t }); // x-intro

    let raf = 0, last = performance.now(), held = false;
    const loop = (now) => {
      if (!alive) return;
      if (held) { last = now; raf = requestAnimationFrame(loop); return; }
      if (intro.frame(now)) { last = now; raf = requestAnimationFrame(loop); return; } // x-intro: sim and HUD wait
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
      v3, sim,
      info: () => ({
        x: sim.s.x, z: sim.s.z, yaw: sim.s.yaw, pitch: sim.s.pitch, eyeY: t.heightAt(sim.s.x, sim.s.z) + RADIO.eyeHeightM.value,
        look: look && look.title, points: vis.filter((v) => v.on).map((v) => ({ name: v.point.name, x: v.point.x, y: Math.max(v.point.y, t.heightAt(v.point.x, v.point.z)), z: v.point.z })),
        alert: sim.s.alert, active: Object.keys(sim.s.active).filter((k) => sim.s.active[k]),
        reserveS: sim.s.reserve.seconds, timeLeftS: sim.s.timeLeft.seconds, radio: sim.s.radio, phase: log.phase,
        atTarget: sim.atTarget(), atRover: sim.atRover(), modal: sim.s.modal, ended: log.ended, started: sim.s.started, tS: log.tS,
        distanceM: log.distanceM, lockBroken: !!lk.broken, lockWhy: lk.broken, fastHeld: shift.held(performance.now()), lookMode: lookMode(), edge: [free.edgeX, free.edgeY], demo: mode.demo, aim: mode.aim, landing: mode.landing, locked: isLocked(), workW: sim.s.workW,
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
