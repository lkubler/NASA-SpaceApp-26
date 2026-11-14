# UX pass 1 (prototype on main, b0164cd), judge persona, desktop

Method: `vite preview` build, headless Chrome (swiftshader), 1280x720 and 1920x1080. Flow: #/briefing cold open, Plan the EVA, map edits (add station, change task, EVA start, suit level, SPE toggle), Walk (guided walk, sky chip, dust storm), Sources. Screenshots in `research/ux-1/`.
Not testable headless: real pointer-lock mouse-look walk, dragging the rover/stations with the mouse (not exercised; add/edit via click and inputs worked), right-click remove.
Console: no errors or warnings except 2x `ERR_CONNECTION_REFUSED` (resource URL not identified; check in a real browser, may be a missing external asset). Timing: cold open 4.2 s then briefing; "Plan the EVA" enabled after about 8 s (swiftshader), map drawn at once after that.
Scope notes: tasks 015 (true-return reserve) and 017 (labels, dose, ribbon) already exist; items overlapping them are marked.

## P1 (a judge will notice within 3 minutes)

**P1-1 The map panel hides the interaction at 1280x720.** The panel is 944 px tall, the viewport 676. Below the fold: EVA start time, suit-level slider, Clear stations, SPE replay toggle (in the autonomy bar), the pink-swatch legend (the only place that says pink = comms shadow), and the provenance legend. Judges on a laptop see numbers but not the "what do I do" controls, and never learn what the pink hatching means. Repro: open #/map at 1280x720, scroll the panel. Shots: `04-map.png` (cut off at "Comms shadow on route"), `14-map-1080.png` (everything visible at 1080). Fix: compact the panel (collapse hint text, put legend/ provenance behind a "?" or into a bottom strip, put time and suit controls above the stations table), and add an on-map legend for the hatch. Owner: designer (layout) + builder (panel structure).

**P1-2 The turn-back message contradicts the other numbers.** Default scenario: "SUIT RESERVE AT END 22 %" (red) while text says "Turn back at 14:39 after 495 m (before finishing station 6): consumables would no longer cover the walk home plus the 20 % buffer". 22 % is above the 20 % buffer, yet it is red and flagged; 14:39 is exactly when station 6 (drill 120 min, arrive 12:39) finishes, not "before" it; the map label says "TURN BACK before station 6 14:39" while the table shows station 6 arriving 12:39. A judge cannot tell what the turn-back point is, which is the core story. Also the turn-back marker sits at station 6 itself, not on the path, so it is not a visible "point". Shots: `04-map.png`, `05-map-direct.png`. Likely partly addressed by task 015 (true-return reserve), re-test after it merges. Owner: builder; wording by designer.

**P1-3 The first thing the walk shows is a red "SIGNAL NONE / comms shadow" at the start position, with 100 % reserve that never moves.** Spawn is inside the hatched shadow near the lander, so the headline signal is NONE before the user does anything; after 15 s of guided walk reserve is still 100 % and dose reads 0.0001 mSv, so the HUD looks static and the walk adds no drama versus the map. Repro: map, Walk, press Guided walk. Shots: `10-walk-arrive.png`, `11-walk-guided.png`. Fix: show reserve with decimals or drain visibly (or a "time since start / distance walked" readout); make the spawn at a point with link so the loss of signal is an event, then toast and turn-back moments. Dose zero display overlaps task 017. Owner: builder (HUD logic), designer (display).

## P2

**P2-1 "What do I do?" is not stated.** Briefing says plan the EVA, but the map only says "Click: add station ..." in grey 12 px text. No sentence like "Your job: plan a loop that gets you home before the suit reserve hits 20 %". The magenta meaning (comms shadow) is not explained in the 3D view at all (ribbon, fat magenta cone at the bottom of every frame; only a toast on entry). Shots: `10-walk-arrive.png`. Owner: designer (copy), builder.

**P2-2 EVA start 12:00 produces a night-time EVA without warning.** Set start 12:00 and add station: EVA 8.7 h ends about 20:40 LTST, reserve 0 %, and nothing mentions darkness/sunset. Also the suit-level slider to 30 % reports "Turn back at 14:01 after 73 m" fine, but "EVA length 8.7 h / reserve 0 %" is shown unchanged. Shots: `07-map-noon.png`, `08-map-suit30.png`. Owner: builder (add sunset marker or warning).

**P2-3 Dust storm at tau 8.5 looks nearly the same.** Banner says "visibility 120 m" and the panel says "direct sun 3 %" (task 017 covers the number), but 3 s after selecting Storm 2018 the mesa 1 km away is still sharp. May be a ramp (3 s sample), but a judge clicking it expects an instant dramatic change. Shot: `13-walk-dust.png` vs `11-walk-guided.png`. Owner: designer.

**P2-4 Sky panel overlaps the HUD.** At 1280x720 the expanded sky panel reaches y=515 and the HUD starts at y=489, covering the EVA DOSE title. The collapsed "09:00 LTST" header wraps to two lines when expanded. A red sliver peeks out from under the top banner at x 565-715 (some element hidden behind the comms banner). Shot: `13-walk-dust.png`. Owner: designer.

**P2-5 HUD dose card is crowded and unclear.** "0.070 MSV/H . ROUTE 0.429" (unit/label of 0.429 missing), SPE caution plus both MEASURED and SIMULATED chips stacked. Uppercase transform turns "mSv/h" into "MSV/H" and "m/s" into "M/S" (wrong units to a scientist). Wrapping known. Shot: `10-walk-arrive.png`. Owner: designer.

## P3

- P3-1 Cold open on direct #/briefing: the first frame reads "NO SIGNAL" (big green text, pill red). The big word is green on a no-signal message (colour semantics off) while the timer is magenta. Shot: `01-cold-0.7s.png`. Designer.
- P3-2 Cold open lasts 4.2 s and the Plan button is disabled ("Acquiring terrain...") until about 8 s on slow GPUs; a judge may think it is stuck. Consider enabling after skip with a spinner label. `03-briefing.png`. Builder.
- P3-3 Map: label collisions at 1280x720 ("TURN BACK before station 6 14:39" overlaps "Imaging 30 min" in some states, and with the station-1 label when turn back is at station 1: `08-map-suit30.png`). Designer.
- P3-4 Hint line mentions "lander, rover or station" drag, but the rover is a small pink square labelled "Rover on high ground (comms)", with no affordance. Designer.
- P3-5 Sources page works and fits; the third column is mostly empty, fine. 1920x1080 map is clean (`14-map-1080.png`).
- P3-6 Station row time turns amber/red with no explanation of colour meaning (amber = slope above preferred 15 deg?). Designer.

## What works
Briefing is clear and the Hazard/Objective copy tells a story. Map at 1080 is strong: route, shadow hatch, turn-back label, tiles with MEASURED/MODELLED chips. Map and walk agree on light-time line and the SPE dose x2.5 (0.028 to 0.070 mSv/h). Guided walk works, sky chip and dust buttons respond, Sources is honest and complete.
