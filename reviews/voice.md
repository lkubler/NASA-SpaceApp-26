# Voice review

Two parts. Part 1 is what the team means by "agent voice": text that over-justifies, over-explains, or should not be in the product at all. Part 2 is the earlier pass on names and wording.
Nothing in the app was changed. Read on main at `ad9219f` (Sun 15.11., 01:00): every text string in `app/src/steps`, `app/src/frame`, `app/src/ui`, `app/src/core` (values, sources, places, plan) and `app/index.html`, including the explanations inside the info markers and the Sources page.
Not covered: text from work not merged yet (sky, beacon, transitions part 2), and the repo's own documents (README files, code comments, `research/`, `reviews/`).

# Part 1: agent voice

Almost all of it sits in the info marker explanations and on the Sources page, not in the headlines. Six kinds:

## 1. Repo and file names shown to the visitor
A visitor cannot open these and should never see them.
- Source titles: "Suit model (src/core/suit.js)" (7 times in the Walk), "Suit model (src/core/suit.js), planner (src/core/planner.js)", "Team research: sample candidates in the walk square (research/walk-targets.md)".
- Sources page: "(public/models/sev.glb)", "(public/models/mars.glb; mesh smoothed at load time, texture unchanged)", "(public/sky/milky-way.jpg)", "(public/data/missions/)", "(public/egress/egress.mp4)", "(docs/design/egress/README.md)", "(source docs/design/helm-source.webp)", "(scripts/preprocess/build_helmet.py)", "(scripts/preprocess/README.md)".
- "Access Mars public/index.html, murray_buttes_markers".
- Step numbers instead of names: "in step 1", "you walk in step 4", "The visor frame in step 4".

Suggested: name the thing, not the file. "Our suit model", "Our route planner", "The rover in the walk". The file paths belong in `docs/` and the project description.

## 2. Build details nobody asked for
- "A point counts as standing on a closed cell only once it is this far inside the cell. A planned diagonal step between two open cells touches the corner of the cells beside it; this tolerance lets the planner and the Walk agree that such a step keeps the slope rule." (a value on the Sources page)
- "textures reduced to 1024 px, mesh simplified to 85,062 triangles and compressed, otherwise unedited; scaled to 4.5 m length at load time"
- "Shrinking the rover model offline (texture resize, mesh simplification, meshopt compression …) and decoding it in the app"
- "converting its heights to metres (fit correlation 0.999)"
- "the green was keyed out and 'AI-generated image' written into the image pixels by our script"
- "Outline smoothed for display; the warnings use the planner's exact slope test on the 0.5 m walk grid."
- "the 0.5 m walk grid" appears in 12 explanations; "walk square" in 4; "terrain grid" in 6. One explanation of the grid on the Sources page is enough; elsewhere "measured on the terrain" says it.

Suggested: one plain sentence each ("NASA's model, made smaller for the web"). The rules require listing tools and edits, so the edit stays named, the parameters go.

