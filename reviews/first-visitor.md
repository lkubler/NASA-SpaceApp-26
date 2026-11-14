# First visitor: whole journey

Setup: `npm run dev -- --port 5183` in `app/`, Playwright headless Chromium 1280x720, opened `http://localhost:5183/` with no URL parameters. Clicks and keys only as the screen asked. I read `app/scripts/journey.mjs` (lines 115-165 only) because holding W seemed to do almost nothing. It showed the keys are `KeyW`, arrows and `KeyE`, and that the test script moves time forward with its own hook. In headless Chromium the walk runs at a low frame rate, so I held keys for several seconds at a time. I turned using the compass reading on screen.

Note: `main` got new merges while I was testing (`9960fd2`, `af4a7cb`, `f7ed86f`). Some labels changed between runs: "F1/F7" became "01/06", and "Moon" became "lunar rule". Screenshots from run 1 show the older labels.

Screenshots: `reviews/first-visitor/` (`a*` = run 1 with the first spot offered, `b*` = run 2 with a far spot and wandering off, `c*` = one extra check).

## Run 1: first spot offered

**a01-open: intro**
- Tells me: a crew on Mars is on its own because signals take 4-22 min, and the question is "can I still get home?".
- Do: click Begin.
- Confused: a dark, barely visible map behind the text with labels (Murray Buttes, Marias Pass) I can't read yet. Otherwise clear.

**a02-mission: Choose your mission**
- Tells me: three Gale crater sites Curiosity visited. Only Murray Buttes is open; the other two say "not in this demo".
- Do: click Murray Buttes.
- Confused: the label looked clickable, but Playwright reported the pin button as "not visible". I had to click the label position on screen.

**a03/a04-requests: Requests from Earth**
- Tells me: Earth teams want either a sandstone sample or a radiation measurement, and answers take 18 min, so the crew decides alone.
- Do: pick one card, then "Plan this mission" (dimmed until a card is picked).
- Confused: nothing big. The real Curiosity photos make it feel grounded. "Sent 19:10 · received 19:28" looks like Earth clock time, not Mars time.

**a05-plan: Plan your mission (empty)**
- Tells me: a top-down map with numbered candidate spots, Home (the rover), slope hatching and radio shadow dots.
- Do: hover or click a number, then Confirm route.
- Confused: the left/top of the map is smeared and streaky (stretched texture). "Interference" is cut off at the left edge. Spot 02 sits on top of the "Buttes" point. The legend has many symbols.

**a06-plan-spot01: spot 01 picked**
- Tells me: 01 is the cheapest spot: about 1 h 23 total, 6 h 17 reserve, steepest slope 19.5°.
- Do: Confirm route.
- Confused: the card says 28 m, but the legs say 14 m each. I only understood afterwards that 28 m is the round trip. 14 m on foot taking 32 min seems very slow. The tooltip covers spot 02.

**a07-gonogo: Route ready**
- Tells me: the route passes every rule (slope, distance, way home, length, radio shadow), with a height profile.
- Do: Start excursion.
- Confused: rules are tagged "real · Moon" in a Mars app. I don't know why lunar rules apply. The height profile has no numbers on its axis. "Distance from the rover: farthest 13 m" next to "plan 2.00 km" is a big jump in scale.

**a08-walk-start: helmet view**
- Tells me: I'm in a suit looking at the butte. The blue band is my route, and the HUD shows suit, reserve, radiation and radio.
- Do: W A S D to walk, arrows to turn, "click to look around".
- Confused: the clock stays at 00:00:00 until I move. The HUD says the spot is "10 m · 24 min", while the plan said 14 m · 32 min.

**a09-walk-out / a10-at-spot: walking out**
- Tells me: follow the band. "Steep stretch ahead" and "Ground over 20° underfoot" warnings appear, and "E Take sample" pops up near the spot.
- Do: keep W and steer, then press E.
- Confused: on the "every rule kept" route I got a red "Rule broken: slope on foot" warning right away (21°/23°), even though I was walking straight at the spot. When I held W without steering I walked past the spot and up the butte. Nothing stopped me. The target diamond disappears when you get close.

