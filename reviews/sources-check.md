# Sources and labels check before submission

Reviewer: Claude Code agent (review only, no code changed). Sun 15.11., 08:45 to about 09:25, phase BUILD.
Based on: `app/src/core/sources.js`, `app/src/core/values.js`, `app/src/ui/label.js`, `app/src/frame/sourcesPage.js`, `app/src/steps/*`, `app/public/**`, `app/package.json`, `docs/ai-use.md`, and the screenshots in `reviews/journey/{far-1280,far-1920,near-1280,stops-1280}`. The app was not started; the Sources page was read from its source, not rendered.

## Summary (most serious first)

1. **AI disclosure is incomplete:** the "Use of AI" section on the Sources page (`AI_NOTE`, sources.js:204-208) does not mention the intro film, although the film is marked "AI-generated" in its pixels and listed under Tools. No text says which AI tool made the helmet image or which parts of the film are AI-made (that is "missing" in both the app and `docs/ai-use.md`).
2. **`docs/ai-use.md` contradicts itself and the app:** line 23 still says the helmet frame is "by a team member ... origin to be confirmed". Later lines and the Sources page say it is an AI-generated image.
3. **External sources shown in markers are missing from the Sources page:** the request texts cite Banham et al. 2021, the PIA21043 caption and JPL news articles (requests.js), but these are not in `DOCS` and do not appear on the page. The rules ask for all external text sources to be listed.
4. **Values without a marker:** the Debrief line "Your report reaches Earth in 18 min" (an assumption value, `signalDelayNowMin`) has no marker. At 1280 px the Plan totals headers "Reserve on ret…" and "Without radio …" are cut off, and their markers are cut off with them.
5. **Markers hard to see:** on the Walk reserve panel (orange glass), the Walk legend (grey on the helmet), the step 1 footer source line, and the map scale bars on Go and Debrief, the marker is close to invisible. All 48 source URLs answer 200/206.

---

## MUST FIX before submission

| # | Where | What is wrong | Suggested fix |
|---|---|---|---|
| M1 | `app/src/core/sources.js:204-208` (`AI_NOTE`) | The "Use of AI" section names only the code and the helmet image. The intro film (`app/public/egress/egress.mp4`, marked "AI-generated" in its pixels) is not mentioned. | Add one sentence on the film that says what in it is AI-made. The team must supply this; do not guess. |
| M2 | sources.js:197, sources.js:198, `docs/ai-use.md` | The AI tool used to generate the helmet image is missing. Which parts of the film were made with AI is also missing (ai-use.md line 33: "the README itself does not say which parts were made with AI"). | The team names the tool and the AI-made parts. Write them into `AI_NOTE`, `TOOLS` and ai-use.md. |
| M3 | `docs/ai-use.md:23` | "Helmet frame image by a team member: `docs/design/helmet-frame.png`; origin to be confirmed before it ships". This contradicts ai-use.md:27 and sources.js:197, which say it is AI-generated. | Mark line 23 as superseded, or add "superseded: AI-generated, see feedback round 1". |
| M4 | `app/src/steps/1-mission/requests.js:21-24` and the other request `whySource` entries; `DOCS` in sources.js | External text sources appear only in hover markers and are missing from the Sources page: Banham et al. 2021 (doi 10.1029/2020JE006554), NASA PIA21043 caption, jpl.nasa.gov news "nasa-scientists-discover-unexpected-mineral-on-mars" and "nasas-curiosity-rover-team-confirms-ancient-lakes-on-mars". | Add them to `DOCS`, or list the request sources in their own "Mission texts" block on the page. |
| M5 | `app/src/steps/5-debrief/index.js:483-484`; screenshots far-1280/16-debrief.jpg, stops-1280/17-debrief.jpg | "Your report reaches Earth in 18 min" has no marker. The value is `ENVIRONMENT.signalDelayNowMin` (assumption, MCBRAYER). | Append `labelTag(ENVIRONMENT.signalDelayNowMin)` inside the `dbf__nowrap` span. |
| M6 | far-1280/06-plan-F7.jpg, stops-1280/07-plan-3-stops.jpg (Plan totals) | At 1280 px the headers are cut off ("Reserve on ret…", "EVA time, rou…", "Without radio …"), and the markers of "Reserve on return" and "Without radio" go with them. These are the key values of the screen. They are fine at 1920. | Shorten the headers, or keep the marker outside the ellipsis box. |
| M7 | sources.js:142 (Space Exploration Vehicle entry) | The intro film is rendered from a `Space_Exploration_Vehicle.glb` (ai-use.md:33), but the SEV credit names only "the rover in the walk". Whether the film's model is the NASA/LaRC one is not confirmed. | The team confirms. If it is the NASA model, extend "use" with "and the intro film". |

