# 4 Walk
The visitor should understand: at every step the helmet tells me whether I can still get home.
Rests on: `specs/rules.md`, `research/helmet-display.md`, `research/walk-terrain.md`, `docs/mockups/04-helmet-view.png`

View => first person on the terrain, through the helmet frame; starts at the rover, facing the route
Sky and horizon => the real background image of the Access Mars scene (`app/public/murray/background.jpg`, from Curiosity's images); never a black or invented sky
Rover => a simple rover model stands at the start point and covers the gap in the terrain there; label: simulated
Moving => keys and mouse, at walking pace
Route => a cyan band on the ground; the target as a diamond marker with name and distance
Layout => as in the mockup; the ground ahead stays clear

Always shown:
Compass => strip at the top with heading
Minimap => round, top left: route, own position and view direction, rover; below it the target with distance and time
Reserve => a chip at the lower left: reserve on return, the limiting consumable, time left
Suit and body => card top right: heart rate, core temperature, suit pressure, CO2; label: simulated
Mission => card bottom right: time outside, radiation dose, outside temperature, power, radio to rover
Demo time => the factor, in the mission card
End => "esc: end mission" at the bottom

Only when needed, in the centre, one at a time, most urgent first:
Steep stretch ahead => caution, before the crew reaches it
Ground over 20° underfoot => warning; counted as a broken rule
Radio shadow ahead => advisory, before the crew enters it; the radio line in the mission card changes inside
Off the path => caution; no new route
Turn back now => warning when the reserve on return reaches zero; stays until the crew heads home
Edge of the site => caution, then the visitor is stopped
Same spots => each warning appears where the plan marked it

Looking at a butte or an Access Mars point => a card beside the reticle: name, one sentence, size
At the target => "E: take sample"; time moves on by the work duration; a real Curiosity photo of this rock and one sentence; the target switches to the rover
Suit empty before the rover => the walk ends; the debrief says so; label: simulated
Back at the rover => "E: end excursion", then Debrief

Not in this spec: abort key, pace, rerouting, sudden events, partner.
