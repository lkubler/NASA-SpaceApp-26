# 002 Terrain preprocessing: DTM + Access Mars alignment
owner: builder
state: done
area: scripts/preprocess/, app/public/data/

## Goal
Python offline: crop HiRISE DTM DTEEC_040770_1755_039280_1755_U01 around Murray Buttes (raw files in data/raw/, ignored), output heightmap + slope + no-data mask as compact binary/PNG for the 2D map (~1 m). Export the 0.5 m Access Mars walk grid (see research/spike-3d.md). Estimate Access Mars origin/rotation against the DTM (research/data-sites.md: ±30 m, rotation unknown) by matching height fields; record the transform and its error.

## Done when
Files load in the browser; README in scripts/preprocess/ explains how to regenerate; alignment error stated in research/ or the README. Wave 1.

## Result
Branch `task-002-terrain`. Outputs in `app/public/data/murray/`, format and alignment (NCC 0.93, position +-2 m, rotation 2.4 +-1.5 deg, scene z = north) in `scripts/preprocess/README.md`.
Test: `python3 scripts/preprocess/build_murray.py` (needs data/raw/ from the README steps); check sizes of the 6 files and open `dtm_hillshade.png`.