## Check 1: values shown without a marker

| Where | Value | Must / nice | Suggested fix |
|---|---|---|---|
| Debrief, far-1280/16-debrief.jpg | "reaches Earth in 18 min" | must (M5) | see M5 |
| Plan totals at 1280, far-1280/06-plan-F7.jpg | markers of Reserve on return and Without radio cut off | must (M6) | see M6 |
| Plan leg list, far-1280/06-plan-F7.jpg, far-1920/06-plan-F7.jpg | "Base · Bradbury Landing · 8 km" (the map pill has a marker, the list row has none) | nice | Reuse the `drive` or base tag on the row |
| Plan map, far-1920/06-plan-F7.jpg | "EVA zone · 89 × 74 m" label on the map (the legend has a marker) | nice | Fine through the legend, or add the zone tag |
| Step 1, far-1280/03-requests.jpg | "Bradbury Landing · 10.1 km drive", site names, "Mount Sharp": covered only by the footer source line, whose markers are barely visible | nice | Make the footer markers visible (see check 2) |
| Step 1 vs Plan | "10.1 km drive" (step 1) vs "8 km" (Plan): one is the drive length, the other the straight-line distance (extras.js:14-17), but neither label says so | nice | Say "8 km straight line" in the Plan pill or its marker text |
| Go, far-1280/07-go.jpg | Elevation profile: no marker for the heights (Access Mars/HiRISE grid) and no height scale | nice | Add one marker beside the profile (real terrain, model route) |
| Walk, far-1280/10-walk-out-30.jpg | Task row "47 m · 1 h 47" has no marker. The same row at the sample (13-walk-sample.jpg, "69 m · 2 h 37 ⓘ") has one. | nice | Show the tag in every target state |
| Walk compass | Heading "091°" | nice | Acceptable (a direction, not data); no change needed |

## Check 2: markers that wrap alone, overlap, or are hard to see

| Where | Problem | Must / nice | Suggested fix |
|---|---|---|---|
| far-1280/10-walk-out-30.jpg, 13-walk-sample.jpg (Reserve on return panel, top right) | Marker almost invisible on the orange glass. This is the walk's key number. | nice (close to must) | Raise the marker contrast on HUD glass (white at 70 %) |
| far-1280/10-walk-out-30.jpg (legend, bottom right: Over 20°, Radio shadow edge, Target beacon, Ground…, Sky) | Grey markers on the grey helmet interior, hard to see | nice | Same contrast fix, or a dark backing |
| far-1280/03-requests.jpg (footer "Sources … Height ×2.5 ⓘ …") | Markers in the footer source line nearly invisible on the crater | nice | Brighter marker colour in `.m1` footer |
| far-1280/07-go.jpg, 16-debrief.jpg, stops-1280/17-debrief.jpg (map scale "20 m ⓘ", "10 m ⓘ", "5 m ⓘ") | Grey marker on the orange map, barely visible | nice | Dark chip behind the scale bar |
| far-1280/06-plan-F7.jpg (selected stop card) | The title marker of "East side, behind the butte mass" wraps alone onto the second line (fine at 1920) | nice | Keep the marker with the last word (same nowrap fix as in Debrief) |
| stops-1280/17-debrief.jpg ("…more reserve than planned." then ⓘ) | Marker wraps alone onto its own line (far-1280 is fine) | nice | Wrap the last word and the marker in a nowrap span |
| far-1920/06-plan-F7.jpg | The stop tooltip covers the Relay marker and its label | nice | Offset the tooltip, or accept it (transient) |
| far-1280/10-walk-out-30.jpg | "in 8 m ⓘ ." puts a space before the full stop | nice | Drop the space |

