# Live route in the walk
The visitor should understand: the display always shows me the way to my next goal from where I stand.
Rests on: `specs/4-walk.md`, `specs/feedback-1.md` (several stops), `specs/x-waypoints.md`, the team's usage review in `notes.md` ("way back to the route is not calculated or shown", "Turn back now at the wrong moment").

## Route to the next goal
Route shown in the walk (band on the ground, small map) => runs from where the crew stands to the current target, planned by the same rules as in Plan
Crew moves => the route is planned again from the new place; no visible stutter, no flicker of the band
Current target => as built: the next stop, after the last sample the rover, after "Turn back now" the rover
Waypoints still ahead on this leg => the live route passes them
Planned route => stays visible as a thin, faint line, so plan and walk can be compared
"Off the path" => still measured against the planned route; it stays a caution, and the live route is the way to go on
No way to the target by the rules from here (e.g. standing in closed ground) => the display shows the shortest way back to allowed ground, in the warning colour
Distance and time to the target on the display => along the live route
Reserve on return => as built (from here, remaining stops, way home)
Label => model, like the route
Crew stays on the planned route => looks and counts as before
Debrief => planned against actual as before; the live route is not stored

## Turn back now, the moment
Round fits the suit => as built
Round is longer than the suit allows (reserve below zero right at the start) => no "Turn back now" at the rover; instead one caution "This round is longer than the suit allows" with the stops that still fit
Turn back now in that case => comes when going on to the next stop would no longer leave a way home with reserve; it then skips the remaining stops as built
Reserve on return in that case => counts the stops that still fit and the way home, and says which stops are left out; it is not shown as a large negative time while oxygen for hours is left
Go / no-go => unchanged: it still names the broken rule before the walk

Not in this spec: changing the plan during the walk, new stops in the walk, a new speed model, changes to Plan or Go / no-go
