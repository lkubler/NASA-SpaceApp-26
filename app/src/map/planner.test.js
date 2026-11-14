import test from 'node:test';
import assert from 'node:assert/strict';
import { astar, slopeCost, planRoute } from './planner.js';

const mk = (rows) => ({ width: rows[0].length, height: rows.length, cost: Float32Array.from(rows.flatMap((r) => [...r].map((c) => (c === '#' ? Infinity : c === '~' ? 5 : 1)))) });

test('straight line on open grid', () => {
  const r = astar(mk(['.....', '.....', '.....']), [0, 1], [4, 1]);
  assert.equal(r.path.length, 5); assert.equal(r.cost, 4);
});
test('goes around a wall', () => {
  const r = astar(mk(['..#..', '..#..', '.....']), [0, 0], [4, 0]);
  assert.ok(r.path.some(([, row]) => row === 2));
  assert.ok(r.path.every(([c, row]) => !(c === 2 && row < 2)));
});
test('unreachable returns null', () => {
  assert.equal(astar(mk(['.#.', '.#.', '.#.']), [0, 0], [2, 0]), null);
});
test('prefers cheap detour over steep shortcut', () => {
  const r = astar(mk(['.~~~.', '.....']), [0, 0], [4, 0]);
  assert.ok(r.path.every(([c, row]) => c === 0 || c === 4 || row === 1));
});
test('no corner cutting between two blocked cells', () => {
  assert.equal(astar(mk(['.#', '#.']), [0, 0], [1, 1]), null);
});
test('slopeCost limits', () => {
  assert.equal(slopeCost(21), Infinity); assert.equal(slopeCost(NaN), Infinity);
  assert.ok(slopeCost(10) < slopeCost(16)); assert.ok(Number.isFinite(slopeCost(20)));
});
test('planRoute flags infeasible leg with reason, sums feasible legs', () => {
  const W = 5, hm = { width: W, height: 1, cellSize_m: 1, data: new Float32Array(W) };
  const bad = planRoute(hm, Float32Array.from([0, 0, 30, 0, 0]), [[0, 0], [4, 0]]);
  assert.equal(bad.legs[0].feasible, false); assert.match(bad.legs[0].reason, /slope limit/);
  const ok = planRoute(hm, new Float32Array(W), [[0, 0], [4, 0]]);
  assert.ok(ok.total.feasible); assert.ok(Math.abs(ok.total.dist_m - 4) < 1e-9);
});
