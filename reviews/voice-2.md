# Voice review, round 2: agent voice in app text

Read on `main` at `faf8260` (Sun 15.11., ~02:00), framed by `reviews/voice.md` Part 1 (six kinds: file names, build details, repeated disclaimers, justifying choices, explaining the app, formula style). Renames (Part 2) are left out. Nothing in the app was changed.
Kinds used below: **file** (repo/file/step names shown), **build**, **repeat** (disclaimer repeated), **justify**, **explain** (explains the app), **formula**. "Keep" in a proposal marks an element that must survive (label kind, source, lunar note, named edit, AI disclosure). `{x}` = a value the code fills in.

## The 10 worst

| # | file:line | current text (short) | kind | proposed text |
|---|---|---|---|---|
| 1 | `app/src/steps/4-walk/hud.js:24,29,30,31,32` | Source shown as "Suit model (src/core/suit.js)" (5 labels) and "Suit model (src/core/suit.js), planner (src/core/planner.js)" | file | Source: "Our suit model" / "Our suit model and route planner" |
| 2 | `app/src/core/sources.js:63,67` | Source titles "Team research: walk terrain inventory (research/walk-terrain.md)", "Team research: sample candidates in the walk square (research/walk-targets.md)"; shown as the source of ~15 labels (Plan steep/shadow/spot/distance/slope/waypoint, Go, Debrief, rover position) | file | "Our analysis of the Access Mars terrain" / "Our sample spots, derived from the Access Mars terrain" |
| 3 | `app/src/core/values.js:162` (Sources page) | "A point counts as standing on a closed cell only once it is this far inside the cell. A planned diagonal step between two open cells touches the corner …; this tolerance lets the planner and the Walk agree …" | build | "Margin at the edge of ground that is too steep: you count as on it only once you are 0.1 m inside." (or drop this row and `steepPenalty` from the visitor table; both are planner tuning, not mission values) |
| 4 | `app/src/steps/1-mission/requests.js:24,41,55` + `index.js:274` | Source `where`: "research/research-requests.md §1 and §5.3"; label text repeats the visible "why" paragraph, then "The question is real; the message from Earth is part of the demo." | file, repeat | `where`: drop (the NASA caption and paper are already the source title). Label text: "The scientific question is real; the message from Earth is part of the story." (keeps real + the disclosure, drops the duplicated paragraph) |
| 5 | `app/src/core/sources.js:142` | "The rover in the walk (public/models/sev.glb): textures reduced to 1024 px, mesh simplified to 85,062 triangles and compressed, otherwise unedited; scaled to 4.5 m length at load time (assumption)" | file, build | "The rover in the walk. Made smaller for the web, otherwise unedited; its 4.5 m length is our assumption." (keeps the named edit and the assumption) |
| 6 | `app/src/core/sources.js:197,198` | Helmet: "The visor frame in step 4: an AI-generated green-screen image made by the team (source docs/design/helm-source.webp); the green was keyed out and "AI-generated image" written into the image pixels by our script (scripts/preprocess/build_helmet.py)". Film: "(public/egress/egress.mp4) … Python/pyrender scripts … (docs/design/egress/README.md); cut at the fade to black and marked "AI-generated" in the pixels with FFmpeg" | file, build | Helmet: "The visor frame in the walk: an AI-generated image made by the team, background removed, with a visible "AI-generated image" mark." Film: "The intro film before the walk, made by the team from a 3D model of NASA's Space Exploration Vehicle on placeholder terrain; shortened and marked "AI-generated" in the picture." (keep the AI disclosure in both) |
| 7 | `app/src/core/groundColor.js:8,10,31,32` | Sources "Our display colour (src/core/groundColor.js) over the Access Mars terrain", "Our display code (src/core/groundLook.js) …"; texts say it is ours twice ("of our own choosing … the colour is ours, not NASA's"; "our display work, not NASA data") | file, repeat | Sources: "Our display colour over the Access Mars terrain" / "Our display over the Access Mars terrain". Texts: "About half of the site has only greyscale imagery in Access Mars. There the ground is tinted with our own Mars colour, shaded by the terrain heights." and "Where the camera image is grey or stretched over steep ground, the ground is filled with the colour of the real photo around it, plus a fine grain near you. Our display, not NASA data." |
| 8 | `app/src/steps/2-plan/extras.js:21` + `index.js:105,134` | Relay source "PROPOSAL.md, later steps (placing a device)"; "Placing and moving it comes in a later version; … nothing is calculated from it yet."; notices "Comparing with and without the relay comes in a later version.", "Moving the relay comes in a later version." | file, build | Source: "The team's design". Text: "A radio relay that would shrink the radio shadow, shown where it could stand on high ground. Not calculated in this demo." Notices: "Not available in this demo." |
| 9 | `app/src/steps/1-mission/index.js:169` | "Elevation of Gale crater from NASA's printable 3D model … We placed it on the map and converted it to metres by fitting it to MOLA laser altimetry (correlation {r}). Surface colour … (low resolution, about 6 pixels per degree). … Mount Sharp is the highest point of the central mound in this grid." | build | "Heights of Gale crater from NASA's 3D model, made from HRSC stereo images on ESA's Mars Express ({w} × {h} km), converted to metres with NASA's MOLA altimetry. Colour from NASA's Mars globe model; site positions from Curiosity's drive." Three sentences: the sources (HRSC/ESA, NASA model, MOLA, waypoints) and the named edit (heights converted) cannot fit in two. |
| 10 | `app/src/core/values.js:130` (shown in Plan, Go, Walk, Debrief) | "Demo time: the clock and the suit's consumption run this many times faster than reality, so turning back becomes a real decision inside the 128 m site." `where`: "tuned for the 128 m demo square" | justify | "Demo time: the clock and the suit's use run 76× faster than real time." `where`: "chosen by the team" |

