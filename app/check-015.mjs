// Task 015 headless check: node check-015.mjs   (needs `vite preview --port 4315`)
import puppeteer from 'puppeteer-core';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 100000);
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage(); await p.setViewport({ width: 1400, height: 850 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PE ' + e.message));
await p.goto('http://localhost:4315/#/map'); await sl(1500);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'MAP')?.click());
await p.waitForFunction('window.__map && window.__map.route()', { timeout: 60000 }); await sl(2500);
const summary = () => p.evaluate(() => {
  const m = window.__map.route(), tb = m.turnBack;
  return { dist: Math.round(m.total.dist_m), hours: +(m.points.at(-1).elapsed_s / 3600).toFixed(2), endFrac: +m.points.at(-1).remainingFraction.toFixed(3),
    turnBack: tb && { kind: tb.kind, idx: tb.index, workMin: Math.round(tb.workS / 60), clockH: +tb.clockH.toFixed(2) },
    stations: m.stations.map((s) => [s.n, s.minutes, Math.round(s.homeMin), Math.round(s.homePct)]),
    shadows: m.shadows.map((s) => [s.startIdx, s.endIdx, Math.round(s.duration_s / 60), s.exceedsLimit]), night: m.night };
});
console.log('BEFORE', JSON.stringify(await summary()));
await p.screenshot({ path: '../research/planner-015-before.png' });
const t0 = Date.now();
await p.evaluate(() => window.__map.moveRelay()); await sl(1500);
console.log('FIX ms', Date.now() - t0, 'AFTER', JSON.stringify(await summary()));
await p.screenshot({ path: '../research/planner-015.png' });
await p.evaluate(() => window.__map.setClock(12)); await sl(500);
console.log('LATE START night', JSON.stringify((await summary()).night));
await p.evaluate(() => window.__map.setClock(8.5));
console.log('ERRORS', JSON.stringify(errs));
process.exit(0);
