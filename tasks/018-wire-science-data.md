# 018 Wire science data into the app
owner: builder
state: open (start after 015 is merged — both edit app/src/map/)
area: app/src/map/, app/src/walk/, app/src/ui/

## Goal
Use the task 016 data (app/public/data/murray/: ortho_1024.jpg / ortho_2048.jpg on the exact DTM grid, curiosity_track.json, photos/ + credits.json; docs in scripts/preprocess/README.md and research/data-science.md section 6):
1. HiRISE orthoimage as the default map base (slope layer as optional overlay); MEASURED chip, credit "NASA/JPL/University of Arizona".
2. Curiosity's real traverse (sols 1414–1475 inside the crop) as a dotted line with sol labels, toggleable; MEASURED.
3. Station cards: clicking a named station (Quela, Marimba, cross-bedding butte) shows the real Curiosity photo with credit line, sol, camera. Same card at the station marker in Walk if cheap.
4. Validation panel (jury change 5, cheapest honest version): compare our planned path slopes vs. slopes along Curiosity's real track (from the DTM) — "Curiosity drove slopes up to X°, our suited-crew limit is 20°" — and the butte shielding fact (dose ~4–5 % lower next to the butte at Quela; NASA release / Guo et al. 2021) as a sourced note. No claims beyond the sources.
5. Add the chest X-ray (0.1 mSv) and Earth background (2.4 mSv/yr) reference sources to the Sources page with links (verify).

## Done when
Build, tests, 0 console errors, screenshots research/planner-018.png and docs/ui-018-station-card.png.
