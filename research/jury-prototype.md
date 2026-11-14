# Jury simulation: prototype checkpoint

Jury, Sat 14.11. 14:30, BUILD phase. Freeze Sun 10:30 (20 h), submission Sun 15:45.
Judged: `main` at b0164cd, from source (`app/src/`) and screenshots (`docs/ui-008/010/013/014-*.png`, `research/planner.png`). I could not run a browser, so anything about feel, frame rate, or the deployed link is not verified. 36 model/planner tests pass (`node --test src/**/*.test.js`). Sanity numbers below were computed from `model/reserve.js` defaults.
The idea is the humans' (`notes.md`). Nothing here replaces it. Everything below is a fix, a cut, or a check.
Scores are judgement, not measurement.

## Verdict
**16/25 today.** The idea-stage projection was 20 if complete, 16-17 if scope slipped. Scope did not slip; the build is broader than expected. The score is held down by three things: the signature feature does not yet do what the pitch will say it does, the "science-first" part is not visible in the product, and no demo, pitch, or project page exists.
Reachable by Sunday 10:30 with the five changes below: **19-20**.

| Criterion | Now | Reason | Idea-stage projection |
|---|---|---|---|
| Impact | 3 | Niche user group; the autonomy clock ("answer in 14 min, the crew decides alone") is the one line that makes a layperson care. No stated user beyond "astronaut". | 3 |
| Creativity | 3 | Comms shadow as time out of contact on a real route is there and reads well. The return reserve, the other half of the signature, currently behaves like an EVA timer (see risk 1), so the novel part is half delivered. | 4 |
| Validity | 3 | Sourcing and measured/modelled/simulated labels are better than most hackathon projects. But the default plan has logic errors a judge finds in one minute (one-way route, turn-back time, return path), and several labels are wrong. | 4 |
| Relevance | 4 | HiRISE DTM really drives slope, route, and line of sight: core, not decoration. Loses the 5 because science targets are generic "Imaging / Sample / Drill" pins, there is no orbital image on the map, and no Curiosity photo anywhere in the planner. | 5 |
| Presentation | 3 | Cold open and briefing are strong and consistent. The map looks like a synthetic heat map, the walk view has a grey untextured slab and a wide magenta strip in the first frame, and there is no video, no slides, no pitch text. Judged today, this is the criterion with the least on the table. | 4 |

What improved against the idea-stage risks:
- Walk terrain vs planner terrain: solved better than I expected. Access Mars is aligned to the DTM (±2 m), the walk square is drawn on the map, and the planned route is drawn in 3D. This was Validity risk 1 and it is closed.
- Numbers: the reserve model uses Pandolf/Santee with NASA sizing figures, the mGy/mSv mix-up is gone (0.67 mSv/day), boxwork is gone, the 10 km walkback is gone.
- Provenance chips and the Sources page shipped. Keep them; they are the best Validity asset in the build.

What got worse or stayed open:
- The Ehresmann butte-shielding result (RAD measured 4 % lower dose next to Butte M12) is not used. Radiation is time multiplied by a constant, as predicted.
- No validation check of any model exists.
- SEXTANT / Johnson 2009 is named in research but nowhere in the product or a pitch.

## The 5 changes that raise the score most (ranked)

**1. Make the return reserve true. Effort M. Moves Validity +1, Creativity +1.**
Findings in `map/mapView.js` and `model/reserve.js`:
- The route ends at the last station. There is no leg back to the lander. "EVA length 6.2 h" and "Suit reserve at end 22 %" are values at station 6, not at the airlock.
- Return cost is the outbound path reversed through all stations, not the best way home from the current point. Johnson 2009 / SEXTANT computes the efficient path home from any point. Being cruder than the 2009 prior art on the feature called "signature" is the worst place to be cruder. Fix: one A* from each station (or every N-th point) to the lander on the existing cost grid.
- The turn-back message is wrong in time. The default shows "Turn back at 14:39 ... before finishing station 6". 14:39 is when the 120 min drill would be finished, i.e. after the budget is already broken. The correct output is "at station 6 you can work N min; leave by HH:MM".
- Then draw the return leg on the map and show "walk home from here: X min, Y % of suit" per station.

**2. Rebuild the default scenario so terrain decides something, and so it goes from red to green. Effort M. Moves Creativity, Presentation, Validity.**
- In the default plan the crew walks 495 m in 6.2 h. With the model's own numbers a 500 m walk home costs about 0.3 MJ, 3 % of the 10.1 MJ suit budget; station work at 352 W is the other 75 %. So the turn-back point is set almost entirely by station minutes the team assumed, not by slope or load. A judge who asks "what does the terrain change?" gets "3 %". The Pandolf model, the gravity scaling, and the load term are invisible.
- The DTM crop is 1 km. A loop of 1.5-2 km fits in it and matches the decided 2-3.5 km walkback constraint; at 2 km the walk home is about 12 % of the budget and uphill legs cost about 27 % more than level (744 W vs 585 W at 10 % grade). Use that scale. Show one comparison the model actually produces: the short steep way vs the longer flat way, or 23 kg load vs none.
- The default plan fails both limits (turn-back, and a 122 min comms shadow against a 10 min limit) and the tool offers no way out. For the demo the story must be plan, problem, fix: move the rover/relay (already draggable) and the shadow shrinks; drop a station and the plan fits. Ship one preset "fixed" state or a "Compare" toggle so this takes one click on camera. The notes already contain the repeater idea ("HUD/Planung schlägt Repeater-Standort vor"); the cheapest version is to mark the candidate relay cell that sees most of the route.
- Put the signature moments inside the 128 m walk square. Today the route leaves the square after station 1, and the turn-back point is 400 m outside it. The 3D walk therefore cannot show "entering comms shadow" followed by the turn-back marker, which is the picture the video needs.

