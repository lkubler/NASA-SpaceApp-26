import test from 'node:test';
import assert from 'node:assert/strict';
import { computeReserve, metabolicRateW, o2LitresFromKJ, W_PER_ML_MIN, G_EARTH } from './reserve.js';

const near = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);
// Plain Pandolf check params: Earth gravity, no load, no suit offset, eta 1.0 not in table -> use hardpan 1.1 via explicit terrain
const base = { gravity: G_EARTH, loadKg: 0, suitVo2OffsetMlKgMin: 0, bodyMassKg: 80, speedMs: 1 };

test('Pandolf level, no load, Earth: 1.5W + eta*W*1.5V^2', () => {
  // hand: 120 + 1.1*80*1.5*1 = 120 + 132 = 252
  near(metabolicRateW(0, 'hardpan', base), 252);
});

test('Pandolf uphill 10 %: adds eta*W*0.35*V*G', () => {
  // hand: 252 + 1.1*80*0.35*1*10 = 252 + 308 = 560
  near(metabolicRateW(10, 'hardpan', base), 560);
});

test('Pandolf with load: static term 2(W+L)(L/W)^2', () => {
  // W=80 L=20: 120 + 2*100*0.0625 + 1.1*100*1.5 = 120 + 12.5 + 165 = 297.5
  near(metabolicRateW(0, 'hardpan', { ...base, loadKg: 20 }), 297.5);
});

test('Santee downhill -10 %: hand-computed', () => {
  // W=80,L=0,V=1,eta=1.1,G=-10. Pandolf loaded = 1.1*80*(1.5-3.5)= -176.
  // CF = 1.1*(-10*80*1/3.5 - 80*16/80 + 24) = 1.1*(-228.571-16+24) = -242.857
  // loaded = -176 + 242.629 = 66.629 -> floor stat=0 not hit. P = 120 + 66.857
  near(metabolicRateW(-10, 'hardpan', base), 186.628571429, 1e-6);
});

test('Mars gravity scales loaded terms, keeps basal', () => {
  const mars = { ...base, gravity: 3.71 };
  const gs = 3.71 / G_EARTH;
  near(metabolicRateW(0, 'hardpan', mars), 120 + gs * 132);
  assert.ok(metabolicRateW(0, 'hardpan', mars) < 252);
});

test('suit offset: 14 ml/kg/min * 80 kg * 0.350 W per ml/min', () => {
  const w = metabolicRateW(0, 'hardpan', { ...base, suitVo2OffsetMlKgMin: 14 });
  near(w - 252, 14 * 80 * W_PER_ML_MIN);
  near(W_PER_ML_MIN, 0.3503, 1e-3);
});

test('default Mars walking power is in NASA walkback range (about 400-700 W)', () => {
  const p = metabolicRateW(0, 'regolith');
  assert.ok(p > 400 && p < 700, String(p)); // NASA: 1700-2300 BTU/hr = 498-674 W walkback
});

test('o2LitresFromKJ round trip: 1 L O2 ~ 21 kJ', () => {
  near(o2LitresFromKJ(21.02), 1, 0.01);
});

// Flat route, 100 m steps
const flat = (n, step = 100) => Array.from({ length: n }, (_, i) => ({ dist_m: i * step, elev_m: 0, terrain: 'hardpan' }));

test('flat route: energy matches P*t, remaining and symmetric return cost', () => {
  const p = { ...base, capacityKJ: 1000, bufferFrac: 0.2 };
  const r = computeReserve(flat(11), p); // 1000 m at 1 m/s = 1000 s, P=252 W -> 252 kJ
  const last = r.points[10];
  near(last.usedKJ, 252, 1e-6);
  near(last.remainingKJ, 748, 1e-6);
  near(last.returnCostKJ, 252, 1e-6);
  near(r.bufferKJ, 200);
  assert.equal(r.turnBackIndex, -1); // 748 - 252 = 496 > 200
});

test('turn-back index: last point where remaining - return >= buffer', () => {
  // each 100 m step = 25.2 kJ. margin(i) = 1000 - 2*25.2*i - 200 < 0 -> i > 15.87, so 15 is the last safe point
  const p = { ...base, capacityKJ: 1000, bufferFrac: 0.2 };
  const r = computeReserve(flat(30), p);
  assert.equal(r.turnBackIndex, 15); assert.equal(r.turnBack.kind, 'walk');
  assert.ok(!r.points[15].mustTurnBack && r.points[16].mustTurnBack);
});

