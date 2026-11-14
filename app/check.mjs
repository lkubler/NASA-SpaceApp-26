// Headless check: node check.mjs <url> <screenshot.png>   (needs `vite preview` running)
import puppeteer from 'puppeteer-core';
const url = process.argv[2] || 'http://localhost:4190/#/walk';
const out = process.argv[3] || 'shot.png';
setTimeout(() => { console.log('HARD TIMEOUT'); process.exit(1); }, 150000);
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
await new Promise((r) => setTimeout(r, 4000)); // textures
const r = await p.evaluate(() => {
  const s = window.__app;
  return { stats: s.stats, gridVsRay: s.gridVsRay(), simple: s.simpleVsTiles(), slope: s.slopeStats(),
    hmin: Math.min(...s.H), hmax: Math.max(...s.H) };
});
console.log(JSON.stringify(r, null, 1));
// find a steep spot and look at it; also walk test
const steep = await p.evaluate(() => { const s = window.__app; let best = null;
  for (let j = 20; j < 236; j += 4) for (let i = 20; i < 236; i += 4) { const x = -64 + (i + .5) * .5, z = -64 + (j + .5) * .5; const [gx, gz] = s.gradient(x, z); const d = Math.hypot(gx, gz); if (!best || d > best.d) best = { x, z, d, gx, gz }; } return best; });
console.log('steepest', steep);
await p.evaluate(() => window.__app.tp(0, 0, 0.6, -0.05));
await new Promise((r) => setTimeout(r, 1500));
await p.screenshot({ path: out });
// walk speed test: uphill vs downhill from a slope
const walk = await p.evaluate(async () => {
  const s = window.__app; const res = [];
  for (const yaw of [0, Math.PI / 2, Math.PI, -Math.PI / 2]) {
    s.tp(-10, -10, yaw); s.key('KeyW', true);
    await new Promise((r) => setTimeout(r, 1500)); s.key('KeyW', false);
    res.push({ yaw, speed: s.state.speed, mult: s.state.mult, slope: s.state.slope, pos: [s.state.pos.x, s.state.pos.z] });
  }
  return res;
});
console.log(JSON.stringify(walk));
console.log('fps', await p.evaluate(() => window.__app.fps()), 'maxDiff walk', await p.evaluate(() => window.__app.maxDiff()));
console.log('ERRORS', errs);
await b.close(); process.exit(0);
