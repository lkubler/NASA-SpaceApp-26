// Movable waypoints on the Plan map (specs/x-waypoints.md). A drag on the route line makes a waypoint there,
// a drag on a waypoint moves it; while dragging a thin preview line runs from the place before through the
// pointer to the place after, red over ground where a waypoint may not stand (over the slope rule, outside
// the site); there the waypoint returns on release. A click selects a waypoint, its small × removes it.
// The map itself never drags (the Plan map is fixed), so a drag anywhere else does nothing; a click on a
// spot still selects it (the spot markers lie above the route line).
// No numbers of its own: the planning is the core's (planRound), this file only handles the pointer.

import { s } from '../../ui/index.js';
import { MAP_DRAG_PX } from '../../ui/mapPanel.js';
import { ROVER, legKeysOf } from '../../core/index.js';

/**
 * &waypoints=0:x,z;1:x,z;... -> { legKey: [{x, z}] } for the legs `keys` (leg index into keys), in the order
 * given; points where isAllowed(x, z) is false are dropped. null when nothing valid is given.
 */
export function parseWaypoints(text, keys, isAllowed) {
  if (!text) return null;
  const out = {};
  for (const part of String(text).split(';')) {
    const m = /^\s*(\d+)\s*:\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*$/.exec(part);
    if (!m) continue;
    const key = keys[Number(m[1])], x = Number(m[2]), z = Number(m[3]);
    if (!key || !isAllowed(x, z)) continue;
    (out[key] = out[key] || []).push({ x, z });
  }
  return Object.keys(out).length ? out : null;
}

/**
 * @param {{ map, terrain, isAllowed(x, z), getRoute(), getIds(), getWaypoints(), onChange(wps), onStart(), onSelect() }} o
 */
