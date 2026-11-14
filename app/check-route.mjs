// Headless check of the planned route in 3D: node check-route.mjs <base-url> <png> <shadow-png>  (needs `vite preview`)
import puppeteer from 'puppeteer-core';
const base = process.argv[2] || 'http://localhost:4207/';
const out = process.argv[3] || 'walk-route.png', out2 = process.argv[4] || 'walk-route-shadow.png';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 170000);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 720 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
await p.goto(base + '#/map');
await p.waitForFunction('window.__map && window.__app', { timeout: 120000 });
await new Promise((r) => setTimeout(r, 3000));
const plan = await p.evaluate(async () => {
  const m = window.__map, S = (x, z) => m.local(x, z);
  const a = S(-45, -40), w1 = S(10, -20), w2 = S(40, 40), w3 = S(80, 60);
  m.setRover(a); m.setWaypoints([w1, w2, w3]); m.setBudget(3);
  await new Promise((r) => setTimeout(r, 2500));
  const r = m.route(); return { pts: r.points.length, tb: r.turnBackIndex, shadows: r.shadows, legs: r.legs.map((l) => l.feasible) };
});
console.log('plan', JSON.stringify(plan));
// planner on this route yields no shadow / turn-back: inject them (same shapes as the planner) to exercise the 3D side
await p.evaluate(() => { const st = window.__state, r = st.get().route, P = r.points, n = P.length;
  const tf = { ...r, turnBackIndex: Math.floor(n * 0.35), shadows: [{ start: P[Math.floor(n * 0.5)].time_s, end: P[Math.floor(n * 0.8)].time_s, duration_s: 1, exceedsLimit: false }] };
  st.set({ route: tf }); });
await p.evaluate(() => { location.hash = '#/walk'; });
await new Promise((r) => setTimeout(r, 3000));
const info = await p.evaluate(() => { const a = window.__app, r = a.route3d.built; return { built: !!r, first: r && r.first, samples: r && r.S.length, pos: [a.state.pos.x, a.state.pos.z], yaw: a.state.yaw }; });
console.log('spawn', JSON.stringify(info));
await p.screenshot({ path: out });
const g = await p.evaluate(async () => {
  const a = window.__app; a.route3d.setGuided(true); const log = [];
  for (let k = 0; k < 8; k++) {
    await new Promise((r) => setTimeout(r, 1000)); const st = window.__state.get(), t = document.querySelector('.walk-toast');
    log.push([+a.state.pos.x.toFixed(1), +a.state.pos.z.toFixed(1), st.reserve && +st.reserve.fraction.toFixed(2), st.comms && st.comms.status, t.hidden ? '' : t.textContent]);
    if (!a.route3d.guided) break;
  }
  return log;
});
console.log('guided', JSON.stringify(g));
const sh = await p.evaluate(() => {
  const a = window.__app, R = a.route3d.built, k = R.S.findIndex((s) => s.sh && s.in); if (k < 0) return null;
  const s = R.S[k], n = R.S[Math.max(0, k - 8)]; a.route3d.setGuided(false);
  a.tp(n.x, n.z, Math.atan2(-(s.x - n.x), -(s.z - n.z)), -0.15); return { x: s.x, z: s.z };
});
console.log('shadow', JSON.stringify(sh));
await new Promise((r) => setTimeout(r, 1500));
if (sh) await p.screenshot({ path: out2 });
console.log('ERRORS', JSON.stringify(errs));
await b.close();
