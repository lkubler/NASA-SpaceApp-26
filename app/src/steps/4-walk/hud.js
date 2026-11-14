// Helmet display: frame, compass, minimap, reserve chip, suit and mission cards, one alert at a time,
// look-at card, target marker, prompts. DOM only; values come in from the sim (core numbers).
import { h, labelTag, fmtDuration, fmtClock, fmtDistance, fmtMSv } from '../../ui/index.js';
import {
  RULES, DEMO, ENVIRONMENT, SUIT, ROVER, ACCESS_MARS_POINTS, ASTRONAUT,
  bodyReadings, outsideTempC, fractions, fullLevels, timeLeft, spotSeconds, spotLabel,
} from '../../core/index.js';
import { ALERTS } from './sim.js';
import { DISPLAY as D } from './display.js';
import frameUrl from './helmet-frame.webp';
import { GROUND_TAG } from '../../core/groundColor.js';

const tag = (o) => labelTag(o);
const SIM_TAG = { label: 'simulated', text: 'The rover model is a simple stand-in built for this view; it marks where the crew parked. The real scene has a gap there where Access Mars cut out Curiosity.' };
const MODEL_TAG = (text) => ({ label: 'model', text, source: { title: 'Our calculation from the walk grid (Access Mars Murray Buttes, NASA/JPL-Caltech imagery)', url: '', where: '' } });
const AM_TAG = { label: 'real', text: 'Card text from Access Mars (Google Creative Lab with NASA/JPL), a 2016 web experience built from Curiosity’s images of Murray Buttes.', source: { title: 'Access Mars, public/index.html', url: 'https://github.com/googlecreativelab/access-mars', where: 'murray_buttes_markers' } };
const fullTime = timeLeft(fullLevels()).seconds;

// distances shown with the target and on the markers: path distance from here along the fastest way that
// keeps every rule (the plan's cost field), with its walking time; the sample card names a straight distance
const DIST_TAG = MODEL_TAG('Straight-line distance measured on the 0.5 m walk grid.');
const ROUTE_TAG = MODEL_TAG('Path distance from where you stand along the fastest way that keeps every rule, measured on the 0.5 m walk grid, and its walking time from the suit model, in demo time.');
const TIME_TAG = { label: 'model', text: 'Suit time since you left the rover, counted from the rover itself like the plan: walking and work times from the suit model, shown at demo speed. The debrief shows the same clock.', source: { title: 'Suit model (src/core/suit.js)', url: '', where: '' } };
const SLOPE_TAG = MODEL_TAG('Slope of the ground here, from the 0.5 m walk grid built from the Access Mars terrain.');
const AHEAD_TAG = MODEL_TAG('Distance ahead in your walking direction, measured on the 0.5 m walk grid.');
const OFF_TAG = MODEL_TAG('Distance from you to the nearest point of the planned route, measured on the 0.5 m walk grid.');
const LAST_M_TAG = MODEL_TAG('Straight-line distance from here to the rover, measured on the 0.5 m walk grid.');
const LAST_S_TAG = { label: 'model', text: 'Walking time of the last metres at planning pace, from the suit model, in demo time. It is added to the clock when you end the excursion.', source: { title: 'Suit model (src/core/suit.js)', url: '', where: '' } };
const RESERVE_TAG = { label: 'model', moon: true, text: RULES.walkBackRateFactor.text + ' Reserve on return = time left minus the way home from here, if you continue as planned.', source: { title: 'Suit model (src/core/suit.js)', url: '', where: '' } };
const FAST_TAG = { label: 'model', text: 'Work rate at the fast pace from the suit model (Pandolf effort equation under Mars gravity): faster walking costs more per metre. ' + ASTRONAUT.fastPaceFactor.text, source: { title: 'Suit model (src/core/suit.js)', url: '', where: '' } };
const JUMP_TAG = { label: 'model', text: 'A jump is counted as a normal walk from here to the landing point on the fastest way that keeps every rule: its time, work rate, radio shadow and warnings go into the walk log as if walked.', source: { title: 'Suit model (src/core/suit.js), planner (src/core/planner.js)', url: '', where: '' } };
const STEEP_CUE_TAG = MODEL_TAG(`Thin lines rising from the edge of ground steeper than ${RULES.slopeMaxDeg.value}° (closed to the route), shown within about ${D.cueFadeMaxM} m of you. The edge is the planner's slope test on the 0.5 m walk grid.`);
const RADIO_CUE_TAG = MODEL_TAG(`Dotted line on the ground at the edge of the radio shadow (no line of sight from your eye to the rover antenna), shown within about ${D.cueFadeMaxM} m of you. Geometry on the 0.5 m walk grid, no radio physics.`);
const BODY_TAG = { label: 'simulated', text: 'Heart rate, core temperature, suit pressure and CO2 are simulated from the work rate; no sensor data behind them.' };

