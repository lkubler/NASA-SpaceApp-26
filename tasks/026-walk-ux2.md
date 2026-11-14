# 026 Walk fixes from UX pass 2
owner: builder
state: done
area: app/src/walk/, app/src/ui/autonomy.js (only if needed)

## Goal (research/ux-2.md)
- P2-1: one clock. Walk spawns at the map's EVA start (state), sky time always follows the EVA clock (T key manual override labelled "manual"); guided walk must not jump backwards.
- P2-2: comms toast and SIGNAL tile derive from the same state sample; debounce only the toast; after the relay is moved, no shadow toast.
- P2-4: make station cards (task 023) reachable in the demo path: HUD line "3D walk area: 128 m square at station N. Next station: …" and a "Show station photo" button (or key) that opens the nearest station's card.
- P2-5: sky panel starts collapsed at 1280×720 (or max-height + scroll); "Your job" banner never under the panel.
Don't touch app/src/map/ (task 025 is working there).

## Done when
Tests + build pass, 0 console errors, screenshots research/walk-026*.png (entry, guided walk with matching toast/tile, station card open).

## Result (builder)
Branch worktree-agent-a8ed8ab2b00f5c6ff. No new state keys.
- P2-1 one clock: sky time follows the EVA clock always (guided time-lapse, else route elapsed at the nearest route point, same value the HUD shows; entry is 09:34 in both). Slider or T key = manual, labelled "(manual)" in the sky panel, reset when a guided walk starts. Guided walk starts at the clock the walk shows (T+1h03), no jump back (walkView.js, route3d.js, sky.js).
- P2-2 toast and SIGNAL tile use the same sample; toast start debounced 1 s, toast clears when the shadow ends, reset on route rebuild (no shadow toast after the relay is moved, since no shadow samples).
- P2-4 HUD line "3D walk area: 128 m square at station N. Next station: ..." (hud.js) and "Show station photo" button opening the nearest named station card with distance and direction (stations.js showNearest, pinned until closed). New CSS: app/src/styles/walk-ux.css.
- P2-5 sky panel was already collapsed by default in this branch; checked at 1280x720 expanded and collapsed: no overlap with the job banner.
Test: cd app && npm run build && node --test src/model/*.test.js src/map/*.test.js src/walk/*.test.js (55 pass). Manual: Plan the EVA, open Walk, compare HUD clock with sky chip, press Guided walk, press Show station photo. Headless: 0 console errors; screenshots research/walk-026-entry.png, walk-026-guided.png, walk-026-station-card.png.
Not verified: pointer-lock free walking, relay-moved path in the walk (reasoned from code only), 1080p.