## 3. The same disclaimer again and again
Each is right once. Repeated, it reads as defensive.
- "no radio physics" / "Geometric only, no radio physics": 6 times (Plan, Go, Walk twice, values twice).
- "not this exact spot": 4 times (Walk sample card twice, Debrief twice).
- "A caution, not a rule" / "Not a rule: the walk may go on.": 3 times.
- "in demo time" / "Shown in demo time (76×)": 9 times.
- "No Curiosity target lies in this square.", "Not a sample spot.", "this is a simulation", "there is no suit to read".
- "The question is real; the message from Earth is part of the demo." (visible text in step 1, not in a marker)
- "The real scene has a gap there where Access Mars cut out Curiosity." (also out of date: the rover is now NASA's model)

Suggested: keep each disclaimer in one place (the explanation of the value it belongs to, or the Sources page) and drop the copies. The label kind (model, simulated, assumption) already says most of it.

## 4. Justifying our own choices
- "…run this many times faster than reality, so turning back becomes a real decision inside the 128 m site."
- "Our sources give no standing rate; the closest is the Apollo planning rate for riding the rover (700 BTU/h), used here as a stand-in."
- "No value for Mars regolith exists." / "The capacity is not confirmed by a NASA document."
- "NASA's Mars backpack study sizes the primary supply for 2, 4, 6 or 8 hours; we use 8 hours."
- "There is no base on Mars. We place the crew's base at Bradbury Landing, where Curiosity landed in August 2012. The position is real (Curiosity's first waypoint), and the line is Curiosity's real drive from there to Murray Buttes, 12 km as drawn."
- "The idea, its direction and every product decision come from the team." (Sources, Use of AI)

Suggested: state the value and its source; the label "assumption" carries the rest. "Standing still: about 205 W, taken from the Apollo rate for riding the rover." The AI line is a disclosure the rules ask for; its wording is the team's call.

## 5. Explaining how the app works
- "Shown as a backdrop; it turns slowly."
- "The debrief shows the same clock."
- "counted from the rover itself like the plan"
- "It is added to the clock when you end the excursion."
- "its time, work rate, radio shadow and warnings go into the walk log as if walked."
- "It is the same ground you walk in step 4."
- "Length of the route calculated in your browser on the terrain grid"
- Debrief stops explanation: "Taken: a sample at that stop; skipped: left out by 'Turn back now'; not taken: not visited or passed without a sample."

Suggested: cut. If the screen needs the sentence to be understood, the screen is the problem, not the explanation.

## 6. Formula and note style
- "Reserve on return = time left minus the way home from here, if you continue as planned."
- "Dose during the walk = this rate times the time outside (model)."
- "where = distance from the rover and time into the excursion."
- "Astronaut 80 kg + load 23 kg", "limit > 0 min, home ×1.2"

Suggested: sentences. "Reserve on return is the time left in the suit once you are back at the rover."

## A rule of thumb for the rewrite
An explanation has at most two sentences: what the value is, and where it comes from. No file names, no step numbers, no grid or cell talk, no "we chose this because". A caveat appears once.

## What must not be lost
- Every value keeps its label kind and its source; the rules and the judging (Validity) rest on them.
- The lunar-rule note ("from NASA's planning for the Moon") stays.
- Edits to NASA material stay named (made smaller, colour changed), without parameters.
- The AI disclosure stays.

## How to apply it safely
One builder rewrites, a second agent checks every changed text against the old one: same meaning, same number, same label kind, same source, no claim added. The same pair does the renames from part 2. Best done after the last walk feature is merged, because three builders are editing these files now.

# Part 2: names and wording

## The voice the app already has, where it is good
- Short headlines with a full stop: "Choose your mission.", "Plan your mission.", "Back home.", "Sources."
- Speaks to the visitor as "you": "You reached the rover with 1 h 49 left in the suit and kept every rule."
- Says plainly what is real and what is not: "this rock in the Murray Buttes as Curiosity saw it, not this exact spot."
- Calm warnings that say what to do: "Turn back now", "Head for the rover."

The suggestions below pull the rest towards this voice.

## A. One thing, several names (team decides the word)

| Thing | Words used now | Where | Suggestion |
|---|---|---|---|
| The time outside on foot | "excursion" (Start excursion, End excursion, into the excursion, Excursion length), "walk" (End walk, Keep walking, The walk ends here, Rules on the walk, step name Walk), "mission" (End mission, Press esc again to end the mission here, You ended the mission, Mission ended before the rover) | Go, Walk, Debrief, top menu dialog | "walk" for the time outside, everywhere. "Mission" only for the whole task from Earth (step 1, "New mission", "Plan this mission"). "Excursion" only where a NASA rule is named ("Excursion length"), or not at all |
| The rover | "Rover", "Rover, home", "Home" | Plan map says "Home", Plan list and legend say "Rover, home", the list ends with "Rover", Debrief says "Rover", Sources group says "Home" | "Rover" everywhere. "Home" stays only in sentences ("Way home", "Back home.") |
| A place to go to | "spot" (Candidate spot, Click to plan this spot, Sample spot), "stop" (Chosen stop, 1st stop), "target" (Next target: the rover.) | Plan, Go, Walk | "spot" = a place on the map; "stop" = a spot on your route; "target" = where you are heading now. This is already nearly so; fix the few that break it (list C) |
| The task from Earth | "Request", "Mission", "Task", "Missions from Earth" | Plan chip says "Request", Walk display says "Task", step 1 says "Missions from Earth", Debrief says "Request" | "Mission" in step 1; "Request" for the one line carried through Plan, Walk and Debrief (Walk: "Request" instead of "Task") |
| The route | "route", "round", "way", "path" | "No way on this round keeps this rule", "Round breaks a rule", "Off the path", "from the planned route" | "route" for the line on the map; "round" only when several stops are meant; "Off the route" instead of "Off the path" |
| Radio | "Radio shadow", "No line of sight", "Radio to rover" | Go, Walk, Debrief | Keep "Radio shadow" as the name and "no line of sight to the rover" as its explanation; fine as it is, listed for the team to confirm |
| Lowest total time | "Cheapest", "Cheapest of the spots", "· cheapest" | Plan | Nothing costs money here. "Fastest" (the planner text already says "Fastest route to every spot that keeps every rule.") |
| Leaving the walk early | "End mission" (key hint), "End walk" (dialog button), "ended early", "Mission ended before the rover" | Walk, Debrief | "End walk" everywhere; Debrief: "Walk ended before the rover" |

## B. Tone breaks and long sentences

| Where | Now | Problem | Suggestion |
|---|---|---|---|
| Plan, hint | "Click more spots to add stops (up to 3); click a chosen one to remove it." | Two instructions, brackets, semicolon | "Click a spot to add it, up to 3. Click it again to remove it." |
| Plan, hint | "Click a spot for a 2nd stop. ↑ ↓ change the order, × removes." | Telegram style next to full sentences | "Click a spot to add a 2nd stop. Use ↑ ↓ to reorder, × to remove." |
| Plan, hint | "3 stops, the most per excursion. ↑ ↓ change the order, × removes." | Same | "3 stops is the most. Use ↑ ↓ to reorder, × to remove." |
| Plan, tooltip | "Already 3 stops, the most. To add this one, remove a stop first." and "3 stops chosen: remove one to add this spot" | Two wordings for one message | One: "3 stops is the most. Remove one to add this spot." |
| Plan | "No way on this round keeps this rule; the best route is shown." | "way on this round" is hard to read | "No route keeps this rule. The best one is shown." |
| Plan | "Hover a number to see its total time." | "its" is unclear | "Hover a spot to see its total time." |
| Go | "The best round, rover → 01 → 02 → rover, breaks 1 NASA rule. Every other limit is checked below." | Long; arrows inside a sentence | "This route breaks 1 NASA rule. All checks are below." (the stops are already listed beside it) |
| Go | "No line of sight to the rover. Not a rule: the walk may go on." | Fine in content, clipped in tone | "No line of sight to the rover. This is a caution, not a rule." |
| Go, checks | "limit > 0 min, home ×1.2", "plan 14 m", "steepest 19.5°", "farthest 28 m" | Lower-case fragments; "home ×1.2" is not understandable alone | Keep the fragments (they are data rows) but replace "home ×1.2" by "way home counted ×1.2" |
| Go | "Start with 1 broken rule" | Good and honest; keep | — |
| Walk, warning | "… if you go on to the spot and back. Head for the rover." | Fine; "spot" becomes "stop" with several stops | check after stops part 2 is merged |
| Walk, hint | "look · rest at an edge to keep turning" | Unclear without context | "Move to an edge of the view to keep turning" |
| Walk, two hints | "Move the mouse to look" and "Move the mouse to look around" | Two wordings | "Move the mouse to look around" |
| Walk | "Jump: counted as walked", "Demo speed: movement only" | Short and clear; keep (spec wording) | — |
| Walk | "Ground over 20° underfoot" | Stiff | "You are on ground steeper than 20°" |
| Walk | "Plan breaks" | Unclear row name | "Rules broken" |
| Walk | "to the debrief" (button, lower case) | Only lower-case button | "To the debrief" |
| Walk | "No route planned. Start from step 1." | Fine | — |
| Debrief | "Not done this time. Earth will hear it in 18 min." | Slightly flippant next to the rest | "Not collected this time. Your report reaches Earth in 18 min." (same form as the success line) |
| Debrief | "The plan counts the way home at a 20 % higher work rate, so you can reach the rover with more reserve than planned." | Good content, long | "The plan counts the way home at a 20 % higher work rate. That is why you can arrive with more reserve than planned." |
| Debrief | "Demo time 76×: times are suit time." | Hard to parse | "Shown in suit time. On screen the walk ran 76× faster." |
| Debrief | "ended early, 14 m south-east of the rover" | Fine | — |
| Mission | "Three missions at real Curiosity sites in Gale crater." | Good | — |
| Mission | "Gale crater elevation data could not be loaded." | Fine as an error | — |
| Sources | lede sentence with all four labels in brackets | One very long sentence | Split: "Every place, number and image in this mission, and where it comes from." then a short list of the four labels |

## C. Small consistency points
- **Capitals:** buttons are sentence case ("Confirm route", "Start excursion", "Send report") except "to the debrief". Row names are sentence case except the lower-case data fragments in the Go checks.
- **"Demo time":** written three ways: "Demo time: clock and suit run 76× faster" (Plan), "Demo time" as a row (Go, Walk), "Demo time 76×: times are suit time." (Debrief). One sentence for all three would help; suggestion in B.
- **Units:** "20 %" with a space, "20°" without, "76×" without. This is correct typography and consistent; no change.
- **"NASA rule":** Go says "NASA rule", Plan and Debrief say "rule". Some limits are lunar planning values or our assumptions, and the labels say so. "NASA rule" in the headline sentence may promise more than the labels keep; "rule" alone is safer.
- **"Spot" in the Go stop list:** falls back to the word "Spot" when a stop has no name. Not visible with the current data.
- **Step name against button:** the step is "Walk", the button into it is "Start excursion", the key hint out of it is "End mission". With the word list in A this becomes "Start walk" / "End walk".
- **Page description** (`index.html`): "Plan one excursion on foot at Murray Buttes, Mars, by NASA's rules, and walk it through the helmet." It follows whatever the team decides in A.

## What I would not change
- The headlines and the "you" sentences in Debrief.
- The warning names ("Turn back now", "Steep stretch ahead", "Radio shadow ahead", "Edge of the site").
- The honest photo lines ("not this exact spot").
- Place names from Access Mars and the request texts from the research file; they carry sources.

## Decisions for the team
1. The word for the time outside: "walk" (suggested), "excursion", or "EVA".
2. "Rover" everywhere instead of "Home" / "Rover, home".
3. "Fastest" instead of "Cheapest".
4. "Request" in the Walk display instead of "Task".
5. "rule" instead of "NASA rule" in the Go headline sentence.
6. Whether the B list is applied as written.