## Opening and Mission

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/steps/1-mission/index.js:97` | "NASA's 3D model of Mars, with a surface texture from spacecraft imagery. Shown as a backdrop; it turns slowly." | explain | "NASA's 3D model of Mars, with a surface texture from spacecraft imagery." |
| `app/src/steps/1-mission/index.js:169` | Gale crater label (see worst #9) | build | see #9 |
| `app/src/steps/1-mission/index.js:176` | "There is no base on Mars. We place the crew's base at {Bradbury Landing}, where Curiosity landed in August 2012. The position is real (Curiosity's first waypoint), and the line is Curiosity's real drive from there to Murray Buttes, {12} km as drawn." | justify | "The crew's base at Bradbury Landing, where Curiosity landed in August 2012. The line is Curiosity's real {12} km drive from there to Murray Buttes." (label stays assumption; the position source stays the waypoints) |
| `app/src/steps/1-mission/requests.js:24,41,55` | `where`: "research/research-requests.md §…" | file | drop `where` (see #4) |
| `app/src/steps/1-mission/index.js:274` | "Why it matters: {why} The question is real; the message from Earth is part of the demo." | repeat | see #4 |
| `app/src/core/values.js:136` | "Heights in the 3D view of Gale crater (step 1) are drawn this many times taller than they are, so the crater rim and Mount Sharp are easy to see. Distances across the ground are true to scale." | file, justify | "Heights in the Gale crater view are drawn 2.5× taller than they are; distances across the ground are true to scale." |
| `app/src/core/values.js:135` | `where`: "vertical exaggeration for readability, chosen by the team" | justify | "chosen by the team" |

## Plan

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/steps/2-plan/index.js:23` | "The site from above: the Access Mars 3D terrain of Murray Buttes, built from Curiosity images. It is the same ground you walk in step 4." | file, explain | "The site from above: the Access Mars 3D terrain of Murray Buttes, built from Curiosity images." |
| `app/src/steps/2-plan/index.js:24` | "Ground steeper than 20° on the slope grid of the same terrain. NASA's suit is built for 20° at most, so routes do not cross it." | build | "Ground steeper than 20°, the most NASA's suit is built for. Routes do not cross it." |
| `app/src/steps/2-plan/index.js:25` | "Ground without a straight line of sight to the rover antenna at eye height. Geometry only, no radio physics. A caution, not a rule." | repeat | "Ground with no line of sight to the rover antenna at eye height. A caution, not a rule." ("no radio physics" once, on the Sources page: `values.js:107`) |
| `app/src/steps/2-plan/index.js:26` | "Position derived from the terrain: a reachable spot at the foot of a butte wall. No Curiosity target lies in this square." | repeat | "A reachable spot at the foot of a butte wall, derived from the terrain." |
| `app/src/steps/2-plan/index.js:27` | "A point of interest of the Access Mars app, with its original text. Not a sample spot." | repeat (mild) | "A point of interest from Access Mars, with its original text." (keep "Not a sample spot." only if the team sees visitors clicking these) |
| `app/src/steps/2-plan/index.js:28` | "Length of the route calculated in your browser on the terrain grid: the fastest way that keeps every rule." | explain, build | "Length of the fastest route that keeps every rule." |
| `app/src/steps/2-plan/index.js:29` | "Route length at NASA's planning pace, plus the fixed work at the spot; in demo time." | repeat (demo time) | "Walking time at NASA's planning pace, plus the work at each stop." (demo time is stated once in the panel line below) |
| `app/src/steps/2-plan/index.js:32` | "A point you set that the route must pass. No sample and no work there; the legs on either side are planned again by the same rules." | explain | "A point the route must pass. No sample and no work there." |
| `app/src/steps/2-plan/index.js:33` | "One leg of the round: length of the fastest way that keeps every rule, and its walking time at NASA's planning pace, in demo time." | repeat | "Length of this leg and its walking time at NASA's planning pace." |
| `app/src/steps/2-plan/extras.js:20` | "The rover drive from the base at Bradbury Landing (8 km north-east) is drawn on a way over the terrain that keeps the slope rule. It is a picture only: it does not count into time, distance or reserve yet." | explain, build | "The rover drive from the base at Bradbury Landing, 8 km north-east. Drawn only; not counted in time, distance or reserve." |
| `app/src/steps/2-plan/extras.js:21` | relay (see #8) | file, build | see #8 |
| `app/src/steps/2-plan/extras.js:22` | "The area of this excursion: a frame around the candidate spots and the rover, measured on the walk grid." | build | "The area of this excursion around the spots and the rover." |
| `app/src/steps/2-plan/extras.js:23` | "The route on foot coloured by the slope under each step, from flat (easy) to 20° (hard). A stand-in for the walking effort, which comes in a later version." | build | "The route coloured by the slope underfoot, from flat (easy) to 20° (hard), as a stand-in for walking effort." |
| `app/src/steps/2-plan/index.js:105,134` | "… comes in a later version." (two notices) | build | "Not available in this demo." |
| `app/src/steps/2-plan/index.js:133,532` | "Shrinks the radio shadow · not placed yet"; row "Set relay" / "later" | build (mild) | "Shrinks the radio shadow · not in this demo"; value "not in this demo" |
| `app/src/ui/mapPanel.js:53` | "Map scale measured on the 0.5 m walk grid built from the Access Mars terrain of Murray Buttes." Source "Our walk grid (…)" | build | "Map scale of the Access Mars terrain of Murray Buttes." Source "Access Mars terrain (NASA/JPL-Caltech imagery)" |
| `app/src/core/groundColor.js:8,10` | ground colour label (Plan map and walk) | file, repeat | see #7 |

## Go / no-go

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/steps/3-go/labels.js:9,31` | `where`: "grid method" (shown after the source) | build | drop `where` |
| `app/src/steps/3-go/labels.js:10` | "Length of the planned round trip on foot, measured along the route over the HiRISE-based terrain of the walk square." | build | "Length of the planned round trip on foot, measured on the terrain." (unsure: the walk terrain is Access Mars; HiRISE is used for its position and slope check, `sources.js:93`. Check "HiRISE-based" before keeping it) |
| `app/src/steps/3-go/labels.js:14` | "Walking time at NASA's planning pace, corrected for slope, plus 20 min of work at the spot (at every stop of a round). Shown in demo time (76×)." | repeat | "Walking time at NASA's planning pace, corrected for slope, plus 20 min of work at each stop." |
| `app/src/steps/3-go/labels.js:18,19` | `where` "walk grid slope"; "Steepest ground on the route, from the slope of the 0.5 m terrain grid. The rule allows 20°." | build | `where`: drop. "Steepest ground on the route. The rule allows 20°." |
| `app/src/steps/3-go/labels.js:23` | "… with the way home counted at ×1.2 the normal work rate. Shown in demo time (76×)." | repeat | "Time left in the suit back at the rover, with the way home counted at 1.2× the normal work rate." |
| `app/src/steps/3-go/labels.js:35,36` | `where` "line of sight on the walk grid"; "… Geometric line of sight only, no radio physics. Shown in demo time." | build, repeat | `where`: drop. "Longest stretch of the route with no line of sight to the rover at eye height." |
| `app/src/steps/3-go/labels.js:40` | "The suit checks are simulated: there is no suit to read. They stand for the checks a crew runs before leaving the rover." | repeat | "Stand-ins for the checks a crew runs before leaving the rover." (label stays simulated) |
| `app/src/steps/3-go/index.js:43` | "limit > 0 min, home ×1.2" | formula | "limit: above 0 min · way home ×1.2" |
| `app/src/steps/3-go/index.js:104,107` | "… Every other limit is checked below." | explain | drop the sentence; the checks are on screen |
| `app/src/steps/3-go/index.js:178` | "No line of sight to the rover. Not a rule: the walk may go on." (with "a caution, not a rule" at :53 and the "Caution" tag beside it) | repeat | "No line of sight to the rover." (the "Caution" tag and :53 already say it) |

## Walk

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/steps/4-walk/hud.js:15` | Rover: "The rover model is a simple stand-in built for this view; it marks where the crew parked. The real scene has a gap there where Access Mars cut out Curiosity." | explain, out of date | The walk now loads NASA's Space Exploration Vehicle model (`scene3d.js:483`, `sources.js:139`). Proposed: "NASA's Space Exploration Vehicle 3D model, where the crew parked; its 4.5 m length is our assumption." Unsure: the label kind (now simulated) should follow the Sources entry; team decides |
| `app/src/steps/4-walk/hud.js:17` | AM card source "Access Mars, public/index.html", where "murray_buttes_markers" | file | Source "Access Mars (Google Creative Lab, NASA/JPL-Caltech)", no `where` |
| `app/src/steps/4-walk/hud.js:22,25,26,27,28,438` | "… measured on the 0.5 m walk grid." (6 labels) | build, repeat | end each with "measured on the terrain." e.g. "Straight-line distance, measured on the terrain." |
| `app/src/steps/4-walk/hud.js:23` | "Path distance from where you stand along the fastest way that keeps every rule, measured on the 0.5 m walk grid, and its walking time from the suit model, in demo time." | build | "Distance along the fastest route that keeps every rule, and its walking time." |
| `app/src/steps/4-walk/hud.js:24` | "Suit time since you left the rover, counted from the rover itself like the plan: walking and work times from the suit model, shown at demo speed. The debrief shows the same clock." Source "Suit model (src/core/suit.js)" | explain, file | "Suit time since you left the rover: walking and work times from our suit model." Source "Our suit model" |
| `app/src/steps/4-walk/hud.js:29` | "Walking time of the last metres at planning pace, from the suit model, in demo time. It is added to the clock when you end the excursion." | explain, file | "Walking time of the last metres to the rover at planning pace." Source "Our suit model" |
| `app/src/steps/4-walk/hud.js:30` | "{way-home text} Reserve on return = time left minus the way home from here, if you continue as planned." | formula, file | "{way-home text} Reserve on return is the time left in the suit once you are back at the rover, if you go on as planned." (keep moon) Source "Our suit model" |
| `app/src/steps/4-walk/hud.js:31` + `values.js:56` | "Work rate at the fast pace from the suit model (Pandolf effort equation under Mars gravity): faster walking costs more per metre. Fast walk (Shift held in the Walk): this many times the planning pace, about 3 km/h. The work rate at that speed comes from the effort equation (model), so the suit is used faster per metre." | repeat, file | `values.js:56`: "Fast walk: 1.5× the planning pace, about 3 km/h." `hud.js:31`: "Work rate at the fast pace, from the Pandolf effort equation under Mars gravity: faster walking uses more suit per metre." |
| `app/src/steps/4-walk/hud.js:32` | "A jump is counted as a normal walk from here to the landing point on the fastest way that keeps every rule: its time, work rate, radio shadow and warnings go into the walk log as if walked." Source "Suit model (src/core/suit.js), planner (src/core/planner.js)" | explain, file | "A jump counts as walking the fastest route there: time, suit use and warnings as if walked." Source "Our suit model and route planner" |
| `app/src/steps/4-walk/hud.js:33` | "A low border along the edge of ground steeper than 20° (closed to the route), shown within about {n} m of you. Outline smoothed for display; the warnings use the planner's exact slope test on the 0.5 m walk grid." | build | "Border of ground steeper than 20°, closed to the route, shown near you." |
| `app/src/steps/4-walk/hud.js:34` | "A thin beam of light and a ring on the ground at your current target (the next sample spot, then the rover), visible across the whole site and fading out within about {n} m so it does not cover the spot. Position from the walk grid, drawn for orientation." | explain, justify | "A beam of light at your next target: the next stop, then the rover." |
| `app/src/steps/4-walk/hud.js:35` | "Dotted line on the ground at the edge of the radio shadow (no line of sight from your eye to the rover antenna), shown within about {n} m of you. Geometry on the 0.5 m walk grid, no radio physics." | build, repeat | "Edge of the radio shadow: beyond it there is no line of sight from your eye to the rover antenna." |
| `app/src/steps/4-walk/hud.js:36` | "The day sky: a butterscotch gradient (dusty at the horizon, darker overhead) with one small sun, drawn after the colours of Curiosity's daytime sky photos at Gale crater (Sources page). The sun stands at a fixed place, the same direction that lights the rover. Display choice, not a measured sky." | explain, build | "Day sky drawn after the colours of Curiosity's raw-colour sky photos at Gale crater; not a measured sky." (the photo ids stay on the Sources page) |
| `app/src/steps/4-walk/hud.js:48` + `groundColor.js:31,32` | "Ground without a clear camera image: filled" + fill label | file, repeat | see #7 |
| `app/src/steps/4-walk/hud.js:83` + `values.js:112` | "Dose so far: Curiosity's measured dose rate at Gale crater times your time outside. Radiation dose rate that Curiosity measured on the surface at Gale crater. Dose during the walk = this rate times the time outside (model)." | repeat, formula | `hud.js:83`: use only its own text: "Dose so far: Curiosity's measured dose rate at Gale crater times your time outside." `values.js:112`: "Radiation dose rate that Curiosity measured on the surface at Gale crater." |
| `app/src/steps/4-walk/hud.js:86` | "Line of sight from your eye to the rover antenna over the terrain grid. Geometric only, no radio physics." | build, repeat | "Line of sight from your eye to the rover antenna over the terrain." |
| `app/src/steps/4-walk/hud.js:521,522` | Label: "Real Curiosity photo of this rock, the sandstone of the Murray Buttes. Curiosity never stopped at this exact spot." Text: "… The photo shows this rock in the Murray Buttes as Curiosity saw it, not this exact spot." | repeat | Label: "Real Curiosity photo of the Murray Buttes sandstone." Keep the text sentence (it is the one honest line on the card) |
| `app/src/steps/4-walk/hud.js:528,530` | Label: "What happens when the suit runs out is simulated: the walk simply ends here." Text: "… The walk ends here." | repeat | Label: "What happens when the suit runs out is simulated." |
| `app/src/steps/4-walk/index.js:45` | "No route planned. Start from step 1." | file (step number) | "No route planned. Start with a mission." |

## Debrief

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/steps/5-debrief/index.js:30` | "Length of the planned round trip, measured on the 0.5 m terrain grid built from Curiosity images." | build | "Length of the planned round trip, measured on the terrain." |
| `app/src/steps/5-debrief/index.js:31,37` | "… measured on the same terrain grid." / "… from the terrain grid." | build | "… measured on the terrain." / drop "from the terrain grid" |
| `app/src/steps/5-debrief/index.js:40` | "The planned stops of this round in visiting order: sample spots at the foot of the buttes, positions derived from the terrain. Taken: a sample at that stop; skipped: left out by "Turn back now"; not taken: not visited or passed without a sample." | explain | "The planned stops in visiting order, at the foot of the buttes; positions derived from the terrain." (if "skipped" needs explaining, the screen word is the problem, voice.md §5) |
| `app/src/steps/5-debrief/index.js:41` | "Samples taken on your walk, one per planned stop; the request counts as done with at least one sample and the rover reached." | explain | "Samples taken on your walk, one per planned stop." (unsure: the "counts as done" rule may be wanted by the team) |
| `app/src/steps/5-debrief/index.js:42` | "Warnings the helmet raised during the walk from the NASA rules; where = distance from the rover and time into the excursion." | formula | "Warnings the helmet raised during the walk, with where and when each happened." |
| `app/src/steps/5-debrief/index.js:43` | "The suit ran out before the rover. The walk ended there; this is a simulation." | repeat | "What happens when the suit runs out is simulated." (label already simulated; the headline says the rest) |
| `app/src/steps/5-debrief/index.js:44` | "Where it happened: straight-line distance and direction from the rover on the 0.5 m terrain grid, and the suit time into the excursion (demo time)." | build, repeat | "Straight-line distance and direction from the rover, and suit time into the excursion." |
| `app/src/steps/5-debrief/index.js:45` | "You ended the mission with esc before reaching the rover; where = the point you stopped, measured on the terrain grid." | formula, explain | "Where you ended the walk before reaching the rover." |
| `app/src/steps/5-debrief/index.js:255` | "The plan counts the way home at a 20 % higher work rate, so you can reach the rover with more reserve than planned." | explain (mild) | keep; it explains a result the visitor sees. Part 2 B already proposes the split |
| `app/src/steps/5-debrief/index.js:435` | fallback caption "…: Curiosity's own sample nearby, not this exact spot." | — | keep (once per screen is fine) |
| Debrief sources via `sources.js:63,67` | "(research/walk-terrain.md)", "(research/walk-targets.md)" on 11 labels | file | see #2 |

## Sources page

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/frame/sourcesPage.js:54` | Documents list prints the internal key before each title ("CON ", "OGI ", "BELL " …) | file (internal ids) | drop the key; keep "(Moon)" |
| `app/src/core/sources.js:71,75` | Source titles "No source: placeholder chosen by the team for the demo" and "Assumption" (shown as "Source: Assumption" under the kind line) | repeat | "No source: chosen by the team" for both |
| `app/src/core/sources.js:100` | "… in step 1 the landing site (Bradbury Landing, where we place the base: assumption) and the drive …" | file (step number) | "… on the mission map the landing site (Bradbury Landing, where we place the base: assumption) and the drive …" |
| `app/src/core/sources.js:107` | "… Raw frames from the Curiosity raw image archive; list with file ids in public/data/murray/photos/credits.json" | file | "… Raw frames from the Curiosity raw image archive." |
| `app/src/core/sources.js:114` | "The 3D view of Gale crater in step 1 (208 x 276 km, 387 m per pixel), …" | file (step) | "The 3D view of Gale crater on the mission map (208 x 276 km, 387 m per pixel), …" |
| `app/src/core/sources.js:121` | "Photos on the two missions marked "soon" in step 1 (public/data/missions/)" | file | "Photos on the two missions marked "soon"." |
| `app/src/core/sources.js:128` | "… converting its heights to metres (fit correlation 0.999)" | build | "… converting its heights to metres." |
| `app/src/core/sources.js:135` | "(public/models/mars.glb; mesh smoothed at load time, texture unchanged)" | file, build | "The planet on the opening screen (mesh smoothed, texture unchanged) and the surface colour of the Gale crater view" |
| `app/src/core/sources.js:142` | rover model | file, build | see #5 |
| `app/src/core/sources.js:149,156` | "Reference only, not copied into the app: …" | build (mild) | "Reference only, not shown: …" |
| `app/src/core/sources.js:163` | "… kept to show why the walk uses the raw-colour butterscotch sky (model)" | justify | "Reference only, not shown: the same place in white-balanced colour, where the sky looks grey-blue (model)." |
| `app/src/core/sources.js:170` | "… a 2560 x 1440 crop around the core of the Milky Way (public/sky/milky-way.jpg)" | file | "… a crop around the core of the Milky Way" |
| `app/src/core/sources.js:196` | "Offline data preparation (scripts/preprocess)" | file | "Offline data preparation" |
| `app/src/core/sources.js:197,198` | helmet frame, egress film | file, build | see #6 |
| `app/src/core/sources.js:199` | "Shrinking the rover model offline (texture resize, mesh simplification, meshopt compression; scripts/preprocess/README.md) and decoding it in the app" | file, build | "Making the rover model smaller for the web" |
| `app/src/core/sources.js:205` | "The idea, its direction and every product decision come from the team." | justify | the team's call (voice.md §4); a required disclosure, not shortened here |
| `app/src/core/sources.js:207` | AI note names only the helmet image as AI-generated | — | unsure: the egress film is also marked "AI-generated" (`sources.js:198`) but described as rendered by the team; team should make the two consistent. Not a voice issue |
| `app/src/core/values.js:67` | "Work rate while standing still on the walk, about 205 W. Our sources give no standing rate; the closest is the Apollo planning rate for riding the rover (700 BTU/h), used here as a stand-in." | justify | "Work rate while standing still, about 205 W, taken from the Apollo planning rate for riding the rover (700 BTU/h)." |
| `app/src/core/values.js:70` | "… for loose, uneven ground. No value for Mars regolith exists." | justify | "Terrain coefficient of the effort equation for loose, uneven ground; none is measured for Mars." |
| `app/src/core/values.js:89` | "NASA's Mars backpack study sizes the primary supply for 2, 4, 6 or 8 hours; we use 8 hours." | justify | "Primary supply of NASA's Mars backpack: 8 hours, the longest option in the study (2, 4, 6 or 8 h)." |
| `app/src/core/values.js:96` | "… The capacity is not confirmed by a NASA document." | repeat | drop the sentence (the assumption label says "not confirmed by a NASA document") |
| `app/src/core/values.js:107` | "Height of the rover antenna, taken as eye height. Radio shadow is geometric line of sight only, no radio physics." | — | keep: this is the one place for "no radio physics" |
| `app/src/core/values.js:112` | "… Dose during the walk = this rate times the time outside (model)." | formula | drop the sentence (Walk and Go labels say it) |
| `app/src/core/values.js:130,129` | demo time | justify | see #10 |
| `app/src/core/values.js:134` | "Demo speed in the Walk: the visitor moves this many times faster on screen. Movement only: suit time and consumption are counted as a normal walk over the same distance." | explain ("the visitor") | "Demo speed: you move 5× faster on screen. Suit time and use are counted as a normal walk." |
| `app/src/core/values.js:55,133` | `where`: "Walk: Shift held", "Walk: Shift tapped twice" | explain | "chosen by the team" |
| `app/src/core/values.js:141-146` | six times "… is simulated; no data." | repeat | keep one row text; the others can be empty (the label already says simulated) |
| `app/src/core/values.js:160,162` + names `:198` | "Cost multiplier for closed ground in the fallback route."; edge tolerance; names "Cost of closed ground in the fallback route", "Closed-cell edge tolerance" | build | see #3; if kept, names "Route planner: steep-ground penalty", "Route planner: steep-edge margin" |
| `app/src/core/values.js:163` | `where`: "chosen by the team (specs/feedback-1.md, Several stops)" | file | "chosen by the team" |
| `app/src/core/values.js:191` | name "Crater height factor (step 1 view)" | file (step) | "Crater height factor (mission map)" |

## Shared (header, dialogs, label popover, page)

| file:line | current text | kind | proposed text |
|---|---|---|---|
| `app/src/ui/label.js:41-44,55` | kind lines and "This value comes from NASA's planning for the Moon." | — | keep (these carry the label kinds and the lunar note) |
| `app/src/frame/shell.js:115` | "The walk so far is discarded. {Step} opens with your plan kept." | — | keep (says what happens on a destructive action) |
| `app/index.html:8` | meta generator: AI disclosure | — | keep (rules ask for it in metadata) |

Not visible to visitors, so not listed: `places.js` `AM_SRC` / `T_SRC` and candidate notes (no UI reads them), `3-go/dev/*`, `5-debrief/fixtures.js`, console and error strings.
