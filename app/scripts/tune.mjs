// Demo time factor tuning (specs/rules.md "Tuning"). Prints plan numbers per candidate and a detour test.
// Run: npm run tune
import { nodeTerrain } from '../test/load.js';
import { DEMO, CANDIDATES, planAllCandidates, planRoute, planNumbers, findRoute, stepCost, fullLevels, consume, workRate, reserveFrom, timeLeft, fractions } from '../src/core/index.js';

const t = nodeTerrain();
const factor = Number(process.argv[2]) || DEMO.timeFactor.value;
DEMO.timeFactor.value = factor;
const hm = (s) => `${s < 0 ? '-' : ''}${Math.floor(Math.abs(s) / 3600)} h ${String(Math.round((Math.abs(s) % 3600) / 60)).padStart(2, '0')}`;
console.log('demo factor', factor);
console.log('id   path_out  round  time     reserve  limiting     used%  steepest  shadow   dose');
for (const { candidate: c, plan: p } of planAllCandidates(t)) {
  const used = 1 - Math.min(...Object.values(fractions(p.levelsAtHome)).map((f) => f));
  console.log(`${c.id.padEnd(4)} ${p.outM.toFixed(1).padStart(7)}  ${p.distanceM.toFixed(1).padStart(6)}  ${hm(p.timeS).padStart(7)}  ${hm(p.reserveS).padStart(7)}  ${p.limitingName.padEnd(12)} ${(100 * used).toFixed(0).padStart(4)}  ${p.steepestDeg.toFixed(1).padStart(6)}°  ${hm(p.radioShadowS).padStart(7)}  ${p.radiationMSv.toFixed(3)}  ${p.brokenRules.map((b) => b.id).join(',')}`);
}
// Detour test: to the farthest candidate via a detour point, then check the reserve on the way.
const far = CANDIDATES.reduce((a, b) => (b.pathM > a.pathM ? b : a));
for (const via of [{ x: 30, z: -20 }, { x: -30, z: 20 }, { x: 40, z: 30 }]) {
  const a = findRoute(t, { x: 0, z: 0 }, via), b = findRoute(t, via, far);
  let lv = fullLevels(), minR = Infinity, turned = null, m = 0;
  const cells = [...a.cells, ...b.cells.slice(1)];
  for (let k = 1; k < cells.length; k++) {
    const st = stepCost(t, cells[k - 1], cells[k]);
    lv = consume(lv, workRate(st.slopeDeg), st.seconds); m += st.m;
    const p = t.pointOf(cells[k]);
    const r = reserveFrom(t, lv, { x: p.x, z: p.z, phase: 'out', spot: far });
    if (r.seconds < minR) minR = r.seconds;
    if (r.seconds <= 0 && !turned) turned = { m: m.toFixed(1), x: p.x, z: p.z };
  }
  console.log(`detour via (${via.x},${via.z}) to ${far.id}: path ${m.toFixed(1)} m, lowest reserve ${hm(minR)}, turn back needed: ${turned ? 'yes at ' + turned.m + ' m' : 'no'}`);
}
