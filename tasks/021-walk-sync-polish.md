# 021 Sync sky to EVA clock; guided-walk polish
owner: designer
state: done
area: app/src/walk/sky.js, app/src/walk/hud.js, app/src/walk/route3d.js, app/src/styles/

## Goal
Seen in docs/ui-020-guided-2.png:
- During guided walk the EVA clock reads 09:14 but the sky still says 09:00 LTST: drive the Mars24 sun time from the EVA clock while a route is active (time-lapse lighting change is a free wow moment); manual slider overrides until the next guided walk.
- "Click to walk" pill stays visible during guided walk — hide it while guided.
- Spawn starts in comms shadow (SIGNAL NONE at T+0): start the guided walk from the lander (route start) so it begins with LINK and the drama is entering the shadow, then the turn-back marker.
- When passing the turn-back marker in guided walk: brief amber flash + toast, as the demo climax.

## Done when
Build, tests, 0 console errors, 3-frame screenshot sequence docs/ui-021-*.png.
