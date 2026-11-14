# 4 Walk
The visitor should understand: at every step the helmet tells me whether I can still get home.
Rests on: `specs/rules.md`, `research/helmet-display.md`, `research/walk-terrain.md`

View => first person on the terrain, through a helmet frame; starts at the rover, facing the route
Moving => keys and mouse, at walking pace
Route => the planned route as a line on the ground; the target as a marker
Display position => small, at the top and upper right; the ground ahead stays clear

Always shown:
Target => direction and distance
Reserve on return => as a bar, with the limiting consumable
Radio => connected or shadow
Minimap => route, own position, rover
Demo time => the factor

Only when needed, in the centre, one at a time, most urgent first:
Steep stretch ahead => caution, before the crew reaches it
Ground over 20° underfoot => warning; counted as a broken rule
Radio shadow ahead => advisory, before the crew enters it
Off the path => caution; no new route
Turn back now => warning when the reserve on return reaches zero; stays until the crew heads home
Edge of the site => caution, then the visitor is stopped
Same spots => each warning appears where the plan marked it

At the target => "E: take sample"; time moves on by the work duration; the real photo and one sentence; the target switches to the rover
Suit empty before the rover => the walk ends; the debrief says so; label: simulated
Back at the rover => "E: end excursion", then Debrief

Not in this spec: abort key, pace, rerouting, sudden events, partner, suit readings in detail.
