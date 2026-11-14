# Spec check: steps 4 Walk and 5 Debrief

Checked Sat 14.11. about 19:30 to 20:30 (BUILD), `main` at f59c6fd. The app ran from `app/` with `npm run dev -- --port 5182` and was driven by Playwright 1.46 headless Chromium (SwiftShader WebGL), using real key presses (W A S D, arrows, E, esc) and a real mouse with pointer lock. The walk loop was paused with `window.__walk.hold(true)` and stepped with `__walk.advance()`, the same way `app/scripts/journey.mjs` does it.
Sizes: 1280x720 and 1920x1080. Entry points: `?step=4&spot=F7`, `?step=4&spot=F1`, `?step=4&broken=1`, `?step=5&outcome=home|broken|lost&spot=F7`, plus real walks that ended at the rover, with the suit empty, and with esc.
Screenshots: `reviews/spec-check/4-5/` (JPEG q70). No console errors in any run.

Known and already being fixed (not counted again below): the eastern terrain renders grey in first person (e.g. `alert-F7-1280-0-radioAhead.jpg`, `walk-sample-F7-1280.jpg`, `edge2-1280-5-edge.jpg`); the spot is called 01-06 in Plan but F7 in Walk and Debrief.

## 4 Walk (`specs/4-walk.md`)

### Not met

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| Layout => as in the mockup; the ground ahead stays clear | not met (1280) | At 1280x720 the target marker label "East side, behind the butte mass 65 m" runs into the minimap target line ("F7 East side, behind the butte ma.East side…"). In other views it overlaps the "Click to look around" hint. At 1920 the placement matches mockup 04 (compass top, minimap and target top left, reserve chip lower left, body card top right, mission card lower right, esc at the bottom). | `walk-start-F7-1280.jpg`, `turn-1280-turnback-on.jpg`, `look-1280-look-1.jpg`, `walk-start-F7-1920.jpg` |

