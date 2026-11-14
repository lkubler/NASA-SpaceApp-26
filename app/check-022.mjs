// Task 022 headless check: node check-022.mjs   (needs `vite preview --port 4322`)
import puppeteer from 'puppeteer-core';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 100000);
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
const p = await b.newPage();
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PE ' + e.message));
p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()));
await p.setViewport({ width: 1280, height: 720 });
await p.goto('http://localhost:4322/#/map'); await sl(1500);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'MAP')?.click());
await p.waitForFunction('window.__map && window.__map.route()', { timeout: 60000 }); await sl(2500);
console.log('SUMMARY', JSON.stringify(await p.evaluate(() => {
  const r = window.__map.route(), pn = document.getElementById('map-panel');
  return { distKm: r.total.dist_m / 1000, feasible: r.total.feasible, legs: r.legs.map((l) => Math.round(l.dist_m)), stationsHomeMin: r.stations.map((s) => Math.round(s.homeMin)), turnBack: r.turnBack && { kind: r.turnBack.kind, idx: r.turnBack.index }, evaH: r.points.at(-1).elapsed_s / 3600, panelScrolls: pn.scrollHeight > pn.clientHeight + 1, text: pn.querySelector('.mp-res')?.textContent, shadows: r.shadows.length, viewshedMs: window.__map.stats.viewshedMs };
})));
await p.screenshot({ path: '../research/planner-022-regional.png' });
// zoom into the 1 km area (wheel) around the walk square for the detail view
const c = await p.evaluate(() => window.__map.walkScreen());
console.log('WALKSCREEN', JSON.stringify(c));
if (c) {
  await p.mouse.move(c[0], c[1]);
  for (let i = 0; i < 9; i++) { await p.mouse.wheel({ deltaY: -250 }); await sl(60); }
  await sl(700);
}
await p.screenshot({ path: '../research/planner-022-detail.png' });
// relay demo
await p.evaluate(() => window.__map.moveRelay()); await sl(1500);
console.log('RELAY', await p.evaluate(() => document.querySelector('.mp-assume')?.textContent));
// Walk view
await p.evaluate(() => { location.hash = '#/walk'; });
await sl(6000);
await p.screenshot({ path: '../research/planner-022-walk.png' });
console.log('WALKROUTE', JSON.stringify(await p.evaluate(() => { const s = window.__state.get(); const a = window.__app, r = a && a.route3d && a.route3d.built; return { pts: s.route.points.length, first: s.route.points[0].x, inside: r && r.S.filter((q) => q.in).length, samples: r && r.S.length }; })));
console.log('ERRORS', JSON.stringify(errs));
process.exit(0);
