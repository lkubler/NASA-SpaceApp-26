// Shift key: held = fast walk, two short taps = demo speed on / off (specs/feedback-1.md, Walk: controls).
// Pure state machine on timestamps, so it can be tested without a browser.
//  - Auto-repeat keydowns (repeat: true) never count as presses.
//  - Some Linux setups send auto-repeat as keyup + keydown pairs with no time between them: a keydown within
//    repeatGapMs of the keyup continues the same press, so a held key stays held and is never read as taps.
//  - A press counts as a tap when it was held at most tapMaxMs; two taps toggle demo speed when the second
//    press starts within doubleTapMs of the first release. A long hold in between clears the first tap.

/** @param {{ tapMaxMs: number, doubleTapMs: number, repeatGapMs: number }} o */
export function createTapHold({ tapMaxMs, doubleTapMs, repeatGapMs }) {
  let down = false;          // key physically down (as far as the events say)
  let pressAt = 0;           // start of the current press
  let releasedAt = null;     // keyup seen, not yet final (a keydown may follow within repeatGapMs)
  let lastTapUpAt = null;    // release time of a first tap, waiting for the second
  let toggles = 0;           // demo speed toggles not yet taken

  function settle(now) {
    if (releasedAt === null || now - releasedAt <= repeatGapMs) return;
    const tap = releasedAt - pressAt <= tapMaxMs;
    if (!tap) lastTapUpAt = null;
    else if (lastTapUpAt !== null && pressAt - lastTapUpAt <= doubleTapMs) { toggles++; lastTapUpAt = null; }
    else lastTapUpAt = releasedAt;
    releasedAt = null;
  }

  return {
    keyDown(now, repeat = false) {
      if (releasedAt !== null && now - releasedAt <= repeatGapMs) { releasedAt = null; down = true; return; } // same press
      settle(now);
      if (down) return; // auto-repeat, or a second Shift while one is held
      down = true;
      // an auto-repeat keydown without a press seen first (focus came while held): a hold, never a tap
      pressAt = repeat ? now - tapMaxMs - 1 : now;
    },
    keyUp(now) {
      if (!down) return;
      down = false;
      releasedAt = now;
    },
    /** Window lost focus: the key counts as released now, and no tap is pending. */
    reset() { down = false; releasedAt = null; lastTapUpAt = null; },
    /** Held for fast walk (a pending release within repeatGapMs still counts as held). */
    held(now) { settle(now); return down || releasedAt !== null; },
    /** Number of demo speed toggles since the last call (settles a pending release first). */
    takeToggles(now) { settle(now); const n = toggles; toggles = 0; return n; },
  };
}
