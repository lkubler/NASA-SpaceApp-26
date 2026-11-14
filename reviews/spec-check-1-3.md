# Spec check: steps 1 to 3 (frame, design, mission, plan, go / no-go)

Checked Sat 14.11. about 19:30 (BUILD phase), `main` at f59c6fd. The app ran in dev mode (`vite --port 5181`, serving `app/`). I drove it with Playwright headless Chromium (SwiftShader WebGL) at 1280 × 720 and 1920 × 1080: the full visitor path 1 → 2 → 3 with no dev jump, then `?step=3&spot=F7` and `?step=4&broken=1` for single states. Screenshots are in `reviews/spec-check/1-3/` (JPEG, quality 70). The suffix gives the width (`-1280` / `-1920`). No console errors on any run.

**Note on the broken-rule path:** none of the six real candidates (F1–F5, F7) breaks a rule, so no visitor can reach the broken-rule screens. I tried them with the builder's test fixture (`steps/3-go/dev/broken.js`, a test point up the east butte wall), loaded from the browser console. Screenshots of that path have `TESTFIXTURE` in their names.

Status values: **met**, **not met**, **unclear** (two spec lines conflict), **not checked** (I could not check the line in steps 1–3, with the reason given).

---

## 0 Frame (`specs/0-frame.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Layout in steps 1 to 3 => map left, panel right, one main button at the bottom right of the panel | not met (step 3) | Steps 1 and 2 match. Step 3 follows its own spec and mockup 03 instead: headline top left, small map top right, profile across, button bottom right. The two specs conflict here. | `3-go-F7-1280.jpg` |
| Stack => static web app, Vite and Three.js, in `app/`; builds to GitHub Pages with the existing workflow | met | `app/package.json` has Vite 6 and three 0.170. `.github/workflows/pages.yml` builds `app/` and deploys `app/dist`. I did not run the deploy. | – |
| Steps => Mission, Plan, Go / no-go, Walk, Debrief; each its own module | met | Step bar reads 1 Mission, 2 Plan, 3 Go / no-go, 4 Walk, 5 Debrief. Each step is a folder under `app/src/steps/`. | `1-crater-1280.jpg` |
| Step bar => small, beside the project name, in steps 1, 2, 3 and 5; shows done, current, next | met | Small mono bar right of `[MARTIAN MAP]` in steps 1, 2, 3 and 5. Hidden in step 4. Done steps have a cyan ring, the current step is filled white, next steps are grey. | `2-open-1280.jpg`, `5-broken-carried-TESTFIXTURE-1280.jpg` |
| Forward => only when the current step is complete | met | Step 1: "Plan this mission" and step bar item 2 stay disabled until a request is chosen. Step 2: "Confirm route" stays disabled until a spot is chosen. | `1-requests-1280.jpg`, `2-open-1280.jpg` |
| Back => always possible until the walk starts | met | Step bar item 1 is enabled in step 2. "Edit route" in step 3 goes back with the spot kept (F7). In step 4 item 1 is disabled once `walk.started` is true. | `3-edit-route-back-1280.jpg` |
| Shared state => one object | met | `frame/state.js` holds one object (`window.__state`) with request, candidates, spotId, route, plan, walk. | – |
| Rules and suit model => one module, built from `specs/rules.md`; no step holds a number of its own | met | Rule, suit and demo values live in `core/values.js`. Steps read them from there. Step 1 holds its own display factor `VERTICAL_EXAGGERATION = 2.5`; see the rules row "Values => all in one place". | – |
| Terrain => loaded once from `app/public/murray`, used by Plan and Walk | met | `getTerrain()` caches one promise and loads from `app/public/data/murray/`, one folder deeper than the spec says. Plan and Walk both call it. | – |
| Labels => one component; click shows one or two sentences and the source | met | Clicking `real` beside the MOLA credit shows the kind, two sentences and the MOLA MEGDR source. Clicking the suit-check `simulated` label also works. | `1-label-real-1280.jpg`, `3-suit-label-1280.jpg` |
| Sources => a page reachable from every step: all data, tools and code used, and the AI-use note | met | "SOURCES" sits top right in steps 1–5 (also in the walk header). The page lists data, a values table, documents, tools and code, and "Use of AI". The values table shows code keys (e.g. `slopeMaxDeg`) as value names. | `0-sources-step1-1280.jpg`, `0-sources-step3-1280.jpg` |
| Language => English only | met | Text scan of the opening, steps 1–3 and the sources page found no German words or umlauts. | – |
| Screen => works at 1280 × 720 and 1920 × 1080 | met | Every step 1–3 screen fits at both sizes without scrolling. One exception, test fixture only: at 1280 × 720 a broken-rule alert in the Plan panel pushes "limited by oxygen" under the button area. | `*-1280.jpg`, `*-1920.jpg`, `2-broken-candidate-TESTFIXTURE-1280.jpg` |
| Look => `specs/design.md`; one style sheet for all steps | met | Shared `styles/tokens.css`, `base.css`, `components.css`, `frame.css`. Each step adds a small `style.css` on top. | – |
| Not in this spec: the content of the five steps | – | Not applicable. | – |

