// Helmet display: frame, compass, minimap, reserve chip, suit and mission cards, one alert at a time,
// look-at card, target marker, prompts. DOM only; values come in from the sim (core numbers).
import { h, labelTag, fmtDuration, fmtClock, fmtDistance, fmtMSv } from '../../ui/index.js';
import {
  RULES, DEMO, ENVIRONMENT, SUIT, ROVER, ACCESS_MARS_POINTS,
  bodyReadings, outsideTempC, fractions, fullLevels, timeLeft, spotSeconds,
} from '../../core/index.js';
import { ALERTS } from './sim.js';
import { DISPLAY as D } from './display.js';
import frameUrl from './helmet-frame.webp';

const tag = (o) => labelTag(o);
const SIM_TAG = { label: 'simulated', text: 'The rover model is a simple stand-in built for this view; it marks where the crew parked. The real scene has a gap there where Access Mars cut out Curiosity.' };
const MODEL_TAG = (text) => ({ label: 'model', text, source: { title: 'Our calculation from the walk grid (Access Mars Murray Buttes, NASA/JPL-Caltech imagery)', url: '', where: '' } });
const AM_TAG = { label: 'real', text: 'Card text from Access Mars (Google Creative Lab with NASA/JPL), a 2016 web experience built from Curiosity’s images of Murray Buttes.', source: { title: 'Access Mars, public/index.html', url: 'https://github.com/googlecreativelab/access-mars', where: 'murray_buttes_markers' } };
const fullTime = timeLeft(fullLevels()).seconds;

const BODY_TAG = { label: 'simulated', text: 'Heart rate, core temperature, suit pressure and CO2 are simulated from the work rate; no sensor data behind them.' };

