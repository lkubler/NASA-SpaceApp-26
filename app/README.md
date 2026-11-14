# MHUD app

Static web app (Vite + Three.js). Builds to `app/dist`, deployed by `.github/workflows/pages.yml`.

Five steps, one excursion on foot at Murray Buttes (Gale crater): 1 Mission (pick a request from Earth),
2 Plan (pick a sample spot; the planner draws the fastest route that keeps every rule), 3 Go / no-go (every
rule checked on that route), 4 Walk (first person through the helmet on the Access Mars terrain; the reserve
on return is recalculated at every step), 5 Debrief (planned next to actual, warnings, report to Earth).

## Run, test, tune
```
cd app
npm ci             # exact versions from package-lock.json
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (relative URLs, works under the Pages sub-path)
npm test           # core unit tests (vitest, test/*.test.js)
npm run tune [76]  # per-candidate plan numbers and detours for a demo factor
```

Journey test (whole visitor journey in headless Chromium, no dev jump). It fails on any console error or on
numbers that differ between Plan, Go / no-go, Walk and Debrief, and writes a JPEG (quality 70) of every screen
to `../reviews/journey/<run>/`. Runs: `near-1280` (spot 01), `far-1280` (spot 06), `far-1920`; default all
three. `stops-1280` (round 01 -> 02 -> 03: badges, leg rows, stops kept after Edit route, every stop on the Go
profile, the walk leg by leg with one sample per stop and no reserve jump, Debrief "3 of 3") and
`stops-turn-1280` (the same round, waiting at stop 2 until "Turn back now" skips stop 3, Debrief "2 of 3") run
only when named. Playwright is not an app dependency: install it anywhere (`npm i playwright@1.46 && npx playwright install chromium`).
```
npm run dev &
PW=/path/to/node_modules/playwright/index.mjs node scripts/journey.mjs http://localhost:5173/ [near-1280 far-1280 far-1920]
```

## Intro (`specs/x-intro.md`, `src/steps/4-walk/intro.js`)
The first walk of a session (a module flag; a reload is a new session) opens with the intro: part A, the team's
film `public/egress/egress.mp4`, fetched as a blob while Go / no-go is open (`src/ui/introFilm.js`) and left out
when it cannot play through at the click (still loading, blocked, no H.264 decoder: Playwright's bundled
Chromium); part B, the live walk camera stepping out of the rover hatch to the walk's start pose (about 4 s, fade
only with `prefers-reduced-motion`), helmet frame only; then the display fades in and the controls are handed
over. The sim, the suit clock and the walk log stand still until then. Skip button, any key or a click ends it at
once. Test hook: `window.__intro` (`phase`: a, hold, b, hud, done; `path`; `skip()`).

## Step transitions (`specs/x-transitions.md`, `src/frame/shell.js`, `src/styles/frame.css`)
The frame animates every step change: the new step mounts at once (interactive at once) under the old one, which
stays as an inert layer while it fades out moving 16 px in the direction of travel (forward left, back right),
then is unmounted (its loops, listeners and WebGL go then). The new page fades in from the other side (about
0.4 s); its main blocks come in one after the other when marked `data-enter="1".."5"` (headline 1, numbers 2,
map 3, main button last; about 0.3 s). The walk fades only (no transform over its canvas); step 1 keeps its own
entry. Walk -> Debrief and Go / no-go -> every walk after the first fade through black (0.3 s + 0.3 s); the first
walk has the intro. A step change during a transition finishes the running one at once. The top menu's marker
slides to the active step. Sources slides in from the right over a dimmed page. Reduced motion: a 150 ms fade,
no movement, no stagger, no drawing. Inside the pages: a newly chosen route draws along its path on the Plan map
(`mapPanel.drawIn`, 0.6 s, not on pan / zoom / redraw); Go / no-go ticks its rule checks in one after the other
and draws its profile once. Test hook: `<html data-step-transition="slide|black|fade">` while a transition runs.

