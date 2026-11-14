# Martian Map app

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
three. Playwright is not an app dependency: install it anywhere (`npm i playwright@1.46 && npx playwright install chromium`).
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

## Walk keys
Hold the mouse button and drag to look around; Chromium also captures the mouse on that press (pointer lock), so
moving it alone turns the view. Firefox on Linux gets no pointer lock (its lock reports movement as the offset
from the lock point where it cannot re-centre the cursor, e.g. under Wayland: the view turned one way only), nor
does a browser that refuses the lock: there the drag turns the view. W A S D walk, arrow keys turn and look, Shift held fast walk (`ASTRONAUT.fastPaceFactor`), Shift tapped twice
demo speed on / off (`DEMO.screenSpeedFactor`, movement only), F aim mode (click jumps to the marker, counted as
walked on the `findRoute` way; F or esc cancels), E take sample / end excursion, esc twice end the mission.
Test hook: `window.__walk` (`advance`, `hold`, `info`).

## Dev jump and test states (URL parameters; never reached by a visitor)
- `?step=N` opens step N with the state the earlier steps would have produced (each step's `devFixture`).
- `?step=4` opens the walk without the intro (`specs/x-intro.md`); `?step=4&intro=1` plays it anyway. Go / no-go is
  skipped there, so the film is not preloaded and only part B (stepping out) plays; for the full intro open
  `?step=3&spot=F1` and click "Start excursion".
- `&spot=F7` picks the spot in step 2 (default F3). Example: `?step=5&spot=F7`.
- `?step=2&broken=1` adds a test point up the east butte wall as spot 07 (`steps/3-go/dev/broken.js`): no route
  keeps the slope rule, so the Plan map shows the red broken stretch above the spot markers.
- `?step=4&broken=1` starts the Walk (and, ended, the Debrief) on that broken route: the rule broken in the plan is carried along.
- `?step=5&outcome=home|broken|lost` opens the Debrief with a walk log built from the core functions
  (`steps/5-debrief/fixtures.js`): back home, home with broken rules (slope broken several times, shown once
  as "(4×)"), or suit empty before the rover. Use with `&spot=F7`.

## Shared state (`src/frame/state.js`, one object; steps read and write only this)
```
{ step: 1..5,
  request: null | { id, title, ... },   // chosen request (step 1)
  requestsDone: string[],               // finished request ids (step 5 adds one)
  candidates: [{ candidate, route, plan }],   // planAllCandidates (step 2)
  spotId: null | 'F1'..'F7',            // chosen spot (step 2)
  route: null | Route,                  // planRoute (step 2)
  plan: null | PlanNumbers,             // planNumbers (step 2; read by 3 and 5)
  walk: null | WalkLog }                // newWalkLog / logMove (step 4; read by 5)
```

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
- `planRoute(t, spot)`, `planAllCandidates(t)`, `planNumbers(t, route)` the one set of numbers for Plan, Go and Debrief; `reserveFrom(t, levels, { x, z, phase, spot })` live reserve.
- `newWalkLog()`, `logMove(log, t, { from, to, dtS, workW, radio, spot })`, `simulateWalk(t, route)`.

## Demo factor
`DEMO.timeFactor` = 76 (assumption): the farthest candidate F7 (138 m round trip) comes back with about 1 h 12 reserve;
detours on the way can force a turn back. See `npm run tune`.

## AI use
This app's code was written with an AI coding agent (Claude Code, Anthropic) from the team's specs. The helmet frame image is AI-generated and marked as such on screen. Log: `../docs/ai-use.md`.
