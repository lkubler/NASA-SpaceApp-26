import test from 'node:test';
import assert from 'node:assert/strict';
import { lineOfSight, bestRelay, viewshed, routeShadows, HIDDEN, VISIBLE, UNKNOWN } from './comms.js';

function flat(w, h, cs = 1, z = 0) {
  return { width: w, height: h, cellSize_m: cs, data: new Float32Array(w * h).fill(z), noData: -9999 };
}

// brute-force reference LOS (no curvature)
function bruteVisible(hm, obs, tx, ty, th) {
  const cs = hm.cellSize_m, ox = obs.x / cs - 0.5, oy = obs.y / cs - 0.5;
  const z0 = hm.data[Math.round(oy) * hm.width + Math.round(ox)] + obs.antennaHeight_m;
  const dist = Math.hypot(tx - ox, ty - oy), n = Math.ceil(dist * 4);
  const zt = hm.data[ty * hm.width + tx] + th;
  for (let i = 1; i < n; i++) {
    const t = i / n, x = ox + (tx - ox) * t, y = oy + (ty - oy) * t;
    const z = hm.data[Math.round(y) * hm.width + Math.round(x)];
    if (z > z0 + (zt - z0) * t + 0.01) return false;
  }
  return true;
}

test('flat terrain is fully visible', () => {
  const hm = flat(64, 64);
  const v = viewshed(hm, { x: 32.5, y: 32.5, antennaHeight_m: 2 }, 1.8, { curvature: false });
  assert.ok(v.every(c => c === VISIBLE));
});

test('ridge casts a shadow behind it, ahead stays visible', () => {
  const hm = flat(100, 40);
  for (let y = 0; y < 40; y++) hm.data[y * 100 + 50] = 20; // N-S ridge, 20 m
  const obs = { x: 20.5, y: 20.5, antennaHeight_m: 2 };
  const v = viewshed(hm, obs, 1.8, { curvature: false });
  assert.equal(v[20 * 100 + 40], VISIBLE);
  assert.equal(v[20 * 100 + 80], HIDDEN);
  assert.equal(v[20 * 100 + 5], VISIBLE);
  let agree = 0, tot = 0;
  for (let y = 0; y < 40; y++) for (let x = 0; x < 100; x++) {
    if ((x - 20) ** 2 + (y - 20) ** 2 < 4) continue;
    tot++;
    if ((v[y * 100 + x] === VISIBLE) === bruteVisible(hm, obs, x, y, 1.8)) agree++;
  }
  assert.ok(agree / tot > 0.95, `agreement ${agree / tot}`);
});

test('no-data cells are unknown and do not block', () => {
  const hm = flat(60, 20);
  for (let y = 0; y < 20; y++) hm.data[y * 60 + 30] = -9999;
  const v = viewshed(hm, { x: 10.5, y: 10.5, antennaHeight_m: 2 }, 1.8, { curvature: false });
  assert.equal(v[10 * 60 + 30], UNKNOWN);
  assert.equal(v[10 * 60 + 50], VISIBLE);
});

test('routeShadows: segment, duration, limit flag', () => {
  const hm = flat(100, 40);
  for (let y = 0; y < 40; y++) hm.data[y * 100 + 50] = 20;
  const vis = viewshed(hm, { x: 20.5, y: 20.5, antennaHeight_m: 2 }, 1.8, { curvature: false });
  const route = [];
  for (let x = 30; x <= 95; x++) route.push({ x: x + 0.5, y: 20.5, time_s: (x - 30) * 20 });
  const grid = { width: 100, height: 40, cellSize_m: 1 };
  const segs = routeShadows(route, vis, grid);
  assert.equal(segs.length, 1);
  assert.ok(segs[0].start > 0 && segs[0].duration_s > 600);
  assert.equal(segs[0].exceedsLimit, true);
  assert.equal(segs[0].limit_s, 600);
  assert.equal(routeShadows(route, vis, { ...grid, limit_s: 5000 })[0].exceedsLimit, false);
});

test('routeShadows: gap closes at next non-hidden point; unknown is not shadow', () => {
  const vis = new Uint8Array(10).fill(VISIBLE);
  vis[3] = vis[4] = HIDDEN; vis[5] = UNKNOWN;
  const route = [...Array(10).keys()].map(i => ({ x: i + 0.5, y: 0.5, time_s: i * 60 }));
  const segs = routeShadows(route, vis, { width: 10, height: 1, cellSize_m: 1 });
  assert.deepEqual(segs.map(s => [s.start, s.end, s.duration_s, s.exceedsLimit]), [[180, 300, 120, false]]);
});

test('perf: 512x512 viewshed', () => {
  const W = 512, hm = flat(W, W, 1);
  for (let i = 0; i < hm.data.length; i++) hm.data[i] = 8 * Math.sin((i % W) / 17) * Math.cos(Math.floor(i / W) / 23);
  const obs = { x: 256.5, y: 256.5, antennaHeight_m: 2 };
  viewshed(hm, obs);
  const t = performance.now(); viewshed(hm, obs);
  const ms = performance.now() - t;
  console.log(`viewshed 512x512: ${ms.toFixed(1)} ms`);
  assert.ok(ms < 2000);
});

test('lineOfSight: blocked by a ridge, clear on flat ground, symmetric', () => {
  const W = 40, data = new Float32Array(W * 5);
  for (let r = 0; r < 5; r++) data[r * W + 20] = 30; // 30 m wall
  const hm = { width: W, height: 5, cellSize_m: 1, data };
  assert.equal(lineOfSight(hm, { x: 5, y: 2.5 }, { x: 35, y: 2.5 }), false);
  assert.equal(lineOfSight(hm, { x: 5, y: 2.5 }, { x: 15, y: 2.5 }), true);
  assert.equal(lineOfSight(hm, { x: 35, y: 2.5 }, { x: 5, y: 2.5 }), false);
});
test('bestRelay picks the candidate that sees most route points', () => {
  const W = 40, data = new Float32Array(W * 5);
  for (let r = 0; r < 5; r++) data[r * W + 20] = 30;
  const hm = { width: W, height: 5, cellSize_m: 1, data };
  const route = [{ x: 30, y: 2.5 }, { x: 35, y: 2.5 }, { x: 8, y: 2.5 }];
  const b = bestRelay(hm, route, [{ x: 3, y: 2.5 }, { x: 25, y: 2.5 }]);
  assert.equal(b.x, 25); assert.equal(b.visible, 2);
});
