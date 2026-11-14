# Martian Map app

Static web app (Vite + Three.js). Builds to `app/dist`, deployed by `.github/workflows/pages.yml`.

## Run, test, tune
```
cd app
npm install
npm run dev        # http://localhost:5173
npm run build      # -> dist/ (relative URLs, works under the Pages sub-path)
npm test           # core unit tests (vitest, test/*.test.js)
npm run tune [76]  # per-candidate plan numbers and detours for a demo factor
```

Journey test (whole visitor journey in headless Chromium, no dev jump; screenshots to `../reviews/journey/<run>/`;
fails on any console error or on numbers that differ between Plan, Go / no-go and Debrief). Playwright is not
an app dependency: install it anywhere (`npm i playwright@1.46 && npx playwright install chromium`).
```
npm run dev &
PW=/path/to/node_modules/playwright/index.mjs node scripts/journey.mjs http://localhost:5173/ [near-1280 far-1280 far-1920]
```

## Dev jump
`?step=N` opens step N with the state the earlier steps would have produced (each step's `devFixture`).
`&spot=F7` picks the spot in step 2 (default F3). Example: `?step=5&spot=F7`.

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