### Met

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| View => first person, through the helmet frame; starts at the rover, facing the route | met | Eye-height view inside the helmet frame. The start is 3.6 m along the route with the cyan band ahead, and the rover is directly behind (turned 180°). | `walk-start-F7-1280.jpg`, `look-1280-rover-behind.jpg` |
| Sky and horizon => real background image (`murray/background.jpg`); never black or invented | met, with a note | `murray/background.jpg` is loaded (network request seen) and textures the distant skyline mesh on the horizon. Above it is the flat Access Mars haze colour (0xe1cbb2). Note: `background.jpg` holds distant terrain only, no sky pixels, so the sky region can only be the haze. | `walk-start-F7-1920.jpg`, `look-1280-rover-behind.jpg` |
| Rover => simple model at the start point, covers the gap; label: simulated | met | Blocky rover model at the start. Its marker reads "Rover simulated". Tan ground under and behind it, no hole visible. | `look-1280-rover-behind.jpg`, `walk-at-rover-F7-1920.jpg` |
| Moving => keys and mouse, at walking pace | met | W A S D move. The arrow keys turn and pitch. A click locks the pointer, and a 200 px mouse move turned the view 81°. Pace measured at 0.56 m/s, in real time on screen. | `look-1280-look-1.jpg` |
| Route => cyan band on the ground; target as diamond marker with name and distance | met | Cyan band on the ground. A cyan diamond with "East side, behind the butte mass 65 m". After the sample, the rover becomes the diamond target with its distance. | `walk-start-F7-1920.jpg`, `walk-at-rover-F7-1920.jpg` |
| Compass => strip at the top with heading | met | Strip with N/NE/E…, ticks, and a heading readout (e.g. 099°). | `walk-start-F7-1920.jpg` |
| Minimap => round, top left: route, own position and view direction, rover; target with distance and time below | met | Round relief map: cyan route dots, white arrow with view cone, rover square, target diamond. Below it: "F7 East side… / 65 m · 2 h 28" and a progress bar. | `walk-start-F7-1920.jpg` |
| Reserve => chip lower left: reserve on return, limiting consumable, time left | met | "RESERVE ON RETURN model / 1 h 12 / 7 h 58 left / limited by oxygen". Turns red at zero. | `walk-start-F7-1280.jpg`, `turn-1280-turnback-on.jpg` |
| Suit and body => card top right: heart, core temp, suit pressure, CO2; label: simulated | met | Card shows Heart, Core, Suit, CO2 with the "simulated" tag. Heart rises with effort (72 to 91 bpm). | `alert-F7-1280-0-radioAhead.jpg` |
| Mission => card bottom right: time outside, radiation dose, outside temp, power, radio to rover | met | All five rows are present. | `walk-start-F7-1920.jpg` |
| Demo time => the factor, in the mission card | met | "Demo time assumption 76×". | `walk-start-F7-1920.jpg` |
| End => "esc: end mission" at the bottom | met | "esc End mission" at the bottom. The first esc arms it ("Press esc again to end the mission here"); the second ends the walk and opens the Debrief. | `esc-1280-esc-armed.jpg`, `debrief-esc-1280.jpg` |
| Only when needed, in the centre, one at a time, most urgent first | met | A single alert box at the top centre. With "Off the path", "Edge of the site" and "Turn back now" all active, only "Turn back now" showed. | `edge-1280-1-turnBack.jpg`, `edge2-1280-6-turnBack.jpg` |
| Steep stretch ahead => caution, before the crew reaches it | met | Yellow CAUTION "Steep stretch ahead / Ground over 20° in 6 m. Closed to the route." appeared at x 9.9, 6 m before the stretch the plan marked at x 15.25 (`?broken=1` route). | `steep-1280-0-steepAhead.jpg` |
| Ground over 20° underfoot => warning; counted as a broken rule | met | Red WARNING "Ground over 20° underfoot / 26° here. Rule broken…". `walk.brokenRules` logged "Slope on foot", and the Debrief shows it broken. | `steep-1280-underfoot.jpg`, `debrief-walked-broken-1280.jpg` |
| Radio shadow ahead => advisory, before entering; radio line changes inside | met, with a note | Blue ADVISORY "No line of sight to the rover in 10 m". Inside the shadow the mission card reads "No line of sight", and it returns to "Rover · ok" on the way back. Note: on approach the advisory disappeared and reappeared three times (at 10, 9 and 5 m); the walk log counted it once. | `alert-F7-1280-0-radioAhead.jpg`, `radio-F7-1280-lost.jpg`, `radio-F7-1280-back.jpg` |
| Off the path => caution; no new route | met | Caution "Off the path / 6 m from the planned route". The route in state was unchanged and the band stayed in place. | `off-1280-offpath.jpg` |
| Turn back now => warning when reserve reaches zero; stays until heading home | met, with a note | Red warning at reserve 0. It stayed while standing and while walking away, and cleared after walking toward the rover. Note: it reads "Reserve on return −0 min". | `turn-1280-turnback-on.jpg`, `turn-1280-turnback-heading-home.jpg` |
| Edge of the site => caution, then stopped | met | Caution "Edge of the site / The mapped terrain ends here" 4 m from the edge. Position was clamped at z −63.75 and the walk could not go further. Only visible when no higher alert is active: on the first try, "Turn back now" covered it. | `edge2-1280-5-edge.jpg`, `edge2-1280-stopped.jpg` |
| Same spots => each warning appears where the plan marked it | met where checkable | Steep: the plan marked (15.25, 2.25); the walk gave the caution 6 m before and the warning at (15.4, 2.4). Radio: the planned shadow starts at (26.25, −9.75), 1 h 09 in; the walk advisory came at (16.3, −8.2) and the signal was lost at 1 h 07. Turn back: could not check, because the plan for F7 has no turn-back point (`plan.turnBack` is null). | `steep-1280-0-steepAhead.jpg`, `radio-F7-1280-lost.jpg` |
| Looking at a butte or Access Mars point => card beside the reticle: name, one sentence, size | met, with a note | Cards for "Monument Valley", "Bruce Murray" and a butte wall ("Butte"), each with a sentence and "≈ 9 m high · 18 m". Note: aiming at the "Buttes" point (13.8, 6.9) gave no card. | `look-1280-look-1.jpg`, `look-1280-look-2.jpg`, `look-1280-look-0.jpg` |
| At the target => "E: take sample"; time moves by the work duration; real Curiosity photo + one sentence; target switches to rover | met | "E Take sample · 20 min of work". The clock jumped 1200 s. The modal shows a Mastcam photo (PIA21042, NASA/JPL-Caltech/MSSS, real) and a sentence. The target then became "Rover 67 m". | `walk-at-target-F7-1280.jpg`, `walk-sample-F7-1280.jpg` |
| Suit empty before the rover => walk ends; debrief says so; label: simulated | met | "Suit empty. Battery ran out 4 m from the rover. The walk ends here." (simulated). Debrief: "Not returned. The suit ran out 4 m east of the rover." | `turn-1280-suit-empty.jpg`, `debrief-suit-empty-walked-1280.jpg` |
| Back at the rover => "E: end excursion", then Debrief | met | "E End excursion" near the rover; E opened the Debrief. | `walk-at-rover-F7-1920.jpg`, `debrief-walked-F7-1920.jpg` |

