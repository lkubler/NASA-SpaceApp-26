// Task 018/019 headless check: node check-018.mjs   (needs `vite preview --port 4318`)
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
await p.goto('http://localhost:4318/#/map'); await sl(1500);
await p.evaluate(() => [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'MAP')?.click());
await p.waitForFunction('window.__map && window.__map.route()', { timeout: 60000 }); await sl(2500);
const fit = () => p.evaluate(() => {
  const pn = document.getElementById('map-panel'), r = (s) => { const e = pn.querySelector(s); if (!e) return null; const b = e.getBoundingClientRect(); return Math.round(b.bottom); };
  return { panelH: pn.scrollHeight, clientH: pn.clientHeight, scrolls: pn.scrollHeight > pn.clientHeight + 1, clockBottom: r('#mp-clock'), capBottom: r('#mp-cap'), tilesBottom: r('.mp-tiles'), verdictBottom: r('.mp-res'), btnsBottom: r('.mp-btns'), keyTop: Math.round(document.querySelector('.map-key').getBoundingClientRect().top), text: pn.querySelector('.mp-res')?.textContent, tile: [...pn.querySelectorAll('.tile')].map((t) => t.textContent.replace(/\s+/g, ' ') + ' ' + (t.dataset.state || '')) };
});
console.log('FIT 1280x720', JSON.stringify(await fit(), null, 1));
await p.screenshot({ path: '../research/planner-018.png' });
// open validation fold
await p.evaluate(() => { document.getElementById('mp-f-val').open = true; });
console.log('VAL', await p.evaluate(() => document.getElementById('mp-f-val').innerText));
// station card via API: click the Quela ring
const pt = await p.evaluate(() => { const m = window.__map; return m.stationScreen && m.stationScreen('quela'); });
console.log('QUELA px', JSON.stringify(pt));
if (pt) { await p.mouse.click(pt[0], pt[1]); await sl(800); }
console.log('CARD', await p.evaluate(() => { const c = document.querySelector('.poi-card'); return c.hidden ? 'hidden' : c.innerText.replace(/\n+/g, ' | '); }));
await p.evaluate(() => { document.getElementById('mp-f-val').open = false; });
await sl(300);
await p.screenshot({ path: '../docs/ui-018-station-card.png' });
await p.setViewport({ width: 1920, height: 1080 }); await sl(800);
await p.evaluate(() => document.querySelector('.poi-x').click());
await p.screenshot({ path: '../research/planner-018-1080.png' });
console.log('FIT 1920x1080', JSON.stringify({ ...(await fit()), text: undefined, tile: undefined }));
console.log('ERRORS', JSON.stringify(errs));
process.exit(0);
