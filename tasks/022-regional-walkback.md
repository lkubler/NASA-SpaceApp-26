# 022 Regional scale: lander 2.5 km out, real walkback
owner: builder
state: open (start after 018–019 merge — edits app/src/map/)
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
