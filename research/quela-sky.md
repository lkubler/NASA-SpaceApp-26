# Blocked sky at Quela vs. Ehresmann et al. 2021 (task 030, data-scout, Sat 14.11.)

## Verdict
**Not reproduced.** Published: 19 % of the sky blocked at Quela. Ours from the 1 m DTM: 10.0 % of the hemisphere (solid angle), 6.4 % by the unweighted zenith-mean definition. About a factor 2 low under every reading. Do not claim "our code reproduces RAD's number". The honest line: "terrain at Quela blocks 6-10 % of the sky in our DTM, against 19 % published; the same buttes, the same direction (blocked toward E/SE), but our value is lower and we could not read the paper's exact integral."

## Step 1: what is published (partly confirmed)
- **Confirmed (V, publisher abstract via Crossref API `api.crossref.org/works/10.1029/2021JE006851`):** "Curiosity was parked close to Butte M12 in the Murray Buttes formation, which blocked out 19% of the surrounding sky view ... MSL sol 1456-1467 ... a decrease of 4% in the expected dose rate, and 7.5% in the neutral particle environment." So "Butte M12" is the butte at Quela (sols 1456-1467 sit inside the Quela stay, 1455-1468). Guo et al. 2021 GRL (doi 10.1029/2021GL093912): 5 +- 1 % at 19 % obstruction (abstract via search, S).
- **Not confirmed (U): the paper's own definition.** The Ehresmann full text is "bronze OA" at Wiley (OpenAlex), but Wiley returns 403 / Cloudflare to scripts and WebFetch; no repository copy exists (OpenAlex `any_repository_has_fulltext: false`, Europe PMC no hit). I did not try piracy mirrors.
- **Definition from the same group's open follow-up (V, read in full text):** Guo et al., JGR Planets 2026, doi 10.1029/2026JE009704 (PDF at `elib.dlr.de/224554`, "follows the same methodology as Guo et al. (2021)"), Sect. 3: the field of view is computed from the 1 m Gale DEM; the viewpoint is 1 m above the surface "to mimic the height of RAD"; the horizon elevation angle is found for every azimuth, 0.25 deg bins, within 20 km; "ratio of the obstructed sky (ROS) with respect to a full-sky view as a function of zenith angle"; the table value is "sum ROS(theta) * dtheta" over theta 0-90 deg, 1 deg bins. Same paper restates the Murray Buttes result as "decrease of 4%-5% when the blocked sky ratio was approximately 19%". Other sites there: 5-38 % (Tower Buttes 13.7-14.8 %, Maria Gordon Notch 37.9 %). Whether the integral is divided by 90 (unweighted in zenith) or weighted by solid angle is not stated, so I computed both.
- Verdict on step 1: the number (19 %), the site (Butte M12 = Quela), sols and the DEM-horizon method are confirmed; the exact normalisation is not. Proceeded, as the method is clear enough to test.

## Step 2: our value
Script: `scripts/preprocess/quela_sky.py` (about 3 min, numpy only; reads `murray.json`, `regional.json`, the height binaries).
Method: viewpoint at the sol 1455 waypoint (137.3530064 E, -4.69520223; 1 m crop px col 345.2, row 473.5; DTM ground -4376.7 m) plus 1 m; for 1440 azimuths (0.25 deg) the maximum elevation angle along the ray, 1 m crop out to 400 m (1 m steps), then the 5 m regional grid to 2 km. Void cells are skipped. Horizon elevation e gives: solid-angle fraction sin(e) (hemisphere), zenith-mean fraction e/90, cosine-weighted sin^2(e); all averaged over azimuth, negative elevations count as open.

| Definition | Ours at Quela | Published |
|---|---|---|
| Solid-angle fraction of the hemisphere | **10.0 %** | 19 % |
| Mean of ROS(theta) over zenith, unweighted | 6.4 % | 19 % |
| Cosine (projected-area) weighted | 2.1 % | not stated |
| Max horizon elevation | 17.7 deg | not stated |

Horizon elevation by azimuth (deg, every 30 deg from N): 6.1, 5.5, 12.9, 16.3, 16.9, 8.2, 5.4, -0.3, -2.8, -4.3, -3.2, -1.5. The butte blocks the NE to SE sector (azimuth 60-150), up to 17 deg; the west is open.

### Sensitivity to position (5 x 5 grid, +-5 m E/N; full table in `data/raw/quela/sky_result.json`, not committed)
- Solid-angle fraction 8.7 % (5 m W and 5 m S) to 11.6 % (+5 E, +5 N). +-2 m: 9.0-10.8 %. Unweighted: 5.6-7.5 %.
- The sector with the butte gets bigger when the point moves east/south (toward the butte). So registration cannot explain the gap: +-5 m moves the number by 1-2 points; reaching 19 % would need a very different position.

## Why we may be low (not tested, listed in order of my guess)
1. The paper's 19 % may be normalised differently (we cannot read it); 6.4 % and 10 % bracket the plausible readings, 19 % is above both.
2. Position: the waypoint is the sol 1455 drive end; RAD data are sols 1456-1467 at the parked pose. The row in the waypoint file is probably the same spot (13 sols parked), but I did not check the pose against the 1 m orthophoto.
3. DTM no-data begins 320-400 m to the WNW (azimuth 230-300 deg); terrain there is treated as open, so our value is a lower bound. The visible slope there is small, so this is unlikely to add 9 points.
4. Rover self-shielding and the exact RAD field of view (65 deg half angle is cited elsewhere, S) are not part of the terrain-only number.
5. The HiRISE DTM (1 m posting, 25 cm ortho) smooths steep butte walls, so the near-vertical flank may read lower than the real butte.

## Use in the app
Show it as "published 19 % blocked; our DTM 6-10 %; not reproduced" in the "Check against Curiosity and RAD data" fold, or leave it out. Do not tell judges it validates the terrain code. `app/public/data/murray/quela_sky.json` carries the numbers and caveat. License: HiRISE DTM public domain (NASA/JPL/University of Arizona/USGS); papers are cited, not redistributed.

## Sources
- Ehresmann et al. 2021, JGR Planets 126(8), doi:10.1029/2021JE006851, abstract via https://api.crossref.org/works/10.1029/2021JE006851
- Guo et al. 2021, GRL, doi:10.1029/2021GL093912 (abstract via search summary)
- Guo et al. 2026, JGR Planets, doi:10.1029/2026JE009704, https://elib.dlr.de/224554/ (method text, Sect. 3-4)
- OpenAlex record for access status: https://api.openalex.org/works/doi:10.1029/2021JE006851
- Data: `app/public/data/murray/` (HiRISE DTEEC_040770_1755_039280_1755_U01), waypoints in `research/data-science.md` section 1