**a11-sample: Sample taken**
- Tells me: a real Curiosity photo of this rock type, with an honest note that it is not this exact spot. Next target: the rover.
- Do: E to continue.
- Confused: the reserve jumped up from 6 h 04 to 6 h 25 just after the 20 min of work.

**a12-way-home / a13-at-rover: walk back**
- Tells me: turn around, and the rover is visible with a route band leading to it.
- Do: walk to it, then press E "End excursion".
- Confused: the rover is a plain grey box model, and I walked into its wheel. The HUD at the rover said reserve 6 h 01 "limited by battery" and time outside 1:51. The debrief then said 6 h 21 and 1 h 33.

**a14/a15-debrief: Back home**
- Tells me: I made it with 6 h 21 left but broke the slope rule. Planned vs actual, a map of where the warnings happened, and a report to Earth with the photo.
- Do: Send report (it then says it reaches Earth in 18 min), then New mission.
- Confused: the "Closest moment" label crowds the spot marker on the map. "Closest moment 6 h 04 oxygen" is unclear wording. Time 1 h 33 doesn't match the walk clock.

**a16-new-mission**: back to "Choose your mission". Works.

## Run 2: far spot, wandering off route

**b01-plan-spot06: spot 06 picked**
- Tells me: a far spot behind the butte: 138 m, about 5 h 34 total, only 1 h 12 reserve, slope exactly 20.0°, route through radio shadow.
- Do: Confirm route.
- Confused: 69 m on foot taking 2 h 37 seems unrealistically slow for walking. Nothing on screen explains the speed.

**b02-gonogo**
- Tells me: still "Every rule kept", with a yellow caution for 3 h 16 of radio shadow. The profile shades the shadow part.
- Do: Start excursion.
- Confused: the spot diamond is cut off at the right edge of the mini map.

**b03-walk-start**
- Tells me: the band curves right, and a "Butte · real" info card sits next to it.
- Do: I turned north, away from the route.
- Confused: the HUD label "F7 East side, behind the butte ma..." overlaps the 3D label "East side, behind the butte mass 65 m". The plan called it 06, the walk called it F7.

**b04-off-path: Caution, off the path**
- Tells me: a yellow caution, "8 m from the planned route", and the reserve falling fast (33 min, 23, 13...).
- Do: unclear. Nothing tells me to turn yet.
- Confused: the caution only appeared after about 6-7 m off route.

**b05-turn-back: Warning, turn back now**
- Tells me: red "Turn back now. Reserve on return −8 min. Head for the rover." The reserve panel turns red.
- Do: turn back, or end the mission.
- Confused: the rover is only about 14 m away and the suit shows "7 h 03 left", yet the reserve is negative. It was not clear that "reserve" counts finishing the whole planned trip, not just walking home.

**b06-esc / b07-ended: Not returned**
- Tells me: esc once shows "Press esc again to end the mission here". Twice ends it: "Not returned", broke "Way home", rover 14 m away, sample not taken.
- Do: New mission.
- Confused: the second esc only worked when pressed soon after the first. My first try with a pause did nothing. Ending 14 m from the rover counts as "not returned", which feels harsh but is clear.

**c01-after-click-look-around (extra check)**
- I did one click on the view, as the hint "Click to look around" says. The view jumped to heading 009° and showed only empty beige sky. This may be headless pointer-lock behaviour, but it happened both times I tried.

## Summary

- **What it is for:** planning a walk on Mars from real terrain and NASA rules, then walking it in a helmet view to learn whether you can still get back to the rover without help from Earth.
- **Most memorable moment:** wandering off route in run 2 and watching the reserve tick down to a red "Turn back now, reserve on return −8 min" while the rover was still in sight.
- **Looked broken, unfinished or fake:**
  - Smeared, streaky texture on the Plan map.
  - The plain grey box rover, which you can walk through.
  - "Click to look around" turns the view to empty sky.
  - A slope "rule broken" warning on a route the plan said kept every rule.
  - Numbers that disagree between screens: distance 14 vs 10 m, time 1:51 vs 1 h 33, reserve 6 h 01 battery vs 6 h 21.
  - Very slow walking times (69 m = 2 h 37).
  - Spot naming changes between screens (06 / F7).
  - "Moon" / "lunar rule" tags on a Mars product with no explanation.
  - Labels cut off or overlapping (Interference, mini map diamond, F7 label).