## Design (`specs/design.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Markers => numbered circles, mono digits; the chosen one filled cyan | not met (step 3) | Step 2 matches. In step 3 the chosen spot is a hollow cyan diamond with no number, on the map and in the legend ("◇ Spot"). | `3-go-F7-1920.jpg` |
| Accent => cyan: the route on foot, the selected item, the main action, a passed check | unclear | Route, selected marker and card, and passed checks are cyan. The main buttons in steps 1 and 2 are white pills ("Plan this mission", "Confirm route"), as in mockup 02 and as the "Main button" line allows. That line asks for cyan only in the last step before the walk. The two lines disagree for steps 1–2. | `1-chosen-1280.jpg`, `2-select-F7-1280.jpg` |
| Map => a rounded panel on the left, legend below it, scale bar inside | not met (step 3) | Step 2 matches (rounded, legend below, "20 m" bar inside). In step 3 the map is top right, as `3-go.md` asks. The specs conflict. | `2-open-1920.jpg`, `3-go-F7-1920.jpg` |
| Mockups set the look; spec wins | met | Compared with mockups 01–03; see the mockup section below. | – |
| Background => black | met | Black page background in all steps. | `2-open-1280.jpg` |
| Terrain => the only large coloured area: Mars orange and brown | met | Crater, Plan map and Go map are the only large coloured areas. | `1-crater-1920.jpg` |
| Text => white; secondary text grey | met | Headlines and values are white. Ledes, labels and big-number captions are grey. | `3-go-F7-1920.jpg` |
| Headline => one large line per step, ending with a full stop | met | "Choose your mission.", "Plan your mission.", "Route ready." ("Route breaks a rule." with the fixture). | `1-crater-1280.jpg`, `2-open-1280.jpg`, `3-go-F7-1280.jpg` |
| Fonts => geometric display face, plain sans, mono face; matched to the mockups | met | Space Grotesk for headlines and big numbers, Inter for text, JetBrains Mono for values, codes and the project name. The look is close to the mockups. | `3-go-F7-1920.jpg` |
| Project name => top left, mono capitals in square brackets | met | `[MARTIAN MAP]` top left. | `2-open-1280.jpg` |
| Too steep => hatched orange-brown area on the map | met | Orange-brown diagonal hatching on the Plan and Go maps. | `2-open-1920.jpg` |
| Warning levels => red, yellow, blue; only for warnings, cautions and advisories | met | Red for the broken slope rule (fixture). Yellow for the radio-shadow caution and the radio stretch of the route. No advisory appears in steps 1–3. | `3-check-4-1280.jpg`, `3-broken-check-TESTFIXTURE-1280.jpg` |
| Cards => rounded, thin border, dark fill; in the helmet translucent | met (steps 1–3) | Request cards and Plan cards are rounded with a thin border and dark fill. The helmet is outside this check; in passing, the walk start screen shows translucent cards. | `1-chosen-1920.jpg`, `4-broken-carried-TESTFIXTURE-1280.jpg` |
| Main button => one per screen, a wide pill, bottom right; in the last step before the walk cyan with a glow | met | One wide pill bottom right in steps 1 (once the panel is open), 2 and 3. Step 3 "Start excursion" is cyan with a glow (box-shadow 0 0 36px cyan). | `3-go-F7-1280.jpg` |
| Big numbers => label small and grey above, value large below | met | Plan totals and Go big numbers both follow this. | `3-go-F7-1920.jpg` |
| Labels real / model / simulated / assumption => small mono text beside the value | met | Small mono tags beside values in all three steps. | `2-select-F7-1920.jpg` |
| Motion => short fades and slides only | met | `--fade` 180 ms and `--slide` 240 ms; the panel slides in and steps fade in. Nothing else animates. | – |
| Helmet => helmet frame; green area is the scene; "AI-generated image" mark | not checked | Step 4, outside this check. In passing, the frame and an "AI-generated image" mark bottom left are visible. | `4-broken-carried-TESTFIXTURE-1280.jpg` |
| Mockup 4 => its black sky is a placeholder; the walk shows the real sky | not checked | Step 4, outside this check. In passing, the walk shows a sky image. | `4-broken-carried-TESTFIXTURE-1280.jpg` |
| Not in this spec: logo, sound, a light theme | met | No logo, no audio, no light theme or `prefers-color-scheme` (searched `app/src`, `app/index.html`). | – |

