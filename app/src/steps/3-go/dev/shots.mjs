// TEST SCRIPT (not bundled): walks step 3 as a visitor in headless Chromium and writes screenshots.
// Usage: PW=/path/to/node_modules/playwright/index.mjs node shots.mjs http://localhost:5173/ ../../../../../reviews/3-go
// Playwright is not an app dependency; point PW at any local install.
const { chromium } = await import(process.env.PW || 'playwright');
const base = process.argv[2] || 'http://localhost:5173/';
const out = process.argv[3] || 'reviews/3-go';
import { mkdirSync } from 'node:fs';
mkdirSync(out, { recursive: true });

const errors = [];
const browser = await chromium.launch();
const log = (...a) => console.log(...a);

async function open(size, url) {
  const page = await browser.newPage({ viewport: size });
  page.on('console', (m) => { if (m.type() === 'error') errors.push(`${size.width}: ${m.text()}`); });
  page.on('pageerror', (e) => errors.push(`${size.width}: ${e.message}`));
  await page.goto(base + url);
  await page.waitForSelector('.step--go .go__rulechecks', { timeout: 30000 });
  await page.waitForTimeout(600);
  return page;
}

for (const size of [{ width: 1280, height: 720 }, { width: 1920, height: 1080 }]) {
  const tag = `${size.width}x${size.height}`;
  for (const spot of ['F3', 'F7']) {
    const page = await open(size, `?step=3&spot=${spot}`);
    await page.screenshot({ path: `${out}/ready-${spot}-${tag}.png` });
    log(tag, spot, 'headline:', await page.textContent('.headline'), '| button:', await page.textContent('.pill'));
    const overflow = await page.evaluate(() => {
      const r = document.querySelector('.go__bottom').getBoundingClientRect();
      return { bottom: Math.round(r.bottom), vh: innerHeight, scroll: document.documentElement.scrollHeight > innerHeight };
    });
    log(tag, spot, 'layout', JSON.stringify(overflow));
    // click each check
    const ids = ['slope', 'distance', 'wayHome', 'excursion', 'radio'];
    const btns = await page.$$('button.gocheck');
    for (let k = 0; k < btns.length; k++) {
      await (await btns[k].$('.gocheck__name')).click();
      await page.waitForTimeout(150);
      const callout = await page.textContent('.goprof__callout');
      const ring = await page.$$eval('.go-map__ring', (r) => r.length);
      log(tag, spot, 'check', k, 'callout:', callout, 'ring:', ring);
      if (spot === 'F7' || k === 0) await page.screenshot({ path: `${out}/check-${spot}-${k}-${tag}.png` });
    }
    void ids;
    // label popover
    if (spot === 'F3') {
      await page.click('.go__suit .vlabel');
      await page.waitForTimeout(150);
      await page.screenshot({ path: `${out}/label-suit-${tag}.png` });
      await page.keyboard.press('Escape');
      // edit route -> step 2
      await page.click('text=Edit route');
      await page.waitForTimeout(500);
      log(tag, 'after Edit route, step =', await page.evaluate(() => window.__state.step));
      await page.screenshot({ path: `${out}/edit-route-${tag}.png` });
    } else {
      // start -> step 4
      await page.click('.pill');
      await page.waitForTimeout(800);
      log(tag, 'after Start, step =', await page.evaluate(() => window.__state.step));
      await page.screenshot({ path: `${out}/start-${tag}.png` });
    }
    await page.close();
  }

  // broken-rule path: test fixture (dev/broken.js) put into the shared state, then back to step 2 and forward to 3
  const page = await open(size, '?step=3&spot=F3');
  await page.click('.stepbar__item:nth-of-type(2)');
  await page.waitForTimeout(500);
  await page.evaluate(async () => {
    const { brokenFixture } = await import('/src/steps/3-go/dev/broken.js');
    const { getTerrain } = await import('/src/core/terrain.js');
    const { setState } = await import('/src/frame/state.js');
    setState(brokenFixture(await getTerrain()));
  });
  await page.waitForTimeout(200);
  await page.click('.stepbar__item:nth-of-type(3)');
  await page.waitForSelector('.step--go .go__rulechecks');
  await page.waitForTimeout(600);
  log(tag, 'broken headline:', await page.textContent('.headline'), '| button:', await page.textContent('.pill'),
    '| red checks:', await page.$$eval('.gocheck--broken', (e) => e.map((x) => x.textContent)));
  await page.screenshot({ path: `${out}/broken-${tag}.png` });
  await page.click('.gocheck--broken .gocheck__name');
  await page.waitForTimeout(150);
  await page.screenshot({ path: `${out}/broken-check-${tag}.png` });
  await page.click('.pill');
  await page.waitForTimeout(800);
  log(tag, 'broken start, step =', await page.evaluate(() => window.__state.step), 'brokenRules carried:',
    await page.evaluate(() => JSON.stringify(window.__state.plan.brokenRules.map((r) => r.id))));
  await page.screenshot({ path: `${out}/broken-start-${tag}.png` });
  await page.close();
}

log('console errors:', errors.length ? errors : 'none');
await browser.close();
