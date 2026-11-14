// The label component: real / model / simulated / assumption, shown as a small info marker beside a value.
// Hover (or focus) shows the kind, one or two sentences and the source; a click keeps it open
// (specs/0-frame.md "Labels").

import { h } from './dom.js';
import { sourceOf } from '../core/values.js';

const KINDS = ['real', 'model', 'simulated', 'assumption'];
let pop = null;

/**
 * @param {object} spec  either a value entry from core/values.js ({ label, text, src, where, moon }),
 *                       or { label, text, source: { title, url, where }, moon }
 * @returns {HTMLButtonElement}
 */
export function labelTag(spec) {
  const kind = KINDS.includes(spec.label) ? spec.label : 'assumption';
  const src = spec.source || (spec.src ? sourceOf(spec) : { title: '', url: '', where: '' });
  const word = kind + (spec.moon ? ', lunar rule' : ''); // specs/rules.md "Moon values"
  // a small info marker; the kind and the source show on hover (and on click, which keeps it open)
  const btn = h(`button.vlabel.vlabel--${kind}`, { type: 'button', 'aria-label': `Source (${word})`, html: INFO_SVG });
  const show = () => openPop(btn, kind, spec.text || '', src, spec.moon);
  btn.addEventListener('mouseenter', () => { cancelHide(); if (!pop || pop.__anchor !== btn) show(); });
  btn.addEventListener('mouseleave', () => { if (!pinned) hideSoon(); });
  btn.addEventListener('focus', () => { if (!pop || pop.__anchor !== btn) show(); });
  btn.addEventListener('blur', () => { if (!pinned) hideSoon(); });
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!pop || pop.__anchor !== btn) show();
    pinned = true;
  });
  return btn;
}

const INFO_SVG = '<svg viewBox="0 0 16 16" width="1em" height="1em" aria-hidden="true"><circle cx="8" cy="8" r="6.6" fill="none" stroke="currentColor" stroke-width="1.3"/><circle cx="8" cy="5" r="0.95" fill="currentColor"/><path d="M8 7.3v4.4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>';
let pinned = false, hideTimer = 0;
function cancelHide() { clearTimeout(hideTimer); }
function hideSoon() { cancelHide(); hideTimer = setTimeout(() => { if (!pinned) closePop(); }, 160); }

const KIND_TEXT = {
  real: 'Real · NASA data or a value from a NASA document',
  model: 'Model · calculated by us from real data',
  simulated: 'Simulated · a placeholder, no data behind it',
  assumption: 'Assumption · a value we chose, or one no NASA document confirms',
};

function openPop(anchor, kind, text, src, moon) {
  closePop();
  const link = src.url
    ? (/^https?:/.test(src.url) ? h('a', { href: src.url, target: '_blank', rel: 'noopener' }, src.title) : h('span', src.title))
    : h('span', src.title || 'No source');
  pop = h('div.vlabel-pop.fade-in', { role: 'dialog' },
    h('div.vlabel-pop__kind.mono', KIND_TEXT[kind]),
    text ? h('p.vlabel-pop__text', text) : null,
    moon ? h('p.vlabel-pop__moon', 'This value comes from NASA’s planning for the Moon.') : null,
    h('div.vlabel-pop__src', h('span.muted', 'Source: '), link, src.where ? h('span.muted', ', ' + src.where) : null),
  );
  pop.__anchor = anchor;
  pop.addEventListener('mouseenter', cancelHide);
  pop.addEventListener('mouseleave', () => { if (!pinned) hideSoon(); });
  document.body.append(pop);
  const r = anchor.getBoundingClientRect();
  const pw = pop.offsetWidth, ph = pop.offsetHeight;
  let x = Math.min(window.innerWidth - pw - 12, Math.max(12, r.left));
  let y = r.bottom + 8;
  if (y + ph > window.innerHeight - 12) y = Math.max(12, r.top - ph - 8);
  pop.style.left = x + 'px'; pop.style.top = y + 'px';
  setTimeout(() => document.addEventListener('click', onDoc), 0);
  document.addEventListener('keydown', onKey);
}
function onDoc(e) { if (pop && !pop.contains(e.target)) closePop(); }
function onKey(e) { if (e.key === 'Escape') closePop(); }
export function closePop() {
  cancelHide();
  if (pop) pop.remove();
  pop = null;
  pinned = false;
  document.removeEventListener('click', onDoc);
  document.removeEventListener('keydown', onKey);
}
