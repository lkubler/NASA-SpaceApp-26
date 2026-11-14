# 001 App shell from 3D spike + GitHub Pages deploy
owner: builder
state: open
area: app/ (Vite), .github/workflows/

## Goal
Turn `spike-3d/` (branch spike-3d) into the real app in `app/`: Vite + Three.js, routes/views for Map (2D planner) and Walk (3D), shared state module (route, site, settings), `src/styles/tokens.css` from docs/design.md. Deploy to GitHub Pages via Actions (repo goes public; check with humans before flipping visibility).

## Done when
`npm run build` passes; Map and Walk views switch; Murray walk from the spike still works; Pages workflow builds (deploy can wait for public repo); main stays runnable. Wave 1, do first.
