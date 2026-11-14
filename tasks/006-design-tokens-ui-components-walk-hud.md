# 006 Design tokens, UI components, walk HUD
owner: designer
state: done
area: app/src/styles/, app/src/ui/

## Goal
Implement docs/design.md section 16 basics: tokens.css + fonts, panel/tile/chip components, provenance styles, walk HUD overlay (slope, speed, reserve, signal).

## Done when
Components used by 003 and the Walk view; screenshot in research/ or docs/. Wave 1 (after 001 skeleton exists).

## Result
Fonts self-hosted via @fontsource (app/src/ui/fonts.js); components in app/src/ui/components.js (chip, stateChip, badge, panel, tile, button, provLegend) + app/src/styles/components.css; walk HUD in app/src/walk/hud.js (reads state keys reserve, comms). Gallery: app/gallery.html. Screenshots: docs/ui-006-walk.png, docs/ui-006-components.png.
