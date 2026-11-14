# 012 Planner realism and readability
owner: builder
state: done
area: app/src/map/, app/src/model/reserve.js, app/src/state.js

## Goal
Fix two problems seen in research/planner.png (task 003):
1. The turn-back point only appears with an artificial "EVA budget 4 %" slider, because walking alone in a 1 km area never uses up an 8 h suit. Real EVA time is dominated by work at stations (sampling, imaging), not by walking. Add per-waypoint station tasks with duration (e.g. sample 45 min, imaging 15 min, drill 60 min; source or label as assumption, see research/science.md BASALT/analog timelines) at a stationary metabolic rate, plus an EVA clock (start time of day, elapsed). Turn-back then emerges naturally. Remove or demote the budget slider (keep as "suit start level" defaulting to 100 %).
2. The magenta comms shadow covers almost the whole map because the lander sits in a hollow. Default the comms source to the rover parked on visible high ground (use a Curiosity position from research/data-science.md near Murray Buttes, antenna ~2 m) and optionally a second relay; draw the shadow so the map stays readable (hatched/outline or only along the route corridor), magenta still reserved for it.
Also adopt the designer components (app/src/ui/components.js: tile, chip, provLegend) for the side panel, with provenance chips on distance (measured terrain), reserve (modelled), comms (modelled), station durations (assumption).

## Done when
Default scenario at Murray Buttes shows a readable map, a route to Quela with 2–3 stations, a turn-back point without touching any slider, and a shadow segment on part of the route. Tests pass, build passes, screenshot research/planner-012.png.

## Result (builder)
- Stations (imaging/sample/drill, minutes editable) at 352 W stationary rate (NASA 1200 BTU/h sizing average), EVA clock (start 08:30 local solar time, assumption), suit start slider kept at 100 %. Station minutes are assumptions (30/60/120 incl. setup and stow).
- Deviation: three stations cannot exhaust an 8 h suit (about 3 MJ of 10 MJ), so the default scenario is six stations, 6.2 h EVA; turn-back appears before the last drill station at 14:39 without touching a slider.
- Curiosity's Marimba position sits on the DTM edge in a hollow (sees 6 % of the map), so the comms rover is parked on nearby high ground (+10 m, 70 % of route visible); one 122 min shadow segment on the west leg. Shadow drawn hatched in a 90 m route corridor, outline elsewhere.
- state.js: added `start`; route gets stations, shadowSegments, turnBackStation, startHour; points get elapsed_s, remainingFraction, metabolicW, inShadow.
- Test: `cd app && node --test && npm run build && npx vite preview --port 4191` then `node check-planner.mjs out.png`. Screenshot: research/planner-012.png.
