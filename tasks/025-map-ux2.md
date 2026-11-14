# 025 Map fixes from UX pass 2
owner: builder
state: in progress
area: app/src/map/ (mapView.js, planner panel), app/src/model/comms.js

## Goal (research/ux-2.md)
- P1-1: "Move relay to high ground" busy state: button disabled + "Moving relay…", yield a frame before compute, guard double clicks; if cheap make the search faster (coarse-then-fine, or cache). Under the verdict when comms shadow > 0: "Longest time out of contact N min: the relay rover can't see you there. Try: Move relay to high ground."
- P2-3: replace the stale "Relay moved…" line with a persistent state line ("Relay on high ground: contact all the way (was N min with the relay at its start spot)"); button toggles to "Move relay back" so the demo can repeat.
- P1-2: loading placeholder over the canvas until the first terrain image is drawn; ResizeObserver redraw + re-fit; fit on first show.
- P3-3: deterministic initial framing (same view each load, route cluster right of the panel).
- P3-2: label collisions near stations 3/4/Quela at 1280×720 (e.g. hide minor labels, keep station names + turn-back).
- P3-6: thin dotted link line relay rover → lander.
Leave colours/copy of tiles, fold headings, CSS files and briefing/sources to designer task 027.

## Done when
Tests + build pass, 0 console errors, screenshots research/map-025*.png (1280×720 default, relay busy, after relay, after resize to 1920×1080).
