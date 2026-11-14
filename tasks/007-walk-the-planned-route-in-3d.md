# 007 Walk the planned route in 3D
owner: builder
state: done
area: app/src/walk/

## Goal
Show the planned route and waypoints in the 3D scene (aligned via 002), HUD warnings for slope over limit, entering comms shadow, passing the turn-back point; optional guided walk along the route.

## Done when
Plan in Map, walk it in Walk with matching warnings. Wave 2.

## How to test
In Map plan a route inside the walk square, open Walk: ribbon, waypoint poles, TB marker, edge arrows; player spawns on the route; HUD reserve/signal follow the nearest route point; toasts for shadow, turn-back, slope >= 20 deg. "Guided walk" button auto-walks. Headless: `cd app && npx vite preview --port 4207`, then `node check-route.mjs http://localhost:4207/ out.png shadow.png`. Screenshots: research/walk-route*.png. Code: app/src/walk/route3d.js.
