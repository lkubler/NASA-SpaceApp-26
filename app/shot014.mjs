// Task 014 screenshots (needs `vite preview --port 4194`): node shot014.mjs <prefix> [w h]
import puppeteer from 'puppeteer-core';
const [pre = 'before', W = 1400, Hh = 850] = process.argv.slice(2);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: +W, height: +Hh });
const errs = []; p.on('console', (m) => { if (['error'].includes(m.type())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PE ' + e.message));
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
await p.goto('http://localhost:4194/#/map'); await sl(2000);
await p.waitForFunction(() => window.__app, { timeout: 180000 }).catch(() => {}); await sl(6000);
await p.evaluate(() => { location.hash = '#/map'; }); await sl(3000);
await p.screenshot({ path: `../docs/ui-014-${pre}-map-${W}.png` });
await p.evaluate(() => { location.hash = '#/walk'; }); await sl(5000);
await p.screenshot({ path: `../docs/ui-014-${pre}-walk-${W}.png` });
console.log('ERRORS', errs);
await b.close(); process.exit(0);
