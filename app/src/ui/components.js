// Small plain-JS component factories. Each returns an HTMLElement; styles in styles/components.css.
// Provenance classes: 'measured' | 'modelled' | 'simulated' (docs/design.md section 2).
const PROV = { measured: 'MEASURED', modelled: 'MODELLED', simulated: 'SIMULATED' };
const STATE_ICON = { ok: '●', warn: '▲', danger: '■' }; // circle, triangle, square (shape + word, never color alone)
const STATE_WORD = { ok: 'NOMINAL', warn: 'CAUTION', danger: 'DANGER' };

function el(tag, cls, text) {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (text != null) e.textContent = text;
  return e;
}

/** Provenance chip. kind: measured|modelled|simulated. title (optional) = tooltip with the source sentence. */
export function chip(kind, title) {
  const c = el('span', `chip chip-prov chip-${kind}`);
  c.append(el('i', 'dot'), document.createTextNode(PROV[kind] || String(kind).toUpperCase()));
  if (title) c.title = title;
  return c;
}

/** State chip: icon + word. state: ok|warn|danger. */
export function stateChip(state, text) {
  const c = el('span', `chip chip-state chip-${state}`);
  c.append(el('i', 'ico', STATE_ICON[state]), document.createTextNode(text || STATE_WORD[state]));
  return c;
}

/** Numbered POI badge. */
export function badge(n) { return el('span', 'badge', String(n)); }

/** Panel: header label + optional provenance chip, body content (Node or string). */
export function panel({ label, prov, body, cls = '' } = {}) {
  const p = el('section', `panel ${cls}`.trim());
  const h = el('header', 'panel-h');
  h.append(el('span', 'label', label || ''));
  if (prov) h.append(chip(prov));
  p.append(h);
  const b = el('div', 'panel-b');
  if (body != null) b.append(body.nodeType ? body : document.createTextNode(body));
  p.append(b);
  return p;
}

/** Tile: one value. Returns element with .set(value, state?) to update. */
export function tile({ label, value = '--', unit = '', prov, state } = {}) {
  const t = el('div', 'tile');
  t.append(el('span', 'label', label));
  const v = el('div', 'tile-v');
  const num = el('span', 'num', value), u = el('span', 'unit', unit);
  v.append(num, u); t.append(v);
  if (prov) { const f = el('div', 'tile-f'); f.append(chip(prov)); t.append(f); }
  if (state) t.dataset.state = state;
  t.set = (val, st) => { num.textContent = val; if (st !== undefined) { if (st) t.dataset.state = st; else delete t.dataset.state; } };
  return t;
}

/** Button. variant: primary|secondary|ghost. */
export function button(text, { variant = 'primary', onClick } = {}) {
  const b = el('button', `btn btn-${variant}`, text);
  b.type = 'button';
  if (onClick) b.addEventListener('click', onClick);
  return b;
}

/** Legend rows for provenance classes (line sample + tag + description). */
export function provLegend() {
  const d = {
    measured: 'Real NASA/partner data',
    modelled: 'Computed from measured data',
    simulated: 'Placeholder, no live feed',
  };
  const w = el('div', 'legend');
  for (const k of Object.keys(PROV)) {
    const r = el('div', 'legend-row');
    r.append(el('i', `swatch sw-${k}`), chip(k), el('span', 'desc', d[k]));
    w.append(r);
  }
  return w;
}
