// The way home: for ANY cell, the cheapest path back to the lander on the same cost grid as the outbound
// route (not the outbound path reversed), with the metabolic energy and time of walking it in the
// direction of travel (uphill/downhill, load, shared speed model). Pure, no DOM.
// Prior art: Johnson 2009 (MIT, SEXTANT predecessor) also plans a path home from any point; this adds load,
// slope-dependent speed and the Pandolf energy.
import { costField } from './planner.js';
import { legCost, resolveParams } from '../model/reserve.js';

/**
 * @param {object} hm heightmap {width,height,cellSize_m,data}
 * @param {object} grid cost grid from costGrid()
 * @param {[number,number]} homeCell [col,row] of the lander
 * @param {object} [params] reserve params (load, gravity, ...)
 */
export function makeHome(hm, grid, homeCell, params = {}) {
  const o = resolveParams(params), { width: W, cellSize_m: cs, data } = hm;
  const f = costField(grid, homeCell);
  const n = W * hm.height;
  const kJ = new Float32Array(n).fill(NaN), sec = new Float32Array(n).fill(NaN);
  const home = homeCell[1] * W + homeCell[0];
  kJ[home] = 0; sec[home] = 0;
  // energy/time to the lander accumulate along the predecessor tree; resolved lazily and memoised
  function resolve(i) {
    if (!Number.isNaN(kJ[i])) return;
    if (!Number.isFinite(f.cost[i])) { kJ[i] = Infinity; sec[i] = Infinity; return; }
    const chain = [];
    for (let c = i; Number.isNaN(kJ[c]); c = f.from[c]) chain.push(c);
    for (let k = chain.length - 1; k >= 0; k--) {
      const c = chain[k], nx = f.from[c];
      const step = Math.hypot((nx % W) - (c % W), ((nx / W) | 0) - ((c / W) | 0)) * cs;
      const L = legCost(step, data[nx] - data[c], undefined, o);
      kJ[c] = kJ[nx] + L.kJ; sec[c] = sec[nx] + L.s;
    }
  }
  const idx = (c, r) => r * W + c;
  return {
    reachable: (c, r) => Number.isFinite(f.cost[idx(c, r)]),
    /** cost-grid units of the best path home */
    gridCost: (c, r) => f.cost[idx(c, r)],
    returnKJ(c, r) { const i = idx(c, r); resolve(i); return kJ[i]; },
    returnS(c, r) { const i = idx(c, r); resolve(i); return sec[i]; },
    /** cells [col,row] from (c,r) to the lander */
    path(c, r) {
      const out = []; let i = idx(c, r);
      if (!Number.isFinite(f.cost[i])) return out;
      for (; i >= 0; i = f.from[i]) { out.push([i % W, (i / W) | 0]); if (i === home) break; }
      return out;
    },
  };
}