test('return cost is direction dependent (climb out costs more to come back down? check asymmetry)', () => {
  const route = [
    { dist_m: 0, elev_m: 0 },
    { dist_m: 100, elev_m: 15 },
    { dist_m: 200, elev_m: 30 },
  ];
  const r = computeReserve(route, base);
  // going up costs more than coming down at 15 % grade
  assert.ok(r.points[2].usedKJ > r.points[2].returnCostKJ);
  const rev = computeReserve(route.map((q, i) => ({ dist_m: q.dist_m, elev_m: 30 - q.elev_m })), base);
  // mirrored route: forward cost equals original return cost
  near(rev.points[2].usedKJ, r.points[2].returnCostKJ, 1e-9);
});

test('terrain factor raises cost, unknown terrain falls back to regolith', () => {
  assert.ok(metabolicRateW(0, 'sand', base) > metabolicRateW(0, 'hardpan', base));
  near(metabolicRateW(0, 'nope', base), metabolicRateW(0, 'regolith', base));
});

test('empty and single-point routes do not throw', () => {
  assert.equal(computeReserve([]).turnBackIndex, -1);
  assert.equal(computeReserve([{ dist_m: 0, elev_m: 0 }]).points.length, 1);
});

test('station time: energy at stationRateW, clock and fraction, turn-back emerges', () => {
  const pts = [0, 100, 200].map((d) => ({ dist_m: d, elev_m: 0 }));
  const flat = computeReserve(pts, { stationRateW: 360 });
  pts[1].stationS = 3600; // 1 h at 360 W = 1296 kJ
  const r = computeReserve(pts, { stationRateW: 360 });
  near(r.points[1].stationKJ, 1296);
  near(r.points[1].usedKJ - flat.points[1].usedKJ, 1296);
  near(r.points[2].usedKJ - flat.points[2].usedKJ, 1296, 1e-6); // carried to later points
  near(r.points[1].elapsed_s - flat.points[1].elapsed_s, 3600);
  near(r.points[0].elapsed_s, 0);
  near(r.points[1].remainingFraction, r.points[1].remainingKJ / r.capacityKJ);
  // return cost ignores stations
  near(r.points[2].returnCostKJ, flat.points[2].returnCostKJ);
  assert.equal(flat.turnBackIndex, -1);
  pts[1].stationS = 7 * 3600; // 7 h of work: cannot also walk home with the 20 % buffer
  assert.equal(computeReserve(pts, { stationRateW: 360 }).turnBackIndex, 1);
});

test('true return cost: a supplied returnKJ replaces the reversed outbound path', () => {
  const p = { ...base, capacityKJ: 1000, bufferFrac: 0.2 };
  const pts = flat(11); pts.forEach((q) => { q.returnKJ = 10; });
  const r = computeReserve(pts, p);
  near(r.points[10].returnCostKJ, 10); // reversed path would be 252
  assert.equal(computeReserve(flat(30).map((q) => ({ ...q, returnKJ: 10 })), p).turnBackIndex, -1);
});

test('turn-back at a station: work time left and the clock to leave', () => {
  // capacity 1000 kJ, buffer 200. Walk 100 m (25.2 kJ), station at 360 W for 4 h would need 5184 kJ.
  const pts = [0, 100].map((d) => ({ dist_m: d, elev_m: 0, terrain: 'hardpan' }));
  pts[1].stationS = 4 * 3600; pts[1].returnKJ = 25.2;
  const r = computeReserve(pts, { ...base, capacityKJ: 1000, bufferFrac: 0.2, stationRateW: 360 });
  assert.equal(r.turnBack.kind, 'station'); assert.equal(r.turnBackIndex, 1);
  // arrival remaining = 1000 - 25.2; margin = 974.8 - 25.2 - 200 = 749.6 kJ -> 749.6/0.36 s of work
  near(r.turnBack.workS, 749.6 / 0.36, 1e-6);
  near(r.turnBack.leaveElapsed_s, 100 + r.turnBack.workS, 1e-6); // arrival at 100 s (1 m/s)
});

test('slope-dependent speed: climbing takes longer than level, same model as the planner', () => {
  const up = [{ dist_m: 0, elev_m: 0 }, { dist_m: 100, elev_m: 15 }];
  const lvl = [{ dist_m: 0, elev_m: 0 }, { dist_m: 100, elev_m: 0 }];
  const a = computeReserve(up, base).points[1], b = computeReserve(lvl, base).points[1];
  assert.ok(a.usedKJ > b.usedKJ);
});
