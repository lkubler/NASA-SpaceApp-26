# 030 Reproduce blocked sky at Quela vs Ehresmann et al. 2021
owner: data-scout
state: in progress
area: research/, scripts/, app/public/data/murray/ (small JSON only)

## Goal (research/jury-prototype-2.md change 4), hard stop after 2 h
- Step 1 (≤30 min): read the open full text of Ehresmann et al. 2021 (DOI 10.1029/2021JE006851); confirm the blocked-sky number at Quela and its definition (field of view, zenith range, how computed). If it can't be confirmed, write that and stop.
- Step 2: compute the same quantity at the Quela waypoint (137.3530E −4.69520, research/data-science.md) from the 1 m DTM (app/public/data/murray/dtm_height.u16.bin, murray.json), same definition, with the registration caveat (±2 m) and sensitivity to a few metres of offset.
- Write research/quela-sky.md (method, numbers, sources) and app/public/data/murray/quela_sky.json {published, ours, definition, caveat, source} so the app can show it. Don't edit app code.