## Check 3: old-style labels

No inline "model"/"simulated" words or second label component found in the UI. All markers come from `labelTag` (step code uses it directly or through small wrappers such as `MODEL_TAG` in hud.js). The "(assumption)" words in `display.js` are code comments and are not shown.

| Where | Note | Must / nice | Suggested fix |
|---|---|---|---|
| `app/src/frame/sourcesPage.js:52` | The Sources table's "Label" column shows only the marker, so a judge scanning the page cannot read the kind without hovering | nice | Print the kind word beside the marker in that column |
| sourcesPage.js:53 | The table's "Source" column shows the document title without a link | nice | Use `link(DOCS[src].url, title)` |

## Check 4: label kind that looks wrong

| Where | Value | Label now | Why it looks off | Suggested fix |
|---|---|---|---|---|
| `values.js` WORK.walkW, WORK.spotW | 350 W / 310 W | model | Taken directly from the Bellcomm memo (unit conversion only), so "calculated by us" does not fit | `real` (lunar rule) |
| values.js PLANNER.steepPenalty | 1e5 | model, source NONE | An algorithm constant with no data behind it | `assumption` |
| values.js RULES.distanceLimitM | 3.5 km | real, moon | Source is OGI (Mars study), yet it carries the lunar flag; the text derives it from the Apollo walk-back speed | Check against OGI slide 9; keep `real` and drop `moon` if OGI states it for Mars |
| debrief/index.js:42 `warnings` | warning count | model, src WALK_TERRAIN | A count from the walk log; the terrain inventory is not its source | Source "this walk (log)" with no document, kind model |

Everything else checked looks right: body readings are simulated, dose is real rate × model, demo factors are assumptions, the base is an assumption, the photos are real.

## Check 5: Sources page completeness, links, licences

### Assets in `app/public/**` and `package.json`

| Asset / dependency | Entry on Sources page | Note |
|---|---|---|
| `murray/terrain.glb`, `tiles/`, `background.jpg`, `cards/mb1,3,4.jpg` | Access Mars (sources.js:83) | ok. The "use" text says "four Access Mars points and their photos", but only 3 card photos ship (mb2 left out, places.js:30). Nice: say "three photos". |
| `draco-old/` | Tools: Draco decoder | ok, Apache-2.0, LICENSE file shipped |
| `models/mars.glb` | Planet Mars 3D model | ok |
| `models/sev.glb` | Space Exploration Vehicle | ok, credit NASA/LaRC/Advanced Concepts Lab. See M7 for the film. |
| `sky/milky-way.jpg` | Deep Star Maps 2020 | ok, Gaia credit given |
| `data/gale/*` | Gale crater HRSC model + MOLA | ok, ESA/DLR/FU Berlin credit given. `gale_height.i16.bin` + `gale.json` are not loaded by `src` (MOLA grid, covered by the MOLA entry). |
| `data/missions/*.jpg` | PIA20174, PIA18476 | ok. The entry links only PIA20174; nice: add the PIA18476 link. |
| `data/murray/photos/crossbedding_PIA21042.jpg`, `quela_drill.jpg`, `quela_navcam.jpg` | Curiosity photos | ok with credit lines. The link goes to the JPL policy, not to the PIA21042 page; the file was taken from `pds-rings.seti.org` (credits.json). Nice: link the PIA21042 page. |
| `data/murray/photos/marimba_*`, `butte_mastcam_1421.jpg`, `data/murray/regional_*`, `dtm_*`, `ortho_*`, `quela_sky.json` | covered by the Curiosity photos / HiRISE entries | Shipped but not loaded by `src` (grep). Nice: remove them from `app/public` or keep them; they are covered either way. |
| `egress/egress.mp4` | Tools: "Rover egress film" | see M1, M2, M7 |
| `src/steps/4-walk/helmet-frame.webp` (not `app/public/helm.webp`, which does not exist) | Tools: "Helmet frame image (AI-generated)" | visible "AI-generated image" mark confirmed in the walk screenshots; see M2 for the tool |
| `three` | Three.js, MIT | ok |
| `@fontsource/inter`, `jetbrains-mono`, `space-grotesk` | one entry, SIL OFL 1.1 | ok |
| `vite`, `vitest` | yes, MIT | ok |
| Playwright (journey test runs, `app/scripts/journey.mjs`) | missing | nice: add under Tools (dev testing) |
| pyrender (film renders, ai-use.md:33), macOS sips (star map conversion, sky/ATTRIBUTION.txt) | named only in free text / ATTRIBUTION | nice: add pyrender to Tools |