## 1 Mission (`specs/1-mission.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Opening => two sentences before anything else: a crew on Mars, 4 to 22 minutes of signal delay each way; one question: can I still get home? | met | First screen: "A crew is on Mars, on its own: a signal to Earth takes 4 to 22 minutes each way `real`." and "Before every step outside, one question: can I still get home?". The crater is dimmed behind it and a "Begin" button sits bottom right. | `1-opening-1280.jpg`, `1-opening-1920.jpg` |
| View => Gale crater in 3D from real elevation data (MOLA or HRSC), filling the screen; Mount Sharp labelled; label: real | met | Full-screen 3D crater from MOLA MEGDR (463 m per pixel) with "Mount Sharp" labelled. The credit line carries `real`. Heights are drawn ×2.5, labelled `assumption`. | `1-crater-1280.jpg`, `1-crater-1920.jpg` |
| No crater-wide elevation data obtainable => fallback | – | Not needed: crater-wide MOLA data is used. | – |
| Headline => "Choose your mission." at the bottom left, one line of text below it | met | Bottom left, with the line "Three sites in Gale crater that Curiosity explored. Select one." below. | `1-crater-1280.jpg` |
| Sites => Murray Buttes selectable; Marias Pass and Pahrump Hills shown with a lock, "not in this demo" | met | Both locked sites show a lock icon and "not in this demo". Clicking Marias Pass opens nothing. | `1-crater-1920.jpg` |
| Selecting Murray Buttes => the requests from Earth appear as cards | met | The panel slides in from the right with two cards. | `1-requests-1280.jpg` |
| Requests => two: cross-beds in the sandstone; radiation next to a butte wall | met | "A sample from the sandstone at the foot of a butte" (cross-beds) and "A radiation measurement beside a butte wall". | `1-requests-1920.jpg` |
| Card => who asks, what sample or measurement, why it matters in one sentence, a real Curiosity photo | met | Each card has: who asks (e.g. "Sedimentology team, Earth" `simulated`), "One sample" or "One measurement", a one-sentence reason (`real`), and a Curiosity photo with camera, sol and credit (`real`): Mastcam sol 1454 PIA21042 and Navcam sol 1455. | `1-chosen-1920.jpg` |
| Wording => names the rock, not a point | met | "the sandstone at the foot of a butte", "beside a butte wall". | `1-chosen-1920.jpg` |
| One task => each request asks for exactly one sample or measurement | met | "One sample" and "One measurement". | `1-chosen-1920.jpg` |
| Signal delay => shown with the time the request was sent | met | "Sent 19:10 · received 19:28 · 18 min delay `assumption`" on each card. | `1-chosen-1280.jpg` |
| Choosing => one request; the main button leads to Plan | met | Choosing a card highlights it in cyan and enables "Plan this mission →", which opens step 2. | `1-chosen-1280.jpg`, `2-open-1280.jpg` |
| Not in this spec: launch, landing, a base, rover drive, playable other sites, devices to place, mudstone request | met | None of these is built. The "Base" marker from mockup 01 is not built. The other sites cannot be played. | `1-crater-1920.jpg` |

