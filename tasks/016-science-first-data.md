# 016 Science-first data: orthoimage, Curiosity track, station photos
owner: data-scout (prep), then builder
state: open
area: scripts/preprocess/, app/public/data/murray/

## Goal
From research/jury-prototype.md change 3. Prepare data only (no map code yet):
1. HiRISE orthoimage crop matching the DTM crop exactly (same 1024×1024 grid as dtm_height, see murray.json), as a compressed JPG/WebP ≤ 1.5 MB, so the map can use a real orbital image as base.
2. Curiosity's actual traverse around Murray Buttes (sols ~1398–1475) as a polyline in DTM pixel coords + lon/lat, with sol labels, from MSL waypoints / PDS traverse data.
3. 3–6 real Curiosity images (Mastcam/Navcam/MAHLI) of the Murray Buttes stations (Quela, Marimba, the buttes' cross-bedding), small web size, with exact credit line, sol, camera, and license note (NASA/JPL-Caltech images are generally public domain with credit — verify; no NASA logos).
4. Validation idea data (jury change 5): data to compare our route/slope model against Curiosity's real path (e.g. slopes Curiosity drove, or the Ehresmann et al. butte-shielding RAD result near Butte M12) — summarise what is feasible in a short section.
Document everything in scripts/preprocess/README.md and research/data-science.md (new section).

## Done when
Files in app/public/data/murray/ (ortho, curiosity_track.json, photos/ + credits.json), regenerate scripts in scripts/preprocess/, documented.
