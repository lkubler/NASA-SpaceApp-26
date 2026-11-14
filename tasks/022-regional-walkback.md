# 022 Regional scale: lander 2.5 km out, real walkback
owner: builder
state: done
area: app/src/map/, app/src/terrain/, app/src/model/

## Goal
Make the return reserve meaningful at NASA walkback scale (2–3.5 km, research/sources-validity.md). Use the regional layer (app/public/data/murray/regional_*, regional.json: 800² × 5.059 m = 4.05 km; exact offset to the 1 km grid: col_1km = col_reg*5 − 700, row_1km = row_reg*5 − 1488; research/data-science.md section 7).
- Map supports two scales: regional overview (4 km) and the 1 km detail; zoom switches/blends; the 3D walk square stays marked.
- Default lander at site B (SE, lon 137.39435, lat −4.70324, ~2.5 km from Quela; easiest approach). Route: lander → traverse → Murray Buttes stations → back. Path finding: A* on the regional grid for long legs, detail grid inside the 1 km area (or a single A* on regional with detail refinement near stations — choose the simplest that stays < 1 s).
- Best-path-home from every point (map/home.js) on the regional grid, so the walk home is now ~30–45 min and a real share of the budget; turn-back point should then be driven by distance + slope + load, not only station time.
- Comms: relay rover options on regional scale (keep "Move relay to high ground" demo).
- Keep everything else (stations, EVA clock, labels, state keys for Walk) working.

## Done when
Tests (incl. cross-grid path), build, 0 console errors, screenshots research/planner-022-regional.png and -detail.png; default scenario: total walk 4–6 km, walk home from the farthest station 25–45 min, turn-back shown.

## Result (builder)
- Map now plans on the 5 m regional grid (app/src/terrain/regional.js, frame = regional metres); the 1 km orthoimage fades in over it above ~1.1 px/cell zoom; the 3D walk square stays dashed. Scenario in app/src/map/scenario.js: lander at site B (cell 693,486), 5 stations, Quela as station 3.
- Default numbers: 5.9 km, EVA 7.3 h, walk home from the stations 47-54 min (not 25-45: Quela is 2.5 km from B in a straight line, about 43 min at the 0.97 m/s model speed even without detours; the shorter figure needs a closer lander), turn-back at Quela ("leave station 3 by 12:44"), A* plan 0.2 s, best-path-home field 0.2-0.4 s, viewshed 0.3 s.
- Walk view: published route/waypoints/start are translated to the 1 km frame (x,y may be negative or beyond the grid), toScene uses the 1 km transform; state keys unchanged. Verified route inside walk square (287 samples).
- Label crowding: sol labels placed last and dodge stations/labels, duplicate "Quela (photo)" label dropped when a station sits on it, station labels lose minutes at regional zoom, label placer has far stack-out positions. Comms shadow is now a screen-space hatch (crisp at any zoom).
- Limits: regional slope is smoothed (10 m central difference), so steep butte flanks read lower than in the 1 m DTM; the planner does not refine with the 1 m grid.
- Test: `cd app && node --test src/model/*.test.js src/map/*.test.js`; `npm run build && npx vite preview --port 4322` then `node check-022.mjs`; screenshots research/planner-022-*.png.