## 2 Plan (`specs/2-plan.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Selecting a candidate => its card on top of the panel: name, rock, work time, distance; its route in cyan dots on the map | not met | The card shows name, place and task with work time ("At the foot of a butte · One sample, 20 min") and distance ("138 m"), but no rock (e.g. sandstone). The route is in cyan dots. The request box sits above the card. | `2-select-F7-1920.jpg`, `2-select-F3-1280.jpg` |
| Layout => map panel left with legend below; right: headline, cards, list of legs, three totals, main button | met | Matches mockup 02. The legend wraps onto two rows. | `2-select-F7-1920.jpg` |
| Map => the site from above, from the same terrain the visitor walks; north up; scale bar | met | Top-down render of the Access Mars terrain (`real`), "N" top right, "20 m" scale bar. Steep areas show stretched texture streaks. | `2-open-1920.jpg` |
| Rover => at the start point, marked as home | met | Black square labelled "Home" at the centre. Legend: "Rover, home `assumption`". | `2-open-1280.jpg` |
| Too steep => ground over 20° hatched | met | Hatched areas; legend "Too steep (> 20°) `model`". | `2-open-1920.jpg` |
| Radio shadow => ground without line of sight to the rover dotted | met | White dot grid; legend "Radio shadow `model`". | `2-open-1920.jpg` |
| Candidates => reachable spots at the foot of the buttes from `walk-targets.md`, numbered; label: position derived from the terrain | met | Six markers 01–06 = F1, F2, F3, F4, F5, F7, the six listed in `walk-targets.md` §3. Label `model` with the text "Position derived from the terrain…". | `2-open-1920.jpg` |
| Access Mars points => the four real points shown with their text; not sample spots | met | Buttes, Monument Valley, Bruce Murray and Interference show as white points. Hover or click opens their original text (e.g. Bruce Murray), labelled `real`. Interference sits on the west edge with its circle half cut off. | `2-accessmars-point-1280.jpg` |
| Route per candidate => rover to spot and back, fastest rule-keeping route; calculated in the browser when the step opens | met | "Calculating routes…" card, then `planAllCandidates` runs on mount. Each route goes out and back. | `2-open-1280.jpg` |
| Legs => rover, on foot, spot, on foot, rover, each with distance and time | met | Five rows, e.g. "On foot 69 m · 2 h 37", "East side… 20 min", "On foot 69 m · 2 h 37". The rover rows are points with no value; the spot row has a time only. | `2-select-F7-1920.jpg` |
| Totals => total time, reserve on return with the limiting consumable, steepest slope | met | "≈ 5 h 34", "1 h 12 limited by oxygen", "20.0°", each labelled `model`. | `2-select-F7-1920.jpg` |
| Comparing => every marker shows its total time on hover; the cheapest is marked | met | Hover tips for all six (≈ 1 h 23 … ≈ 5 h 34). 01 has a dashed cyan ring and "Cheapest of the spots"; the legend shows "Cheapest". | `2-hover-1280.jpg` |
| Stretches in radio shadow => marked on the route | met | The F7 route shows a yellow band under the dots through the shadow; legend "Route in radio shadow". | `2-select-F7-1920.jpg`, `2-F7-route-zoom-1920.jpg` |
| Candidate without a rule-keeping route => best route shown, broken rules in red in the panel and on the route | not checked (partly) | No real candidate breaks a rule. With the fixture added as candidate 07: the panel shows a red "Breaks a rule: Slope on foot / Crosses 8.1 m of ground steeper than 20°", steepest slope 25.5° in red, and "No route keeps every rule" in the hover tip. The broken stretch lies under markers 01 and 07, so I could not see red on the route. | `2-broken-candidate-TESTFIXTURE-1920.jpg`, `2-broken-route-zoom-TESTFIXTURE-1920.jpg` |
| Work at the spot => fixed duration, counted in time and consumption; label: assumption | met | "20 min `assumption`" in the card and legs, and included in the total. `core/plan.js` counts consumables at `WORK.spotW` for the spot time. | `2-select-F3-1280.jpg` |
| Main button => "Confirm route"; active once a candidate is chosen | met | Disabled before a choice, enabled after. | `2-open-1280.jpg`, `2-select-F7-1280.jpg` |
| Not in this spec: rover route, handover point, infrastructure site, own waypoints, route coloured by effort, pace | met | None built. Mockup 02's rover line, handover point and infrastructure card are absent. No pace is shown or set. | `2-select-F7-1920.jpg` |

