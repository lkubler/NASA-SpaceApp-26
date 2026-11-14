// Shift key state machine (specs/feedback-1.md "Walk: controls"): held = fast walk, steady; two short taps =
// demo speed on / off; auto-repeat never counts as a press.
import { describe, it, expect } from 'vitest';
import { createTapHold } from '../src/steps/4-walk/taphold.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const opts = { tapMaxMs: D.tapMaxMs, doubleTapMs: D.doubleTapMs, repeatGapMs: D.repeatGapMs };

describe('Shift tap / hold', () => {
  it('held with auto-repeat keydowns: held every frame, no demo toggle', () => {
    const k = createTapHold(opts);
    k.keyDown(0);
    let toggles = 0;
    for (let t = 1; t <= 3000; t += 1) {
      if (t >= 500 && t % 33 === 0) k.keyDown(t, true); // OS auto-repeat
      expect(k.held(t)).toBe(true);
      toggles += k.takeToggles(t);
    }
    k.keyUp(3000);
    expect(k.held(3000 + D.repeatGapMs + 1)).toBe(false);
    expect(toggles + k.takeToggles(3100)).toBe(0);
  });

  it('held with auto-repeat as keyup + keydown pairs (some Linux setups): still held, no toggle', () => {
    const k = createTapHold(opts);
    k.keyDown(0);
    let toggles = 0;
    for (let t = 1; t <= 3000; t += 1) {
      if (t >= 500 && t % 33 === 0) { k.keyUp(t); k.keyDown(t, t % 66 === 0); }
      expect(k.held(t)).toBe(true);
      toggles += k.takeToggles(t);
    }
    expect(toggles).toBe(0);
  });

  it('two short taps toggle demo speed once; two more toggle it back', () => {
    const k = createTapHold(opts);
    k.keyDown(0); k.keyUp(80); k.keyDown(200); k.keyUp(280);
    expect(k.takeToggles(400)).toBe(1);
    k.keyDown(1000); k.keyUp(1080); k.keyDown(1200); k.keyUp(1280);
    expect(k.takeToggles(1400)).toBe(1);
  });

  it('a tap then a hold, or taps too far apart, do not toggle', () => {
    const k = createTapHold(opts);
    k.keyDown(0); k.keyUp(80); k.keyDown(200); k.keyUp(900);
    expect(k.takeToggles(1000)).toBe(0);
    k.keyDown(2000); k.keyUp(2080); k.keyDown(2080 + D.doubleTapMs + 50); k.keyUp(2080 + D.doubleTapMs + 120);
    expect(k.takeToggles(4000)).toBe(0);
  });

  it('a hold then a tap does not toggle; reset clears a pending tap', () => {
    const k = createTapHold(opts);
    k.keyDown(0); k.keyUp(1000); k.keyDown(1100); k.keyUp(1180);
    expect(k.takeToggles(1300)).toBe(0);
    k.keyDown(2000); k.keyUp(2080); k.reset(); k.keyDown(2200); k.keyUp(2280);
    expect(k.takeToggles(2400)).toBe(0);
  });
});
