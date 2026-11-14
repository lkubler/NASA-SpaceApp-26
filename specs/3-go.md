# 3 Go / no-go
The visitor should understand: the excursion starts only after the plan has been checked against every NASA rule.
Rests on: `specs/rules.md`, `docs/mockups/03-route-overview.png`

Layout => as in the mockup: headline and one sentence top left, big numbers below, small map top right, height profile across, checks and main button at the bottom
Headline => "Route ready."; with a broken rule "Route breaks a rule."
Big numbers => distance, duration, steepest slope, reserve on return, radiation dose
Height profile => the route from rover to spot and back; the spot marked; stretches in radio shadow marked
Checks => one per rule: slope, distance from the rover, way home, excursion length; each with planned value and limit
Radio shadow => its own check with the longest stretch; a caution at most
Suit checks => oxygen full, suit sealed, radio to rover; label: simulated
Click on a check => map and profile show where on the route the value occurs
Every rule kept => all checks cyan; main button "Start excursion", cyan
Rule broken => the check is red and names the rule; main button "Start with 1 broken rule"; the broken rule is carried into the walk and the debrief
Edit route => link beside the main button, back to Plan

Not in this spec: weather window, cutscene.
