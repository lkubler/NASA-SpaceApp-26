# 029 Show how sure the 22 % is; plausibility holes
owner: builder
state: in progress
area: app/src/ui/sources.js, reserve fold text in app/src/map/mapView.js, new app/src/model/sensitivity.js, app/src/terrain/ (1 m slope sampling)

## Goal (research/jury-prototype-2.md change 3)
- "What moves this number" list (reserve fold): computed live from the model, not hard-coded: load 0 / 23 / 40 kg, flat terrain, suit offset −50 % / +50 %, (Earth gravity as a sanity line). One line: the 20 % buffer exists because the model is this uncertain.
- One visible line: "Suit reserve = metabolic energy budget, a proxy for oxygen, CO2 removal, cooling and battery."
- 1 m slope re-check: sample the 1 m DTM slope grid along the route part inside the 1 km crop; show max 1 m slope next to the planner's max. If > 20°, say so honestly (or nudge the station point if trivial).
- Comms tile/verdict: total time out of contact next to the longest stretch; reason line "With the lander as the only radio source: N of M min out of contact" (compute, don't hard-code).
- Framing: humans set the scenario as the NASA walk-back case (2–3.5 km, research/sources-validity.md). Briefing/verdict should say it once: "Walk-back case: the crew rover is unavailable; an uncrewed relay unit keeps the radio link." Rename "relay rover" → "relay unit" consistently (COMMS_SOURCE_NAME and labels) if not breaking tests.
- Sources page: "Prior work: SEXTANT (Johnson 2009, SAE 2009-01-2562)" and the gravity-scaling assumption (factor 0.75, range 0.68–1.0).
Coordinate: task 028 adds a timeline mount in mapView; keep your mapView diff to the fold/verdict text and tile.

## Done when
Tests (sensitivity unit test) + build, 0 console errors, screenshot research/validity-029.png (fold open), sources screenshot.
