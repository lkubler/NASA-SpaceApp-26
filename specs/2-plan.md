# 2 Plan
The visitor should understand: every spot costs something different, and the map proposes only ways that keep NASA's rules.
Rests on: `specs/rules.md`, `research/walk-targets.md`, `research/walk-terrain.md`, `docs/mockups/02-plan-route.png`

Layout => as in the mockup: map panel left with legend below, on the right the headline "Plan your mission.", cards, the list of legs, three totals, the main button
Map => the site from above, drawn from the same terrain the visitor walks; north up; scale bar
Rover => at the start point, marked as home
Too steep => ground over 20° hatched
Radio shadow => ground without line of sight to the rover dotted
Candidates => the reachable spots at the foot of the buttes from `walk-targets.md`, as numbered markers; label: position derived from the terrain
Access Mars points => the four real points (Buttes, Monument Valley, Bruce Murray, Interference) shown with their text; not sample spots
Route per candidate => rover to spot and back, fastest route that keeps every rule; calculated in the browser when the step opens
Selecting a candidate => its card on top of the panel: name, rock, work time, distance; its route in cyan dots on the map
Legs => rover, on foot, spot, on foot, rover, each with distance and time
Totals => total time, reserve on return with the limiting consumable, steepest slope
Comparing => every marker shows its total time on hover; the cheapest is marked
Stretches in radio shadow => marked on the route
Candidate without a rule-keeping route => its best route is shown, the broken rules in red in the panel and on the route
Work at the spot => fixed duration, counted in time and consumption; label: assumption
Main button => "Confirm route"; active once a candidate is chosen

Not in this spec: rover route, handover point, infrastructure site, own waypoints, route coloured by effort, pace.