## 3 Go / no-go (`specs/3-go.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Rule broken => check red and names the rule; main button "Start with 1 broken rule"; the broken rule is carried into the walk and the debrief | not met (last part) | Fixture: the slope check is red with "Crosses 8.1 m of ground steeper than 20°". The button reads "Start with 1 broken rule" and is red. Walk start (`?step=4&broken=1`): the HUD names no broken rule. Ending the walk early with esc gave the debrief "kept every rule". `5-debrief/index.js` carries a planned broken rule only when the walk log itself already records one. I did not walk the whole route. | `3-broken-check-TESTFIXTURE-1280.jpg`, `4-broken-carried-TESTFIXTURE-1280.jpg`, `5-broken-carried-TESTFIXTURE-1280.jpg` |
| Layout => headline and one sentence top left, big numbers below, small map top right, height profile across, checks and main button at the bottom | met | Matches mockup 03. | `3-go-F7-1920.jpg` |
| Headline => "Route ready."; with a broken rule "Route breaks a rule." | met | Both seen ("Route breaks a rule." with the fixture). | `3-go-F7-1280.jpg`, `3-broken-TESTFIXTURE-1280.jpg` |
| Big numbers => distance, duration, steepest slope, reserve on return, radiation dose | met | 138 m, ≈ 5 h 34, 20.0°, 1 h 12, 0.16 mSv, each labelled (`model`, Moon where taken from lunar planning). The values match Plan. 0.16 mSv = 0.67 mSv/day × 5 h 34. | `3-go-F7-1920.jpg` |
| Height profile => rover to spot and back; spot marked; radio shadow stretches marked | met | Profile from Rover to Rover, spot named in cyan with a dashed line, radio shadow as a dotted area labelled "Radio shadow". | `3-go-F7-1920.jpg` |
| Checks => one per rule: slope, distance from the rover, way home, excursion length; each with planned value and limit | met | Slope "steepest 20.0° / limit 20°". Distance "farthest 60 m / plan 2.00 km / limit 3.50 km". Way home "reserve 1 h 12 / limit > 0 min, home ×1.2". Excursion "5 h 34 / plan 6 h / limit 8 h". | `3-go-F7-1920.jpg` |
| Radio shadow => its own check with the longest stretch; a caution at most | met | Yellow "!" Radio shadow, "longest 3 h 16", "a caution, not a rule". | `3-check-4-1280.jpg` |
| Suit checks => oxygen full, suit sealed, radio to rover; label: simulated | met | Three ticks with one `simulated` label, which explains itself on click. | `3-suit-label-1280.jpg` |
| Click on a check => map and profile show where on the route the value occurs | met | Slope: ring on the map and "Steepest point: 20.0°" on the profile. Radio: the longest stretch is highlighted yellow on both. All five rule checks respond. | `3-check-0-1280.jpg` … `3-check-4-1280.jpg` |
| Every rule kept => all checks cyan; main button "Start excursion", cyan | met | Four rule checks and three suit checks are cyan. Radio shadow is yellow (a caution). "Start excursion →" is cyan. | `3-go-F7-1280.jpg` |
| Edit route => link beside the main button, back to Plan | met | "Edit route" left of the button opens Plan with F7 still chosen. | `3-edit-route-back-1280.jpg` |
| Not in this spec: weather window, cutscene | met | Neither built. Start goes straight to the walk. | – |

