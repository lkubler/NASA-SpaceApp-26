import test from 'node:test';
import assert from 'node:assert/strict';
import { makeHome } from './home.js';
import { costGrid, astar } from './planner.js';
import { computeReserve } from '../model/reserve.js';

// 20 x 9 grid, 1 m cells, flat. A steep wall (column 10) with one gap at row 7 separates A (left) from the lander (right).
function world() {
  const W = 20, H = 9, data = new Float32Array(W * H), slope = new Float32Array(W * H).fill(2);
  for (let r = 0; r < H; r++) if (r !== 7) slope[r * W + 10] = 40;
  return { hm: { width: W, height: H, cellSize_m: 1, data }, slope };
}
test('return path is the cheapest way home from the current point, not the reversed outbound path', () => {
  const { hm, slope } = world(), grid = costGrid(hm, slope);
  const home = makeHome(hm, grid, [19, 4], { loadKg: 0 });
  const p = home.path(2, 4);
  assert.deepEqual(p[0], [2, 4]); assert.deepEqual(p.at(-1), [19, 4]);
  assert.ok(p.some(([c, r]) => c === 10 && r === 7), 'goes through the gap');
  const a = astar(grid, [2, 4], [19, 4]); // same answer as a point-to-point A* from here
  assert.ok(Math.abs(a.cost - home.gridCost(2, 4)) < 1e-3);
});

test('return energy: zero at the lander, grows with distance, climbing home costs more than descending home', () => {
  const W = 30, H = 3, data = new Float32Array(W * H);
  for (let r = 0; r < H; r++) for (let c = 0; c < W; c++) data[r * W + c] = c * 1.0; // 10 m cells: 5.7 deg
  const hm = { width: W, height: H, cellSize_m: 10, data }, slope = new Float32Array(W * H).fill(5.7), grid = costGrid(hm, slope);
  const climbHome = makeHome(hm, grid, [29, 1]), descendHome = makeHome(hm, grid, [0, 1]);
  assert.equal(climbHome.returnKJ(29, 1), 0);
  assert.ok(climbHome.returnKJ(10, 1) > climbHome.returnKJ(20, 1));
  assert.ok(climbHome.returnKJ(0, 1) > descendHome.returnKJ(29, 1));
  assert.ok(climbHome.returnS(0, 1) > descendHome.returnS(29, 1));
});

test('reserve with the true return cost: a close lander moves the turn-back later than the reversed route', () => {
  const pts = Array.from({ length: 30 }, (_, i) => ({ dist_m: i * 100, elev_m: 0, terrain: 'hardpan' }));
  const p = { capacityKJ: 3000, bufferFrac: 0.2, loadKg: 0, speedMs: 1 };
  const rev = computeReserve(pts, p);
  const direct = computeReserve(pts.map((q) => ({ ...q, returnKJ: Math.min(40, q.dist_m * 0.252) })), p);
  assert.equal(direct.turnBackIndex, -1);
  assert.ok(rev.turnBackIndex > 0);
});
