# 026 Walk fixes from UX pass 2
owner: builder
state: in progress
area: app/src/walk/, app/src/ui/autonomy.js (only if needed)

## Goal (research/ux-2.md)
- P2-1: one clock. Walk spawns at the map's EVA start (state), sky time always follows the EVA clock (T key manual override labelled "manual"); guided walk must not jump backwards.
- P2-2: comms toast and SIGNAL tile derive from the same state sample; debounce only the toast; after the relay is moved, no shadow toast.
- P2-4: make station cards (task 023) reachable in the demo path: HUD line "3D walk area: 128 m square at station N. Next station: …" and a "Show station photo" button (or key) that opens the nearest station's card.
- P2-5: sky panel starts collapsed at 1280×720 (or max-height + scroll); "Your job" banner never under the panel.
Don't touch app/src/map/ (task 025 is working there).

## Done when
Tests + build pass, 0 console errors, screenshots research/walk-026*.png (entry, guided walk with matching toast/tile, station card open).
