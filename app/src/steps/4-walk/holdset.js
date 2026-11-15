// How long a warning shows (specs/feedback-1.md, Walk: display). Pure state machine on timestamps, so it can
// be tested without a browser. The simulation says every tick which warnings have a cause right now; this
// turns that into what the display shows:
//  - a warning shows from the first moment its cause is there until the cause has been gone for holdS
//    (so a cause that flickers at its limit never makes it blink);
//  - after that it stays "present" for another fadeS, so the display can fade it out softly, and it is
//    dropped then. A cause that returns during the fade-out brings it back (the same entry, no new one);
//  - the display only reads this; the walk log is written by the simulation and is not touched.

/** @param {{ holdS: number, fadeS: number }} o */
export function createHoldSet({ holdS, fadeS }) {
  const lastCause = new Map(); // id -> time of the last tick with the cause
  return {
    /**
     * @param {number} nowS  time in seconds (any origin, never going back)
     * @param {string[]} activeIds  warnings with a cause this tick
     * @returns {{ id: string, on: boolean }[]}  every warning still present; on: shown, false: fading out
     */
    update(nowS, activeIds) {
      for (const id of activeIds) lastCause.set(id, nowS);
      const out = [];
      for (const [id, t] of lastCause) {
        const gone = nowS - t;
        if (gone > holdS + fadeS) { lastCause.delete(id); continue; }
        out.push({ id, on: gone <= holdS });
      }
      return out;
    },
    /** Forget everything at once (a modal covers the display, a new walk). */
    reset() { lastCause.clear(); },
  };
}
