# 003 2D route planner
owner: builder
state: open
area: app/src/map/

## Goal
Map view: hillshade/slope layer from task 002 (stub with Access Mars grid until it lands), click to add/move/remove waypoints, path between waypoints (A* on slope cost, hard limit 20°, prefer <15°, avoid no-data), per-leg distance/slope/time. Uses modules 004/005 when available.

## Done when
Route can be planned at Murray Buttes; infeasible legs are flagged with reason; unit test for A* on a small grid. Wave 1.
