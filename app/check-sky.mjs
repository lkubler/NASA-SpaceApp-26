// Headless check for task 008: node check-sky.mjs <url> <outdir>   (needs `vite preview` running)
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:4190/#/walk';
const out = process.argv[3] || '../docs';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 170000);
const b = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--no-sandbox', '--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage();
await p.setViewport({ width: 1280, height: 720 });
const errs = [];
p.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ': ' + m.text()); });
p.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
p.on('requestfailed', (r) => errs.push('reqfail: ' + r.url()));
await p.goto(url);
await p.waitForFunction('window.__app', { timeout: 120000 });
await new Promise((r) => setTimeout(r, 4000));
const shots = [['noon', 12, 0, 0.1, 'look-away'], ['sunset', 17.7, 0, 0.12, 'sun'], ['storm', 11, 3, 0.05, 'look-away']];
for (const [name, hour, dust, pitch, look] of shots) {
  const info = await p.evaluate((hour, dust, pitch, look) => {
    document.getElementById('msg').style.display = 'none'; const a = window.__app; a.sky.setDust(dust); a.sky.setHour(hour);
    const s = a.sky.st.sun; const az = look === 'sun' ? s.azimuth : (s.azimuth + 150) % 360;
    a.tp(-6, 8, -az * Math.PI / 180, pitch);
    return { el: s.elevation, az: s.azimuth, Ls: s.Ls, ltst: s.ltst, vis: s.vis, direct: s.direct };
  }, hour, dust, pitch, look);
  await new Promise((r) => setTimeout(r, 1500));
  await p.screenshot({ path: `${out}/ui-008-${name}.png` });
  console.log(name, JSON.stringify(info));
}
console.log('ERRORS', errs);
await b.close(); process.exit(0);
