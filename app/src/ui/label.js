// The label component: real / model / simulated / assumption, small mono text beside a value.
// Click shows one or two sentences and the source (specs/0-frame.md "Labels").

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
  const word = kind + (spec.moon ? ' · Moon' : '');
  const btn = h(`button.vlabel.vlabel--${kind}`, { type: 'button', title: 'What does this mean?' }, word);
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPop(btn, kind, spec.text || '', src, spec.moon);
  });
  return btn;
}

const KIND_TEXT = {
  real: 'Real: NASA data or a value from a NASA document.',
  model: 'Model: calculated by us from real data.',
  simulated: 'Simulated: a placeholder, no data behind it.',
  assumption: 'Assumption: a value we chose, or one no NASA document confirms.',
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
  if (pop) pop.remove();
  pop = null;
  document.removeEventListener('click', onDoc);
  document.removeEventListener('keydown', onKey);
}
