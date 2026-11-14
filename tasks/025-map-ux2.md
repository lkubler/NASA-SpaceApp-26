# 025 Map fixes from UX pass 2
owner: builder
state: done
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

## Result (builder)
Branch worktree-agent-af949b1e4b8dff8c0. Files: app/src/map/mapView.js, app/src/model/comms.js (bestRelay).
- Relay button: click sets "Moving relay..." (disabled, aria-busy), yields a frame before computing, ignores double clicks. After the move the button reads "Move relay back" (restores the first-guess spot). Timing, headless swiftshader: click handler froze the page 4.65 s with no feedback before; now the busy state paints at once and the move finishes in about 1.6-2.1 s. Same relay found (1164 m, 115 min to 0 min). Speed-up in bestRelay: stop scoring a candidate once its shadow exceeds the 6th best so far, and verify with the viewshed only until the best verified result is no worse than the next quick score (exact in the scenarios I tried; coarse-then-fine was tried and rejected, it missed the zero-shadow spot).
- Verdict sentence when shadow > 0: "Longest time out of contact N min: the relay rover can't see you there. Try: Move relay to high ground." After a move a persistent line replaces the stale note: "Relay on high ground (N m from the lander): contact all the way (was 115 min ...)". Dragging the relay by hand or setRover clears it.
- Map: "Loading terrain imagery..." placeholder until the orthoimage is drawn; ResizeObserver on the map area resizes, re-fits (unless the user zoomed/panned) and redraws; fit() on a hidden 0x0 map is deferred until shown, which also fixes the random initial framing (same view every load, route right of the panel).
- Label collisions: "3D walk area" and photo-station labels only show from zoom 1.6 (MINOR_LABEL_ZOOM); station, turn-back, lander and relay labels stay.
- Thin dotted link line relay rover to lander.
- Verified: 55 tests pass, build OK, headless 1280x720 and resize to 1920x1080 correct, briefing to map 0 console errors/warnings. Screenshots: research/map-025-default.png, map-025-relay-busy.png, map-025-relay-after.png, map-025-resize-1080.png. Not verified: "Move relay back" click in a browser, real-GPU timing.
