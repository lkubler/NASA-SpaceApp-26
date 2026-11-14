// Sources page, reachable from every step: all data, documents, tools and code, every value with its
// label and source, and the AI-use note.

import { h } from '../ui/dom.js';
import { labelTag } from '../ui/label.js';
import { DOCS, DATA, TOOLS, AI_NOTE } from '../core/sources.js';
import { listValues } from '../core/values.js';

const GROUP_NAMES = {
  RULES: 'Rules', ASTRONAUT: 'Astronaut', WORK: 'Work rate', SUIT: 'Suit and consumables', RADIO: 'Radio shadow',
  ENVIRONMENT: 'Environment', DEMO: 'Demo', BODY: 'Body readings', HOME: 'Home', PLANNER: 'Route planner',
};

function fmtValue(e) {
  if (Array.isArray(e.value)) return 'table';
  if (typeof e.value === 'object') return Object.entries(e.value).map(([k, v]) => `${k} ${v}`).join(', ');
  const v = typeof e.value === 'number' && !Number.isInteger(e.value) ? +e.value.toPrecision(4) : e.value;
  if (e.unit === 'J') return `${(e.value / 3.6e6).toFixed(2)} kWh`;
  if (e.unit === 's') return `${(e.value / 3600).toFixed(1)} h`;
  return `${v}${e.unit ? ' ' + e.unit : ''}`;
}

export function sourcesPage(onClose) {
  const link = (url, text) => (/^https?:/.test(url) ? h('a', { href: url, target: '_blank', rel: 'noopener' }, text) : h('span', text));
  const values = listValues();
  const el = h('div.sources.fade-in', { role: 'dialog', 'aria-label': 'Sources' },
    h('div.sources__inner',
      h('div.sources__head',
        h('h1.headline.headline--normal', 'Sources.'),
        h('button.sources__close', { type: 'button', onclick: onClose }, 'Close'),
      ),
      h('p.lede', 'Every place, number and image in this mission, and where it comes from. Each value on screen carries a label: real (NASA data or a NASA document), model (calculated by us), simulated (a placeholder) or assumption (our choice, or not confirmed by a NASA document).'),

      h('h2', 'Data'),
      h('div.sources__list', DATA.map((d) => h('div.sources__item',
        h('div.sources__name', link(d.url, d.name)),
        h('div.muted', d.by),
        h('div', d.use),
        d.note ? h('div.muted', d.note) : null,
        h('div.mono.sources__lic', d.licence)))),

      h('h2', 'Rules, suit and demo values'),
      h('table.sources__table',
        h('thead', h('tr', h('th', 'Group'), h('th', 'Value'), h('th', ''), h('th', 'Label'), h('th', 'Source'))),
        h('tbody', values.map(({ group, key, entry }) => h('tr',
          h('td.muted', GROUP_NAMES[group] || group),
          h('td', h('div', entry.name || key), entry.text ? h('div.muted.sources__text', entry.text) : null),
          h('td.mono', fmtValue(entry)),
          h('td', labelTag(entry)),
          h('td.sources__src', (DOCS[entry.src] || DOCS.NONE).title, entry.where ? h('span.muted', ', ' + entry.where) : null),
        )))),

      h('h2', 'Documents'),
      h('ul.sources__docs', Object.entries(DOCS).filter(([k]) => k !== 'NONE').map(([k, d]) => h('li', h('span.mono.muted', k + ' '), link(d.url, d.title), d.moon ? h('span.muted', ' (Moon)') : null))),

      h('h2', 'Tools and code'),
      h('div.sources__list', TOOLS.map((t) => h('div.sources__item',
        h('div.sources__name', link(t.url, t.name)), h('div', t.use), h('div.mono.sources__lic', t.licence)))),

      h('h2', 'Use of AI'),
      h('div.sources__ai', AI_NOTE.map((p) => h('p', p))),
    ),
  );
  el.addEventListener('keydown', (e) => { if (e.key === 'Escape') onClose(); });
  return el;
}
