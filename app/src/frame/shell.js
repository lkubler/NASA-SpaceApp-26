// The frame: project name, step bar, sources link, and the stage the five steps mount into.
// Navigation rules (specs/0-frame.md, specs/feedback-1.md "Frame"): forward only when the current step is
// complete; back always possible. From the walk an earlier step first asks "End this walk and go back?"; yes
// discards the walk. From the Debrief an earlier step discards the walk. Request, spot, route and plan stay.

import { h } from '../ui/dom.js';
import { closePop } from '../ui/label.js';
import { state, setState, subscribe, resetMission } from './state.js';
import { sourcesPage } from './sourcesPage.js';
import { STEPS } from '../steps/index.js';
import { getTerrain } from '../core/terrain.js';
import { PROJECT_NAME } from './project.js';

const SHOW_BAR = new Set([1, 2, 3, 4, 5]); // step 4: the top menu is the way back from the walk

// Step transitions (specs/x-transitions.md), UI timing only; mirrored in styles/frame.css (--t-*).
// slide: the old page fades out moving in the direction of travel, the new one fades in from the other side.
// black: Walk -> Debrief and Go / no-go -> a later walk fade through black. Reduced motion: a plain fade.
const T = { flip: 400, zoom: 360, out: 220, done: 440, black: 300, reduced: 150 }; // done: page in 140 + 260 ms, last block 140 + 120 + 180 ms
const reducedMotion = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

