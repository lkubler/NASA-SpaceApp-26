// DEMO RECORDER (not bundled): plays prepared scenarios in a visible Chromium window and records each one
// as an H.264 clip for the demo video (pitch.md, section 2). Setup steps run fast and unrecorded; only the
// action is recorded, in real time, in headless Chromium on the GPU (60 fps WebGL), encoded at 30 fps.
//
//   npm run dev                                   # in app/, serves http://localhost:5173/
//   PW=/path/to/node_modules/playwright/index.mjs node scripts/record.mjs [url] [clip ...] [--size 1920x1080] [--list] [--show]
//
// Needs Playwright (same as journey.mjs: npm i playwright@1.46 && npx playwright install chromium) and ffmpeg.
// Default: all clips. Clips go to ../../demo/clips/<clip>.mp4 (ignored by git: video is not committed).
// Bundled Chromium cannot play H.264, so the intro film (part A) is left out of the "intro" clip; use the film
// file from app/public/egress directly in the edit.
import { mkdirSync, mkdtempSync, writeFileSync, rmSync, linkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const { chromium } = await import(process.env.PW || 'playwright');
const args = process.argv.slice(2);
const base = (args.find((a) => /^https?:/.test(a)) || 'http://localhost:5173/').replace(/\/?$/, '/');
const sizeArg = args[args.indexOf('--size') + 1];
const [W, H] = (args.includes('--size') ? sizeArg : '1920x1080').split('x').map(Number);
// the page is laid out at 1280 px wide (the size the app is tested at) and rendered at W / 1280 pixel density,
// so the window fits on a laptop screen and the clip is still sharp at W x H
const VW = 1280, VH = Math.round((1280 * H) / W), DPR = W / 1280;
const outDir = fileURLToPath(new URL('../../demo/clips/', import.meta.url));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- recording: CDP screencast frames -> ffmpeg, constant 30 fps ----------
async function recorder(page, name) {
  const cdp = await page.context().newCDPSession(page);
  const dir = mkdtempSync(join(tmpdir(), `rec-${name}-`));
  const frames = [];
  let on = false;
  cdp.on('Page.screencastFrame', async ({ data, metadata, sessionId }) => {
    if (on) {
      const f = join(dir, `${String(frames.length).padStart(5, '0')}.jpg`);
      writeFileSync(f, Buffer.from(data, 'base64'));
      frames.push({ f, t: metadata.timestamp, wall: Date.now() });
    }
    await cdp.send('Page.screencastFrameAck', { sessionId }).catch(() => {});
  });
  return {
    async start() {
      on = true;
      await cdp.send('Page.startScreencast', { format: 'jpeg', quality: 95, maxWidth: W, maxHeight: H, everyNthFrame: 1 });
    },
    async stop() {
      const tEnd = frames.length ? frames.at(-1).t + (Date.now() - frames.at(-1).wall) / 1000 : 0;
      await cdp.send('Page.stopScreencast');
      on = false;
      if (!frames.length) throw new Error(`${name}: no frame captured`);
      // the screencast sends a frame only when the screen changes: lay the frames on a constant 30 fps grid,
      // each output frame showing the latest captured frame (hard links, no copies)
      const seq = join(dir, 'seq');
      mkdirSync(seq);
      const n = Math.max(1, Math.round((tEnd - frames[0].t) * 30));
      for (let k = 0, j = 0; k < n; k++) {
        const t = frames[0].t + k / 30;
        while (j + 1 < frames.length && frames[j + 1].t <= t) j++;
        linkSync(frames[j].f, join(seq, `${String(k).padStart(6, '0')}.jpg`));
      }
      mkdirSync(outDir, { recursive: true });
      const out = join(outDir, `${name}.mp4`);
      execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '30', '-i', join(seq, '%06d.jpg'),
        '-vf', `scale=${W}:${H}:force_original_aspect_ratio=decrease,pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2,format=yuv420p`,
        '-c:v', 'libx264', '-crf', '16', '-preset', 'slow', '-movflags', '+faststart', out]);
      const dur = tEnd - frames[0].t;
      console.log(`  saved ${out} (${dur.toFixed(1)} s, ${frames.length} frames)`);
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

// ---------- helpers ----------
// the screencast does not show the system cursor: draw one in the page
const CURSOR = () => {
  const add = () => {
    const c = document.createElement('div');
    c.id = '__rec-cursor';
    c.style.cssText = 'position:fixed;left:0;top:0;width:22px;height:22px;margin:-3px 0 0 -3px;pointer-events:none;z-index:2147483647;display:none;'
      + "background:url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22 22'><path d='M3 2 L3 18 L7.5 13.8 L10.5 20.5 L13 19.4 L10.1 12.8 L16 12.6 Z' fill='white' stroke='black' stroke-width='1.3' stroke-linejoin='round'/></svg>\") no-repeat;";
    document.documentElement.append(c);
    addEventListener('mousemove', (e) => { c.style.display = 'block'; c.style.transform = `translate(${e.clientX}px,${e.clientY}px)`; }, true);
  };
  if (document.documentElement) add(); else addEventListener('DOMContentLoaded', add);
};

const S = (page) => page.evaluate(() => JSON.parse(JSON.stringify(window.__state, (k, v) => (ArrayBuffer.isView(v) ? undefined : v))));
const info = (page) => page.evaluate(() => window.__walk.info());

async function openWalk(page, query) {
  await page.goto(base + query);
  await page.waitForFunction(() => window.__state && window.__state.step === 4 && window.__walk, null, { timeout: 90000 });
  await page.waitForSelector('.walk-loading.is-off', { state: 'attached', timeout: 90000 });
  await page.evaluate(() => window.__walk.hold(true));
}

/** Steering toward the route point ahead of the walker; returns the yaw error in degrees. */
function steerErr(points, i0, inf) {
  let idx = i0, bd = Infinity;
  for (let i = i0; i < Math.min(points.length, i0 + 40); i++) {
    const d = Math.hypot(points[i].x - inf.x, points[i].z - inf.z);
    if (d < bd) { bd = d; idx = i; }
  }
  const tgt = points[Math.min(points.length - 1, idx + 2)];
  let err = Math.atan2(tgt.x - inf.x, tgt.z - inf.z) - inf.yaw;
  err = Math.atan2(Math.sin(err), Math.cos(err));
  return { idx, deg: (err * 180) / Math.PI, frac: idx / points.length };
}

/** Unrecorded: walk along points with the sim clock held, until stop(info, frac) is true. */
async function fastWalk(page, points, stop) {
  let idx = 0;
  await page.keyboard.down('KeyW');
  for (let g = 0; g < 4000; g++) {
    const inf = await info(page);
    const e = steerErr(points, idx, inf);
    idx = e.idx;
    if (inf.ended || stop(inf, e.frac)) break;
    if (Math.abs(e.deg) > 1) {
      const key = e.deg > 0 ? 'ArrowRight' : 'ArrowLeft';
      await page.keyboard.down(key);
      await page.evaluate((s) => window.__walk.advance(s), Math.min(0.3, Math.abs(e.deg) / 80));
      await page.keyboard.up(key);
    }
    await page.evaluate(() => window.__walk.advance(0.1));
  }
  await page.keyboard.up('KeyW');
}

/** Recorded: walk along points in real time (clock running) until stop(info, frac) or maxS seconds. */
async function liveWalk(page, points, stop, maxS = 15) {
  let idx = 0, held = null;
  const t0 = Date.now();
  await page.keyboard.down('KeyW');
  while (Date.now() - t0 < maxS * 1000) {
    const inf = await info(page);
    const e = steerErr(points, idx, inf);
    idx = e.idx;
    if (inf.ended || stop(inf, e.frac, (Date.now() - t0) / 1000)) break;
    const want = Math.abs(e.deg) > 4 ? (e.deg > 0 ? 'ArrowRight' : 'ArrowLeft') : null;
    if (want !== held) {
      if (held) await page.keyboard.up(held);
      if (want) await page.keyboard.down(want);
      held = want;
    }
    await wait(40);
  }
  if (held) await page.keyboard.up(held);
  await page.keyboard.up('KeyW');
}

// ---------- scenarios: each clip = setup (unrecorded) + action (recorded) ----------
const CLIPS = {
  // Storyboard 10-13 s: Mars from orbit, the fly-in to the site
  opening: {
    about: 'Opening screen, globe zoom and fly-in to Murray Buttes, missions panel',
    async run(page, rec) {
      await page.goto(base);
      await page.waitForSelector('.m1-intro');
      await wait(1500);
      await rec.start();
      await wait(2000);
      await page.click('.m1-intro .pill');
      await page.waitForFunction(() => !document.querySelector('.m1-intro') && !document.querySelector('.m1--flying'), null, { timeout: 30000 });
      await page.waitForSelector('.m1-panel.is-open .m1-req');
      await wait(2000);
      await page.locator('.m1-req').first().click();
      await wait(1500);
      await rec.stop();
    },
  },
  // Storyboard 13-20 s: choose sample spots, the route appears, the totals update
  plan: {
    about: 'Plan map: add stop 03, then stop 06; route and totals update',
    async run(page, rec) {
      await page.goto(base + '?step=2');
      await page.waitForSelector('.step--plan .map.map--fade:not(.is-pending)', { timeout: 60000 });
      await wait(1500);
      const mark = (n) => page.locator('.step--plan .map-marker--number.plan-hit').filter({ hasText: n });
      await rec.start();
      await wait(1500);
      for (const n of ['03', '06']) {
        const box = await mark(n).boundingBox();
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 25 });
        await wait(400);
        await mark(n).click({ force: true });
        await wait(2500);
      }
      const btn = await page.locator('.step--plan .split__action .pill').boundingBox();
      await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2, { steps: 30 });
      await wait(1500);
      await rec.stop();
    },
  },
  // Storyboard 17-21 s: spot 06 lies in radio shadow; placing the relay shrinks the shadow and the time without contact
  relay: {
    about: 'Plan map with spot 06: place the radio relay, radio shadow and time without contact are calculated again',
    async run(page, rec) {
      await page.goto(base + '?step=2');
      await page.waitForSelector('.step--plan .map.map--fade:not(.is-pending)', { timeout: 60000 });
      await wait(1500);
      // unrecorded: only spot 06 as the stop (Plan opens with the request's spot; a click removes or adds a stop)
      const mark = (n) => page.locator('.step--plan .map-marker--number.plan-hit').filter({ hasText: n });
      for (const id of (await S(page)).stops || []) {
        const n = await page.evaluate((i) => import('/src/core/index.js').then((c) => c.spotNumber(i)), id);
        await mark(n).click({ force: true });
        await wait(800);
      }
      await mark('06').click({ force: true });
      await page.waitForFunction(() => (window.__state.stops || []).join() === 'F7', null, { timeout: 20000 });
      await wait(2000);
      // screen position of a scene point (x east, z north), from two spot markers (the map is a linear top view)
      const at = async (id) => {
        const n = await page.evaluate((i) => import('/src/core/index.js').then((c) => c.spotNumber(i)), id);
        const b = await page.locator('.step--plan .map-marker--number.plan-hit').filter({ hasText: n }).boundingBox();
        return { sx: b.x + b.width / 2, sy: b.y + b.height / 2 };
      };
      // two spots that are not chosen (a chosen marker carries an order badge that moves its box)
      const [a, b] = [await at('F5'), await at('F3')];
      const A = { x: 26.75, z: 31.25 }, B = { x: -1.75, z: -27.75 };
      const toScreen = (x, z) => ({
        x: a.sx + ((x - A.x) * (b.sx - a.sx)) / (B.x - A.x),
        y: a.sy + ((z - A.z) * (b.sy - a.sy)) / (B.z - A.z),
      });
      const relay = toScreen(30, -10); // open ground that sees both the rover and spot 06
      await page.mouse.move(VW * 0.75, VH * 0.5);
      await rec.start();
      await wait(1500);
      const place = await page.locator('.plan-relay__move').first().boundingBox();
      await page.mouse.move(place.x + place.width / 2, place.y + place.height / 2, { steps: 25 });
      await wait(300);
      await page.mouse.click(place.x + place.width / 2, place.y + place.height / 2);
      await wait(600);
      await page.mouse.move(relay.x, relay.y, { steps: 35 });
      await wait(300);
      await page.mouse.click(relay.x, relay.y);
      await wait(3500);
      await rec.stop();
      const r = await page.evaluate(() => import('/src/core/index.js').then((c) => c.getRelay()));
      if (!r) throw new Error('relay not placed');
      console.log(`  relay at ${r.x.toFixed(1)}, ${r.z.toFixed(1)}`);
    },
  },
  // Go / no-go: the rule checks for a three-stop round
  go: {
    about: 'Go / no-go: rule checks for a three-stop round, open the way-home check',
    async run(page, rec) {
      await page.goto(base + '?step=3&stops=F1,F2,F3');
      await page.waitForSelector('.step--go .go__rulechecks', { timeout: 60000 });
      await wait(1500);
      await rec.start();
      await wait(2000);
      await page.locator('button.gocheck').nth(2).locator('.gocheck__name').click();
      await wait(3000);
      await rec.stop();
    },
  },
  // Storyboard 0-4 s: helmet view, the HUD warning lights up
  turnback: {
    about: 'Helmet view at stop 2 of 3: the crew lingers, TURN BACK NOW appears, they turn and head home',
    async run(page, rec) {
      // pass 1 finds how long the crew can wait at stop 2; pass 2 stops a few seconds before that
      const toStop2 = async () => {
        await openWalk(page, '?step=4&stops=F1,F2,F3');
        const st = await S(page);
        for (let k = 0; k < 2; k++) {
          await fastWalk(page, st.route.legs[k].points, (inf) => inf.atTarget);
          await page.keyboard.press('KeyE');
          await page.evaluate(() => window.__walk.advance(0.1));
          await page.keyboard.press('KeyE');
          await page.evaluate(() => window.__walk.advance(0.1));
        }
      };
      await toStop2();
      let waitS = 0;
      for (; waitS < 3000; waitS++) {
        const inf = await page.evaluate(() => window.__walk.advance(1));
        if (inf.alert === 'turnBack' || inf.ended) break;
      }
      if (waitS >= 3000) throw new Error('no turn back while waiting at stop 2');
      await toStop2();
      await page.evaluate((s) => window.__walk.advance(s, true), Math.max(0, waitS - 4));
      await rec.start();
      await page.evaluate(() => window.__walk.hold(false));
      // look around slowly until the warning comes
      await page.keyboard.down('ArrowLeft');
      const t0 = Date.now();
      while ((await info(page)).alert !== 'turnBack' && Date.now() - t0 < 12000) await wait(50);
      await page.keyboard.up('ArrowLeft');
      await wait(2500);
      const home = await page.evaluate(() => window.__walk.sim.leg().points);
      await liveWalk(page, home, (_i, _f, t) => t > 4, 5);
      await wait(500);
      await rec.stop();
    },
  },
  // Storyboard 22-27 s: fast pace, the reserve forecast falls, then take the sample
  fastwalk: {
    about: 'Helmet view: normal walk, Shift held for fast walk (reserve falls faster), arrive and take the sample',
    async run(page, rec) {
      await openWalk(page, '?step=4&spot=F3');
      const pts = (await S(page)).route.out.points;
      await fastWalk(page, pts, (_inf, frac) => frac > 0.45);
      await page.evaluate(() => window.__walk.advance(0.05, true));
      await rec.start();
      await page.evaluate(() => window.__walk.hold(false));
      await liveWalk(page, pts, (_i, _f, t) => t > 2, 2);
      await page.keyboard.down('ShiftLeft');
      await liveWalk(page, pts, (inf, _f, t) => inf.atTarget || t > 3, 3);
      await page.keyboard.up('ShiftLeft');
      await liveWalk(page, pts, (inf) => inf.atTarget, 12);
      await wait(800);
      await page.keyboard.press('KeyE');
      await wait(3500);
      await rec.stop();
    },
  },
  // the first walk of a session: stepping out of the rover (film part A left out, see header)
  intro: {
    about: 'Walk intro: stepping out of the rover into the helmet view (without the film)',
    async run(page, rec) {
      await page.goto(base + '?step=4&spot=F1&intro=1');
      await page.waitForFunction(() => window.__state && window.__state.step === 4 && window.__walk, null, { timeout: 90000 });
      await rec.start();
      await page.waitForSelector('.walk-loading.is-off', { state: 'attached', timeout: 90000 });
      await page.waitForFunction(() => !document.querySelector('.walk-intro'), null, { timeout: 60000 });
      await wait(2000);
      await rec.stop();
    },
  },
  debrief: {
    about: 'Debrief: planned against walked, then New mission',
    async run(page, rec) {
      await page.goto(base + '?step=5');
      await page.waitForSelector('.dbf__table', { timeout: 60000 });
      await wait(1500);
      await page.mouse.move(VW * 0.9, VH * 0.6);
      await rec.start();
      await wait(2000);
      const btn = await page.locator('.dbf__foot .pill').boundingBox();
      await page.mouse.move(btn.x + btn.width / 2, btn.y + btn.height / 2, { steps: 30 });
      await wait(400);
      await page.click('.dbf__foot .pill');
      await wait(2500);
      await rec.stop();
    },
  },
};

