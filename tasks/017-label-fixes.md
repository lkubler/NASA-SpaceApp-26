# 017 Label and number fixes outside the map
owner: designer
state: open
area: app/src/walk/sky.js, app/src/walk/hud.js, app/src/ui/briefing.js, app/src/ui/sources.js, app/src/walk/route3d.js

## Goal
From research/jury-prototype.md label fixes (outside app/src/map — task 015 owns the map):
- Sky panel "direct sun 7 %" at tau 8.5 is wrong (direct beam ≈ 0.02 %): compute direct beam correctly or rename to "light reaching the ground (approx.)" incl. diffuse; keep visibility labelled simulated.
- Briefing: "One-way light time 4–22 min" is computed → MODELLED. Quela "sols 1464 to 1468" (drilling) vs "sols 1455–1468" (parked) — make both explicit.
- Dose display: no "0.0000 mSv"; show EVA total for the route (≈0.17 mSv) with a reference people understand (e.g. ≈ X chest X-rays / Y days of Earth background, sourced), live value with 2–3 significant digits; SPE replay stays but small.
- Walk toast "no link to the lander" must match the comms source name used by task 015 (coordinate: read app/src/ui/sources.js and the map; if 015 not merged yet, use a single constant COMMS_SOURCE_NAME exported from app/src/model/comms.js).
- 3D route ribbon: tone down saturated magenta (thinner, semi-transparent, magenta only in shadow segments).
- Grey untextured terrain slab at the walk-square edge in the first frame: hide it (fade/skip untextured tiles or start facing away) — check app/src/walk/walkView.js loader.

## Done when
Build, 0 console errors, screenshots docs/ui-017-*.png.