### Not in this spec (step 4)

| Item | Result | What I saw | Screenshot |
|---|---|---|---|
| Abort key, pace setting, rerouting, sudden events, partner | none built | No abort key besides the esc end, no pace control, no new route when off the path, no events, no partner. | `off-1280-offpath.jpg` |
| Built but not named in the spec: control hint "Click to look around · W A S D walk · ← → turn" | finding | Shown in the centre until the first step. | `walk-start-F7-1920.jpg` |
| Built but not named: walked track drawn on the minimap | finding | A white line of the walked path on the minimap. | `alert-F7-1280-0-radioAhead.jpg` |
| Built but not named: small white dots marking Access Mars points in the view | finding | White dots on the terrain at the Access Mars points. | `walk-start-F7-1920.jpg` |
| Built but not named: esc needs a second press ("Press esc again…") | finding | The spec names only "esc: end mission". | `esc-1280-esc-armed.jpg` |

## 5 Debrief (`specs/5-debrief.md`)

### Not met

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| Outcome => one sentence: home with reserve, home with a broken rule, or not returned | not met (broken-rule case) | Real walk on the `?broken=1` route: "…but broke 4 rules: Slope on foot, Slope on foot, Slope on foot, Slope on foot." Only one rule was broken; it was logged once per crossing. The fixture outcome reads correctly ("broke a rule: Slope on foot"). Home and not-returned sentences are correct. | `debrief-walked-broken-1280.jpg`, `debrief-broken-1920.jpg`, `debrief-home-1280.jpg`, `debrief-lost-1280.jpg` |
| Layout => headline, big numbers, map, checks, main button | not met (checks row) | Parts and order match Go / no-go. The "Rules on the walk" checks repeat a rule once per crossing: "Slope on foot" ×4 on the broken walk, "Way home" ×2 on the suit-empty walk. | `debrief-walked-broken-1280.jpg`, `debrief-suit-empty-walked-1280.jpg` |
| Report to Earth => sample with spot, time and photo | not met at 1280 (not-returned) | Spot, time (11:52 local Mars time, assumption) and the Curiosity photo (real) are all there. At 1280x720 in the not-returned layout the photo is cut and the "Spot" line overlaps its lower edge. Correct in the other layouts. | `debrief-lost-1280.jpg`, `debrief-walked-F7-1280.jpg` |
| Closest moment => lowest reserve during the walk, marked on the map | not met (legibility) | Big number and map marker are present. The "Closest moment" label covers warning marker 3 (`debrief-broken-1920.jpg`) and runs into the "Rover" / "Suit empty" labels (`debrief-suit-empty-walked-1280.jpg`). | `debrief-broken-1920.jpg`, `debrief-suit-empty-walked-1280.jpg` |

### Met

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| Headline => "Back home."; otherwise "Not returned." | met | Both headlines seen: walked home, broken, fixture home/broken show "Back home."; suit empty, esc and fixture lost show "Not returned.". | `debrief-walked-F7-1280.jpg`, `debrief-lost-1920.jpg` |
| Table => planned next to actual: sample, distance, time, reserve on return, time in radio shadow | met, with a note | All five rows, planned and actual, each labelled. Note: at 1280 the "simulated" tag after "not returned" is clipped ("simulat"). | `debrief-walked-F7-1920.jpg`, `debrief-lost-1280.jpg` |
| Warnings => count and list, each with where it occurred | met | "Warnings · 2" with numbered entries such as "Steep stretch ahead · 10 m east of the rover · 23 min in", plus numbered markers on the map. | `debrief-walked-broken-1280.jpg` |
| Map => planned route and walked path together | met | Planned route (cyan dots) and walked path (white) on one zoomed map, with a legend. | `debrief-walked-F7-1280.jpg` |
| "Send report" shows the signal delay | met | "Sent 14:14 local Mars time. It reaches Earth in 18 min (one-way signal delay). assumption". | `debrief-sent-F7-1280.jpg` |
| Not returned => where the suit ran out and how far the rover was | met | "Suit empty before the rover: 40 m east of the rover, 7 h 17 into the excursion; the rover was 40 m away", a "Rover was 40 m away" big number, and a "Suit empty" marker with a dashed gap line. | `debrief-lost-1280.jpg`, `debrief-suit-empty-walked-1280.jpg` |
| End => "New mission" leads to step 1; the finished request is marked done | met | Goes to step 1. The request "One sample" shows "✓ Done" and `requestsDone` = ["crossbeds"]. | `new-mission-F7-1280.jpg`, `new-mission-requests-done-1280.jpg` |