**3. Make "science-first" visible with real NASA imagery. Effort M. Moves Relevance to 5, Presentation +0.5.**
- Stations need names and reasons from the team's own Ground Control request: Quela drill site (sols 1455-1468), cross-bedding at a butte foot, the Murray/Stimson contact. One real Curiosity image with sol number and credit per station, shown in the planner and at the station in the walk. `notes.md` asks for exactly this ("Am POI: echtes Rover-Foto"); the challenge text suggests it.
- Add the HiRISE orthoimage as the map base (toggle with the slope tint). The current base is an elevation colour ramp; nothing on the main screen looks like Mars data. This is the cheapest visible Relevance gain in the project.
- Draw Curiosity's real track (waypoints are already in `data/raw/msl_wp.json`) on the map. It is free context and sets up change 5.

**4. Produce the demo, the project page text, and the pitch now, not Sunday. Effort M (one human, plus `pitch`). Moves Presentation +1.**
- Nothing exists. The guide says most of the evaluation is the project page, and nominees are picked after the live pitch. A 30 s video needs a scripted click path and a build that supports it (change 2).
- One human owns it from now. Rough cut Sun 09:00 on whatever the build shows, final Sun 12:00.
- The page must say in the first paragraph: what exists (Mars Trek is regional; SEXTANT plans analog traverses and finds a path home), and what this adds (time out of contact and a turn-back point on real 1 m Mars terrain, in a browser). Naming SEXTANT yourselves is still worth a Creativity point.
- Verify the public link in a private window once per merge. I did not check that the Pages deployment is live.

**5. One validation check, shown in the app. Effort S-M. Moves Validity, and is the only route to Best Use of Science.**
Pick one:
- Compare the planner's route between two of Curiosity's real waypoints with the path the rover actually drove, and state where they agree and differ (different slope limits, so differences are expected and explainable).
- Reproduce the 19 % blocked sky at Butte M12 (Ehresmann et al. 2021) with the existing viewshed code. If it lands near 19 %, that is a measured NASA number confirming the line-of-sight code, and it makes radiation a real map layer instead of a clock.
Either one gives the pitch the sentence "we tested it against what NASA measured here".

Quick label fixes, all S, do them with change 1 (they cost Validity for no reason):
- "Walking distance" carries a MEASURED chip. It is a computed route length. Briefing "One-way light time 4-22 min" is MEASURED; it is computed.
- Sky panel "direct sun 7 %" at tau 8.5. `sky.js` uses exp(-0.3 tau / sin el); the direct beam at tau 8.5 is about 0.02 %. Either rename it ("light reaching the ground, approx.") or compute the real direct beam. Visibility 800 m / 120 m comes from the design doc, not from a source; it is labelled simulated, keep it that way and do not quote it.
- Sources page says the viewshed is "from the lander"; the map uses a "Rover on high ground"; the walk toast says "no link to the lander". Pick one. Also: on the map the lander itself sits inside the hatched shadow, which looks like the crew cannot reach its own base.
- "exceeds 10 min limit": 10 min is the team's assumption. Say "assumed mission rule" next to it and make it editable.
- Briefing says Curiosity drilled at Quela "sols 1464 to 1468" and the fact card says "sols 1455-1468". Explain or align.
- Dose shown as "0.0000 mSv" and SPE "x2.5": four decimals of a near-zero number advertise that it does not matter. Show the EVA total (about 0.17 mSv) and a reference a person understands.
- Planner time uses a home-made speed-vs-slope rule; energy uses constant speed; the walk view moves at 1.4 m/s while the planner assumes 0.97 m/s. Use one speed.

## Cut or do not build
- **AI assistant (task 009), as specified: do not build all three parts.** The in-browser embedding model (25 MB) and the localhost bridge are invisible to a judge using the public link, and free-text AI answers about suit limits add unsourced claims to a product whose strength is sourcing. The closest competitor concept (MarswalkAI) is "layers plus AI text"; this moves toward it. The humans decided the product gets an AI part, so the defensible minimum is step 1 only: a few pre-written, source-cited answers at stations, labelled AI-generated. Build it only after changes 1-4 are in. It moves no criterion by itself.
- **Other sites (task 011): cut.** One finished site outscores four half-finished ones. Mention them on the page as next steps.
- **No more atmosphere work.** Day/night and dust are done and good enough; they are simulated placeholders and already take more screen space than the signature features.
- **No new HUD cells.** Five cells plus the autonomy bar is already dense. The SPE replay can stay but does not go in the video.
- Still out: scroll launch/landing, rover sizing, HUD customizer, live rerouting beyond the existing toasts, QR/mobile.

