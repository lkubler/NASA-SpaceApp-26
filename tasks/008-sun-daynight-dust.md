# 008 Sun, day/night, dust haze
owner: designer
state: done
area: app/src/walk/

## Goal
Signature moments 3 and 4 from docs/design.md: sun position (Mars24 algorithm) for real shadows, sky shader, day/night slider, dust tau presets (labelled simulated).

## Done when
Visible in Walk; tau table sourced. Wave 2.

## Result
sky.js + mars24.js (unit tests pass both GISS examples). Scene axes assumed -Z north; tau table from research/sources-validity.md D. Screens: docs/ui-008-{noon,sunset,storm}.png. Not done: HUD DUST caution banner, dust motes, wind.
