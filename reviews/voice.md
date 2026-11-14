# Voice review

A review of the wording on screen, done on main at `2705f8e` (Sun 15.11., 00:50). Nothing in the app was changed.

How it was done: every text string in `app/src/steps`, `app/src/frame`, `app/src/ui`, `app/src/core/places.js`, `app/src/core/plan.js` and `app/index.html` was read, about 450 strings.
Not covered: the long explanations inside the info markers (`core/values.js`, `core/sources.js`, the long `text:` entries), and text from work not merged yet (rover, several stops in Walk and Debrief, transitions).

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