### Not in this spec (step 5)

| Item | Result | What I saw | Screenshot |
|---|---|---|---|
| Comparison per consumable, placed devices | none built | Not present. | `debrief-walked-F7-1920.jpg` |
| Learning from the result | finding | A sentence under the table explains the result: "The plan counts the way home at a 20 % higher work rate, so you can reach the rover with more reserve than planned." No spec line names it. | `debrief-walked-F7-1280.jpg` |
| Dev fixture `outcome=broken` | finding (dev only) | Closest moment is −1 h 44 (below zero), yet "Way home" shows kept. The real walk logs Way home as broken below zero. | `debrief-broken-1920.jpg` |

## Design (`specs/design.md`), lines that steps 4 and 5 show

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| Map => rounded panel on the left, legend below, scale bar inside | not met | Debrief map is a rounded panel with the legend below and a scale bar inside, but it sits on the right (as on Go / no-go). | `debrief-walked-F7-1280.jpg` |
| Labels real / model / simulated / assumption => small mono text beside the value | not met (coverage) | Tags are small mono text where present. Values without a tag: Walk "Time outside", the target "65 m · 2 h 28" under the minimap, the marker distances ("65 m", "Rover 4 m"), and "bagged 58 m from the rover" in the sample card; Debrief map scale "20 m". See also Rules > Labels. | `walk-start-F7-1920.jpg`, `walk-sample-F7-1280.jpg` |
| Headline => one large line per step, ending with a full stop | met for 5; unclear for 4 | Debrief: "Back home." / "Not returned.". The Walk has no headline, as in mockup 04. The design spec asks for one per step, and spec 4 says "Layout => as in the mockup". This conflict is reported, not judged. | `debrief-walked-F7-1280.jpg`, `walk-start-F7-1920.jpg` |
| Project name => top left, mono capitals in square brackets | met for 5; unclear for 4 | "[MARTIAN MAP]" on the Debrief. Not shown in the Walk, which follows mockup 04. Same conflict as the headline. | `debrief-walked-F7-1280.jpg` |
| Mockups set the look; values and terrain are placeholders | met | The walk matches mockup 04's arrangement (except the 1280 overlap under Walk). The Debrief follows the Go / no-go look. | `walk-start-F7-1920.jpg` |
| Background => black | met | Debrief background is black. | `debrief-home-1920.jpg` |
| Terrain => the only large coloured area | met | Debrief: only the map is coloured. Walk: the scene is the terrain. | `debrief-home-1920.jpg` |
| Text => white; secondary grey | met | | `debrief-home-1920.jpg` |
| Fonts => geometric display, plain sans, mono | met | Geometric headline and big numbers, sans text, mono values and tags. | `debrief-walked-F7-1920.jpg` |
| Accent => cyan: route on foot, selected item, main action, passed check | met, with a note | Cyan: route band, minimap route, passed checks, "Send report". Note: the Debrief main button "New mission" is a white pill; the Main button line asks for cyan only before the walk. | `debrief-walked-F7-1280.jpg` |
| Too steep => hatched orange-brown on the map | met | Hatched areas on the Debrief map. | `debrief-walked-F7-1920.jpg` |
| Warning levels => red, yellow, blue only for warnings, cautions, advisories | met | Red warning, yellow caution, blue advisory in the helmet, with matching marker colours on the Debrief. | `steep-1280-underfoot.jpg`, `off-1280-offpath.jpg`, `alert-F7-1280-0-radioAhead.jpg` |
| Cards => rounded, thin border, dark fill; translucent in the helmet | met | | `walk-start-F7-1920.jpg` |
| Markers => numbered circles, mono digits | met | Debrief warning markers 1, 2, 3. | `debrief-broken-1920.jpg` |
| Main button => one per screen, wide pill, bottom right | met | "New mission →" wide pill at the bottom right. "Send report" is a small outline button. | `debrief-home-1920.jpg` |
| Big numbers => small grey label above, large value below | met | | `debrief-home-1920.jpg` |
| Helmet => frame around the view; green area is the scene; small visible mark "AI-generated image" on the frame | met | "AI-generated image" is visible on the frame at the lower left at both sizes. | `walk-start-F7-1280.jpg`, `walk-start-F7-1920.jpg` |
| Mockup 4 => black sky is a placeholder; the walk shows the real sky | met | The sky is not black (see Sky and horizon under Walk). | `walk-start-F7-1920.jpg` |
| Motion => short fades and slides only | could not check fully | Screenshots cannot show motion. The code uses a fade-in on the report status. I saw no other motion. | — |
| Not in this spec: logo, sound, light theme | none built | No logo, no audio element, no theme switch. | — |