## Rules lines these steps show (`specs/rules.md`)

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Demo time => one factor speeds up the clock and the consumption; label: assumption; always shown | not met (step 1) | Shown in step 2 ("Demo time: clock and suit run 76× faster `assumption`") and step 3. Not shown anywhere in step 1. | `1-chosen-1280.jpg`, `2-open-1280.jpg` |
| Values => all in one place in the app | not met | The height factor "×2.5" (`assumption`) shown in step 1 is defined in `steps/1-mission/crater.js` and is missing from the Sources values table. Everything else shown in steps 1–3 is in `core/values.js` and the table. | `1-crater-1280.jpg`, `0-sources-step1-1280.jpg` |
| Astronaut => 82 kg body mass, 23 kg carried load; shown | not met (steps 1–3) | Only in the Sources table. No step module reads these values (`grep` over `app/src/steps`). | `0-sources-step1-1920.jpg` |
| Suit => NASA Mars suit study, 104 kg; shown | not met (steps 1–3) | Same as above: only in the Sources table. | `0-sources-step1-1920.jpg` |
| Secondary oxygen => 1 hour; shown, never counted as time left | not met (steps 1–3) | Only in the Sources table. No step shows it. | – |
| Slope on foot => at most 20°; steeper ground is closed to the route | met | Hatched > 20° on the map. No real route has a closed point; F7 peaks at exactly 20.0°. Go check: limit 20° `real · Moon`. | `3-go-F7-1920.jpg` |
| Distance from the rover => plan 2 km, limit 3.5 km | met | Go distance check. | `3-go-F7-1920.jpg` |
| Way home => counted at a 20 % higher work rate | met | Go check "home ×1.2". The reserve label text says the same. | `3-go-F7-1920.jpg` |
| Excursion length => 6 h planned, 8 h limit | met | Go excursion check. | `3-go-F7-1920.jpg` |
| Radio shadow => no line of sight to the rover at eye height; a caution, not a rule | met | Plan dots, Go caution check. | `3-check-4-1280.jpg` |
| No route keeps every rule => best route still shown; each broken rule marked on the route and at go / no-go | met at Go, partly in Plan | Fixture only; see the Plan and Go rows above. | `3-broken-check-TESTFIXTURE-1920.jpg` |
| Home => the parked rover at the start point | met | "Home" at the centre of the map. | `2-open-1280.jpg` |
| Time left => set by the consumable that runs out first; the display names it | met | "limited by oxygen". | `2-select-F7-1920.jpg` |
| Reserve on return | met | Shown in Plan and Go, same value. | `3-go-F7-1920.jpg` |
| Turn-back point | not checked | No real route reaches zero reserve, so the Go "turn-back point" text never appears. | – |
| Tuning => spots 14 to 78 m of path; round trip to the farthest uses most of the suit | met (as far as visible) | Spots are 14 to 69 m one way. F7 leaves 1 h 12 of reserve. Detour behaviour is a walk matter and was not checked. | `2-select-F7-1920.jpg` |
| Moon values => labelled | met | "real · Moon" and "model · Moon" on lunar values. | `3-go-F7-1920.jpg` |
| Labels => every value is real, model, simulated or assumption, with its source | met | A DOM scan of steps 1–3 found only scale bars ("20 m") and marker numbers without a label. Every value has a tag that opens a source. | – |
| Unconfirmed in `source-check.md` => assumption | not checked | Not compared line by line against `source-check.md`. | – |
| Warning levels | met | See the design row. | – |
| Places => only from `walk-targets.md` | met | The six candidates and four Access Mars points all appear in `walk-targets.md`. | `2-open-1920.jpg` |
| Radiation dose => measured rate × time outside; label: model | met | 0.16 mSv `model`. | `3-go-F7-1920.jpg` |
| Mars gravity, consumables, work rate | not checked | Not visible in steps 1–3 apart from the limiting consumable. The code uses `marsG/earthG` in `core/suit.js`. | – |
| Not in this spec: pace, astronaut and suit settings, partner, events | met | None in steps 1–3. | – |

## Compared with the mockups

- **01 Choose mission:** same composition: 3D crater, Mount Sharp label, sites with lock icons, headline bottom left. Mockup 01's "Base" marker and its ring around the sites are not built (base is excluded by the spec). The requests panel is not in the mockup; it comes from the spec.
- **02 Plan route:** same layout. The rover route, handover point and infrastructure site card are not built (excluded by the spec). The added request box, radio-shadow dots and Access Mars points come from the spec. The terrain in the app shows stretched texture streaks on steep ground.
- **03 Route overview:** same layout and cyan glowing button. The "Rover / on foot" big number is replaced by reserve on return (as the spec asks). The spot on the small map is a hollow diamond, while mockup 03 uses a numbered cyan circle ("03").

## Other checks asked for

- **Labels on every value:** met in steps 1–3 (see above). Only scale bars and marker numbers have no label.
- **No German text:** met in the opening, steps 1–3 and the sources page.
- **Sources page lists everything shown:** data (MOLA, Access Mars, HiRISE, waypoints, the three Curiosity photos with credits, RAD, REMS), tools and code (three.js, Vite, Vitest, Draco, fonts, Python, AI helmet frame, Claude Code) and the AI-use note are listed. The only value missing is the step 1 height factor ×2.5.

---

# Round 2

