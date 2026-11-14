// Task 020 screenshots (needs `vite preview --port 4230`): node shot020.mjs
import puppeteer from 'puppeteer-core';
const W = 1280, Hh = 720;
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: W, height: Hh });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PE ' + e.message));
p.on('requestfailed', (r) => errs.push('REQFAIL ' + r.url()));
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const shot = (n) => p.screenshot({ path: `../docs/ui-020-${n}.png` });
await p.goto('http://localhost:4230/#/briefing'); await sl(700); await shot('cold-0.7s'); await sl(500); await shot('cold-1.5s'); await sl(3500);
const dis = await p.evaluate(() => document.querySelector('.brief-go')?.disabled); console.log('plan disabled at 5s', dis);
await shot('briefing');
await p.evaluate(() => { location.hash = '#/map'; }); await sl(3000); await shot('map');
await p.evaluate(() => { location.hash = '#/walk'; });
await p.waitForFunction(() => document.querySelector('.walk-guide') && document.querySelector('.walk-guide').style.display !== 'none', { timeout: 60000 }).catch(() => console.log('no guide btn'));
await sl(1500); await shot('walk-hint');
await p.evaluate(() => document.querySelector('.walk-guide')?.click());
for (let k = 1; k <= 3; k++) { await sl(k === 1 ? 2500 : 7000); await shot('guided-' + k); console.log('hud', await p.evaluate(() => [...document.querySelectorAll('.hud-cell')].map((c) => c.innerText.replace(/\n/g, ' ')).join(' | '))); }
await p.evaluate(() => document.querySelector('.walk-guide')?.click());
await shot('walk-clear');
await p.evaluate(() => document.querySelector('.sky-chip')?.click()); await sl(500); await shot('sky-open');
await p.evaluate(() => [...document.querySelectorAll('.sky-opt')].at(-1)?.click()); await sl(500); await shot('storm-0.5s');
await sl(2000); await shot('storm-3s');
console.log('ERRORS', errs);
await b.close(); process.exit(0);
