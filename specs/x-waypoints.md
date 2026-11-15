# Movable waypoints
The visitor should understand: the route is mine to shape; the rules still decide whether it holds.
Rests on: `specs/2-plan.md`, `specs/feedback-1.md` (several stops), the team's notes (movable waypoints, dynamic path generation).

Waypoint => a point the route must pass; no sample, no work time there
Add => dragging any point of the route line on the Plan map makes a waypoint there; the route bends through it
Move => dragging a waypoint moves it
Remove => a small × on the selected waypoint removes it; "Clear" removes all waypoints and stops
While dragging => a thin preview line follows the pointer
On release => the legs around the waypoint are planned again by the same rules as every leg; distance, time, reserve and all checks update
Number => no fixed limit; if planning gets noticeably slow, the builder reports at how many
Not allowed ground (over 20°, outside the site) => the waypoint turns red while over it and returns to where it was on release
Map drag and zoom => still work; a drag that starts on the route line moves a waypoint, anywhere else it moves the map; a click on a spot still selects it
Panel => the leg list shows waypoints as small unnamed points between the stops
Go / no-go, Walk, Debrief => use the shaped route as the plan; waypoints are not targets, get no beacon and no sample
Walk, off path => measured against the shaped route
A route that breaks a rule because of a waypoint => shown like any broken route; Go / no-go names the rule
Label => model, like the route
No waypoint set => everything works exactly as before
Dev jump => waypoints can be given in the address like stops

Not in this spec: waypoints added during the walk, automatic suggestions, saving routes, route straightening
