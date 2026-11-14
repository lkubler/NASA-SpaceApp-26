# 020 Walk HUD drama, sky and small UI fixes
owner: designer
state: open
area: app/src/walk/hud.js, app/src/walk/sky.js, app/src/styles/*, app/src/ui/briefing.js, app/src/ui/loading.js

## Goal
From research/ux-1.md (items 3–5) — outside app/src/map (015/018/019 own it):
- Walk opens with red "SIGNAL NONE" at spawn and a static HUD (reserve 100 % after 15 s guided walk, dose ~0). Guided walk should advance the EVA clock along route elapsed_s (time-lapse: show EVA clock in HUD, e.g. "EVA 10:42 · T+2h12"), so reserve, dose and signal change visibly; a short intro hint saying the user's job ("Walk the planned route. Magenta = no radio link. Amber = turn back.").
- Storm (tau 8.5) must change the view immediately and strongly (UX says barely visible 3 s after click).
- Expanded sky panel overlaps HUD dose title; units uppercased ("MSV/H", "M/S") → proper case (mSv/h, m/s); every number has a unit.
- Cold-open "NO SIGNAL" is green — must be magenta per design.md.
- "Plan the EVA" disabled until ~8 s on slow GPUs — allow entering the map immediately (map doesn't need the 3D terrain).
- Check the 2 ERR_CONNECTION_REFUSED requests (probably a dev-server/HMR or font URL) and remove the cause.

## Done when
Build, 0 console errors, screenshots docs/ui-020-*.png incl. a guided-walk sequence (3 frames) showing reserve/dose/clock changing.
