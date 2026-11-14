# 001 App shell from 3D spike + GitHub Pages deploy
owner: builder
state: done
area: app/ (Vite), .github/workflows/

## Goal
Turn `spike-3d/` (branch spike-3d) into the real app in `app/`: Vite + Three.js, routes/views for Map (2D planner) and Walk (3D), shared state module (route, site, settings), `src/styles/tokens.css` from docs/design.md. Deploy to GitHub Pages via Actions (repo goes public; check with humans before flipping visibility).

## Done when
`npm run build` passes; Map and Walk views switch; Murray walk from the spike still works; Pages workflow builds (deploy can wait for public repo); main stays runnable. Wave 1, do first.

## Result (builder, branch task-001-app-shell)
Done. App in `app/` (Vite 6 + Three 0.170): `src/main.js`, `state.js` (pub/sub store: view, site, settings), `map/mapView.js` (placeholder canvas), `walk/walkView.js` + `oldDraco.js` (from spike-3d), `ui/nav.js`, `styles/tokens.css` (design.md section 11). Hash routes `#/map`, `#/walk`. Pages workflow `.github/workflows/pages.yml` (builds `app/`, deploys on push to main; vite `base: './'`); repo visibility untouched.
Test: `cd app && npm i && npm run build && npx vite preview`, open `/#/walk` (WASD) and `/#/map`; headless: `node check.mjs http://localhost:4173/#/walk shot.png` (0 errors verified). `window.__app` exposes the walk test API.
