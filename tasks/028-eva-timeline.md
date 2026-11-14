# 028 EVA timeline strip under the map + walk HUD reserve fix
owner: builder
state: in progress
area: app/src/map/timeline.js (new), small mount hook in app/src/map/mapView.js, app/src/walk/route3d.js

## Goal (research/jury-prototype-2.md change 2)
- Bug first: in the guided time-lapse the walk HUD reserve jumps to the after-work value on arrival at a station (route3d.js picks the first point with elapsed_s >= clock; station points include dwell). Interpolate reserve (and anything else sampled) by time, including inside station dwell. Add a unit test.
- New strip under/beside the map (fits 1280×720 without covering the route; collapsible): x axis = EVA clock. Line 1: suit reserve. Line 2: reserve needed to get home from there (best-path-home return cost + 20 % buffer). Where they touch = turn-back (amber marker, same as map). Magenta bands = out of contact (route.shadows). Station blocks with numbers. Data already in route.reserve.points / route.shadows / home field. Updates live on replan (relay move: magenta bands vanish; drill 70 → 90 min: lines touch, leave-by appears).
- Hover shows clock, reserve, needed-to-home.
- If cheap and the strip is done: REMS sol 1440 measured air/ground temperature along the same clock (research/data-science.md section 2; check what's already in app/public/data) and Mars24 sun elevation, small, chips measured/modelled.
Coordinate: task 029 also edits mapView (folds, sources); keep your mapView diff to the mount + data hand-off.

## Done when
Tests + build, 0 console errors, screenshots research/timeline-028.png (default), -relay.png (after relay), -drill90.png (drill 90 min, leave-by visible), walk HUD reserve matches the model mid-dwell.