## Rules (`specs/rules.md`), lines that steps 4 and 5 show

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| Labels => every value is real, model, simulated or assumption, with its source | not met | Untagged values in the Walk and Debrief (listed under Design > Labels). | `walk-start-F7-1920.jpg` |
| Moon values => every value taken from lunar planning says so | not met | Go / no-go labels the planned reserve on return "model · Moon"; the Debrief shows the same value (1 h 12) as "model" only. The Walk reserve chip uses the 20 % walk-back factor (Apollo) and is tagged "model" with no Moon. | `debrief-walked-F7-1280.jpg`, `reviews/preview/3-go.png` |
| Slope on foot => at most 20° | met | Warning above 20° (26° shown). Checked in the Debrief. | `steep-1280-underfoot.jpg` |
| Distance from the rover => 2 km / 3.5 km | met (shown) | Debrief check "Distance from the rover" kept. The 64 m site cannot reach the limit. | `debrief-walked-F7-1280.jpg` |
| Way home => walk back must fit time left, at 20 % higher work rate | met | Reserve chip and turn-back warning. The Debrief says "20 % higher work rate" (real · Moon). | `turn-1280-turnback-on.jpg` |
| Secondary oxygen => 1 hour; shown, never counted | not shown in 4-5 | Not visible in the Walk or the Debrief. I did not check earlier steps. | — |
| Excursion length => 6 h planned, 8 h limit | met | The suit-empty walk passed 8 h, and "Excursion length" is marked broken in the Debrief. | `debrief-suit-empty-walked-1280.jpg` |
| Radio shadow => a caution, not a rule | met, with a note | The Debrief shows Radio shadow as a yellow "!" caution, not a rule. In the helmet it is a blue advisory, as spec 4 says. | `debrief-walked-F7-1280.jpg` |
| No route keeps every rule => each broken rule marked | met | The broken route's slope breach is marked in the warnings, the checks and the map. | `debrief-walked-broken-1280.jpg` |
| Home => the parked rover at the start point | met | | `walk-at-rover-F7-1920.jpg` |
| Astronaut 82 kg + 23 kg, suit 104 kg; shown | not shown in 4-5 | Not visible in the Walk or the Debrief. I did not check earlier steps. | — |
| Time left => consumable that runs out first; display names it | met | "limited by oxygen"; "Battery ran out" when the suit emptied. | `walk-start-F7-1280.jpg`, `turn-1280-suit-empty.jpg` |
| Reserve on return / Turn-back point | met | See the Walk rows. | `turn-1280-turnback-on.jpg` |
| Work rate => model | met (indirect) | Not shown as a number. Body readings change with effort. | `alert-F7-1280-0-radioAhead.jpg` |
| Demo time => one factor; label: assumption; always shown | met | "Demo time 76× assumption" in the mission card and on the Debrief. | `walk-start-F7-1920.jpg`, `debrief-home-1920.jpg` |
| Tuning => spots 14-78 m; farthest round trip uses most of the suit; a detour forces turning back | met | F7 planned 5 h 34 with 1 h 12 reserve. Standing or a detour brought "Turn back now" (2 h 15 in). | `turn-1280-turnback-on.jpg` |
| Warning levels => warning red, caution yellow, advisory blue | met | | `steep-1280-underfoot.jpg` |
| Places => only from walk-targets.md | met | Access Mars points seen: Buttes, Monument Valley, Bruce Murray, Interference, all in `research/walk-targets.md`. "TEST-BROKEN" appears only with the dev route `?broken=1`. | `look-1280-look-1.jpg` |
| Radiation dose => measured rate × time; label: model | met | 0.15 mSv after 5 h 13 (about 0.69 mSv/day), tagged model. | `walk-at-rover-F7-1920.jpg` |
| Body readings => shown in the helmet; label: simulated | met | | `walk-start-F7-1920.jpg` |
| Values => all in one place; unconfirmed in source-check => assumption; Mars gravity | could not check in the browser | Not visible in the UI. | — |
| Not in this spec: pace, astronaut and suit settings, partner, events | none built | | — |

## Other checks asked for

