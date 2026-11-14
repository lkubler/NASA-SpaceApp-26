// Headless Map check for task 012: node check-planner.mjs <png> [url]   (needs `vite preview` on :4191)
import puppeteer from 'puppeteer-core';
const out = process.argv[2] || 'planner-012.png';
const url = process.argv[3] || 'http://localhost:4191/#/map';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 120000);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 850 });
const errs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); });
p.on('pageerror', (e) => errs.push(e.message));
await p.goto(url); await new Promise((r) => setTimeout(r, 1500)); await p.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.trim() === 'MAP')?.click()); await p.waitForFunction('window.__map', { timeout: 60000 }); await new Promise((r) => setTimeout(r, 2500));
const r = await p.evaluate(() => {
  const m = window.__map.route();
  return { turnBack: m.turnBackIndex, turnStation: m.turnBackStation && m.turnBackStation.n, stations: m.stations.map((s) => [s.n, s.minutes, Math.round(s.arrive_s / 60), +s.remainingFraction.toFixed(2)]),
    shadows: m.shadows.map((s) => [s.startIdx, s.endIdx, Math.round(s.duration_s / 60)]), points: m.points.length, dist: Math.round(m.total.dist_m),
    legsOk: m.legs.map((l) => l.feasible), endFraction: m.points.at(-1).remainingFraction, hours: m.points.at(-1).elapsed_s / 3600, hiddenPts: m.points.filter((q) => q.inShadow).length,
    state: { reserve: window.__state.get().reserve, comms: window.__state.get().comms } };
});
console.log(JSON.stringify(r));
await p.screenshot({ path: out });
console.log('ERRORS', JSON.stringify(errs));
process.exit(0);
