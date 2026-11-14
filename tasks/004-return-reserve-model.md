# 004 Return reserve model
owner: builder
state: done
area: app/src/model/reserve.js

## Goal
Pure JS module: Pandolf/Santee metabolic rate with grade, Mars gravity, suit + load mass, terrain factor; NASA sizing (research/sources-validity.md, research/science.md when available). Outputs consumables used, remaining, 20 % buffer, turn-back point along the route (walkback 2–3.5 km). Every constant has a source comment and a provenance label (measured/modelled/simulated).

## Done when
Unit tests with hand-checked values; documented in a short block at the top of the file. Wave 1, independent.

## How to test
`node --test app/src/model/reserve.test.js` (13 tests, no dependencies). API: `computeReserve(points, params)` in app/src/model/reserve.js, branch task-004-reserve.