| Check | Result | What I saw | Screenshot |
|---|---|---|---|
| Comparison with `docs/mockups/04-helmet-view.png` | met except at 1280 | Same arrangement. The 1280 overlap is listed under Walk > Layout. Where the mockup has no tags or labels, the spec additions are there (Suit and body header with simulated, Demo time row). | `walk-start-F7-1920.jpg` |
| "AI-generated image" mark on the helmet frame | met | | `walk-start-F7-1280.jpg` |
| Sky is the real Access Mars background | met, with a note | See Sky and horizon under Walk. | `walk-start-F7-1920.jpg` |
| No German text | met | None in any captured text, and no German strings in `app/src/steps/4-walk` or `5-debrief`. | — |

## Round 2

Checked Sat 14.11. about 20:30 to 21:30 (BUILD), `main` at 23ff958, served from `app/` on port 5182 (vite dev). Playwright 1.46 headless Chromium (SwiftShader), 1280x720 and 1920x1080, real key presses (W, arrows, E, esc) with the walk loop paused and stepped through `window.__walk` as in `app/scripts/journey.mjs`. Entry points: `?step=4&spot=F1|F7`, `?step=4&spot=F7&broken=1`, `?step=5&outcome=home|broken|lost&spot=F7`. Real walks: spot 01 and spot 06 along the band, spot 01 with the walker held 0.8 m and 1.5 m to either side of the band, spot 06 3 m beside the band, five approaches to the rover, a walk to the site edge, a suit-empty walk, an esc end. No console errors in any run. Screenshots: `reviews/spec-check/4-5/r2-*.jpg` (JPEG q70).
Left out as the team decided: Debrief map on the right, no headline in the Walk, the tinted eastern ground ("Ground colour model").

### Not met

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| 5 End => "New mission" leads to step 1; the finished request is marked done | not met (unfinished request) | Walk ended with esc 5 m from the rover: Debrief says "Not returned." and "Sample not taken". After "New mission" the request "One sample" shows "✓ Done" and `requestsDone` = ["crossbeds"]. The request is marked done whether or not the sample was taken. | `r2-esc-debrief-1920.jpg`, `r2-esc-new-mission-requests-1280.jpg` |
| 4 Same spots => each warning appears where the plan marked it | not met (one caution) | Rule-keeping route to spot 06 (plan: every rule kept, no steep stretch marked). On the way back, at (57.5, 0.9), 0.99 m from the band, the yellow caution "Steep stretch ahead / Ground over 20° in 4 m. Closed to the route." appeared. Seen in two runs at 1920 (the 1280 run passed a little further from that point and got none). The Debrief lists it as warning 02 "57 m east of the rover". No red warning and no broken rule. | `r2-F7-steep-on-band-1920.jpg`, `r2-F7-1920-debrief.jpg` |
| Rules: Labels => every value is real, model, simulated or assumption | not met (small remainder) | Fixed since round 1: Time outside, target distance and time, marker distances, sample card distance, Debrief scale bar. Still untagged: the E prompts ("Take sample · 20 min of work", "End excursion · last 4 m to the rover, 9 min"), the numbers in the helmet alerts ("26° here", "in 4 m", "−6 min"), the "where" lines in the Debrief warnings and checks ("57 m east of the rover · 2 h 52 in"). | `r2-F7-1280-rover.jpg`, `r2-turnback-1280.jpg`, `r2-F7-1920-debrief.jpg` |

### Round 1 not-met lines and first-visitor items, checked again

