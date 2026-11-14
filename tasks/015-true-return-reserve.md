# 015 True return reserve and a scenario that shows it
owner: builder
state: done
area: app/src/map/, app/src/model/reserve.js, app/src/state.js

## Goal
From research/jury-prototype.md changes 1+2 (read it, section "The 5 changes" and the label fixes).
1. Return cost from each route point = cost of the best path home (A* back to the lander from that point on the same cost grid), not the outbound path reversed. Johnson 2009 (SEXTANT predecessor) already does "path home from any point" — ours must at least match it, then add load/slope metabolic cost + comms.
2. Turn-back point = the last point (walking or at a station) where remaining consumables ≥ return cost + 20 % buffer. Show the clock time you must turn back (not the time the next station would end). Route includes the leg home: plan as a loop (last station → lander) and show it.
3. One speed model: the same slope-dependent walking speed for planner time, energy, and the 3D walk (walkView currently 1.4 m/s vs planner 0.97 m/s) — export it from one module.
4. Default scenario: a 1.5–2 km loop inside the DTM with named science stations (use the briefing objective: cross-bedding in Stimson sandstone at the butte foot, Quela drill site, Marimba; positions from research/data-science.md), so the walk home is a meaningful part of the budget. The comms shadow and the turn-back marker should fall at least partly inside the 128 m 3D walk square, so the walk demo shows them. Comms source: the lander must not sit in its own shadow; pick ONE source name (lander or rover/relay) and use it everywhere (map, Walk toasts, app/src/ui/sources.js line on viewshed).
5. Demo moment: one-click "fix" — e.g. "Move relay to ridge" or "Reroute around shadow" button turns the red shadow warning green.
6. Map label fixes: "Walking distance" is computed → MODELLED (from measured DTM); "exceeds 10 min limit" → "exceeds assumed 10 min mission rule" and make the limit editable.

## Done when
Tests (incl. return-path cost and turn-back time) pass, build passes, 0 console errors, screenshot research/planner-015.png, and the Walk view spawned on the default route shows the shadow segment and turn-back marker inside the walk square.

## Result (builder)
- Return cost = best path home from each route point (map/home.js, Dijkstra on the cost grid, Pandolf energy in travel direction). The route is a loop (lander, 5 stations, lander). Turn-back = last safe point; at a station: "leave by HH:MM, N of M min of work".
- One speed model: model/speed.js (planner time, reserve energy and the 3D walk all use 0.97 m/s x slope factor).
- Default loop 1.5 km: mudstone outcrop, butte flank, Quela drill, Murray/Stimson contact, cross-bedding at the butte foot (durations assumed). Marimba is NOT in it: it lies on the DTM north edge and no relay position sees it together with Quela. Comms source: "relay rover" (COMMS_SOURCE_NAME).
- Default relay beside the lander gives a 277 min shadow (red); the button "Move relay to high ground" gives 3 min (within the assumed 10 min rule, editable in the panel). Reserve tile is coloured by margin; night warning added (Mars24 sunset about 18:06).
- How to test: `node --test src/model/*.test.js src/map/*.test.js`; `npm run build`; `vite preview --port 4315`, then `node check-015.mjs` and `node check-015-walk.mjs` (screenshots research/planner-015*.png, research/walk-015.png).
- Not done: orthoimage base (task 016 wiring); the home path is drawn only from the turn-back point.
