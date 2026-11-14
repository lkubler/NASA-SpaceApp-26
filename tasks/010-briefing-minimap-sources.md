# 010 Briefing, minimap, loading screen, sources panel
owner: designer
state: open
area: app/src/ui/

## Goal
NO SIGNAL cold open, mission briefing (Ground Control requests, notes.md), minimap (notes.md section), loading screen, sources panel listing every dataset and model with provenance.

## Done when
All reachable from the app; sources panel complete. Wave 2.

## Progress (branch task-010-briefing)
- [x] (a) Loading: terrain progress bar (app/src/ui/loading.js) on the cold open; "Plan the EVA" disabled until walkReady.
- [x] (b) NO SIGNAL cold open then Ground Control briefing, Murray Buttes (app/src/ui/briefing.js, start screen, #/briefing). Screenshots docs/ui-010-coldopen.png, ui-010-briefing.png.
- [x] (c) Sources panel (app/src/ui/sources.js, #/sources, nav button) incl. AI-use line. Screenshot docs/ui-010-sources.png.
- [ ] (d) Minimap: open, needs the planner.
