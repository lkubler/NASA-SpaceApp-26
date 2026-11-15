// Warning hold (specs/feedback-1.md "Walk: display"): a warning stays as long as its cause lasts and at
// least holdS after; a flickering cause does not blink it; it is present for fadeS more to fade out.
import { describe, it, expect } from 'vitest';
import { createHoldSet } from '../src/steps/4-walk/holdset.js';
import { DISPLAY as D } from '../src/steps/4-walk/display.js';

const mk = () => createHoldSet({ holdS: D.warnHoldS, fadeS: D.warnFadeS });
const get = (r, id) => r.find((x) => x.id === id);

describe('warning hold', () => {
  it('shows at once and stays at least holdS after the cause ends', () => {
    const h = mk();
    expect(get(h.update(0, ['radioAhead']), 'radioAhead').on).toBe(true);
    for (let t = 0.05; t <= D.warnHoldS; t += 0.05) expect(get(h.update(t, []), 'radioAhead').on).toBe(true);
    expect(get(h.update(D.warnHoldS + 0.05, []), 'radioAhead').on).toBe(false); // fading out, still present
    expect(get(h.update(D.warnHoldS + D.warnFadeS - 0.05, []), 'radioAhead')).toBeTruthy();
    expect(get(h.update(D.warnHoldS + D.warnFadeS + 0.1, []), 'radioAhead')).toBeUndefined();
  });
  it('a cause flickering every tick never hides it', () => {
    const h = mk();
    let hidden = 0;
    for (let i = 0; i < 600; i++) {
      const r = h.update(i / 30, i % 2 ? [] : ['steepAhead']);
      if (!get(r, 'steepAhead') || !get(r, 'steepAhead').on) hidden++;
    }
    expect(hidden).toBe(0);
  });
  it('the cause again during the fade-out: shown again', () => {
    const h = mk();
    h.update(0, ['offPath']);
    expect(get(h.update(D.warnHoldS + 0.1, []), 'offPath').on).toBe(false);
    expect(get(h.update(D.warnHoldS + 0.15, ['offPath']), 'offPath').on).toBe(true);
  });
  it('warnings are independent of each other', () => {
    const h = mk();
    h.update(0, ['turnBack', 'radioAhead']);
    const r = h.update(1, ['turnBack']);
    expect(get(r, 'turnBack').on).toBe(true);
    expect(get(r, 'radioAhead').on).toBe(true);
    expect(get(h.update(D.warnHoldS + 0.1, ['turnBack']), 'radioAhead').on).toBe(false);
  });
  it('reset forgets all', () => {
    const h = mk();
    h.update(0, ['edge']);
    h.reset();
    expect(h.update(0.1, [])).toEqual([]);
  });
});