| Item | Result | What I saw | Screenshot |
|---|---|---|---|
| 4 Layout (1280 target label ran into the minimap line) | met | The minimap target name now wraps onto two lines; the marker label no longer touches it at 1280 or 1920. Other overlaps are listed under Visual cleanliness. | `r2-F7-1280-start.jpg`, `r2-F7-1920-start.jpg` |
| 5 Outcome (broken rule repeated per crossing) | met | Real walk on the `broken=1` route: "…but broke a rule: Slope on foot (2×)." (out and back over the same stretch). Fixture: "broke 2 rules: Slope on foot (4×), Way home." | `r2-broken-debrief-1280.jpg`, `r2-debrief-broken-1280.jpg` |
| 5 Layout, checks row (rule repeated) | met | Each rule once, with "· 4×" or "· 2×" after it. | `r2-debrief-broken-1920.jpg` |
| 5 Report to Earth (photo cut at 1280, not returned) | met | Photo fits and the Spot line sits below it. | `r2-debrief-lost-1280.jpg` |
| 5 Closest moment (label covered markers) | met, with a note | Label no longer covers warning markers at 1920 or in the fixture. Note: in the suit-empty walk at 1280 the "Rover" and "Suit empty" labels touch. | `r2-debrief-broken-1920.jpg`, `r2-suitempty-debrief-1280.jpg` |
| Rules: Moon values | met, with a note | Walk reserve chip "model · lunar rule"; Debrief planned Time and Reserve "model · lunar rule". Note: "Closest moment" (the lowest reserve on return, also counted with the 20 % way-home factor) is tagged "model" only. | `r2-F7-1280-debrief.jpg` |
| Slope warning on a rule-keeping route, walking on the band | met | Spot 01 and spot 06 walked along the band, and spot 01 with the walker 0.8 m left and right of the band: no "Ground over 20° underfoot", no broken rule, "kept every rule" in the Debrief. (Exception: the one caution at 0.99 m on route 06, see Not met.) | `r2-F1-1280-debrief.jpg`, `r2-F1o0.8-1280-debrief.jpg`, `r2-F1o-0.8-1280-debrief.jpg`, `r2-F7-1280-debrief.jpg` |
| Slope warning, walking near the band (1.2-1.5 m beside it) | observed | Spot 01, 1.2-1.5 m beside the band: yellow "Steep stretch ahead / Ground over 20° in 5 m. Closed to the route." on both sides. On one run 1.4 m beside the band near the spot, the red "Ground over 20° underfoot" fired and "Slope on foot" was broken; that walk kept crossing the edge of the closed ground and the Debrief reads "Slope on foot (83×)". The ground there is over 20°, so the warning itself follows spec line "Ground over 20° underfoot". | `r2-near-1.5-F1-steepAhead-1280.jpg`, `r2-F1o1.5-1280-debrief.jpg`, `r2-F1o-1.5-1280-debrief.jpg` |
| Numbers Walk vs Debrief, real walk to spot 01 | met | Helmet at the rover: Time outside 01:06:23, reserve 6 h 35, prompt "last 4 m to the rover, 9 min". Debrief: Time 1 h 16, Reserve 6 h 36. Time = 1:06 + 9 min. The reserve is 1 min higher because the last metres are walked at the normal work rate, not at the planned +20 %, which the Debrief sentence explains. | `r2-F1-1280-rover.jpg`, `r2-F1-1280-debrief.jpg` |
| Numbers Walk vs Debrief, real walk to spot 06 | met | 1280: helmet 05:13:45, reserve 1 h 57, "last 4 m, 9 min"; Debrief 5 h 23, 1 h 59. 1920: helmet 05:11:49, 1 h 58; Debrief 5 h 21, 2 h 01. Time matches with the last metres added; the reserve differs by 2-3 min for the reason above. | `r2-F7-1280-rover.jpg`, `r2-F7-1280-debrief.jpg`, `r2-F7-1920-debrief.jpg` |
| Reserve jumps across the sample | observed | Spot 01: reserve 6 h 17 at the spot, 6 h 36 right after the 20-minute sample, while time left fell from 7 h 24 to 7 h 06. Spot 06 (1920): 1 h 15 before, 1 h 30 after. The first visitor reported the same jump. | `r2-F1-1280-sample.jpg`, `r2-F7-1920-target.jpg`, `r2-F7-1920-sample.jpg` |
| Reserve a few metres off the path | met | Spot 06 with the walker 3 m beside the band: reserve logged every second stayed between 1 h 04 and 1 h 14 with no jumps, and fell steadily near the spot. No off-path caution (it starts at 6 m). | `r2-offpath3-F7-1280.jpg` |
| Rover cannot be walked through | met | Walked straight at the rover from north, east, south, west and north-east: stopped at 1.85 m from the centre line on the sides, 3.5 m from the north. Never inside the model. | `r2-rover-0-1280.jpg`, `r2-rover-90-1280.jpg`, `r2-rover-180-1280.jpg` |
| "Click to look around" turns the view to empty sky | met | A real click took the pointer lock; heading and pitch stayed the same (099.5°, −6°). | `r2-mouse-look-1280.jpg` |

### Full pass for regressions

