# 024 Tune the default regional scenario for the demo
owner: builder
state: in progress
area: app/src/map/scenario.js, app/src/map/planner.js, app/src/map/mapView.js, app/src/model/comms.js

## Goal
After 022 the default scenario (research/planner-022-regional.png) no longer tells the story:
1. Reserve at lander is 0 % (buffer 20 %). The default plan should be feasible but tight: lander reserve 20–35 %, with a visible turn-back/leave-by at the farthest station that actually matters (e.g. "can work N of M min"). Tune station times/count, suit start, or EVA start; don't fake the model.
2. Comms shadow covers almost the whole route (434 min); "Move relay to high ground" only cuts it to 124 min. Default: one or two clear shadow segments near the buttes (relay rover at the lander can't see behind them); the relay button moves the rover to a real high point that clears it (target ≤ 10 min, or clearly near zero). Consider a relay mast height (state an assumed antenna height, labelled assumed) and/or choosing the relay spot by searching high cells that maximise route visibility. Keep it honest: chips say modelled/assumed.
3. Labels near Quela crowd; "Mudstone outcrop" is clipped under the left panel. Keep labels inside the visible map area right of the panel, or pan/fit the initial view so the route sits right of the panel.
4. Optional, only if cheap: refine slope with the 1 m DTM inside the 1 km area so butte flanks aren't under-read.

## Done when
Tests (add a test for default scenario: reserve ≥ 20 %, shadow before relay > 0, after relay ≤ 10 min or ≥ 90 % reduction), build, 0 console errors, screenshot research/planner-024.png (before and after relay), walk view still works.
