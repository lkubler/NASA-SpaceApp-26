// Headless Map check: node check-map.mjs <url> <png> [budgetPct]   (needs `vite preview` running)
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:4191/#/map';
const out = process.argv[3] || 'planner.png';
const budget = +(process.argv[4] || 3);
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 150000);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
await p.setViewport({ width: 1400, height: 850 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
await p.goto(url);
await p.waitForFunction('window.__map', { timeout: 60000 });
await new Promise((r) => setTimeout(r, 2500));
const res = await p.evaluate(async (budget) => {
  const m = window.__map, l = m.layer;
  const O = m.local(0, 0), Q = l.tf.lonLatToLocal(137.353006, -4.695202);
  m.setRover({ x: O.x, y: O.y });
  m.setWaypoints([{ x: O.x - 60, y: O.y + 50 }, { x: Q.x, y: Q.y }, { x: Q.x - 30, y: Q.y - 90 }]);
  m.setBudget(budget);
  await new Promise((r) => setTimeout(r, 1500));
  const r = m.route();
  return { stats: m.stats, legs: r.legs.map((x) => ({ f: x.feasible, d: Math.round(x.dist_m || 0), s: +(x.maxSlope_deg || 0).toFixed(1), why: x.reason })),
    total: r.total, turn: r.turnBackIndex, shadows: r.shadows, state: window.__state.get().comms, reserve: window.__state.get().reserve };
}, budget);
console.log(JSON.stringify(res, null, 1));
await p.screenshot({ path: out });
console.log('ERRORS', JSON.stringify(errs));
await b.close();