export function createHud(el) {
  // frame and the mark on it
  const frame = h('img.walk-frame', { src: frameUrl, alt: '', draggable: 'false' });
  const aiMark = h('div.walk-aimark.mono', 'AI-generated image');

  // compass
  const compassCv = h('canvas.walk-compass__cv');
  const compassDeg = h('div.walk-compass__deg.mono', '000°');
  const compass = h('div.walk-compass', compassCv, compassDeg);

  // minimap + target
  const miniCv = h('canvas.walk-mini__cv');
  const tgtName = h('div.walk-target__name');
  const tgtLine = h('div.walk-target__line.mono');
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
    mRow('time', 'Time outside', null),
    mRow('dose', 'Radiation', tag({ ...ENVIRONMENT.doseMSvPerDay, label: 'model', text: 'Dose so far: Curiosity’s measured dose rate at Gale crater times your time outside. ' + ENVIRONMENT.doseMSvPerDay.text })),
    mRow('temp', 'Outside', tag(ENVIRONMENT.airTempK)),
    mRow('power', 'Power', tag(SUIT.consumables.battery)),
    mRow('radio', 'Radio to rover', tag({ label: 'model', text: 'Line of sight from your eye to the rover antenna over the terrain grid. Geometric only, no radio physics.', source: { title: 'Our calculation from the walk grid', url: '', where: '' } })),
    mRow('demo', 'Demo time', tag(DEMO.timeFactor)));

  // reserve chip
  const resVal = h('div.walk-reserve__val');
  const resSub = h('div.walk-reserve__sub');
  const resLeft = h('div.walk-reserve__left.mono');
  const resBar = h('div.walk-reserve__bar', h('span'));
  const reserve = h('div.walk-reserve',
    h('div.walk-reserve__head', h('span', 'Reserve on return'), tag({ label: 'model', text: RULES.walkBackRateFactor.text + ' Reserve on return = time left minus the way home from here, if you continue as planned.', source: { title: 'Suit model (src/core/suit.js)', url: '', where: '' } })),
    h('div.walk-reserve__main', resVal, resLeft), resSub, resBar);

  // centre: alert, reticle, look card, prompt
  const alertEl = h('div.walk-alert');
  const reticle = h('div.walk-reticle');
  const lookCard = h('div.walk-look');
  const prompt = h('div.walk-prompt');
  const hint = h('div.walk-hint', h('span', 'Click to look around'), h('i', '·'), h('span', h('kbd', 'W A S D'), ' walk'), h('i', '·'), h('span', h('kbd', '← →'), ' turn'));
  const escHint = h('div.walk-esc', h('kbd', 'esc'), h('span', 'End mission'));

  // markers projected from 3D
  const tgtMark = h('div.walk-mark.walk-mark--target', h('span.walk-mark__label'), h('span.walk-mark__dia'));
  const roverDist = h('b.mono');
  const roverMark = h('div.walk-mark.walk-mark--rover', h('span.walk-mark__label', 'Rover', roverDist, ' ', tag(SIM_TAG)), h('span.walk-mark__dia'));
  const pointMarks = ACCESS_MARS_POINTS.map(() => h('div.walk-mark.walk-mark--point', h('span.walk-mark__dot')));
  const marks = h('div.walk-marks', tgtMark, roverMark, ...pointMarks);

  const modal = h('div.walk-modal');
  const loading = h('div.walk-loading.mono', 'Loading terrain…');

  const hud = h('div.walk-hud', compass, mini, bodyCard, reserve, missionCard, alertEl, reticle, lookCard, prompt, hint);
  el.append(marks, frame, aiMark, hud, escHint, modal, loading);

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
    g.fillStyle = '#1a0f08'; g.fillRect(0, 0, w, H);
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
  let lastAlert = '', lastPrompt = '', lastLook = '';
  function update(sim, headingDeg) {
    const { s, log } = sim;
    drawCompass(headingDeg);
    drawMini(sim, headingDeg);
    const tg = sim.target();
    tgtName.textContent = tg.kind === 'spot' ? `${tg.id ? tg.id + ' ' : ''}${tg.name}` : 'Rover';
    tgtLine.textContent = `${fmtDistance(tg.metres)} · ${fmtDuration(tg.seconds)}`;
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

    // alert: one at a time, most urgent first
    const id = s.modal ? null : s.alert;
    const key = id ? id + alertDetail(id, s) : '';
    if (key !== lastAlert) {
      lastAlert = key;
      alertEl.replaceChildren();
      if (id) {
        const A = ALERTS[id];
        alertEl.append(h(`div.alert.alert--${A.level}.walk-alert__box`,
          h('div.walk-alert__lvl.mono', A.level), h('div.alert__title', A.title), h('div.alert__text', alertDetail(id, s))));
      }
    }

    // prompt
    let p = '';
    if (!log.ended && !s.modal) {
      if (sim.atTarget()) p = 'take';
      else if (sim.atRover()) p = 'end';
    }
    if (p !== lastPrompt) {
      lastPrompt = p;
      prompt.replaceChildren();
      if (p === 'take') prompt.append(h('kbd', 'E'), h('span', `Take sample · ${fmtDuration(spotSeconds())} of work`));
      if (p === 'end') prompt.append(h('kbd', 'E'), h('span', 'End excursion'));
      prompt.classList.toggle('is-on', !!p);
    }
    hint.classList.toggle('is-off', s.started);
  }

  function alertDetail(id, s) {
    const i = s.alertInfo[id] || {};
    switch (id) {
      case 'turnBack': return `Reserve on return ${fmtDuration(i.reserveS)}. Head for the rover.`;
      case 'steepUnder': return `${Math.round(i.slopeDeg)}° here. Rule broken: slope on foot, at most ${RULES.slopeMaxDeg.value}°.`;
      case 'edge': return 'The mapped terrain ends here.';
      case 'steepAhead': return `Ground over ${RULES.slopeMaxDeg.value}° in ${Math.max(1, Math.round(i.m))} m. Closed to the route.`;
      case 'offPath': return `${Math.round(i.m)} m from the planned route.`;
      case 'radioAhead': return `No line of sight to the rover in ${Math.max(1, Math.round(i.m))} m.`;
      default: return '';
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
  let lastRoverTxt = '';
  function setMarks(target, roverP, roverOn, points) {
    const box = alertEl.firstChild && alertEl.firstChild.getBoundingClientRect();
    minY = Math.max(window.innerHeight * 0.27, box ? box.bottom + 40 : 0);
    const toRover = target.kind === 'rover';
    place(tgtMark, target.p, !toRover);
    if (!toRover) tgtMark.firstChild.replaceChildren(h('span', target.name + ' '), h('b.mono', fmtDistance(target.metres)));
    // the rover carries its own label (simulated); as the target it also shows the distance
    const txt = toRover ? fmtDistance(target.metres) : '';
    if (txt !== lastRoverTxt) { lastRoverTxt = txt; roverDist.textContent = txt ? ' ' + txt : ''; }
    roverMark.classList.toggle('is-target', toRover);
    place(roverMark, roverP, roverOn);
    points.forEach((q, i) => place(pointMarks[i], q.p, q.on));
    const blocks = [box, lookCard.classList.contains('is-on') && lookCard.firstChild && lookCard.firstChild.getBoundingClientRect(),
      prompt.classList.contains('is-on') && prompt.getBoundingClientRect()].filter(Boolean);
    quietIfCovering(tgtMark, blocks);
    quietIfCovering(roverMark, blocks);
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
      h('p.walk-modal__text', `${route.spot.name}: sandstone of the butte (Stimson formation), bagged ${fmtDistance(Math.hypot(log.sample.x - ROVER.x, log.sample.z - ROVER.z))} from the rover. The photo shows this rock in the Murray Buttes as Curiosity saw it, not this exact spot.`),
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

  return { setTerrain, update, setLook, setMarks, showSample, showEmpty, hideModal, setEscArmed, setLoading, hud };
}