if (args.includes('--list')) {
  for (const [k, c] of Object.entries(CLIPS)) console.log(`${k.padEnd(10)} ${c.about}`);
  process.exit(0);
}
const chosen = args.filter((a) => CLIPS[a]);
const clips = chosen.length ? chosen : Object.keys(CLIPS);
// headless with the GPU (Metal through ANGLE): 60 fps WebGL and a frame size that does not depend on the screen.
// --show opens a visible window instead (to watch; the clip can be cropped when the window does not fit).
const show = args.includes('--show');
const browser = await chromium.launch({ headless: !show, args: ['--use-angle=metal', '--enable-gpu', '--ignore-gpu-blocklist', '--hide-scrollbars', `--window-size=${VW},${VH + 100}`] });
const failed = [];
for (const name of clips) {
  console.log(`clip ${name}: ${CLIPS[name].about}`);
  const page = await browser.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: DPR });
  await page.addInitScript(CURSOR);
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  try {
    await CLIPS[name].run(page, await recorder(page, name));
  } catch (e) {
    failed.push(name);
    console.log(`  FAIL ${e.message.split('\n')[0]}`);
  }
  for (const e of errors) console.log(`  page error: ${e}`);
  await page.close();
}
await browser.close();
if (failed.length) { console.log(`\nfailed: ${failed.join(', ')}`); process.exit(1); }
console.log(`\nclips in ${outDir}`);