## What a real judge would poke at
1. "Your route never goes home." (one-way route, change 1)
2. "What does the terrain change in your reserve?" (3 % at this scale, change 2)
3. "Reserve of what?" It is metabolic energy against 8 h x 1200 BTU/hr. That is a proxy for oxygen, CO2 removal, cooling water, and battery, which do not deplete together. Say "metabolic budget as a proxy for consumables" on screen.
4. "The suit offset is 392 W of the 585 W walking rate and was measured at Earth gravity in a Mark III." True per the code comments. The honest answer is the uncertainty band `research/science.md` already recommends; it is not shown in the UI.
5. "Gravity scaling of Pandolf is your own." Yes, labelled in code, not visible in the app. Put it on the Sources page.
6. "20 degrees is a lunar suit figure and your DTM cannot see rocks." The Sources page handles the first. The briefing lists "fallen blocks" as the hazard, and the tool cannot detect them. Say so in one line.
7. "Why would the crew talk to a rover and not to the habitat or an orbiter?" Have the one-sentence answer ready (geometric line of sight is the conservative case; orbiter passes are intermittent). The notes' placeholder text already says it; it is not on screen.
8. "Where does NASA say time without line of sight is a planning limit?" `research/sources-validity.md` says this claim from the notes is not verified. Open the ASCEND deck and quote the slide, or stop saying NASA.
9. "Is this new? MIT did this in 2009." Answer first, in the pitch.
10. "Radiation: so it does not affect the route at all?" Correct today. Either change 5 (butte shielding) or present it as an exposure log, not a route factor.
11. Rules: AI disclosure is on the Sources page; it must also be in the project description. `docs/ai-use.md` says AI did research, code, and design, which a judge may read against the "idea must be human" rule. The page should state plainly which ideas are the team's (the notes are the evidence).

## Global Awards
Realistic goal: Global Nominee from Heilbronn. A Global Award is a long shot for any team.
- **Best Mission Concept: still the best fit**, and only if changes 1 and 2 land. A mission concept judged on plausibility cannot have a one-way route.
- **Best Use of Data: weaker than at idea stage.** One dataset (the DTM) does the work; REMS, RAD, and waypoints appear as static facts. Change 3 (orthoimage, Curiosity track and photos) is what makes this claimable.
- **Best Use of Science: not realistic today.** Change 5 makes it arguable.
- **Art & Technology: outside chance.** The cold open and sky are the assets; the grey slab and the magenta strip in the walk view are the blockers. Not worth extra build time beyond fixing those two.
- **Best Storytelling: no.** There is no story artefact yet. A good video helps Presentation; it does not win this award.

## 30 s demo storyboard for this build
Assumes changes 1-3. Lines marked (now) work with today's build. Export at 28 s. English text on screen, no voice needed. No AI-generated footage, so no watermark is needed; screen recordings only.

| Time | Picture | On-screen text |
|---|---|---|
| 0-4 s | Cold open as built: LINK OK flips to NO SIGNAL, timer runs. (now) | "Mars is 4 to 22 light-minutes from help." |
| 4-7 s | Briefing: Murray Buttes, Ground Control request. (now) | Project name, team, challenge. "Mars Trek shows the region. This plans one walk." |
| 7-15 s | Map on HiRISE image. Stations appear with names and Curiosity thumbnails, route bends around red slopes, magenta hatch switches on, tiles turn red: comms shadow N min, turn back at station X. | "Real 1 m terrain: HiRISE DTM." "Out of contact: N min." "Turn back here." |
| 15-19 s | Drag the relay rover to the ridge: shadow shrinks, tiles turn green, return leg closes the loop. | "Move one relay. The plan is safe." |
| 19-26 s | Guided walk: ribbon ahead, HUD reserve falling, toast "Entering comms shadow", SIGNAL NONE, autonomy bar "answer in 14 min, the crew decides alone", turn-back marker in view. | HUD only. |
| 26-28 s | Sources page: three columns. (now) | "Measured. Modelled. Simulated. Built on NASA open data." |

If changes 1-3 are not done by Sun 09:00: keep 0-7 s, show the current red plan for 8 s with the three numbers, guided walk for 9 s, sources for 2 s. It still works, but it shows a problem without a solution.

## Verified and not verified
- Verified: source read for all files named in the task; 36 tests pass; reserve numbers (585 W level, 744 W at 10 % grade, 352 W station, 10.13 MJ, 500 m walk = 3.0 % and 2 km = 11.9 % of budget) computed from `model/reserve.js`; screenshots viewed.
- Not verified: the live deployment, frame rate, the guided walk in motion, whether the 013b dose fix is visible (the 014 walk screenshot still shows "route 0.004" and SIGNAL "simulated"; the code now says modelled), whether a HiRISE orthoimage for DTEEC_040770 is already downloaded (not in `app/public/data/`).
- Direct-beam figure (0.02 % at tau 8.5) is exp(-8.5), from my own arithmetic.
