# Transitions between the steps
The visitor should understand: the five steps are one line I move along; nothing jumps.
Rests on: `specs/0-frame.md`, `specs/design.md`, the team's feedback (the opening is rich, the other step changes are hard cuts).

## Every step change
Old page => fades out and moves a few pixels in the direction of travel; the new page fades in from the other side; about 0.4 s in total
Direction => forward moves left, back moves right
Top bar and "Sources" => stay fixed; only the content below changes
Active step in the top menu => slides to its new place
Blocks of the new page => come in one after the other, very short delay: headline, numbers, map, main button last; about 0.3 s in total
Click during a transition => taken at once, nothing blocks
Reduce motion set in the system => a plain short fade, no movement
Performance => only opacity and position are animated
Numbers => never change their value by animation (no counting up)

## Extra per change
Mission → Plan => the crater view zooms slightly towards Murray Buttes while fading; the Plan map fades in at that place
Plan → Go / no-go => the map with the route moves from its large place on the left to its small place on the right; the rest fades around it
Go / no-go → Walk => the intro film (`specs/x-intro.md`); from the second walk on, a fade through black
Walk → Debrief => fade through black, about 0.6 s
Debrief → Mission => as built: dark ground tone, the crater fades in
Sources => slides in from the right over the dimmed page; slides out on close

## Inside the pages
Go / no-go => the rule checks tick in one after the other; the profile line draws from left to right once
Plan => a newly chosen route draws along its path
Debrief => the planned and actual rows appear one after the other

If an extra does not look clean => it is left out and the shared transition is used

Not in this spec: page flips, sound, particle effects, any animation longer than a second apart from the intro
