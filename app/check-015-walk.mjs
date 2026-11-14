// Task 015 walk check: node check-015-walk.mjs  (needs `vite preview --port 4315`)
import puppeteer from 'puppeteer-core';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 100000);
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
p.on('pageerror', (e) => errs.push('PE ' + e.message));
await p.goto('http://localhost:4315/#/map'); await sl(1500);
await p.waitForFunction('window.__map && window.__map.route() && window.__app', { timeout: 80000 }); await sl(2000);
await p.evaluate(() => { location.hash = '#/walk'; }); await sl(5000);
const info = await p.evaluate(() => { const R = window.__app.route3d && window.__app.route3d.built; return R ? { first: R.first, tb: R.tb, samples: R.S.length, inSq: R.S.filter((s) => s.in).length, shIn: R.S.filter((s) => s.in && s.sh).length, speed: window.__app.state.speed } : null; });
console.log('WALK', JSON.stringify(info));
// look toward the turn-back marker: turn to face it
await p.evaluate(() => { const a = window.__app, R = a.route3d.built; if (R && R.tb > 0) { const t = R.sc[R.tb], s = a.state.pos; a.state.yaw = Math.atan2(-(t.x - s.x), -(t.z - s.z)); a.state.pitch = -0.1; } });
await sl(1500);
await p.screenshot({ path: '../research/walk-015.png' });
console.log('ERRORS', JSON.stringify(errs));
process.exit(0);
