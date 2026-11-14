# 029 Show how sure the 22 % is; plausibility holes
owner: builder
state: done
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

## Result (builder)
Branch worktree-agent-ac5a1f325166a6ab6. Default scenario (5.9 km loop, 23 kg, 4.9 h EVA), all numbers computed live:
- Sensitivity (reserve fold "What moves the reserve number", `model/sensitivity.js`): base 22 %; load 0 kg 24 % (+2), 40 kg 20 % (-2); flat terrain 26 % (+4); suit offset -50 % 35 % (+13), +50 % 9 % (-13); Earth gravity (sanity) 11 % (-11). Assumptions alone span 9 % to 35 %; the fold says the 20 % buffer exists because the model is this uncertain. The suit offset is the dominant uncertainty.
- Proxy line under the verdict: "Suit reserve = metabolic energy budget, a proxy for oxygen, CO2 removal, cooling and battery."
- 1 m slope re-check (`terrain/slope1m.js`, 1 m DTM slope sampled about every metre on the part of the route inside the 1 km crop, 36 % of the route): max 29 degrees vs planner 16 degrees (5 m grid); above the 20 degree limit on 0.3 % of samples. Shown honestly in the verdict ("treat those few metres as a scramble"); no station nudge.
- Out of contact: relay unit 175 min total, 115 longest (of 293 min EVA); lander as the only radio source 281 of 293 min (longest 281). Tile now "Out of contact: 175 min total, 115 longest".
- "relay rover" renamed "relay unit" (COMMS_SOURCE_NAME, map, sources, walk toast). Briefing has a "Scenario" row: walk-back case, crew rover unavailable, uncrewed relay unit keeps the radio link.
- Sources page: SEXTANT prior work (Johnson 2009, SAE 2009-01-2562) and gravity-scaling assumption (model ratio about 0.83 suited flat; Brown et al. 2018 measured 0.68 unsuited; range 0.68 to 1.0, working default 0.75, per research/data-science.md section 5).
How to test: `cd app && npm run build && node --test src/model/*.test.js src/map/*.test.js src/walk/*.test.js` (57 pass; regional.test.js has a 1 s timing assertion that flaked once under load). Open Map, fold "What moves the reserve number". Screenshots: research/validity-029.png (fold open), research/validity-029-top.png, research/validity-029-sources.png. Headless: 0 console errors.
