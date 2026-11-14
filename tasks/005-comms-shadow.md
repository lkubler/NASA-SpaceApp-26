# 005 Comms shadow (line of sight)
owner: builder
state: done
area: app/src/model/comms.js, scripts/preprocess/

## Goal
Viewshed from a rover/lander position (antenna height configurable) over the heightmap; per-route-point visible yes/no; shadow segments with duration; warning when a shadow exceeds the configurable limit (default 10 min, labelled as an assumption). Precompute in Python if the browser is too slow.

## Done when
Unit test on a synthetic ridge; shadow segments returned for a Murray route; < 200 ms per rover position in the browser or precomputed. Wave 1, independent.

## How to test
`node --test app/src/model/comms.test.js` (ESM; needs `"type":"module"` in app/package.json or Node 22+ syntax detection). Limit default 600 s is an assumption. Murray-route check not done here (no route data yet).
