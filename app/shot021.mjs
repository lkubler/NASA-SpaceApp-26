// Task 021 screenshots (needs `vite preview --port 4231`): node shot021.mjs
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage(); await p.setViewport({ width: 1280, height: 720 });
const errs = []; p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', (e) => errs.push('PE ' + e.message));
const sl = (ms) => new Promise((r) => setTimeout(r, ms));
const info = () => p.evaluate(() => ({ hud: [...document.querySelectorAll('.hud-cell')].slice(0, 5).map((c) => c.innerText.replace(/\n/g, ' ')).join(' | '), sky: window.__app?.sky.st.hour.toFixed(2), msg: document.getElementById('msg').style.display, toast: document.querySelector('.walk-toast:not([hidden])')?.textContent }));
await p.goto('http://localhost:4231/#/briefing'); await sl(3000);
await p.evaluate(() => { location.hash = '#/map'; }); await sl(2500);
await p.evaluate(() => { location.hash = '#/walk'; });
await p.waitForFunction(() => document.querySelector('.walk-guide') && document.querySelector('.walk-guide').style.display !== 'none', { timeout: 60000 }).catch(() => console.log('no guide btn'));
await sl(1000);
await p.evaluate(() => document.querySelector('.walk-guide')?.click());
await sl(2500); await p.screenshot({ path: '../docs/ui-021-1-start.png' }); console.log('start', await info());
await p.evaluate(() => { window.__mx = 0; setInterval(() => { window.__mx = Math.max(window.__mx, +getComputedStyle(document.querySelector('.walk-flash')).opacity); }, 50); }); await p.evaluate(() => { const r = window.__app.route3d; r.seek(r.tbFrac() - 0.01); }); await sl(300);
let n = 1, sawTb = false;
for (let t = 0; t < 80 && n < 3; t++) {
  await sl(500); const i = await info();
  if (false) {}
  if (!sawTb && /TURN-BACK/.test(i.toast || '')) { sawTb = true; await sl(400); await p.evaluate(() => document.querySelector('.walk-flash').getAnimations().forEach((a) => { a.pause(); a.currentTime = 300; })); console.log('anims', await p.evaluate(() => { const f = document.querySelector('.walk-flash'); return document.getAnimations().map((a) => a.animationName + a.playState + a.currentTime).join(',') + ' ' + getComputedStyle(f).animationName + ' ' + getComputedStyle(f).display; })); console.log('flashmax', await p.evaluate(() => window.__mx)); console.log('flashop', await p.evaluate(() => { const f = document.querySelector('.walk-flash'); return f.className + ' ' + getComputedStyle(f).opacity; })); await p.screenshot({ path: '../docs/ui-021-2-turnback.png' }); console.log('tb', await info()); n++; }
  if (sawTb && n === 2) { await sl(5000); await p.screenshot({ path: '../docs/ui-021-3-after.png' }); console.log('after', await info()); n++; }
}
console.log('sawTb', sawTb, 'ERRORS', errs);
await b.close(); process.exit(0);
