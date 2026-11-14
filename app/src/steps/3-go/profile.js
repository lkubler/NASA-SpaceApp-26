// Height profile of the round rover -> stop(s) -> rover, drawn from plan.profile (core planNumbers).
// Marks: every stop, named at its place, stretches in radio shadow, ground over the slope rule, and one focus point
// (where a clicked check's value occurs).
import { h, s } from '../../ui/index.js';

const W = 1000; // SVG units across; height is set from the element's size

/**
 * @param {PlanNumbers} plan
 * @param {{ spotName?: string, stops?: { sM: number, label: string }[] }} o  stops: every stop with its name;
 *   without it the one spot (plan.spotAt) named spotName
 * @returns {{ el, focus(where|null, text, range?), resize() }}
 */
export function heightProfile(plan, { spotName, stops }) {
  const stopMarks = stops || [{ sM: plan.spotAt.sM, label: spotName }];
  const pts = plan.profile;
  const total = pts[pts.length - 1].sM || 1;
  let ymin = Infinity, ymax = -Infinity;
  for (const p of pts) { if (p.y < ymin) ymin = p.y; if (p.y > ymax) ymax = p.y; }
  const span = Math.max(ymax - ymin, 0.5);

  const svg = s('svg', { class: 'goprof__svg', preserveAspectRatio: 'none' });
  const labels = h('div.goprof__labels');
  const marks = h('div.goprof__marks');
  const callout = h('div.goprof__callout.mono');
  const plot = h('div.goprof__plot', svg, marks, callout);
  const el = h('div.goprof', plot, labels);

  const X = (m) => (m / total) * W;
  const pct = (m) => `${(100 * m) / total}%`;
  let H = 100;
  const Y = (y) => H - 4 - ((y - ymin) / span) * (H - 18);

  // shadow stretches and closed stretches, as [startM, endM] ranges
  const shadowRanges = plan.radioStretches.map((r) => [r.startM, r.endM]);
  const closedRanges = ranges(pts, (p) => p.closed);

  // HTML labels under the plot
  const lab = (m, text, cls, align) => labels.append(h(`span.goprof__label${cls ? '.' + cls : ''}`, { style: { left: pct(m), transform: align === 'start' ? 'none' : align === 'end' ? 'translateX(-100%)' : 'translateX(-50%)' } }, text));
  lab(0, 'Rover', '', 'start');
  for (const st of stopMarks) lab(st.sM, st.label, 'is-spot', 'middle');
  lab(total, 'Rover', '', 'end');
  if (shadowRanges.length) {
    const r = shadowRanges.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));
    marks.append(h('span.goprof__shadowlabel', { style: { left: pct((r[0] + r[1]) / 2) } }, 'Radio shadow'));
  }

  let focusState = null;

  // labels that would overlap the one before move to a second row (stops close together on the round)
  function placeLabels() {
    const els = [...labels.children];
    els.forEach((e) => e.classList.remove('is-row2'));
    let prev = [null, null];
    for (const e of els) {
      const r = e.getBoundingClientRect();
      if (!r.width) continue;
      const hit = (q) => q && r.left < q.right + 8;
      const row = hit(prev[0]) ? 1 : 0;
      if (row) e.classList.add('is-row2');
      prev[row] = e.getBoundingClientRect();
    }
    labels.classList.toggle('has-row2', els.some((e) => e.classList.contains('is-row2')));
  }

  function draw() {
    H = Math.max(40, plot.clientHeight || 100);
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    const defs = s('defs');
    const grad = s('linearGradient', { id: 'goprof-fill', x1: 0, y1: 0, x2: 0, y2: 1 },
      s('stop', { offset: '0%', 'stop-color': 'var(--accent)', 'stop-opacity': 0.22 }),
      s('stop', { offset: '100%', 'stop-color': 'var(--accent)', 'stop-opacity': 0.02 }));
    const pat = s('pattern', { id: 'goprof-shadow', width: 6, height: 6, patternUnits: 'userSpaceOnUse' },
      s('circle', { cx: 3, cy: 3, r: 0.9, fill: 'rgba(255,255,255,0.55)' }));
    defs.append(grad, pat);
    svg.append(defs);
    for (const [a, b] of shadowRanges) svg.append(s('rect', { class: 'goprof__shadow', x: X(a), y: 0, width: Math.max(1, X(b) - X(a)), height: H }));
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${X(p.sM).toFixed(1)} ${Y(p.y).toFixed(1)}`).join('');
    svg.append(s('path', { class: 'goprof__area', d: `${line}L${W} ${H}L0 ${H}Z` }));
    svg.append(s('path', { class: 'goprof__line', d: line, 'vector-effect': 'non-scaling-stroke' }));
    for (const [a, b] of closedRanges) {
      const seg = pts.filter((p) => p.sM >= a && p.sM <= b);
      if (seg.length < 2) seg.push({ ...seg[0], sM: seg[0].sM + total / W });
      svg.append(s('path', { class: 'goprof__closed', d: seg.map((p, i) => `${i ? 'L' : 'M'}${X(p.sM).toFixed(1)} ${Y(p.y).toFixed(1)}`).join(''), 'vector-effect': 'non-scaling-stroke' }));
    }
    for (const st of stopMarks) svg.append(s('line', { class: 'goprof__spot', x1: X(st.sM), x2: X(st.sM), y1: 0, y2: H, 'vector-effect': 'non-scaling-stroke' }));
    if (focusState) drawFocus();
  }

  function heightAtM(m) {
    let k = 0;
    while (k < pts.length - 1 && pts[k + 1].sM < m) k++;
    const a = pts[k], b = pts[Math.min(k + 1, pts.length - 1)];
    const t = b.sM > a.sM ? (m - a.sM) / (b.sM - a.sM) : 0;
    return a.y + (b.y - a.y) * Math.max(0, Math.min(1, t));
  }

  function drawFocus() {
    const { where, range, tone } = focusState;
    const g = s('g', { class: `goprof__focus tone-${tone}` });
    if (range) g.append(s('rect', { class: 'goprof__focusrange', x: X(range[0]), y: 0, width: Math.max(2, X(range[1]) - X(range[0])), height: H }));
    g.append(s('line', { x1: X(where.sM), x2: X(where.sM), y1: 0, y2: H, 'vector-effect': 'non-scaling-stroke' }));
    svg.append(g);
  }

  const api = {
    el,
    /** Show where on the route a value occurs; null clears. */
    focus(where, text, { range = null, tone = 'accent' } = {}) {
      focusState = where ? { where, range, tone } : null;
      callout.replaceChildren();
      callout.className = 'goprof__callout mono';
      marks.querySelectorAll('.goprof__dot').forEach((d) => d.remove());
      if (where) {
        const left = (100 * where.sM) / total;
        callout.textContent = text;
        callout.classList.add(`tone-${tone}`, left > 70 ? 'is-left' : 'is-right');
        callout.style.left = `${left}%`;
        const dot = h(`span.goprof__dot.tone-${tone}`, { style: { left: `${left}%`, top: `${Y(heightAtM(where.sM))}px` } });
        marks.append(dot);
        el.classList.add('has-focus');
      } else el.classList.remove('has-focus');
      draw();
    },
    resize() { draw(); placeLabels(); if (focusState) { const d = marks.querySelector('.goprof__dot'); if (d) d.style.top = `${Y(heightAtM(focusState.where.sM))}px`; } },
  };
  return api;
}

/** Ranges [startM, endM] of consecutive profile points where pred holds. */
export function ranges(pts, pred) {
  const out = [];
  let start = null, last = null;
  for (const p of pts) {
    if (pred(p)) { if (start == null) start = p.sM; last = p.sM; }
    else if (start != null) { out.push([start, p.sM]); start = null; }
  }
  if (start != null) out.push([start, last]);
  return out;
}
