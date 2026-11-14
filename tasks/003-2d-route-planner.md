# 003 2D route planner
owner: builder
state: done
area: app/src/map/

## Goal
Map view: hillshade/slope layer from task 002 (stub with Access Mars grid until it lands), click to add/move/remove waypoints, path between waypoints (A* on slope cost, hard limit 20°, prefer <15°, avoid no-data), per-leg distance/slope/time. Uses modules 004/005 when available.

## Done when
Route can be planned at Murray Buttes; infeasible legs are flagged with reason; unit test for A* on a small grid. Wave 1.

## Result
How to test: `cd app && node --test src/map/planner.test.js src/model/*.test.js`; `npm run build && npx vite preview --port 4191`, then `node check-map.mjs http://localhost:4191/#/map ../research/planner.png 4`. Screenshot: research/planner.png. Map uses the HiRISE DTM (1 km), falls back to the Access Mars grid. Route results are in state.js (route, rover, reserve, comms).
