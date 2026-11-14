# 024 Tune the default regional scenario for the demo
owner: builder
state: done
area: app/src/map/scenario.js, app/src/map/planner.js, app/src/map/mapView.js, app/src/model/comms.js

## Goal
After 022 the default scenario (research/planner-022-regional.png) no longer tells the story:
1. Reserve at lander is 0 % (buffer 20 %). The default plan should be feasible but tight: lander reserve 20–35 %, with a visible turn-back/leave-by at the farthest station that actually matters (e.g. "can work N of M min"). Tune station times/count, suit start, or EVA start; don't fake the model.
2. Comms shadow covers almost the whole route (434 min); "Move relay to high ground" only cuts it to 124 min. Default: one or two clear shadow segments near the buttes (relay rover at the lander can't see behind them); the relay button moves the rover to a real high point that clears it (target ≤ 10 min, or clearly near zero). Consider a relay mast height (state an assumed antenna height, labelled assumed) and/or choosing the relay spot by searching high cells that maximise route visibility. Keep it honest: chips say modelled/assumed.
3. Labels near Quela crowd; "Mudstone outcrop" is clipped under the left panel. Keep labels inside the visible map area right of the panel, or pan/fit the initial view so the route sits right of the panel.
4. Optional, only if cheap: refine slope with the 1 m DTM inside the 1 km area so butte flanks aren't under-read.

## Done when
Tests (add a test for default scenario: reserve ≥ 20 %, shadow before relay > 0, after relay ≤ 10 min or ≥ 90 % reduction), build, 0 console errors, screenshot research/planner-024.png (before and after relay), walk view still works.

## Result (builder)
Before (022) -> after (024), default scenario (lander site B, 5 stations, EVA start 08:30, suit 100 %):
- Distance 5.9 km (unchanged). EVA 7.3 h -> 4.9 h (back 13:23). Reserve at lander 0 % (model -8 %) -> 22 % (buffer 20), whole loop within budget; slack about 10 min of extra station work (new line in the verdict).
- Station times (assumed, editable, still tagged modelled): imaging 20, cross-bedding 40, Quela drill 70, Murray/Stimson 30, mudstone 25 min (was 30/60/120/60/60). No turn-back is shown by default: with a feasible plan the turn-back is null by construction (it only triggers when the buffer would be broken); the verdict states the slack instead. Add about 10 min of work (e.g. drill to 90 min) and "Leave station N by hh:mm" appears as before.
- Comms: relay first guess is now an assumed spot on the rise 1.4 km SW of the lander (it sees the lander, not behind the buttes): longest shadow 434 min -> 115 min (Quela area) with a few shorter segments along the route. "Move relay to high ground": 115 min -> 0 min; relay lands 1164 m from the lander. Antenna height 2 m stated as assumption (chip under the verdict, RELAY_ANTENNA_M in scenario.js).
- Relay search: lattice 30 m within 3 km of the lander (was 80 m, +-200 m of route), best candidates re-scored with the map's own viewshed (bestRelay `verify`, routeShadowScore) because the line-of-sight pre-score disagreed at shadow edges. About 3 s in node, a few seconds in the browser. A 40 m lattice misses the good spot.
- Labels: on-map key and side panel are label obstacles; view fit keeps the relay icon out from under the key; fit is redone after the relay moves. Mudstone outcrop no longer clipped.
- Not done (optional item 4): 1 m slope refinement.
- Test: `cd app && npm run build && node --test src/model/*.test.js src/map/*.test.js src/walk/*.test.js` (55 pass; new test in src/map/regional.test.js). Screenshots research/planner-024.png (before relay) and research/planner-024-relay.png (after); 0 console errors in the headless run; Walk view code untouched.
