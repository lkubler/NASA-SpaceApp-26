# 2 Plan
The visitor should understand: every sample spot costs something different, and the map proposes only ways that keep NASA's rules.
Rests on: `specs/rules.md`, `research/walk-targets.md`, `research/walk-terrain.md`

Map => the site from above, drawn from the same terrain the visitor walks; north up; scale bar
Outside the site => not shown
Rover => at the start point, marked as home
Too steep => ground over 20° hatched red
Radio shadow => ground without line of sight to the rover dotted yellow
Candidates => every spot where the requested sample can be taken, as markers
Route per candidate => rover to spot and back, fastest route that keeps every rule; calculated in the browser when the step opens
List => one row per candidate: time, reserve on return with the limiting consumable, time in radio shadow, broken rules; sorted by time; the cheapest is marked
Hover or select => the real photo of the spot and one sentence on what is there
Choosing => exactly one candidate; its route is drawn; stretches in radio shadow are marked on it
Candidate without a rule-keeping route => its best route is shown, the broken rules in red in the list and on the route
Work at the spot => fixed duration, counted in time and consumption; label: assumption
Main button => "To go / no-go"; active once a candidate is chosen

Not in this spec: own waypoints, placing a device, route coloured by effort, pace.
