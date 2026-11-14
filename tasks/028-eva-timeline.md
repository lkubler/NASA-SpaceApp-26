# 028 EVA timeline strip under the map + walk HUD reserve fix
owner: builder
state: done
area: app/src/map/timeline.js (new), small mount hook in app/src/map/mapView.js, app/src/walk/route3d.js

## Goal (research/jury-prototype-2.md change 2)
- Bug first: in the guided time-lapse the walk HUD reserve jumps to the after-work value on arrival at a station (route3d.js picks the first point with elapsed_s >= clock; station points include dwell). Interpolate reserve (and anything else sampled) by time, including inside station dwell. Add a unit test.
- New strip under/beside the map (fits 1280×720 without covering the route; collapsible): x axis = EVA clock. Line 1: suit reserve. Line 2: reserve needed to get home from there (best-path-home return cost + 20 % buffer). Where they touch = turn-back (amber marker, same as map). Magenta bands = out of contact (route.shadows). Station blocks with numbers. Data already in route.reserve.points / route.shadows / home field. Updates live on replan (relay move: magenta bands vanish; drill 70 → 90 min: lines touch, leave-by appears).
- Hover shows clock, reserve, needed-to-home.
- If cheap and the strip is done: REMS sol 1440 measured air/ground temperature along the same clock (research/data-science.md section 2; check what's already in app/public/data) and Mars24 sun elevation, small, chips measured/modelled.
Coordinate: task 029 also edits mapView (folds, sources); keep your mapView diff to the mount + data hand-off.

## Done when
Tests + build, 0 console errors, screenshots research/timeline-028.png (default), -relay.png (after relay), -drill90.png (drill 90 min, leave-by visible), walk HUD reserve matches the model mid-dwell.

## Result (builder)
state: done. Branch worktree-agent-afbe49198bff30ac0.
- Bug fix: `app/src/model/timeSeries.js` (new, pure) builds knots at arrival and departure of every station (arrival value = remaining + station energy) and interpolates reserve and return need by TIME. `walk/route3d.js` uses it in the guided time-lapse instead of the first route point with elapsed_s >= clock. Unit tests: `model/timeSeries.test.js` (3; mid-dwell value is between arrival and departure, not the after-work value). Suite: 58 pass (55 + 3).
- Strip: `app/src/map/timeline.js` + `styles/timeline.css`, mounted in mapView with 4 small edits (import, mount, fit() reserves the strip height so the route is not covered, `tl.update(route, startH)` after each replan). x = EVA clock; white line = suit left; dashed = best way home + 20 % buffer; amber diamond + "Leave by hh:mm" where they touch (amber tint where the suit no longer covers it); magenta hatched bands = route.shadows; numbered station blocks; hover readout "clock, suit %, home needs %, sun elevation, NO LINK"; MODELLED chip; Hide/Show collapse (remembered in localStorage, try/catch). Draws are guarded against a 0x0 hidden map. Fits 1280x720 (640x144 px, bottom, between planner panel and layers key).
- Numbers (default plan): no turn-back, strip shows no leave-by; 115 min shadow (bands visible). Drill 90: turn-back at station 5, "Leave by 12:39", lines touch. Relay move: shadows [] and bands vanish. 0 console errors.
- Walk HUD mid-dwell (station 2, guided): reserve 0.754 / 0.731 vs expected 0.754 / 0.731 (arrive 0.798, depart 0.714); no jump to the after-work value.
- Not done: REMS sol 1440 temperature curve. The data is not in app/public/data (only murray/), so it needs a download, parse and bundling step; not cheap. Sun elevation (Mars24, modelled) is in the hover readout instead.
- Screenshots: research/timeline-028.png (default), -hover, -drill90 (leave-by visible), -relay, -collapsed, -walkhud.
- Test: `cd app && npm install && npm run build && node --test src/model/*.test.js src/map/*.test.js src/walk/*.test.js`; open #/map, hover the strip, set drill to 90 min (Stations table), press Move relay.