## Walk keys
Mouse look in every browser: a click captures the mouse (pointer lock), then moving it turns the view, no button
held. Without a lock (before the first click, lock refused or released with esc) free look applies: the plain
cursor movement over the walk view turns it, and resting the cursor near the left / right (top / bottom) edge keeps
turning that way (`DISPLAY.edgeZoneFrac`, `edgeTurnDegS`), so it turns all the way round both ways; holding the
button and dragging turns it too. A runtime check releases the lock for the rest of the walk and falls back to
free look when the lock does not hold the cursor (clientX/Y move under the lock) or movementX/Y look like offsets
from the lock point, not steps (`DISPLAY.lockOffsetPx`, `lockOffsetEvents`). W A S D walk, arrow keys turn and look, Shift held fast walk (`ASTRONAUT.fastPaceFactor`), Shift tapped twice
demo speed on / off (`DEMO.screenSpeedFactor`, movement only), F aim mode (click jumps to the marker, counted as
walked on the `findRoute` way; F or esc cancels), E take sample / end excursion, esc twice end the mission.
Test hook: `window.__walk` (`advance`, `hold`, `info`).

## Dev jump and test states (URL parameters; never reached by a visitor)
- `?mousedebug=1` (Walk) shows a small mouse look readout in the bottom-left corner: mode (locked / free look /
  drag), whether the lock check tripped and why, lock refused, last raw movementX/Y, last clientX/Y, mouse events
  per second, summed yaw from the mouse and from the edge zones, edge zone. Example: `?step=4&mousedebug=1`.
