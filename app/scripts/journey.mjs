// TEST SCRIPT (not bundled): drives the whole journey as a visitor, with NO dev jump, in headless
// Chromium, and writes a screenshot of every screen. Fails on any console error and on values that
// disagree between Plan, Go / no-go and Debrief.
//
//   npm run dev                                   # in app/, serves http://localhost:5173/
//   PW=/path/to/node_modules/playwright/index.mjs node scripts/journey.mjs [url] [run ...]
//
// Playwright is not an app dependency: install it anywhere (npm i playwright@1.46 && npx playwright
// install chromium) and point PW at its index.mjs (or have `playwright` resolvable).
// Runs: near-1280 (nearest spot F1), far-1280 (farthest spot F7), far-1920 (F7 at 1920 x 1080).
// Default: all three. Screenshots go to ../reviews/journey/<run>/.
import { mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PW || 'playwright');
const args = process.argv.slice(2);
const base = args.find((a) => /^https?:/.test(a)) || 'http://localhost:5173/';
const RUNS = {
  'near-1280': { spot: 'F1', w: 1280, h: 720, request: 0 },
  'far-1280': { spot: 'F7', w: 1280, h: 720, request: 0 },
  'far-1920': { spot: 'F7', w: 1920, h: 1080, request: 1 },
};
const chosen = args.filter((a) => RUNS[a]);
const runs = chosen.length ? chosen : Object.keys(RUNS);
const outRoot = fileURLToPath(new URL('../../reviews/journey/', import.meta.url));

const failures = [];
const fail = (run, msg) => { failures.push(`${run}: ${msg}`); console.log(`  FAIL ${msg}`); };
const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });

