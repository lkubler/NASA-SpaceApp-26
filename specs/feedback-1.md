# Feedback round 1
The visitor should understand: nothing new; the same journey, easier to use.
Rests on: `feedback.md` (team), the step specs. Where a line here differs from a step spec, this file wins.

## Frame
Top menu, earlier step during the walk => asks "End this walk and go back?"; yes discards the walk and opens that step with the plan kept
Top menu, earlier step in Debrief => opens that step with the request and plan kept, the walk discarded
Browser back / address per step => not built

## Maps (Plan, Go / no-go, Debrief; one shared behaviour)
Drag => click and hold moves the map, limited to the site
Zoom => click zooms in on that point, right click zooms out; mouse wheel also zooms
Buttons => small + / − / reset on every map
Keys => + and − zoom, 0 resets, while the pointer is over the map
Markers and labels => keep their size while zooming
Plan => a click on a spot still selects it; a drag never selects
Debrief => a click on a warning in the list centres the map on it

## Go / no-go
Name => stays "Go / no-go"
Check icons => aligned to the first line of each title, all in one line
Radio shadow => not in the rule row; its own line "Caution" below it; a click highlights the shadow stretch on map and profile

## Walk: controls
Mouse look => works in Firefox and Chromium on Linux, both directions; no movement is dropped for being large
Mouse look without captured cursor => holding the mouse button and dragging turns the view
Shift held => fast walk: about 1.5 x speed, work rate from the suit model at that speed; label model
Shift tapped twice => demo speed on / off: about 5 x on screen; suit time and consumption count as a normal walk over the same distance; the display says "Demo speed: movement only"
F => jump along the route to the next stop (next warning point, the spot, or the rover on the way home); suit time and consumption count as a normal walk over the skipped distance; the display says so
Key hints => show Shift and F
Helmet frame => `app/public/helm.webp` (grey), green keyed out, "AI-generated image" in the pixels; replaces the old frame

## Walk: display
Several warnings at once => the most important one large, in this order: turn back, rule broken, steep, radio, off path; all others stay visible as small chips at the side
3D labels => hidden inside the warning area
Steep ground (over 20°) => thin vertical lines rising about 1.5 m from the edge of the closed area, in the colour the maps use for steep ground; not visible beyond about 15 m, fading in when closer; label model
Radio shadow => a dotted blue line on the ground at the shadow edge, fading in the same way; label model

## Several stops
Plan => clicking spots adds them to the route in the order clicked, up to three; a click on a chosen spot removes it; each chosen spot shows its order number
Plan panel => every leg with distance and time; totals for the whole round; one clear way to reorder or clear
Route => rover → stop 1 → … → rover, each leg planned by the same rules
Go / no-go => the whole round on map and profile; every stop named on the profile
Walk => the target is the next stop; one sample per stop; reserve on return counts the remaining stops and the way home
Turn back now => means skip the remaining stops and go to the rover; the display shows the way home
Debrief => samples taken, e.g. "2 of 3"; planned against actual for the whole round; the request is done when at least one sample is taken and the rover reached
One stop => works exactly as before

Not in this spec: new sites, new rules, relay, events, position without GPS, the intro film
