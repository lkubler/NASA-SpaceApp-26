// Reusable UI pieces the mockups repeat. All return DOM elements styled by styles/components.css.

import { h } from './dom.js';
import { labelTag } from './label.js';

/** One large line per step, ending with a full stop. size: 'hero' (Go / Debrief) or 'normal'. */
export function headline(text, { size = 'normal' } = {}) {
  return h(`h1.headline.headline--${size}`, text);
}

/** The one line of text under a headline. */
export function lede(...children) { return h('p.lede', ...children); }

/**
 * Rounded card with thin border and dark fill. variant 'helmet' = translucent over the terrain.
 * @param {{ title?, sub?, right?, lead?: Node, selected?, onClick?, variant?, children? }} o
 */
export function card(o = {}) {
  const el = h(`${o.onClick ? 'button' : 'div'}.card${o.selected ? '.is-selected' : ''}${o.variant ? '.card--' + o.variant : ''}`,
    o.onClick ? { type: 'button', onclick: o.onClick } : null,
    o.lead ? h('div.card__lead', o.lead) : null,
    (o.title || o.sub) ? h('div.card__body',
      o.title ? h('div.card__title', o.title) : null,
      o.sub ? h('div.card__sub', o.sub) : null) : null,
    o.right != null ? h('div.card__right.mono', o.right) : null,
    o.children || null,
  );
  return el;
}

/** Small lock icon (inline SVG, inherits colour). */
export const LOCK_SVG = '<svg viewBox="0 0 16 16" width="0.9em" height="0.9em" aria-label="locked"><rect x="3" y="7" width="10" height="7" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.5"/><path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" fill="none" stroke="currentColor" stroke-width="1.5"/></svg>';

/** Big number: small grey label above, large value below, optional unit and value label. */
export function bigNumber({ label, value, unit = '', tag = null, tone = null }) {
  return h(`div.bignum${tone ? '.tone-' + tone : ''}`,
    h('div.bignum__label', label, tag ? [' ', labelTag(tag)] : null),
    h('div.bignum__value', String(value), unit ? h('span.bignum__unit', unit) : null),
  );
}

/**
 * The main button: one per screen, a wide pill, bottom right. variant 'go' = cyan with glow
 * (last step before the walk). Returns the button; set .disabled to toggle.
 */
export function pillButton({ text, onClick, variant = 'default', disabled = false, arrow = false }) {
  const b = h(`button.pill.pill--${variant}`, { type: 'button', onclick: onClick }, text, arrow ? h('span.pill__arrow', '→') : null);
  b.disabled = disabled;
  return b;
}

/** Underlined text link (e.g. "Edit route"). */
export function textLink(text, onClick) { return h('button.textlink', { type: 'button', onclick: onClick }, text); }

/**
 * Numbered marker: circle with mono digits; selected = filled cyan; locked = lock and dimmed.
 * n: number or short text. Returns a <span>; for maps use mapPanel.addMarker.
 */
export function marker(n, { selected = false, locked = false, tone = null } = {}) {
  const txt = typeof n === 'number' ? String(n).padStart(2, '0') : n;
  return h(`span.marker${selected ? '.is-selected' : ''}${locked ? '.is-locked' : ''}${tone ? '.tone-' + tone : ''}`, locked ? '\u{1F512}︎' : txt);
}

/**
 * Legend below a map. items: [{ kind, text }]; kinds: 'foot' (cyan dots), 'walked' (white line),
 * 'rover' (square, home), 'marker', 'selected', 'steep' (hatched), 'shadow' (dotted), 'spot' (diamond),
 * 'warning', 'caution', 'advisory', 'point' (Access Mars point). Optional right-aligned note.
 */
export function legend(items, note = null) {
  return h('div.legend',
    items.map((i) => h('span.legend__item', h(`span.sw.sw--${i.kind}`), i.text)),
    note ? h('span.legend__note', note) : null,
  );
}

/**
 * One check line (Go / no-go, Debrief). status: 'ok' (cyan), 'caution' (yellow), 'broken' (red), 'pending'.
 */
export function checkItem({ text, status = 'ok', detail = '', tag = null, onClick = null }) {
  const icon = { ok: '✓', caution: '!', broken: '×', pending: '' }[status] || '';
  return h(`${onClick ? 'button' : 'div'}.check.check--${status}`, onClick ? { type: 'button', onclick: onClick } : null,
    h('span.check__icon', icon),
    h('span.check__text', text),
    detail ? h('span.check__detail.mono', detail) : null,
    tag ? labelTag(tag) : null,
  );
}

/** Warning box for the helmet / panels. level: 'warning' | 'caution' | 'advisory'. */
export function alertBox(level, title, text = '') {
  return h(`div.alert.alert--${level}`, h('div.alert__title', title), text ? h('div.alert__text', text) : null);
}

/** A row "label ...... value" (legs list, helmet cards). */
export function row(label, value, { lead = null, tone = null, tag = null } = {}) {
  return h(`div.row${tone ? '.tone-' + tone : ''}`,
    lead ? h('span.row__lead', lead) : null,
    h('span.row__label', label),
    h('span.row__value.mono', value, tag ? [' ', labelTag(tag)] : null));
}

/**
 * Split layout for steps 1 to 3 (specs/0-frame.md): map left, panel right, one main button at the
 * bottom right of the panel. Returns { el, map, panel, action }: put the map panel into `map`,
 * content into `panel`, the main button into `action`.
 */
export function splitLayout() {
  const map = h('section.split__map');
  const panel = h('section.split__panel');
  const action = h('div.split__action');
  const side = h('aside.split__side', panel, action);
  const el = h('div.split', map, side);
  return { el, map, panel, action };
}