Checked Sat 14.11. about 20:30 (BUILD phase), `main` at 23ff958 (app code unchanged since). Dev server `vite --port 5182` on `app/` (5181 was already taken by another dev server on the same folder). Playwright 1.46 headless Chromium (SwiftShader WebGL) at 1280 × 720 and 1920 × 1080: the full visitor path 1 → 2 → 3 with no dev jump (spots 03 and 06, all five rule checks clicked, Edit route), then `?step=2&broken=1` → Confirm → Go → Start → Walk → esc → Debrief. Screenshots: `reviews/spec-check/1-3/r2-*.jpg` (JPEG, quality 70; the suffix is the width). No console errors on any run. Each screen also got a DOM scan for clipped boxes, text outside the viewport, overlapping text boxes, debug or placeholder words and German words. It found nothing except the items in the cleanliness table below.

Left out on purpose, by team decision: Go map on the right (frame "Layout", design "Map"), white main buttons in steps 1 and 2 (design "Accent"), no rock type on the spot card (Plan "Selecting a candidate"), no demo factor in step 1 (rules "Demo time").

## Still not met

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Not met: none | – | Every line from round 1 that was not met, apart from the four left out above, is now met. See the next table. | – |

## Round 1 lines that were not met, checked again

| Line | Status | What I saw | Screenshot |
|---|---|---|---|
| Design: Markers => numbered circles, mono digits; the chosen one filled cyan (step 3) | met | The Go map shows the chosen spot as a filled cyan circle "06". The legend reads "● Spot". With the test fixture the circle shows "·" instead of a number (fixture point 07 only). | `r2-3-go-1920.jpg`, `r2-3-broken-TESTFIXTURE-1280.jpg` |
| 3 Go: Rule broken => … the broken rule is carried into the walk and the debrief | met | Fixture: "Start with 1 broken rule" leads into the walk, whose HUD lists "Plan breaks: Slope on foot" in red. After esc the debrief says "…but broke a rule: Slope on foot (in the plan)". "Rules on the walk" shows a red Slope on foot "15 m east of the rover (in the plan)". In the helmet the red text sits on a light translucent card and is hard to read. | `r2-4-broken-TESTFIXTURE-1280.jpg`, `r2-5-broken-TESTFIXTURE-1280.jpg` |
| Rules: Values => all in one place in the app | met | The crater height factor is now `craterHeightFactor` 2.5 × `assumption` in the Sources values table (group Demo). | `r2-0-sources-1280.jpg` |
| Rules: Astronaut => 82 kg body mass, 23 kg carried load; shown | met | Go footer: "Astronaut 82 kg `real` + load 23 kg `real`". | `r2-3-go-1920.jpg` |
| Rules: Suit => 104 kg; shown | met | Go footer: "Suit 104 kg `real`". | `r2-3-go-1920.jpg` |
| Rules: Secondary oxygen => 1 hour; shown, never counted as time left | met | Go footer: "Secondary oxygen 1 h, never planned with `real · lunar rule`". It is not part of the reserve (Plan and Go both show 1 h 12 for spot 06). The wording looks cut off; see cleanliness. | `r2-3-go-1920.jpg` |
| Plan: Candidate without a rule-keeping route => best route shown, broken rules in red in the panel and on the route | met (test fixture only) | `?step=2&broken=1`: the panel has a red "Breaks a rule: Slope on foot / Crosses 8.1 m of ground steeper than 20°" and the steepest slope 25.5° is red. A short red stretch now shows on the map above the markers. Marker 07 sits on top of marker 01's ring and the Monument Valley point, and the red line runs across the "07" digits. No real candidate breaks a rule. | `r2-2-broken-TESTFIXTURE-1920.jpg` |
| Frame: Screen => works at 1280 × 720 (broken-rule alert in Plan) | met | With the alert, the panel still fits at 720 px: "limited by oxygen", the demo line and "Confirm route" are all visible. | `r2-2-broken-TESTFIXTURE-1280.jpg` |
| Rules: Turn-back point | not checked | No real route reaches zero reserve in steps 1–3, so the turn-back text never appears. | – |

## Regression pass (0-frame, design, 1-mission, 2-plan, 3-go)

All other lines that were met in round 1 are still met. I saw them again in these screens.