export function createHud(el) {
  // frame; the "AI-generated image" mark is drawn into the image pixels (bottom left of the frame)
  const frame = h('img.walk-frame', { src: frameUrl, alt: '', draggable: 'false' });
  // the ground Access Mars has only grey imagery for is tinted in our own colour (core/groundColor.js)
  // the ground cues near the walker (scene3d.js): steep lines and radio shadow dots, each labelled model
  const groundMark = h('div.walk-groundmark.mono',
    h('div', h('span.walk-cue.walk-cue--steep'), `Over ${RULES.slopeMaxDeg.value}° `, tag(STEEP_CUE_TAG)),
    h('div', h('span.walk-cue.walk-cue--radio'), 'Radio shadow edge ', tag(RADIO_CUE_TAG)),
    h('div', 'Ground colour ', tag(GROUND_TAG)));

  // compass
  const compassCv = h('canvas.walk-compass__cv');
  const compassDeg = h('div.walk-compass__deg.mono', '000°');
  const compass = h('div.walk-compass', compassCv, compassDeg);

  // minimap + target
  const miniCv = h('canvas.walk-mini__cv');
  const tgtName = h('div.walk-target__name');
  const tgtLineTxt = h('span');
  const tgtLine = h('div.walk-target__line.mono', tgtLineTxt, ' ', tag(ROUTE_TAG));
  const tgtBar = h('div.walk-target__bar', h('span'));
  const mini = h('div.walk-mini', h('div.walk-mini__disc', miniCv, h('span.walk-mini__n.mono', 'N')), h('div.walk-target', tgtName, tgtLine, tgtBar));

  // suit and body
  const bodyVals = {};
  const bodyRow = (k, name, unit) => h('div.walk-row', h('span.walk-row__l', name), h('span.walk-row__v', bodyVals[k] = h('b'), h('small', unit)));
  const bodyCard = h('div.walk-card.walk-card--body',
    h('div.walk-card__head', h('span', 'Suit and body'), tag(BODY_TAG)),
    bodyRow('heart', 'Heart', 'bpm'), bodyRow('core', 'Core', '°C'), bodyRow('suit', 'Suit', 'kPa'), bodyRow('co2', h('span', 'CO', h('sub', '2')), 'kPa'));

  // mission
  const mVals = {};
  const mRow = (k, name, t) => h('div.walk-row', h('span.walk-row__l', name, t ? [' ', t] : null), mVals[k] = h('span.walk-row__v.mono'));
  const missionCard = h('div.walk-card.walk-card--mission',
    mRow('time', 'Time outside', tag(TIME_TAG)),
    mRow('dose', 'Radiation', tag({ ...ENVIRONMENT.doseMSvPerDay, label: 'model', text: 'Dose so far: Curiosity’s measured dose rate at Gale crater times your time outside. ' + ENVIRONMENT.doseMSvPerDay.text })),
    mRow('temp', 'Outside', tag(ENVIRONMENT.airTempK)),
    mRow('power', 'Power', tag(SUIT.consumables.battery)),
    mRow('radio', 'Radio to rover', tag({ label: 'model', text: 'Line of sight from your eye to the rover antenna over the terrain grid. Geometric only, no radio physics.', source: { title: 'Our calculation from the walk grid', url: '', where: '' } })),
    mRow('demo', 'Demo time', tag(DEMO.timeFactor)),
    mRow('plan', 'Plan breaks', null));
  // a rule the plan already broke is carried into the walk (specs/3-go.md): named from the start
  const planRow = mVals.plan.parentElement;
  planRow.hidden = true;

  // reserve chip
  const resVal = h('div.walk-reserve__val');
  const resSub = h('div.walk-reserve__sub');
  const resLeft = h('div.walk-reserve__left.mono');
  const resBar = h('div.walk-reserve__bar', h('span'));
  const reserve = h('div.walk-reserve',
    h('div.walk-reserve__head', h('span', 'Reserve on return'), tag(RESERVE_TAG)),
    h('div.walk-reserve__main', resVal, resLeft), resSub, resBar);

  // centre: alert, reticle, look card, prompt
  const alertEl = h('div.walk-alert');
  const reticle = h('div.walk-reticle');
  const lookCard = h('div.walk-look');
  const prompt = h('div.walk-prompt');
  // the mouse look text follows the look mode (setLookMode): click for the lock, locked, or free look
  const hintLook = h('span', 'Click, then move the mouse to look');
  const hint = h('div.walk-hint', hintLook, h('i', '·'), h('span', h('kbd', 'W A S D'), ' walk'), h('i', '·'), h('span', h('kbd', '← →'), ' turn'),
    h('i', '·'), h('span', h('kbd', 'Shift'), ' fast'), h('i', '·'), h('span', h('kbd', 'F'), ' jump'));
  // key hints on the frame bottom, always shown; esc last (its text changes when armed)
  const escLookKey = h('kbd', 'click'), escLookText = h('span', 'mouse look');
  const escHint = h('div.walk-esc', escLookKey, escLookText, h('kbd', 'Shift'), h('span', 'fast'), h('kbd', 'Shift Shift'), h('span', 'demo speed'), h('kbd', 'F'), h('span', 'jump'),
    h('kbd', 'esc'), h('span', 'End mission'));
  // walking mode (fast walk, demo speed, aim, jump), above the frame bottom
  const modeEl = h('div.walk-mode');
  // aim mode: the landing point on the ground
  const aimLabel = h('span.walk-aim__label');
  const aimMark = h('div.walk-aim', h('span.walk-aim__ring'), aimLabel);

  // markers projected from 3D
  const tgtMark = h('div.walk-mark.walk-mark--target', h('span.walk-mark__label'), h('span.walk-mark__dia'));
  const roverDist = h('b.mono');
  const roverDistTag = h('span', ' ', tag(ROUTE_TAG));
  roverDistTag.hidden = true;
  const roverMark = h('div.walk-mark.walk-mark--rover', h('span.walk-mark__label', 'Rover ', tag(SIM_TAG), roverDist, roverDistTag), h('span.walk-mark__dia'));
  const pointMarks = ACCESS_MARS_POINTS.map(() => h('div.walk-mark.walk-mark--point', h('span.walk-mark__dot')));
  const marks = h('div.walk-marks', tgtMark, roverMark, ...pointMarks);

  const modal = h('div.walk-modal');
  const loading = h('div.walk-loading.mono', 'Loading terrain…');

  const hud = h('div.walk-hud', compass, mini, bodyCard, reserve, missionCard, alertEl, reticle, lookCard, prompt, hint, modeEl);
  el.append(marks, aimMark, frame, groundMark, hud, escHint, modal, loading);

  // ---------- minimap background (once): shaded relief, closed ground darker ----------
  let reliefCv = null, terr = null;
  function setTerrain(t) {
    terr = t;
    const n = t.n, img = new ImageData(n, n);
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c;
      const hx = t.height[r * n + Math.min(n - 1, c + 1)] - t.height[r * n + Math.max(0, c - 1)];
      const hz = t.height[Math.min(n - 1, r + 1) * n + c] - t.height[Math.max(0, r - 1) * n + c];
      const shade = Math.max(0, Math.min(1, 0.62 - 0.55 * (hx - hz) / (2 * t.cell)));
      const steep = t.slope[i] > RULES.slopeMaxDeg.value;
      const o = ((n - 1 - r) * n + c) * 4; // north up
      img.data[o] = (steep ? 120 : 74) + 130 * shade; img.data[o + 1] = (steep ? 58 : 42) + 80 * shade; img.data[o + 2] = (steep ? 30 : 23) + 44 * shade; img.data[o + 3] = 255;
    }
    reliefCv = document.createElement('canvas'); reliefCv.width = n; reliefCv.height = n;
    reliefCv.getContext('2d').putImageData(img, 0, 0);
  }

  function fitCanvas(cv) {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(cv.clientWidth * dpr), hh = Math.round(cv.clientHeight * dpr);
    if (cv.width !== w || cv.height !== hh) { cv.width = w; cv.height = hh; }
    return { w, h: hh, dpr };
  }

  // ---------- compass ----------
  function drawCompass(headingDeg) {
    const { w, h: H, dpr } = fitCanvas(compassCv);
    const g = compassCv.getContext('2d');
    g.clearRect(0, 0, w, H);
    const span = 90, pxPerDeg = w / span, mid = w / 2;
    g.strokeStyle = 'rgba(255,255,255,0.75)'; g.fillStyle = '#fff'; g.lineWidth = dpr;
    g.font = `${11 * dpr}px "JetBrains Mono", monospace`; g.textAlign = 'center'; g.textBaseline = 'top';
    const base = H * 0.62;
    g.beginPath(); g.moveTo(0, base); g.lineTo(w, base); g.stroke();
    const names = { 0: 'N', 45: 'NE', 90: 'E', 135: 'SE', 180: 'S', 225: 'SW', 270: 'W', 315: 'NW' };
    const start = Math.floor((headingDeg - span / 2) / 5) * 5;
    for (let d = start; d <= headingDeg + span / 2; d += 5) {
      const x = mid + (d - headingDeg) * pxPerDeg;
      const dd = ((d % 360) + 360) % 360;
      const major = dd % 45 === 0;
      const edge = Math.min(x, w - x) / (w * 0.12); // fade towards both ends of the strip
      if (edge <= 0) continue;
      g.globalAlpha = Math.min(1, edge);
      g.beginPath(); g.moveTo(x, base); g.lineTo(x, base - (major ? 9 : 5) * dpr); g.stroke();
      if (major) g.fillText(names[dd], x, 0);
      g.globalAlpha = 1;
    }
    g.fillStyle = '#4fcbff';
    g.beginPath(); g.moveTo(mid, base + 1 * dpr); g.lineTo(mid - 5 * dpr, base + 9 * dpr); g.lineTo(mid + 5 * dpr, base + 9 * dpr); g.closePath(); g.fill();
    compassDeg.textContent = String(Math.round(headingDeg) % 360).padStart(3, '0') + '°';
  }

  // ---------- minimap ----------
  function drawMini(sim, headingDeg) {
    if (!reliefCv) return;
    const { w, h: H, dpr } = fitCanvas(miniCv);
    const g = miniCv.getContext('2d');
    const s = sim.s, t = terr;
    const R = w / 2, k = R / D.miniRadiusM; // px per metre
    const toPx = (x, z) => [R + (x - s.x) * k, R - (z - s.z) * k];
    g.save();
    g.clearRect(0, 0, w, H);
    g.beginPath(); g.arc(R, R, R, 0, Math.PI * 2); g.clip();
    // outside the mapped square: a neutral "no data" fill (grey with fine diagonal lines), not black
    g.fillStyle = '#4a4846'; g.fillRect(0, 0, w, H);
    g.strokeStyle = 'rgba(255,255,255,0.16)'; g.lineWidth = dpr;
    g.beginPath();
    for (let d = -H; d < w; d += 6 * dpr) { g.moveTo(d, H); g.lineTo(d + H, 0); }
    g.stroke();
    const [ox, oy] = toPx(t.min, t.max);
    g.imageSmoothingEnabled = true;
    g.drawImage(reliefCv, ox, oy, t.extent * k, t.extent * k);
    // route: both legs, cyan dots
    g.fillStyle = '#4fcbff';
    for (const L of [sim.route.out.points, sim.route.back.points]) {
      for (let i = 0; i < L.length; i += 2) { const [px, py] = toPx(L[i].x, L[i].z); g.beginPath(); g.arc(px, py, 1.3 * dpr, 0, Math.PI * 2); g.fill(); }
    }
    // walked track
    const tr = sim.log.track;
    if (tr.length > 1) {
      g.strokeStyle = 'rgba(255,255,255,0.85)'; g.lineWidth = 1.2 * dpr; g.beginPath();
      tr.forEach((p, i) => { const [px, py] = toPx(p.x, p.z); i ? g.lineTo(px, py) : g.moveTo(px, py); });
      const [px, py] = toPx(s.x, s.z); g.lineTo(px, py); g.stroke();
    }
    g.restore();
    // rover (square) and target (diamond), clamped to the rim
    const rim = (x, z) => {
      let [px, py] = toPx(x, z); const dx = px - R, dy = py - R, d = Math.hypot(dx, dy), m = R - 6 * dpr;
      if (d > m) { px = R + dx / d * m; py = R + dy / d * m; }
      return [px, py];
    };
    const [rx, ry] = rim(ROVER.x, ROVER.z);
    g.fillStyle = '#000'; g.strokeStyle = '#fff'; g.lineWidth = 1.4 * dpr;
    g.fillRect(rx - 4 * dpr, ry - 4 * dpr, 8 * dpr, 8 * dpr); g.strokeRect(rx - 4 * dpr, ry - 4 * dpr, 8 * dpr, 8 * dpr);
    if (!sim.log.sample) {
      const [sx, sy] = rim(sim.route.spot.x, sim.route.spot.z);
      g.save(); g.translate(sx, sy); g.rotate(Math.PI / 4); g.strokeStyle = '#4fcbff'; g.lineWidth = 1.6 * dpr;
      g.strokeRect(-4 * dpr, -4 * dpr, 8 * dpr, 8 * dpr); g.restore();
    }
    // own position and view direction
    const a = (headingDeg * Math.PI) / 180;
    g.save(); g.translate(R, R); g.rotate(a);
    const cone = g.createRadialGradient(0, 0, 0, 0, 0, R * 0.55);
    cone.addColorStop(0, 'rgba(255,255,255,0.45)'); cone.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = cone; g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, R * 0.55, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); g.closePath(); g.fill();
    g.fillStyle = '#fff'; g.beginPath(); g.moveTo(0, -5 * dpr); g.lineTo(4 * dpr, 4 * dpr); g.lineTo(0, 2 * dpr); g.lineTo(-4 * dpr, 4 * dpr); g.closePath(); g.fill();
    g.restore();
  }

  // ---------- per-frame text ----------
  let lastAlert = '', lastAlertMain = '', lastPrompt = '', lastLook = '';
  function update(sim, headingDeg) {
    const { s, log } = sim;
    drawCompass(headingDeg);
    drawMini(sim, headingDeg);
    const tg = sim.target();
    tgtName.textContent = tg.kind === 'spot' ? (spotLabel(tg.id) || tg.name) : 'Rover';
    tgtLineTxt.textContent = `${fmtDistance(tg.metres)} · ${fmtDuration(tg.seconds)}`;
    tgtBar.firstChild.style.width = `${(tg.done * 100).toFixed(1)}%`;

    // reserve chip
    const r = s.reserve;
    resVal.textContent = fmtDuration(r.seconds);
    resSub.textContent = `limited by ${r.name.toLowerCase()}`;
    resLeft.textContent = `${fmtDuration(s.timeLeft.seconds)} left`;
    reserve.classList.toggle('is-warning', r.seconds <= 0);
    resBar.firstChild.style.width = `${Math.max(0, Math.min(100, (100 * r.seconds) / fullTime)).toFixed(1)}%`;

    // body
    const b = bodyReadings(s.workW);
    bodyVals.heart.textContent = Math.round(b.heartBpm);
    bodyVals.core.textContent = b.coreTempC.toFixed(1);
    bodyVals.suit.textContent = b.suitPressureKPa.toFixed(1);
    bodyVals.co2.textContent = b.co2KPa.toFixed(1);

    // mission
    mVals.time.textContent = fmtClock(log.tS);
    mVals.dose.textContent = fmtMSv(log.doseMSv);
    mVals.temp.textContent = `${Math.round(outsideTempC(log.tS))} °C`;
    mVals.power.textContent = `${Math.round(fractions(log.levels).battery * 100)} %`;
    mVals.radio.textContent = s.radio ? 'Rover · ok' : 'No line of sight';
    mVals.radio.className = 'walk-row__v mono ' + (s.radio ? 'tone-accent' : 'tone-advisory');
    mVals.demo.textContent = `${DEMO.timeFactor.value}${DEMO.timeFactor.unit}`;

    // alerts: the most important one large; every other active one stays visible as a small chip beside it
    const ids = s.modal ? [] : (s.alerts || (s.alert ? [s.alert] : []));
    const id = ids[0] || null, rest = ids.slice(1);
    const parts = id ? alertDetail(id, s) : [];
    const key = id ? id + parts.filter((x) => typeof x === 'string').join('') + '|' + rest.join(',') : '';
    if (key !== lastAlert) {
      const sameMain = id && lastAlertMain === id + parts.filter((x) => typeof x === 'string').join('');
      lastAlert = key;
      lastAlertMain = id ? id + parts.filter((x) => typeof x === 'string').join('') : '';
      alertEl.replaceChildren();
      if (id) {
        const A = ALERTS[id];
        const box = h(`div.alert.alert--${A.level}.walk-alert__box`,
          h('div.walk-alert__lvl.mono', A.level), h('div.alert__title', A.title), h('div.alert__text', parts.map((x) => (typeof x === 'string' ? x : tag(x.tag)))));
        // only a new large warning slides in; a chip coming or going does not replay it
        if (sameMain) box.classList.add('is-still');
        alertEl.append(box);
        if (rest.length) {
          alertEl.append(h('div.walk-alert__chips', rest.map((r) => h(`div.walk-alert__chip.is-${ALERTS[r].level}`,
            h('span.walk-alert__dot'), h('span', ALERTS[r].title)))));
        }
      }
    }

    // prompt
    let p = '';
    if (!log.ended && !s.modal) {
      if (sim.atTarget()) p = 'take';
      else if (sim.atRover()) {
        // the walk log counts to the rover's centre, like the plan: the last metres are added at planning pace
        const ll = sim.lastLeg();
        p = `end|${fmtDistance(ll.metres)}|${fmtDuration(ll.seconds)}`;
      }
    }
    if (p !== lastPrompt) {
      lastPrompt = p;
      prompt.replaceChildren();
      if (p === 'take') prompt.append(h('kbd', 'E'), h('span', `Take sample · ${fmtDuration(spotSeconds())} of work `, tag(DEMO.spotWorkMin)));
      if (p.startsWith('end|')) {
        const [, m, d] = p.split('|');
        prompt.append(h('kbd', 'E'), h('span', `End excursion · last ${m} `, tag(LAST_M_TAG), ` to the rover, ${d} `, tag(LAST_S_TAG)));
      }
      prompt.classList.toggle('is-on', !!p);
    }
    hint.classList.toggle('is-off', s.started);
  }

  /** Alert text as parts (strings and { tag } specs, made into value tags when shown); the strings alone are its identity. */
  function alertDetail(id, s) {
    const i = s.alertInfo[id] || {};
    const lim = `${RULES.slopeMaxDeg.value}°`;
    switch (id) {
      case 'turnBack': return i.viaSpot
        ? ['Reserve on return ', `${fmtDuration(i.reserveS)} `, { tag: RESERVE_TAG }, ' if you go on to the spot and back. Head for the rover.']
        : ['Reserve on return ', `${fmtDuration(i.reserveS)} `, { tag: RESERVE_TAG }, '. Head for the rover.'];
      case 'steepUnder': return [`${Math.round(i.slopeDeg)}° here `, { tag: SLOPE_TAG },
        i.offRoute ? ', off the checked route.' : ', on the planned route.', ` Rule broken: slope on foot, at most ${lim} `, { tag: RULES.slopeMaxDeg }, '.'];
      case 'edge': return ['The mapped terrain ends here.'];
      case 'steepAhead': return [`Ground over ${lim} `, { tag: RULES.slopeMaxDeg }, ` in ${Math.max(1, Math.round(i.m))} m `, { tag: AHEAD_TAG }, '. Closed to the route.'];
      case 'offPath': return [`${Math.round(i.m)} m `, { tag: OFF_TAG }, ' from the planned route.'];
      case 'radioAhead': return [`No line of sight to the rover in ${Math.max(1, Math.round(i.m))} m `, { tag: AHEAD_TAG }, '.'];
      default: return [];
    }
  }

  // ---------- look-at card ----------
  function setLook(look) {
    // one thing at a time in the centre: no look-at card while a warning, a prompt or a modal is shown
    if (modal.classList.contains('is-on') || alertEl.firstChild || prompt.classList.contains('is-on')) look = null;
    const key = look ? look.title + look.size : '';
    if (key === lastLook) return;
    lastLook = key;
    lookCard.replaceChildren();
    lookCard.classList.toggle('is-on', !!look);
    if (!look) return;
    lookCard.append(h('div.walk-look__card',
      h('div.walk-look__title', look.title, ' ', tag(AM_TAG)),
      h('div.walk-look__text', look.text),
      h('div.walk-look__size.mono', look.size, ' ', tag(MODEL_TAG('Height of the ground rise and distance, measured on the 0.5 m walk grid.')))));
  }

  // ---------- markers ----------
  let minY = 0;
  function place(m, p, on) {
    // only in the open middle of the visor: not behind the side cards, below the compass strip and the warning
    const W = window.innerWidth, show = !!on && p.visible && p.x > W * 0.25 && p.x < W * 0.76;
    m.classList.toggle('is-on', show);
    if (show) m.style.transform = `translate(${p.x.toFixed(1)}px, ${Math.max(p.y, minY).toFixed(1)}px)`;
  }
  const overlaps = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  /** A marker label that would cover the warning, the look-at card or the prompt stays quiet (diamond only). */
  function quietIfCovering(m, blocks) {
    if (!m.classList.contains('is-on')) return;
    const r = m.querySelector('.walk-mark__label').getBoundingClientRect();
    m.classList.toggle('is-quiet', blocks.some((b) => overlaps(r, b)));
  }
  function sideAwayFrom(m, block) {
    if (!m.classList.contains('is-on')) return;
    m.classList.remove('is-right');
    const r = m.querySelector('.walk-mark__label').getBoundingClientRect();
    const pad = 12;
    if (overlaps(r, { left: block.left - pad, right: block.right + pad, top: block.top - pad, bottom: block.bottom + pad })) m.classList.add('is-right');
  }
  /** The warning area: the large warning and its chips together, or null. */
  function warnArea() {
    if (!alertEl.firstChild) return null;
    const rs = [...alertEl.children].map((c) => c.getBoundingClientRect());
    return { left: Math.min(...rs.map((r) => r.left)), right: Math.max(...rs.map((r) => r.right)), top: Math.min(...rs.map((r) => r.top)), bottom: Math.max(...rs.map((r) => r.bottom)) };
  }
  let lastRoverTxt = '', lastTgtTxt = '';
  function setMarks(target, roverP, roverOn, points) {
    const box = warnArea();
    // markers stay below the compass strip; at the warning they stay where they are and hide (below)
    minY = window.innerHeight * 0.27;
    const toRover = target.kind === 'rover';
    place(tgtMark, target.p, !toRover);
    if (!toRover) {
      const t = `${spotLabel(target.id) || target.name}|${fmtDistance(target.metres)}`;
      if (t !== lastTgtTxt) { lastTgtTxt = t; tgtMark.firstChild.replaceChildren(h('span', (spotLabel(target.id) || target.name) + ' '), h('b.mono', fmtDistance(target.metres)), ' ', tag(ROUTE_TAG)); }
    }
    // the rover carries its own label (simulated); as the target it also shows the distance
    const txt = toRover ? fmtDistance(target.metres) : '';
    if (txt !== lastRoverTxt) { lastRoverTxt = txt; roverDist.textContent = txt ? ' ' + txt : ''; roverDistTag.hidden = !txt; }
    roverMark.classList.toggle('is-target', toRover);
    place(roverMark, roverP, roverOn);
    points.forEach((q, i) => place(pointMarks[i], q.p, q.on));
    const blocks = [box, lookCard.classList.contains('is-on') && lookCard.firstChild && lookCard.firstChild.getBoundingClientRect(),
      prompt.classList.contains('is-on') && prompt.getBoundingClientRect(),
      !hint.classList.contains('is-off') && hint.getBoundingClientRect()].filter(Boolean);
    // the target label sits left of its diamond; where that would run into the minimap and its text, it
    // goes to the right of the diamond instead
    const mr = mini.getBoundingClientRect(), tr = mini.lastChild.getBoundingClientRect(); // disc and the target text below it
    sideAwayFrom(tgtMark, { left: Math.min(mr.left, tr.left), right: Math.max(mr.right, tr.right), top: Math.min(mr.top, tr.top), bottom: Math.max(mr.bottom, tr.bottom) });
    quietIfCovering(tgtMark, blocks);
    quietIfCovering(roverMark, blocks);
    // the aim marker's label (distance or "not reachable") is hidden inside the warning area too
    if (aimMark.classList.contains('is-on')) aimMark.classList.toggle('is-quiet', !!box && overlaps(aimLabel.getBoundingClientRect(), box));
    // inside the warning area nothing projected from the scene shows through: a diamond or point dot there is hidden as well
    const pad = 6, area = box && { left: box.left - pad, right: box.right + pad, top: box.top - pad, bottom: box.bottom + pad };
    for (const m of [tgtMark, roverMark, ...pointMarks]) {
      const dot = m.lastChild || m.firstChild;
      m.classList.toggle('is-under', !!area && m.classList.contains('is-on') && overlaps(dot.getBoundingClientRect(), area));
    }
  }

  // ---------- modals ----------
  function showSample(route, log) {
    modal.replaceChildren(h('div.walk-modal__card',
      h('div.walk-modal__kicker.mono', `Sample · +${fmtDuration(spotSeconds())} work`, ' ', tag(DEMO.spotWorkMin)),
      h('div.walk-modal__title', 'Sample taken.'),
      log.sample.photo ? h('figure.walk-modal__photo',
        h('img', { src: log.sample.photo, alt: log.sample.photoTitle || 'Curiosity photo' }),
        h('figcaption.mono', `${log.sample.photoTitle || ''}. ${log.sample.photoMeta || 'Curiosity'}, ${log.sample.photoCredit || 'NASA/JPL-Caltech'} `,
          tag({ label: 'real', text: 'Real Curiosity photo of this rock, the sandstone of the Murray Buttes. Curiosity never stopped at this exact spot.', source: { title: `${log.sample.photoMeta || 'Curiosity'}, ${log.sample.photoCredit || 'NASA/JPL-Caltech'}`, url: log.sample.photoUrl || '', where: '' } }))) : null,
      h('p.walk-modal__text', `${route.spot.name}: sandstone of the butte (Stimson formation), bagged ${fmtDistance(Math.hypot(log.sample.x - ROVER.x, log.sample.z - ROVER.z))} from the rover in a straight line `, tag(DIST_TAG), `. The photo shows this rock in the Murray Buttes as Curiosity saw it, not this exact spot.`),
      h('div.walk-modal__next', 'Next target: the rover. ', h('kbd', 'E'), ' continue')));
    modal.classList.add('is-on');
  }
  function showEmpty(log) {
    modal.replaceChildren(h('div.walk-modal__card.is-warning',
      h('div.walk-modal__kicker.mono', 'warning ', tag({ label: 'simulated', text: 'What happens when the suit runs out is simulated: the walk simply ends here.' })),
      h('div.walk-modal__title', 'Suit empty.'),
      h('p.walk-modal__text', `${timeLeft(log.levels).name} ran out ${fmtDistance(log.suitEmpty.roverDistanceM)} from the rover. The walk ends here.`),
      h('div.walk-modal__next', h('kbd', 'E'), ' to the debrief')));
    modal.classList.add('is-on');
  }
  function hideModal() { modal.classList.remove('is-on'); modal.replaceChildren(); }

  function setEscArmed(on) {
    escHint.classList.toggle('is-armed', on);
    escHint.lastChild.textContent = on ? 'Press esc again to end the mission here' : 'End mission';
  }
  function setLoading(text) { loading.textContent = text || ''; loading.classList.toggle('is-off', !text); }

  /** Name the rules the plan broke (plan.brokenRules); none: the row stays hidden. */
  function setPlanBroken(rules) {
    const names = [...new Set((rules || []).map((b) => b.name))];
    planRow.hidden = !names.length;
    mVals.plan.textContent = names.join(', ');
    mVals.plan.className = 'walk-row__v mono tone-warning';
  }
  // ---------- controls: mouse look, walking mode and aim ----------
  let lastLookHint = 'click';
  /** 'click' (lock not taken yet: a click captures the mouse), 'locked', or 'free' (free look, no lock) */
  function setLookMode(m) {
    if (m === lastLookHint) return;
    lastLookHint = m;
    hintLook.textContent = m === 'click' ? 'Click, then move the mouse to look' : m === 'locked' ? 'Move the mouse to look' : 'Move the mouse to look around';
    escLookKey.textContent = m === 'click' ? 'click' : 'mouse';
    escLookText.textContent = m === 'free' ? 'look · rest at an edge to keep turning' : m === 'locked' ? 'look' : 'mouse look';
  }
  // Each chip is built once when its mode comes on and stays in place (no rebuild, so its fade-in plays once)
  // for as long as the mode is on; only its numbers change. Order from top: aim, jumped, demo, fast.
  const chips = {};
  const CHIP_ORDER = ['aim', 'jumped', 'demo', 'fast'];
  function chip(k) {
    if (chips[k]) return chips[k];
    const val = h('span');
    let el;
    if (k === 'aim') el = h('div.walk-mode__chip.is-aim', h('kbd', 'click'), h('span', 'Jump: counted as walked '), tag(JUMP_TAG), h('i', '·'), h('kbd', 'F'), h('span', 'cancel'));
    else if (k === 'jumped') el = h('div.walk-mode__chip.is-aim', val, tag(JUMP_TAG));
    else if (k === 'demo') el = h('div.walk-mode__chip', h('span', `Demo speed: movement only · ${DEMO.screenSpeedFactor.value}${DEMO.screenSpeedFactor.unit} `), tag(DEMO.screenSpeedFactor));
    else el = h('div.walk-mode__chip', h('span', `Fast walk ${ASTRONAUT.fastPaceFactor.value}${ASTRONAUT.fastPaceFactor.unit} `), tag(ASTRONAUT.fastPaceFactor), val, tag(FAST_TAG));
    chips[k] = { el, val, text: '' };
    return chips[k];
  }
  /** { fast, workW, demo, aim, jumped: null | { metres, seconds } } */
  function setMode(m) {
    const on = { aim: m.aim, jumped: !!m.jumped, demo: m.demo, fast: m.fast };
    let after = null; // the chip placed last, in order
    for (const k of CHIP_ORDER) {
      if (!on[k]) { if (chips[k]) { chips[k].el.remove(); delete chips[k]; } continue; }
      const c = chip(k);
      const text = k === 'jumped' ? `Jump: counted as walked · ${fmtDistance(m.jumped.metres)} · ${fmtDuration(m.jumped.seconds)} `
        : k === 'fast' ? ` · ${Math.round(m.workW / 10) * 10} W ` : '';
      if (text !== c.text) { c.text = text; c.val.textContent = text; }
      if (!c.el.isConnected) modeEl.insertBefore(c.el, after ? after.nextSibling : modeEl.firstChild);
      after = c.el;
    }
  }
  let lastAim = '';
  /** null: aim off; else { p: projected landing point or null, ok, m } */
  function setAim(a) {
    aimMark.classList.toggle('is-on', !!a);
    if (!a) { lastAim = ''; return; }
    const at = a.p && a.p.visible ? a.p : { x: window.innerWidth / 2, y: window.innerHeight / 2 + 42 };
    aimMark.style.transform = `translate(${at.x.toFixed(1)}px, ${at.y.toFixed(1)}px)`;
    aimMark.classList.toggle('is-bad', !a.ok);
    aimMark.classList.toggle('is-free', !(a.p && a.p.visible));
    const txt = a.ok ? fmtDistance(a.m) : 'not reachable';
    if (txt !== lastAim) { lastAim = txt; aimLabel.textContent = txt; }
  }

  return { setPlanBroken, setTerrain, update, setLook, setMarks, showSample, showEmpty, hideModal, setEscArmed, setLoading, setMode, setAim, setLookMode, hud };
}