### Link check (GET with byte range, generic browser user agent, redirects followed)

All 48 URLs found in `app/src` and the `app/public/data` credit files answered **200 or 206**: NTRS PDFs (6), NTRS citations (2), nasa.gov ConOps PDF, NSSDCA fact sheet, SwRI, PDS Atmospheres REMS, PDS Geosciences MOLA, uahirise.org/dtm, MMGIS waypoints JSON, images.nasa.gov PIA20174/PIA18476, science.nasa.gov (Gale crater, SEV, Mars model, 3 photojournal pages, farewell image 3), jpl.nasa.gov (image policy, PIA16769, 2 news), svs.gsfc.nasa.gov/4851, web.archive.org Bellcomm PDF, wikipedia Pandolf, GitHub (access-mars, draco), threejs.org, vite.dev, vitest.dev, fontsource.org, gltf-transform.dev, ffmpeg.org, numpy.org, anthropic.com/claude-code, 5 Curiosity raw image URLs, pds-rings PIA21042.

| Note | Must / nice | Suggested fix |
|---|---|---|
| The 5 raw image `source_url`s in `credits.json` use `http://mars.jpl.nasa.gov/...` | nice | Switch them to `https://` |
| `WALK_TERRAIN`, `WALK_TARGETS` point to `research/*.md` and show as plain text; judges cannot open them from the app | nice | Link them to the public repo once it is public |
| The PANDOLF_ETA source is Wikipedia | nice | Fine as labelled ("secondary source"); keep the assumption label |

### Licences and credits

NASA media credit lines are present for every NASA image and model (NASA/JPL-Caltech, NASA/JPL-Caltech/MSSS, NASA/LaRC/Advanced Concepts Lab, NASA/GSFC SVS, ESA/DLR/FU Berlin, ESA/Gaia/DPAC). SEV: "NASA media usage guidelines" is named. Fonts: OFL. Three.js: MIT. Access Mars: Apache-2.0 with the licence file shipped. Nothing found missing apart from M7.

## Check 6: `docs/ai-use.md` vs Sources page

| Topic | ai-use.md | Sources page | Must / nice |
|---|---|---|---|
| Helmet image origin | line 23: "by a team member … origin to be confirmed"; line 27: AI-generated, supplied by the team | AI-generated (TOOLS, AI_NOTE) | must (M3) |
| Intro film | line 33: the team's film; the kit README does not say which parts are AI-made; marked "AI-generated" | TOOLS: "labelled AI-generated"; not in AI_NOTE | must (M1, M2) |
| AI tool for images | missing | missing | must (M2) |
| Code, research, data scripts | Claude Code throughout | AI_NOTE + Claude Code entry in Tools + `package.json` description | consistent |
| UI mockups made "with Claude" (line 23) | internal, not shipped | not mentioned | consistent (not part of the product) |

## Not checked

- The Sources page was not rendered, so its layout and readability are unchecked. The stops-turn-1280 run and most 1920 screens were not opened.
- Marker popover texts were not opened one by one; the kinds were read from source.
- Whether the film's rover model and placeholder terrain are the NASA SEV model / AI-made could not be checked: the team must confirm.
- `reviews/journey/near-1280/error.jpg` shows an older Plan layout; it may be a stale file from an earlier run (not touched).
