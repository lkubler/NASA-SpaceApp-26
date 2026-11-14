// Headless screenshots for task 010 (needs `vite preview --port 4191`): node shot010.mjs
import puppeteer from 'puppeteer-core';
const D = '../docs/';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PE ' + e.message));
await p.goto('http://localhost:4191/');
await new Promise((r) => setTimeout(r, 2600));
await p.screenshot({ path: D + 'ui-010-coldopen.png' });
await p.waitForFunction(() => window.__app, { timeout: 120000 }).catch(() => {});
await new Promise((r) => setTimeout(r, 3500));
await p.screenshot({ path: D + 'ui-010-briefing.png' });
await p.evaluate(() => { location.hash = '#/sources'; }); await new Promise((r) => setTimeout(r, 1200));
await p.screenshot({ path: D + 'ui-010-sources.png' });
await p.evaluate(() => { location.hash = '#/map'; }); await new Promise((r) => setTimeout(r, 800));
console.log(await p.evaluate(() => document.body.dataset.view), 'ERRORS', errs);
await b.close(); process.exit(0);
