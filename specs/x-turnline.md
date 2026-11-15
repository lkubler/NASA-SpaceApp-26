# Turn-back line on the small map
The visitor should understand: the map shows me how far I can still go and get home.
Rests on: `notes.md` ("Das Rückweg-Feld zeigen … Reserve bei Rückkehr von jedem Punkt mit der Umkehrlinie als Kontur"), `specs/4-walk.md` (Minimap, Reserve on return), `research/data-minimap.md`.

Small map in the walk => shows the turn-back line: the edge of the ground from which the crew still gets back to the rover with reserve
Calculation => the same as "Reserve on return" (suit levels now, way home from each place, walk-back factor); the line and the number never disagree at the crew's place
Suit is used => the line is calculated again and closes in; often enough that it follows the walk, without stutter
Ground outside the line => shown dimmed or tinted, so "inside" and "outside" read at a glance
Whole site still inside => no line; the map looks as before
Crew outside the line => as built ("Turn back now"); the line does not add a second warning
Legend => one row, label model; info text says it is calculated from the terrain and the suit's state now
Debrief, Plan, Go / no-go => unchanged

Not in this spec: the line in the 3D view, the line on the Plan map, a second line for remaining stops, position uncertainty
