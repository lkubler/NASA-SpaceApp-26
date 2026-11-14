# 018 Map panel fits 1280x720; turn-back story consistent
owner: builder
state: open
area: app/src/map/mapView.js, app/src/styles/map.css

## Goal
From research/ux-1.md P1-1 and P1-2. At 1280x720 the planner panel (944 px) hides EVA start, suit level, Clear, SPE toggle and the pink legend below the fold. The turn-back text contradicts the tiles (reserve 22 % red, "before station 6" at the time station 6 finishes). Designer to review layout against docs/design.md.

## Done when
- At 1280x720 EVA start, suit level, SPE toggle and the comms-shadow legend are visible without scrolling the panel (or the panel is a collapsible overlay).
- Turn-back copy, reserve tile colour and the on-map label agree (same time, same station, reserve vs 20 % buffer).
- Screenshot at 1280x720 attached.
