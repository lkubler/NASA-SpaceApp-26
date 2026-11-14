# 014 visual polish
owner: designer
state: done
area: app/src/map/mapView.js (rendering only), app/src/styles/*.css, app/src/walk/sky.js (panel DOM only)

## Goal
Make route, stations, turn-back and the comms shadow the stars of the Map; make the Walk screen read in a 30 s recording.

## Done when
1. Slope layer subtle (>20 deg faint red, 15-20 deg very faint amber). Done.
2. Shadow outlines only along the route corridor; hatching kept. Done.
3. Map labels on dark pills with collision avoidance; turn-back label amber and placed first. Done.
4. Sky panel collapsed by default to a time + dust chip; Guided walk is a primary button top right. Done.
5. "Click to walk" is a small light pill, vignette lightened, terrain visible. Done.
6. HUD bar checked at 1280x720, 1400x850, 1920x1080: no wrapping, tiles aligned. Done.
Screenshots: docs/ui-014-{before,after}-*.png (script app/shot014.mjs). Build ok, 0 console errors.