| Spec | Status | What I saw | Screenshot |
|---|---|---|---|
| 0-frame | met | Step bar beside `[MARTIAN MAP]` in steps 1–3 and 5, hidden in 4. Forward is blocked until a request or spot is chosen. Edit route goes back with F7 kept. SOURCES is reachable from every step. No German text. Every screen fits at both sizes without scrolling. | `r2-2-open-1280.jpg`, `r2-0-sources-1920.jpg` |
| design | met | Black background, terrain is the only large coloured area, headlines end with a full stop, Space Grotesk / Inter / JetBrains Mono, hatched > 20°, yellow radio caution, cyan glowing "Start excursion" (box-shadow 0 0 36px cyan). | `r2-3-go-1920.jpg` |
| 1-mission | met | The two-sentence opening comes first. MOLA crater with Mount Sharp labelled `real`. "Choose your mission." bottom left. Two locked sites "not in this demo". Two request cards with who asks, one task, reason, Curiosity photo and "Sent 20:10 · received 20:28 · 18 min delay". "Plan this mission" opens Plan. | `r2-1-opening-1280.jpg`, `r2-1-chosen-1920.jpg` |
| 2-plan | met | Same layout. Six numbered spots, four Access Mars points, Home, hatching, radio dots, hover times (≈ 1 h 23 … ≈ 5 h 34), cheapest ring on 01, five legs, three totals (06: ≈ 5 h 34, 1 h 12 limited by oxygen, 20.0°), yellow band on the route through the radio shadow, "Confirm route". | `r2-2-select-06-1920.jpg`, `r2-2-hover-1280.jpg` |
| 3-go | met | "Route ready." / "Route breaks a rule.", five big numbers equal to Plan, profile with the spot and radio shadow, four rule checks plus the radio caution ("longest 3 h 16"), three suit checks `simulated`. Each check highlights its place on the map and profile. "Start excursion" / "Start with 1 broken rule". Edit route sits beside the button. | `r2-3-check-0-1280.jpg` … `r2-3-check-4-1920.jpg`, `r2-3-broken-check-TESTFIXTURE-1920.jpg` |

## Visual cleanliness

| Where | What I saw | Screenshot |
|---|---|---|
| Go, height profile | The "Radio shadow" caption is printed on top of the dot grid and the spot's dashed line, and is hard to read at both sizes. | `r2-3-go-1920.jpg`, `r2-3-go-1280.jpg` |
| Go, footer line | "Secondary oxygen 1 h, never planned with `real · lunar rule`" reads as an unfinished sentence: the label takes the place of the missing object. | `r2-3-go-1920.jpg` |
| Go, checks; Plan, totals | Where a label wraps onto its own line ("real · lunar rule" under "plan 2.00 km", "model · lunar rule" under "Total time"), it starts one character to the right of the line above. | `r2-3-go-1280.jpg`, `r2-2-select-06-1920.jpg` |
| Plan map | The Buttes Access Mars point overlaps the lower right of marker 02. The Interference point is cut in half by the left map edge. Both appear at both sizes. | `r2-2-select-06-1920.jpg`, `r2-2-open-1280.jpg` |
| Plan map (test fixture only) | Marker 07 covers part of marker 01's cheapest ring and the Monument Valley point. The red broken stretch crosses the "07" digits. | `r2-2-broken-TESTFIXTURE-1920.jpg` |
| Go map (test fixture only) | The fixture spot shows "·" instead of its number. | `r2-3-broken-TESTFIXTURE-1280.jpg` |
| Step 1, request cards | The `assumption` tag after "18 min delay" wraps alone onto its own line on both cards, at both sizes. The lede shows "18  min" with a wide gap before "min". | `r2-1-chosen-1280.jpg`, `r2-1-chosen-1920.jpg` |
| Step 1, opening | The dimmed site labels (Marias Pass, Pahrump Hills) show faintly through the text block of the opening question at 1280. | `r2-1-opening-1280.jpg` |
| Sources page | The values table still names values by code keys (`slopeMaxDeg`, `craterHeightFactor`, …). The crater factor's source reads "No source: placeholder chosen by the team for the demo". | `r2-0-sources-1280.jpg` |
| Walk HUD (seen in passing) | "Plan breaks: Slope on foot" is red on a light translucent card, low contrast. | `r2-4-broken-TESTFIXTURE-1280.jpg` |