export function waypointEditor({ map, isAllowed, getRoute, getIds, getWaypoints, onChange, onStart, onSelect }) {
  let drag = null;      // { kind: 'new' | 'move', key, k, j, x0, y0, id, moved, p, ok, from, to, marker }
  let selected = null;  // { key, j }
  let preview = null, ghost = null;

  /** Per leg: its key, its ends (rover or stop) and its waypoints, in route order. */
  function legs() {
    const route = getRoute();
    if (!route || !route.legs) return [];
    const keys = legKeysOf(getIds());
    const stops = route.stops || [route.spot];
    const wps = getWaypoints();
    return route.legs.map((path, k) => ({
      key: keys[k], path,
      from: k === 0 ? ROVER : stops[k - 1], to: k === route.legs.length - 1 ? ROVER : stops[k],
      wps: (wps[keys[k]] || []).map((w) => ({ x: w.x, z: w.z })),
    }));
  }
  const copyAll = () => {
    const out = {};
    for (const [k, l] of Object.entries(getWaypoints())) out[k] = l.map((w) => ({ x: w.x, z: w.z }));
    return out;
  };

  /** Invisible wide strokes over the route, one per part of a leg: a drag on one makes a waypoint in that part. */
  function drawHits() {
    legs().forEach((L, k) => {
      const pts = L.path.points;
      const cuts = [0, ...(L.path.via || []).map((v) => v.index), pts.length - 1];
      for (let j = 0; j + 1 < cuts.length; j++) {
        const seg = pts.slice(cuts[j], cuts[j + 1] + 1);
        if (seg.length < 2) continue;
        const el = map.path(seg, { style: 'wphit', layer: 'routes' });
        el.dataset.leg = String(k); el.dataset.part = String(j);
        el.addEventListener('pointerdown', (e) => begin(e, { kind: 'new', key: L.key, k, j, from: [L.from, ...L.wps][j], to: [...L.wps, L.to][j] }));
      }
    });
  }

  /** The waypoints as small markers; the selected one carries a ×. */
  function drawWaypoints() {
    legs().forEach((L, k) => {
      L.wps.forEach((w, j) => {
        const g = map.addMarker(w.x, w.z, { kind: 'dot', layer: 'top' });
        g.classList.add('plan-wp');
        g.dataset.leg = String(k); g.dataset.wp = String(j);
        g.setAttribute('role', 'button');
        g.setAttribute('aria-label', 'Waypoint. Drag to move it, click to select it.');
        g.prepend(s('circle', { class: 'plan-wp__hit', r: 6 }));
        const isSel = selected && selected.key === L.key && selected.j === j;
        if (isSel) {
          g.classList.add('is-selected');
          const x = s('g', { class: 'plan-wp__x', transform: 'translate(6.5 -6.5) scale(1)', role: 'button', 'aria-label': 'Remove this waypoint' },
            s('circle', { r: 3.6 }), s('path', { d: 'M-1.4 -1.4L1.4 1.4M1.4 -1.4L-1.4 1.4' }));
          x.addEventListener('pointerdown', (e) => e.stopPropagation());
          x.addEventListener('click', (e) => { e.stopPropagation(); remove(L.key, j); });
          g.append(x);
        }
        const all = [L.from, ...L.wps, L.to];
        g.addEventListener('pointerdown', (e) => begin(e, { kind: 'move', key: L.key, k, j, from: all[j], to: all[j + 2], marker: g }));
      });
    });
  }

  function remove(key, j) {
    const wps = copyAll();
    if (!wps[key]) return;
    wps[key].splice(j, 1);
    if (!wps[key].length) delete wps[key];
    selected = null;
    onChange(wps);
  }

  function begin(e, d) {
    if (e.button !== 0 || drag) return;
    e.preventDefault();
    e.stopPropagation();
    drag = { ...d, x0: e.clientX, y0: e.clientY, id: e.pointerId, moved: false, p: null, ok: false };
    try { map.el.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
  }

  const clearPreview = () => { if (preview) preview.remove(); if (ghost) ghost.remove(); preview = ghost = null; };

  function onMove(e) {
    if (!drag || e.pointerId !== drag.id) return;
    if (!drag.moved) {
      if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < MAP_DRAG_PX) return;
      drag.moved = true;
      onStart();
      map.el.classList.add('is-wp-dragging');
      if (drag.marker) drag.marker.style.opacity = '0';
    }
    const p = map.eventToScene(e);
    drag.p = p;
    drag.ok = isAllowed(p.x, p.z);
    // the thin preview line: the place before -> pointer -> the place after
    const pts = [drag.from, p, drag.to].map((q) => map.project(q.x, q.z));
    const dPath = pts.map((q, i) => `${i ? 'L' : 'M'}${q.px.toFixed(2)} ${q.py.toFixed(2)}`).join('');
    if (!preview) preview = map.path([drag.from, p, drag.to], { style: 'wppreview', layer: 'top' });
    preview.setAttribute('d', dPath);
    preview.classList.toggle('is-refused', !drag.ok);
    if (ghost) ghost.remove();
    ghost = map.addMarker(p.x, p.z, { kind: 'dot', layer: 'top' });
    ghost.classList.add('plan-wp', 'plan-wp--ghost');
    ghost.classList.toggle('is-refused', !drag.ok);
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    try { if (map.el.hasPointerCapture(e.pointerId)) map.el.releasePointerCapture(e.pointerId); } catch { /* gone */ }
    map.el.classList.remove('is-wp-dragging');
    clearPreview();
    if (d.marker) d.marker.style.opacity = '';
    if (e.type === 'pointercancel') return;
    if (!d.moved) {
      // a click: on a waypoint it selects it; on the route line it does nothing
      if (d.kind === 'move') { selected = { key: d.key, j: d.j }; onSelect(); }
      return;
    }
    if (!d.ok || !d.p) return; // not allowed ground: the waypoint stays where it was (a new one is not made)
    const wps = copyAll();
    const list = wps[d.key] = wps[d.key] || [];
    if (d.kind === 'new') list.splice(d.j, 0, { x: d.p.x, z: d.p.z });
    else list[d.j] = { x: d.p.x, z: d.p.z };
    selected = { key: d.key, j: d.j };
    onChange(wps);
  }

  // a press on the map away from a waypoint drops the selection
  function onDown(e) {
    if (!selected || (e.target.closest && e.target.closest('.plan-wp'))) return;
    selected = null;
    onSelect();
  }

  map.el.addEventListener('pointermove', onMove);
  map.el.addEventListener('pointerup', onUp);
  map.el.addEventListener('pointercancel', onUp);
  map.el.addEventListener('pointerdown', onDown, true);

  return {
    drawHits, drawWaypoints,
    deselect() { selected = null; },
    destroy() {
      map.el.removeEventListener('pointermove', onMove);
      map.el.removeEventListener('pointerup', onUp);
      map.el.removeEventListener('pointercancel', onUp);
      map.el.removeEventListener('pointerdown', onDown, true);
    },
  };
}
