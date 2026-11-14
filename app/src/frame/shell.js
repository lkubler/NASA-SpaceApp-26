// The frame: project name, step bar, sources link, and the stage the five steps mount into.
// Navigation rules (specs/0-frame.md, specs/feedback-1.md "Frame"): forward only when the current step is
// complete; back always possible. From the walk an earlier step first asks "End this walk and go back?"; yes
// discards the walk. From the Debrief an earlier step discards the walk. Request, spot, route and plan stay.

import { h, clear } from '../ui/dom.js';
import { closePop } from '../ui/label.js';
import { state, setState, subscribe, resetMission } from './state.js';
import { sourcesPage } from './sourcesPage.js';
import { STEPS } from '../steps/index.js';
import { getTerrain } from '../core/terrain.js';
import { PROJECT_NAME } from './project.js';

const SHOW_BAR = new Set([1, 2, 3, 4, 5]); // step 4: the top menu is the way back from the walk

export function startShell(root, { startStep = 1 } = {}) {
  const stage = h('main.stage');
  const bar = h('nav.stepbar', { 'aria-label': 'Mission steps' });
  const sourcesBtn = h('button.header__sources.mono', { type: 'button', onclick: () => openSources() }, 'Sources');
  const header = h('header.header',
    h('div.header__left', h('div.header__name.mono', `[${PROJECT_NAME}]`), bar),
    sourcesBtn);
  root.append(stage, header);

  let current = null;     // mounted step module
  let overlay = null;
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
    if (n < state.step && state.step >= 4) {
      leaveStep();
      setState({ walk: null });
    }
    mount(n);
    return true;
  }

  /** Unmount the current step (pointer lock released, loops stopped by the step's own unmount). */
  function leaveStep() {
    if (current && current.unmount) current.unmount();
    current = null;
    if (document.pointerLockElement) document.exitPointerLock();
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
      leaveStep();
      setState({ walk: null });
      mount(n);
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

  function mount(n) {
    closePop();
    if (current && current.unmount) current.unmount();
    clear(stage);
    setState({ step: n });
    current = STEPS[n - 1];
    const el = h(`div.step.step--${current.id}.fade-in`, { dataset: { step: String(n) } });
    stage.append(el);
    header.classList.toggle('header--minimal', !SHOW_BAR.has(n));
    renderBar();
    Promise.resolve(current.mount(el, ctx)).catch((e) => console.error(e));
  }

  function renderBar() {
    clear(bar);
    STEPS.forEach((m, k) => {
      const n = k + 1;
      const status = n < state.step ? 'done' : n === state.step ? 'current' : 'next';
      const b = h(`button.stepbar__item.is-${status}`, { type: 'button', 'aria-current': status === 'current' ? 'step' : null },
        h('span.stepbar__n', String(n)), h('span.stepbar__t', m.title));
      b.disabled = !allowed(n);
      b.addEventListener('click', () => { b.blur(); goto(n); }); // blur: walk keys (Enter) must not re-click it
      bar.append(b);
      if (n < STEPS.length) bar.append(h('span.stepbar__sep', '—'));
    });
  }
  subscribe(() => renderBar());

  function openSources() {
    if (overlay) return;
    closePop();
    overlay = sourcesPage(closeSources);
    root.append(overlay);
    overlay.tabIndex = -1; overlay.focus();
    overlayListeners.forEach((fn) => fn(true));
  }
  function closeSources() {
    if (!overlay) return;
    overlay.remove(); overlay = null;
    overlayListeners.forEach((fn) => fn(false));
  }

  mount(startStep);
  return ctx;
}