for (const run of runs) {
  const cfg = RUNS[run];
  const out = outRoot + run + '/';
  mkdirSync(out, { recursive: true });
  console.log(`run ${run}: spot ${cfg.spot}, ${cfg.w}x${cfg.h}`);
  const page = await browser.newPage({ viewport: { width: cfg.w, height: cfg.h } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(e.message));
  let shotN = 0;
  const shot = async (name) => {
    await page.waitForTimeout(350);
    const f = `${String(++shotN).padStart(2, '0')}-${name}.png`;
    await page.screenshot({ path: out + f });
    console.log(`  shot ${f}`);
  };
  const text = (sel) => page.locator(sel).first().innerText();
  const S = () => page.evaluate(() => JSON.parse(JSON.stringify(window.__state, (k, v) => (ArrayBuffer.isView(v) ? undefined : v))));
  const step = async () => page.evaluate(() => window.__state.step);

  try {
    // ---------- 1 Mission ----------
    await page.goto(base);
    await page.waitForSelector('.m1-intro');
    await shot('opening');
    await page.click('.m1-intro .pill');
    await page.waitForSelector('.m1-pin--murray .m1-pin__name');
    await page.waitForTimeout(500);
    await shot('crater');
    await page.click('.m1-pin--murray .m1-pin__name');
    await page.waitForSelector('.m1-panel.is-open .m1-req');
    await shot('requests');
    await page.locator('.m1-req').nth(cfg.request).click();
    await shot('request-chosen');
    const req = (await S()).request;
    if (!req) fail(run, 'no request in state after choosing');
    await page.click('.m1-panel__action .pill');

    // ---------- 2 Plan ----------
    await page.waitForFunction(() => window.__state.step === 2 && window.__state.candidates.length > 0);
    await page.waitForSelector('.step--plan .plan-hit');
    await page.waitForTimeout(1500); // top-down terrain render
    await shot('plan-open');
    const cands = (await S()).candidates.map((c) => c.candidate.id);
    const k = cands.indexOf(cfg.spot);
    await page.locator('.step--plan .map-marker--number.plan-hit').nth(k).click({ force: true });
    await page.waitForFunction((id) => window.__state.spotId === id, cfg.spot);
    await shot(`plan-${cfg.spot}`);
    const planTxt = {
      total: await text('.plan-totals .bignum:nth-child(1) .bignum__value'),
      reserve: await text('.plan-totals .bignum:nth-child(2) .bignum__value'),
      steep: await text('.plan-totals .bignum:nth-child(3) .bignum__value'),
      dist: (await text('.plan-cards .card__right')).replace(/\s*model$/, ''),
    };
    console.log('  plan', JSON.stringify(planTxt));
    await page.click('.step--plan .split__action .pill');

    // ---------- 3 Go / no-go ----------
    await page.waitForSelector('.step--go .go__rulechecks');
    await page.waitForTimeout(400);
    await shot('go');
    const goTxt = {};
    for (const b of await page.locator('.go__nums .bignum').all()) {
      goTxt[(await b.locator('.bignum__label').innerText()).replace(/\s*(model|real|assumption|simulated)( · Moon)?$/, '').trim()] = await b.locator('.bignum__value').innerText();
    }
    console.log('  go', JSON.stringify(goTxt));
    if (goTxt.Distance !== planTxt.dist) fail(run, `distance Plan ${planTxt.dist} vs Go ${goTxt.Distance}`);
    if (goTxt.Duration !== planTxt.total) fail(run, `time Plan ${planTxt.total} vs Go ${goTxt.Duration}`);
    if (goTxt['Reserve on return'] !== planTxt.reserve) fail(run, `reserve Plan ${planTxt.reserve} vs Go ${goTxt['Reserve on return']}`);
    if (goTxt['Steepest slope'] !== planTxt.steep) fail(run, `slope Plan ${planTxt.steep} vs Go ${goTxt['Steepest slope']}`);
    await page.locator('button.gocheck').nth(2).locator('.gocheck__name').click();
    await shot('go-check-wayhome');
    // back to Plan and forward again: the choice must survive
    await page.click('.go__action .textlink');
    await page.waitForFunction(() => window.__state.step === 2);
    await page.waitForSelector('.step--plan .plan-totals .bignum__value');
    await page.waitForTimeout(300);
    if ((await S()).spotId !== cfg.spot) fail(run, 'spot lost after Edit route');
    await page.click('.step--plan .split__action .pill');
    await page.waitForSelector('.step--go .go__rulechecks');
    await page.click('.go__action .pill');

    // ---------- 4 Walk ----------
    await page.waitForFunction(() => window.__state.step === 4 && window.__walk);
    await page.waitForSelector('.walk-loading.is-off', { state: 'attached', timeout: 60000 });
    await page.waitForTimeout(1500);
    await shot('walk-start');
    const backOk = await page.evaluate(() => document.querySelector('.stepbar__item:nth-of-type(1)')?.disabled ?? true);
    if (!backOk) fail(run, 'back to Mission possible after the walk started');
    await page.evaluate(() => window.__walk.hold(true));
    const st = await S();
    const walkLeg = async (points, until, label, shots) => {
      let idx = 0, guard = 0, shotAt = new Set(shots);
      await page.keyboard.down('KeyW');
      for (;;) {
        const info = await page.evaluate(() => window.__walk.info());
        if (info[until] || info.ended) break;
        if (++guard > 4000) { fail(run, `${label}: did not arrive`); break; }
        // nearest route point ahead, then aim at the next one (a visitor keeping to the band)
        let best = idx, bd = Infinity;
        for (let i = idx; i < Math.min(points.length, idx + 40); i++) {
          const d = Math.hypot(points[i].x - info.x, points[i].z - info.z);
          if (d < bd) { bd = d; best = i; }
        }
        idx = best;
        const tgt = points[Math.min(points.length - 1, idx + 1)];
        const want = Math.atan2(tgt.x - info.x, tgt.z - info.z);
        let err = want - info.yaw;
        err = Math.atan2(Math.sin(err), Math.cos(err));
        const deg = (err * 180) / Math.PI;
        const turnS = Math.min(0.3, Math.abs(deg) / 80);
        if (Math.abs(deg) > 1) {
          const key = deg > 0 ? 'ArrowRight' : 'ArrowLeft';
          await page.keyboard.down(key);
          await page.evaluate((s) => window.__walk.advance(s), turnS);
          await page.keyboard.up(key);
        }
        await page.evaluate((s) => window.__walk.advance(s), 0.1);
        const frac = idx / points.length;
        for (const f of [...shotAt]) if (frac >= f) { shotAt.delete(f); await page.evaluate(() => window.__walk.advance(0.05, true)); await shot(`${label}-${Math.round(f * 100)}`); }
      }
      await page.keyboard.up('KeyW');
      await page.evaluate(() => window.__walk.advance(0.1, true));
    };
    await walkLeg(st.route.out.points, 'atTarget', 'walk-out', [0.3, 0.7]);
    await shot('walk-at-target');
    await page.keyboard.press('KeyE');
    await page.evaluate(() => window.__walk.advance(0.1, true));
    await shot('walk-sample');
    if (!(await S()).walk.sample) fail(run, 'sample not logged');
    await page.keyboard.press('KeyE');
    await page.evaluate(() => window.__walk.advance(0.1, true));
    await walkLeg(st.route.back.points, 'atRover', 'walk-back', [0.5]);
    await shot('walk-at-rover');
    await page.keyboard.press('KeyE');

    // ---------- 5 Debrief ----------
    await page.waitForFunction(() => window.__state.step === 5);
    await page.waitForSelector('.dbf__table');
    await page.waitForTimeout(500);
    await shot('debrief');
    const rows = await page.locator('.dbf__table tbody tr').evaluateAll((trs) => trs.map((tr) => [...tr.children].map((c) => c.innerText.replace(/\s*(model|real|assumption|simulated)( · Moon)?\s*$/, '').trim())));
    console.log('  debrief', JSON.stringify(rows));
    const row = (n) => rows.find((r) => r[0] === n) || [];
    if (row('Distance')[1] !== planTxt.dist) fail(run, `planned distance Plan ${planTxt.dist} vs Debrief ${row('Distance')[1]}`);
    if (row('Reserve on return')[1] !== planTxt.reserve) fail(run, `planned reserve Plan ${planTxt.reserve} vs Debrief ${row('Reserve on return')[1]}`);
    if (row('Time')[1] !== planTxt.total.replace('≈ ', '')) fail(run, `planned time Plan ${planTxt.total} vs Debrief ${row('Time')[1]}`);
    if (row('Sample')[1] !== cfg.spot || row('Sample')[2] !== cfg.spot) fail(run, `sample row ${row('Sample')}`);
    const head = await text('.step--debrief .headline');
    if (head !== 'Back home.') fail(run, `debrief headline "${head}"`);
    const ws = (await S()).walk;
    const slopeBroken = ws.brokenRules.filter((b) => b.id === 'slope').length;
    if (slopeBroken) fail(run, `walk along the plan logged ${slopeBroken} broken slope rule(s) at ${ws.brokenRules.map((b) => `${b.x.toFixed(1)},${b.z.toFixed(1)}`).join(' ')}`);
    console.log('  warnings', JSON.stringify(ws.warnings.map((w) => `${w.text}@${w.x.toFixed(1)},${w.z.toFixed(1)}`)));
    await page.click('.dbf__send');
    await shot('debrief-report-sent');
    await page.click('.dbf__foot .pill');

    // ---------- New mission ----------
    await page.waitForFunction(() => window.__state.step === 1);
    await page.waitForSelector('.m1-pin--murray .m1-pin__name');
    await page.waitForTimeout(500);
    await shot('new-mission');
    const s2 = await S();
    if (s2.route || s2.walk || s2.spotId || s2.request) fail(run, 'mission state not cleared');
    if (!s2.requestsDone.includes(req.id)) fail(run, 'finished request not marked done');
    await page.click('.m1-pin--murray .m1-pin__name');
    await page.waitForSelector('.m1-panel.is-open .m1-req');
    await shot('new-mission-requests');
    // second mission: the other request, through Plan and Go into the Walk, then end with esc
    await page.locator('.m1-req').nth(1 - cfg.request).click();
    await page.click('.m1-panel__action .pill');
    await page.waitForSelector('.step--plan .plan-hit');
    await page.waitForTimeout(400);
    if ((await S()).spotId) fail(run, 'second mission starts with a spot already chosen');
    await page.locator('.step--plan .map-marker--number.plan-hit').nth(cands.indexOf('F3')).click({ force: true });
    await page.waitForFunction(() => window.__state.spotId === 'F3');
    await shot('second-plan');
    await page.click('.step--plan .split__action .pill');
    await page.waitForSelector('.step--go .go__rulechecks');
    await page.click('.go__action .pill');
    await page.waitForFunction(() => window.__state.step === 4 && window.__walk);
    await page.waitForSelector('.walk-loading.is-off', { state: 'attached', timeout: 60000 });
    await page.evaluate(() => window.__walk.hold(true));
    const w2 = await S();
    if (w2.walk.tS !== 0 || w2.walk.sample) fail(run, 'second walk did not start fresh');
    await page.keyboard.down('KeyW');
    await page.evaluate(() => window.__walk.advance(8));
    await page.keyboard.up('KeyW');
    await page.evaluate(() => window.__walk.advance(0.1, true));
    await shot('second-walk');
    await page.waitForTimeout(300);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => window.__state.step === 5);
    await page.waitForSelector('.dbf__table');
    await page.waitForTimeout(500);
    await shot('second-debrief-ended');
  } catch (e) {
    fail(run, `${e.message.split('\n')[0]} (at step ${await step().catch(() => '?')})`);
    await page.screenshot({ path: out + 'error.png' }).catch(() => {});
  }
  for (const e of errors) fail(run, `console error: ${e}`);
  await page.close();
}
await browser.close();
if (failures.length) { console.log(`\n${failures.length} failure(s):\n` + failures.join('\n')); process.exit(1); }
console.log('\njourney ok');