- `?step=N` opens step N with the state the earlier steps would have produced (each step's `devFixture`).
- `?step=4` opens the walk without the intro (`specs/x-intro.md`); `?step=4&intro=1` plays it anyway. Go / no-go is
  skipped there, so the film is not preloaded and only part B (stepping out) plays; for the full intro open
  `?step=3&spot=F1` and click "Start excursion".
- `&spot=F7` picks the spot in step 2 (default F3). Example: `?step=5&spot=F7`.
- `&stops=F3,F7,F1` picks a round of up to three stops in that order (wins over `spot`). Example: `?step=3&stops=F3,F7,F1`.
  Plain `?step=2` opens Plan with no stop chosen.
- `?step=2&broken=1` adds a test point up the east butte wall as spot 07 (`steps/3-go/dev/broken.js`): no route
  keeps the slope rule, so the Plan map shows the red broken stretch above the spot markers.
- `?step=4&broken=1` starts the Walk (and, ended, the Debrief) on that broken route: the rule broken in the plan is carried along.
- `?step=5&outcome=home|broken|lost|turned|none` opens the Debrief with a walk log built from the core functions
  (`steps/5-debrief/fixtures.js`): back home, home with broken rules (slope broken several times, shown once
  as "(4×)"), suit empty before the rover, turned back before the last stop (that stop skipped; one stop: halfway
  out), or home without a sample. Use with `&spot=F7` or `&stops=F1,F2,F3` (one sample per stop).

## Shared state (`src/frame/state.js`, one object; steps read and write only this)
```
{ step: 1..5,
  request: null | { id, title, spotId, ... }, // chosen request (step 1); title = the task in 2, 4, 5; spotId = spot preselected in 2
  requestsDone: string[],               // finished request ids (step 5 adds one)
  candidates: [{ candidate, route, plan }],   // planAllCandidates (step 2)
  stops: string[],                      // chosen stop ids in visiting order, 0..3 (step 2), e.g. ['F3','F7','F1']
  spotId: null | 'F1'..'F7',            // = stops[0] (the first stop; kept for older readers)
  route: null | Route,                  // planRound(t, stops) (step 2)
  plan: null | PlanNumbers,             // planNumbers(t, route) (step 2; read by 3 and 5)
  walk: null | WalkLog }                // newWalkLog / logMove (step 4; read by 5)
```
Step 2 always writes `stops`, `spotId`, `route` and `plan` together. Read the stops from `route.stops` (or
`stopsOf(route)`), not from `spotId`. Old states without `stops` are filled from `spotId` when step 2 mounts.

### Several stops (feedback-1): Route and PlanNumbers
A round is rover -> stop 1 -> ... -> stop N -> rover, N = 1..`MAX_STOPS` (3, `PLANNER.maxStops`, assumption).
Each leg is its own `findRoute` (same rules as a single spot). One stop gives exactly the old route and numbers
(`test/stops.test.js` compares with a copy of the old planner, `test/legacyPlan.js`).
```
Route = planRound(t, stops) {
  stops: [{ id, name, x, z }],     // visiting order
  legs:  Path[],                   // N + 1 legs: legs[0] rover->stop 1, legs[k] stop k->stop k+1, legs[N] stop N->rover
                                   // Path = findRoute result { cells: Int32Array, points: [{x,z}], keepsRules, closedM, ... }
  keepsRules,                      // every leg keeps the slope rule
  // convenience fields (one-stop readers: Go spot name, Plan map bounds, tests); Walk and Debrief use stops / legs
  spotId, spot,                    // the FIRST stop
  out,                             // = legs[0]
  back }                           // = legs[1..N] joined into one path (junction cells not doubled)
                                   // one stop: out = legs[0], back = legs[1], as before
PlanNumbers = planNumbers(t, route): all old fields, over the whole round
  (distanceM, timeS, walkS, spotS = one stop's work, reserveS, checks, brokenRules, keepsRules, radio shadow,
   steepest slope, farthest distance, turnBack, profile, energyJ, radiationMSv, ...), plus
  stops:    [{ id, name, order: 1..N, index, sM, tS, x, z }]    // arrival at each stop: profile index,
                                                              // metres and seconds from the start, position
  legPlans: [{ index, from: {id,name}, to: {id,name},          // rover: id null, name ''
               distanceM, seconds, energyJ,                    // this leg alone, on foot
               startM, endM, startS, endS,                     // leg boundaries along the round (metres, seconds;
                                                              // seconds include the work at earlier stops)
               startIndex, endIndex,                           // leg boundaries in plan.profile
               keepsRules, closedM }]                          // this leg's own rule check
  stopsS:   spotS * N                                          // work at all stops
  profile[].leg: 'out' (legs before the last), 'spot' (one extra point per stop: the same place after the
                 work, tS moved on by spotS), 'back' (the last leg, the way home)
  legs (panel list): rover, foot, spot, foot, ..., spot, foot, rover; spot entries carry id and order only when N > 1
  outM = legs[0] metres, backM = the rest; spotAt = the first stop.
  reserveS: work at every stop counted, the way home (last leg) at the walk-back rate 1.2x.
  turnBack: one stop as before (back on the same path); N > 1: on the way to the last stop, work at earlier stops
            counted, home from there by the fastest way.
```
Live reserve, "reserve from here given the remaining stops":
`reserveFrom(t, levels, { x, z, phase: 'out', stops: remaining })` with `remaining` = the stops not yet visited,
next one first (`[{ id, x, z }]`): walk to each in order, the work at each, then home from the last one.
`phase: 'back'` = home from here. `{ spot }` alone still works (= `stops: [spot]`). Returns
`{ seconds, limiting, name, levelsAtHome, homeSeconds, homeMetres, closedM, timeLeft }`, where homeSeconds /
homeMetres / closedM cover the whole way ahead.
Helpers: `stopsOf(route)` the stops in order (old routes: `[route.spot]`), `stopOrdinal(n)` '1st' '2nd' '3rd',
`MAX_STOPS`.

### Several stops: Walk and Debrief
- Walk (`steps/4-walk/sim.js`): the target is the next stop not sampled and not skipped, in plan order, then the
  rover. Target marker, label, minimap and route band follow that leg: the planned `legs[k]` while standing at the
  leg start, else the cost-field way from here (`sim.leg()` -> `{ target, key, kind, stop, points, planned }`).
  A sample is taken at any unsampled stop within `DISPLAY.atTargetM` (also out of order or a skipped one); walking
  past a stop leaves it the target. The reserve is `reserveFrom` with `remainingStops(log)` and does not jump at a
  sample (the last metres are logged along the cost-field way). A round's "Turn back now" fires when that reserve
  reaches 0: the remaining stops are marked skipped (`log.turnedBack`), the target becomes the rover, the warning
  says which stops were skipped and stays until the crew heads home. One stop: as before (nothing skipped).
  Off-path is measured against the whole planned round plus the shown leg; steep and radio ahead follow the shown leg.
  The steep border keeps corridors open along every leg of a round (`createScene3d(host, t, { keepOpen })`).
- WalkLog fields for rounds: `stops: [{ id, name, order, x, z, sampled, tS, skipped }]` (`initStops`),
  `sample` = the first sample taken, `turnedBack: null | { x, z, tS, reserveS, skipped: [ids] }`; helpers
  `remainingStops(log)`, `markSampled(log, indexOrId, at)` (phase 'back' when none remains), `samplesOf(log)`.
  `logMove` without `spot` uses the remaining stops; `simulateWalk` walks every leg with one sample per stop.
- Debrief: "Samples 2 of 3" (big number and table row with each stop taken / skipped / not taken), planned against
  actual for the whole round, the round and stops in order ("1st", filled when sampled) on the map, the report
  names the stops sampled. The request is done with at least one sample and the rover reached. One stop: as before.

## How a step registers
Each step lives in `src/steps/<n>-<id>/` and default-exports
`{ n, id, title, isComplete(state), mount(el, ctx), unmount(), devFixture(state, { params, getTerrain }) }`;
`src/steps/index.js` lists them. `ctx` = `{ state, set(patch), next(), back(), goto(n), canBack(), newMission(),
openSources(), onOverlay(fn), getTerrain(), params }`. Forward only when `isComplete`; back until `state.walk.started`.
A step builder edits only its own directory (and its own `style.css`).

## Core API (`src/core`, import from `src/core/index.js`; every number is in `values.js`)
- `values.js` RULES, ASTRONAUT, WORK, SUIT, RADIO, ENVIRONMENT, DEMO, BODY, HOME, PLANNER: each `{ value, unit, label, src, where, text }`; `sourceOf(entry)`, `listValues()`.
- `sources.js` DOCS, DATA, TOOLS, AI_NOTE for the Sources page.
- `getTerrain()` Promise of the shared walk grid (256 x 256, 0.5 m; x east, z north, rover at 0,0): `heightAt(x,z)`, `slopeAt(x,z)`, `cellOf`, `pointOf`, ...
- `getTerrainScene()` Promise `{ root, tiles, simple, background, skyUrl }` of the Access Mars glb in three.js (z flipped: use `sceneToThree`, `threeToScene`, `headingOf`; haze `ACCESS_MARS_FOG`). Import from `core/terrainScene.js`.
- `workRate(slopeDeg, speed, load)` W in Mars gravity (Pandolf, formulas in suit.js).
- `walkSeconds(m)`, `spotSeconds()`, `demoFactor()` demo suit time.
- `fullLevels()`, `consume(levels, W, s)`, `fractions(levels)`, `timeLeft(levels, W)` -> `{ seconds, limiting, name }`.
- `reserveOnReturn(levels, { energyJ, seconds, homeEnergyJ, homeSeconds })` reserve at the rover (way home at 1.2x).
- `doseMSv(s)`, `outsideTempC(s)`, `bodyReadings(W)` (simulated).
- `findRoute(t, from, to)` route keeping slope <= 20 deg, else best route with `keepsRules: false`; `costField(t, target)` cost to target from every cell.
- `lineOfSight(t, a, b)`, `radioShadowMask(t)`, `hasRadio(t, x, z)` at eye height.
- `CANDIDATES`, `ACCESS_MARS_POINTS`, `ROVER`, `candidateById(id)` places.
- `planRound(t, stops)`, `planRoute(t, spot)` (= one stop), `planAllCandidates(t)`, `planNumbers(t, route)` the one set of numbers for Plan, Go and Debrief; `reserveFrom(t, levels, { x, z, phase, stops | spot })` live reserve; `stopsOf`, `stopOrdinal`, `MAX_STOPS` (see Several stops above).
- `ui/mapPanel.js` option `fade: true`: the map frame stays in the dark ground tone (`is-pending`) until the step calls `map.reveal()`, then ground, hatching, route and markers fade in together (300 ms); revealed anyway after 4 s.
- `newWalkLog()`, `logMove(log, t, { from, to, dtS, workW, radio, spot | stops })`, `simulateWalk(t, route)`; rounds: `initStops`, `remainingStops`, `markSampled`, `samplesOf`.

## Demo factor
`DEMO.timeFactor` = 76 (assumption): the farthest candidate F7 (138 m round trip) comes back with about 1 h 12 reserve;
detours on the way can force a turn back. See `npm run tune`.

## AI use
This app's code was written with an AI coding agent (Claude Code, Anthropic) from the team's specs. The helmet frame image is AI-generated and marked as such on screen. Log: `../docs/ai-use.md`.