export function startShell(root, { startStep = 1 } = {}) {
  const stage = h('main.stage');
  // the step bar as a route line: the steps are waypoints on a line, the part already walked is cyan (like
  // the route on the map) and the current step's glowing marker slides along it; built once, only the state changes
  const barMarker = h('span.stepbar__marker', { 'aria-hidden': 'true' });
  const barTrack = h('span.stepbar__track', { 'aria-hidden': 'true' });
  const barFill = h('span.stepbar__fill', { 'aria-hidden': 'true' });
  const barList = h('div.stepbar__list');
  const bar = h('nav.stepbar', { 'aria-label': 'Mission steps' }, barTrack, barFill, barList, barMarker);
  const sourcesBtn = h('button.header__sources.mono', { type: 'button', onclick: () => openSources() }, 'Sources');
  const header = h('header.header',
    h('div.header__left', h('div.header__name.mono', `[${PROJECT_NAME}]`), bar),
    sourcesBtn);
  root.append(stage, header);

  let current = null;     // mounted step module
  let currentEl = null;   // its element in the stage
  let shownStep = 0;     // the step on screen (state.step can be reset before a mount, e.g. New mission)
  let walkMounts = 0;     // walks mounted this page load (the first one opens with the intro, specs/x-intro.md)
  let trans = null;       // the running step transition: { finish() }
  let flipFrom = null;    // Plan <-> Go / no-go: where the old map was (x-transitions); taken by ctx.flipIn
  let overlay = null;
  let overlayDim = null, overlayTimer = 0;
  const overlayListeners = new Set();

  let dialog = null;      // the "End this walk and go back?" question
  const canBack = () => state.step > 1;
  const isComplete = (n) => { const m = STEPS[n - 1]; return !!(m && m.isComplete(state)); };

  function allowed(n) {
    if (n === state.step) return false;
    if (n < state.step) return canBack();
    if (n === state.step + 1) return isComplete(state.step);
    return false;
  }

  const ctx = {
    state,
    /** Merge a patch into the shared state. */
    set: (patch) => setState(patch),
    /** Go to the next step; ignored while the current step is not complete. */
    next: () => goto(state.step + 1),
    /** Go one step back (from the walk: asks first, then discards the walk). */
    back: () => goto(state.step - 1),
    goto: (n) => goto(n),
    canBack,
    /** "New mission": clear the mission (finished requests stay) and go to step 1. */
    newMission: () => { resetMission(); mount(1); },
    openSources: () => openSources(),
    getTerrain,
    /**
     * Plan <-> Go / no-go: the new step's map starts where the old one was and moves to its own place
     * (position and size only, 0.4 s). A step calls it once its map is in the page; without a running
     * Plan <-> Go transition it does nothing.
     */
    flipIn: (node) => flipIn(node),
    /** fn(open: boolean) when the sources page opens / closes (e.g. pause the walk). */
    onOverlay: (fn) => { overlayListeners.add(fn); return () => overlayListeners.delete(fn); },
    params: new URLSearchParams(location.search),
  };

  function goto(n) {
    if (n < 1 || n > STEPS.length || !allowed(n) || dialog) return false;
    if (n < state.step && state.step === 4 && state.walk && state.walk.started && !state.walk.ended) {
      askEndWalk(n);
      return false;
    }
    // back from the walk or the Debrief: the walk is discarded, request, spot, route and plan stay
    mount(n, { discardWalk: n < state.step && state.step >= 4 });
    return true;
  }

  /** Small dialog in the design's style; the walk is paused while it is open. */
  function askEndWalk(n) {
    closePop();
    if (document.pointerLockElement) document.exitPointerLock();
    overlayListeners.forEach((fn) => fn(true));
    // keys go to the dialog only (the walk listens on window in the bubble phase)
    const onKey = (e) => {
      e.stopPropagation();
      if (e.code === 'Escape') { e.preventDefault(); close(false); }
    };
    const close = (yes) => {
      if (!dialog) return;
      window.removeEventListener('keydown', onKey, true);
      window.removeEventListener('keyup', stopKey, true);
      dialog.remove(); dialog = null;
      if (!yes) { overlayListeners.forEach((fn) => fn(false)); return; }
      mount(n, { discardWalk: true });
    };
    const stopKey = (e) => e.stopPropagation();
    const yesBtn = h('button.pill.confirm__yes', { type: 'button', onclick: () => close(true) }, 'End walk');
    const noBtn = h('button.textlink.confirm__no', { type: 'button', onclick: () => close(false) }, 'Keep walking');
    dialog = h('div.confirm', { role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': 'confirm-q' },
      h('div.confirm__card',
        h('div.confirm__q', { id: 'confirm-q' }, 'End this walk and go back?'),
        h('p.confirm__text', `The walk so far is discarded. ${STEPS[n - 1].title} opens with your plan kept.`),
        h('div.confirm__actions', noBtn, yesBtn)));
    dialog.addEventListener('click', (e) => { if (e.target === dialog) close(false); });
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('keyup', stopKey, true);
    root.append(dialog);
    noBtn.focus();
  }

  /** End the running transition at once: the old page goes (unmounted), the new one shows in full. */
  function finishTransition() {
    flipFrom = null;
    if (!trans) return;
    const t = trans; trans = null;
    t.finish();
  }

  function flipIn(node) {
    const from = flipFrom; flipFrom = null;
    if (!from || !trans || !node || !node.animate || performance.now() - from.at > 400) return;
    const r = node.getBoundingClientRect();
    if (!r.width || !r.height) return;
    node.animate([
      { transformOrigin: '0 0', transform: `translate(${from.left - r.left}px, ${from.top - r.top}px) scale(${from.width / r.width}, ${from.height / r.height})` },
      { transformOrigin: '0 0', transform: 'none' },
    ], { duration: T.flip, easing: 'cubic-bezier(0.3, 0.7, 0.2, 1)' });
  }

  /**
   * Swap the step. The new step mounts at once and takes clicks at once; the old one stays briefly as an
   * inert layer above it while it fades out, then is unmounted (its loops, listeners and WebGL go then).
   * A new step change during a transition first finishes the running one, so at most one old layer exists.
   */
  function mount(n, { discardWalk = false } = {}) {
    closePop();
    finishTransition();
    if (document.pointerLockElement) document.exitPointerLock();
    const from = currentEl ? shownStep : 0;
    shownStep = n;
    const oldMod = current, oldEl = currentEl;
    let oldGone = !oldEl;
    const dropOld = () => {
      if (oldGone) return;
      oldGone = true;
      if (oldMod && oldMod.unmount) oldMod.unmount();
      oldEl.remove();
    };
    if (discardWalk) setState({ walk: null });
    current = STEPS[n - 1];
    const firstWalk = n === 4 && walkMounts === 0;
    if (n === 4) walkMounts++;

    const reduced = reducedMotion();
    // Plan <-> Go / no-go: the map with the route moves between its two places (only when the old map is on screen)
    const oldMap = !reduced && oldEl && ((from === 2 && n === 3) || (from === 3 && n === 2)) && oldEl.querySelector('.map:not(.plan-map-wait)');
    // Mission -> Plan: the crater view zooms slightly towards Murray Buttes while the page fades (needs the marker on screen)
    const murray = !reduced && from === 1 && n === 2 && oldEl.querySelector('.m1-site--murray .m1-site__dot');
    let zoomAt = null;
    if (murray) {
      const r = murray.getBoundingClientRect(), o = oldEl.getBoundingClientRect();
      if (r.width && r.left > o.left && r.left < o.right && r.top > o.top && r.top < o.bottom) zoomAt = `${(r.left + r.width / 2 - o.left).toFixed(0)}px ${(r.top + r.height / 2 - o.top).toFixed(0)}px`;
    }
    const kind = !from ? 'none'
      : reduced ? 'fade'
        : (from === 4 && n === 5) || (from === 3 && n === 4 && !firstWalk) ? 'black' : oldMap ? 'flip' : zoomAt ? 'zoom' : 'slide';
    if (kind === 'flip') {
      const r = oldMap.getBoundingClientRect();
      flipFrom = r.width && r.height ? { left: r.left, top: r.top, width: r.width, height: r.height, at: performance.now() } : null;
    }
    const dir = n > from ? 'step--fwd' : 'step--back';
    const el = h(`div.step.step--${current.id}`, { dataset: { step: String(n) } });
    if (kind === 'none') el.classList.add('fade-in');
    else el.classList.add('step--in', `step--${kind}`, dir);

    if (oldEl) {
      oldEl.inert = true;
      if (kind === 'zoom') oldEl.style.setProperty('--zoom-at', zoomAt);
      oldEl.classList.add('step--out', `step--${kind}`, dir);
      stage.insertBefore(el, oldEl);
      if (oldMod === current) dropOld(); // never two instances of one step module
    } else stage.append(el);
    currentEl = el;

    setState({ step: n });
    header.classList.toggle('header--minimal', !SHOW_BAR.has(n));
    renderBar();

    if (kind !== 'none') {
      const timers = [];
      let black = null;
      if (kind === 'black') {
        black = h('div.stage__black.is-in');
        stage.append(black);
      }
      // timed from the first frame (the CSS animations start there; a heavy mount can hold that frame back)
      const frame = requestAnimationFrame(() => {
        if (kind === 'black') timers.push(setTimeout(() => { dropOld(); black.classList.replace('is-in', 'is-out'); }, T.black));
        else timers.push(setTimeout(dropOld, reduced ? T.reduced : kind === 'zoom' ? T.zoom : T.out));
        timers.push(setTimeout(() => { if (trans === t) finishTransition(); }, reduced ? T.reduced + 20 : kind === 'black' ? 2 * T.black + 20 : T.done));
      });
      const t = {
        finish() {
          cancelAnimationFrame(frame);
          timers.forEach(clearTimeout);
          dropOld();
          if (black) black.remove();
          el.classList.remove('step--in', 'step--slide', 'step--flip', 'step--zoom', 'step--fade', 'step--black', 'step--fwd', 'step--back');
          delete document.documentElement.dataset.stepTransition;
        },
      };
      trans = t;
      document.documentElement.dataset.stepTransition = kind;
    }

    Promise.resolve(current.mount(el, ctx)).catch((e) => console.error(e));
  }

  // step bar: items built once; each render only updates their state and moves the marker
  const barItems = STEPS.map((m, k) => {
    const n = k + 1;
    const b = h('button.stepbar__item', { type: 'button' }, h('span.stepbar__n', { 'aria-hidden': 'true' }), h('span.stepbar__t', m.title));
    b.addEventListener('click', () => { b.blur(); goto(n); }); // blur: walk keys (Enter) must not re-click it
    barList.append(b);
    return b;
  });
  let markerAt = '';
  function placeMarker() {
    // dot centres in the bar (the items are not positioned, so offsets are relative to the bar)
    const centre = (k) => { const d = barItems[k].querySelector('.stepbar__n'); return { x: d.offsetLeft + d.offsetWidth / 2, y: d.offsetTop + d.offsetHeight / 2, w: d.offsetWidth }; };
    const dot = barItems[state.step - 1] && barItems[state.step - 1].querySelector('.stepbar__n');
    if (!dot || !dot.offsetWidth) return;
    const a = centre(0), c = centre(state.step - 1), z = centre(barItems.length - 1);
    const at = `${a.x}|${c.x}|${c.y}|${z.x}`;
    if (at === markerAt) return;
    const first = !markerAt;
    markerAt = at;
    if (first) for (const e of [barMarker, barFill]) e.classList.add('is-still');
    barTrack.style.cssText = `left:${a.x}px;top:${a.y}px;width:${z.x - a.x}px`;
    barFill.style.cssText = `left:${a.x}px;top:${a.y}px;width:${c.x - a.x}px`;
    barMarker.style.transform = `translate(${c.x}px, ${c.y}px)`;
    if (first) requestAnimationFrame(() => requestAnimationFrame(() => { for (const e of [barMarker, barFill]) e.classList.remove('is-still'); }));
  }
  function renderBar() {
    barItems.forEach((b, k) => {
      const n = k + 1;
      const status = n < state.step ? 'done' : n === state.step ? 'current' : 'next';
      b.classList.toggle('is-done', status === 'done');
      b.classList.toggle('is-current', status === 'current');
      b.classList.toggle('is-next', status === 'next');
      if (status === 'current') b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current');
      b.disabled = !allowed(n);
    });
    placeMarker();
  }
  subscribe(() => renderBar());
  window.addEventListener('resize', () => { markerAt = markerAt && 'x'; placeMarker(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => placeMarker());

  // sources: slides in from the right over the dimmed page, slides out on close
  function dropSources() {
    clearTimeout(overlayTimer);
    if (overlay) overlay.remove();
    if (overlayDim) overlayDim.remove();
    overlay = overlayDim = null;
  }
  function openSources() {
    if (overlay && !overlay.classList.contains('is-closing')) return;
    dropSources(); // still sliding out: gone at once
    closePop();
    overlayDim = h('div.sources-dim', { 'aria-hidden': 'true' });
    overlay = sourcesPage(closeSources);
    root.append(overlayDim, overlay);
    overlay.tabIndex = -1; overlay.focus({ preventScroll: true });
    overlayListeners.forEach((fn) => fn(true));
  }
  function closeSources() {
    if (!overlay || overlay.classList.contains('is-closing')) return;
    overlay.classList.add('is-closing');
    overlayDim.classList.add('is-closing');
    overlay.inert = true;
    overlayTimer = setTimeout(dropSources, reducedMotion() ? T.reduced : T.out + 40);
    overlayListeners.forEach((fn) => fn(false));
  }

  mount(startStep);
  return ctx;
}