| Spec line | Result | What I saw | Screenshot |
|---|---|---|---|
| 4 View / Sky / Rover | met | As in round 1: first person, helmet frame, start beside the rover facing the band; haze sky with the background skyline; "Rover simulated". | `r2-F7-1920-start.jpg`, `r2-rover-180-1280.jpg` |
| 4 Moving => keys and mouse, at walking pace | met for keys; mouse could not be checked | Keys work. In headless Chromium the pointer-lock mouse events carry jumps of ±640-940 px each, which the app now ignores as jumps (`mouseJumpPx` 300), so the view does not turn. A real mouse cannot be tested here. | `r2-mouse-look-1280.jpg` |
| 4 Route, Compass, Minimap, Reserve, Suit and body, Mission, Demo time, End | met | All present at both sizes. "esc" arms, the second press ends. | `r2-F7-1920-start.jpg`, `r2-esc-armed-1920.jpg` |
| 4 Steep ahead / underfoot (broken route) | met | Caution "Ground over 20° in 6 m", then warning "26° here, on the planned route. Rule broken". | `r2-broken-steepAhead-1280.jpg`, `r2-broken-steepUnder-1280.jpg` |
| 4 Radio shadow ahead | met | Advisory "No line of sight to the rover in 5 m", radio line changes to "No line of sight". | `r2-offpath3-F7-1280.jpg`, `r2-F7-1280-out.jpg` |
| 4 Turn back now | met | "Reserve on return −6 min if you go on to the spot and back. Head for the rover." | `r2-turnback-1280.jpg` |
| 4 Edge of the site | met | Caution "The mapped terrain ends here" at z −60; stopped at z −63.75. | `r2-edge-1280.jpg` |
| 4 Look card | met | "Butte · real", one sentence, "≈ 7 m high · 7 m model". | `r2-F7-1280-start.jpg` |
| 4 At the target / Suit empty / Back at the rover | met | Sample modal with PIA21042 (real); suit-empty modal "Battery ran out 6 m from the rover" (simulated); "E End excursion" opens the Debrief. | `r2-F1-1280-sample.jpg`, `r2-suitempty-1280.jpg`, `r2-F7-1280-rover.jpg` |
| 5 Headline, Table, Warnings, Map, Send report, Not returned | met | As in round 1 on every outcome seen (home, broken, lost, suit empty, esc). | `r2-F7-1280-debrief.jpg`, `r2-F7-1920-sent.jpg`, `r2-suitempty-debrief-1280.jpg` |
| 5 Not in this spec: learning from the result | finding (unchanged) | "The plan counts the way home at a 20 % higher work rate, so you can reach the rover with more reserve than planned." It is also shown on the "Not returned." screens. | `r2-debrief-lost-1280.jpg`, `r2-esc-debrief-1920.jpg` |
| 4 Not in this spec | finding (new) | Mission card row "Plan breaks: Slope on foot" on the broken route; no spec line names it. | `r2-broken-steepUnder-1280.jpg` |
| Design lines (black background, fonts, cards, markers, warning colours, AI mark, main button) | met | No change from round 1. | `r2-F7-1920-debrief.jpg` |

### Visual cleanliness

| Where | What I saw | Screenshot |
|---|---|---|
| Walk, 1280 | The look card ("Butte") runs under the Mission card; its size line touches the "Time outside" row. | `r2-F7-1280-out.jpg` |
| Walk, both sizes | The E prompt sits on top of the look card and hides its size line. | `r2-F7-1920-target.jpg`, `r2-rover-0-1280.jpg` |
| Walk, broken route | The alert box covers the target diamond and its label. | `r2-broken-steepAhead-1280.jpg` |
| Walk, near the rover | A "Butte" look card shows while the reticle is on the rover model. | `r2-rover-0-1280.jpg` |
| Walk, Mission card | "Plan breaks: Slope on foot" (red mono) is barely legible on the light translucent card. The blue "No line of sight" and cyan "Rover · ok" are also low contrast against a bright sky. | `r2-broken-steepUnder-1280.jpg`, `r2-edge-1280.jpg` |
| Walk, minimap near spot 06 | The right half of the round minimap is flat black (outside the mapped square). | `r2-F7-1920-target.jpg`, `r2-F7-steep-on-band-1920.jpg` |
| Debrief map, 1920 | Spot marker "06" is cut by the right edge of the map panel, and warning marker 2 covers its "0". | `r2-F7-1920-debrief.jpg`, `r2-debrief-broken-1920.jpg` |
| Debrief map, suit empty 1280 | "Rover" and "Suit empty" labels touch. | `r2-suitempty-debrief-1280.jpg` |
| Debrief table, 1920 | "Time in radio shadow" runs right up to "3 h 16" with almost no gap. | `r2-F7-1920-debrief.jpg` |
| Debrief, esc end, 1920 | Large empty bands above and below the "Mission ended before the rover" card. | `r2-esc-debrief-1920.jpg` |
| Leftover debug text | None seen. The dev route name "TEST-BROKEN" / "Test point up the east butte wall" appears only with `?broken=1`. | `r2-broken-debrief-1280.jpg` |
