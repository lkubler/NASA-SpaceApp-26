# Jury simulation: prototype checkpoint 2

Jury, Sat 14.11. 15:40, BUILD phase. Feature freeze Sun 10:30 (19 h), submission Sun 15:45.
Judged: `main` at 73d0eef, from source (`app/src/`), task results 012-027, `research/ux-1.md`, `research/ux-2.md`, and screenshots (`research/map-025-*`, `walk-026-*`, `polish-027-*`, `ux-2/*`). 55 tests pass (run by me). Numbers marked (C) are my own runs of the app's model code on the default scenario. I could not run a browser: the deployed link, real-GPU frame rate, free walking, and anything in motion are not verified.
The idea is the humans' (`notes.md`). Everything below is a fix, a cut, or a check on it.
Scores are judgement, not measurement.

## Verdict
**19/25 today** (checkpoint 1: 16). Four of the five changes from checkpoint 1 landed. The one that did not is the demo, pitch, and project page, and it is now the largest gap.
Reachable by freeze with the changes below: **21**. 22 needs a pitch that makes a layperson care.

| Criterion | CP1 | Now | Reason | What raises it most |
|---|---|---|---|---|
| Impact | 3 | 3 | Unchanged. The user is still "an astronaut", the audience is small, and nothing in the product or on paper says who else this helps. | The pitch, not code: one sentence on why a person who never goes to Mars should care (14 min to get an answer, so the map has to decide with you). Realistic ceiling 3, 4 with a strong story. |
| Creativity | 3 | 4 | The return reserve is now real: best path home from every point, leave-by time per station. Comms shadow is a time, and the relay search turns it from a warning into a fix (115 to 0 min). That pair on real terrain is not in the prior art listed in `research/prior-art.md`. | In the default plan the turn-back never appears (the plan is feasible by design), so half of the signature is invisible unless the user edits a station. Change 2. Name SEXTANT in the product and the pitch; today it is only in a code comment (`map/home.js`). |
| Validity | 3 | 4 (low) | The logic errors are gone: loop route, true return cost, one speed model, consistent turn-back text, corrected labels, 55 tests, clean console. It is a low 4 because the plan passes by 2 points of reserve while the model's own uncertainty is about 12 points either way, the "validation" fold validates nothing (it says so itself), and the scenario has two plausibility holes (see questions 1-3). | Change 3 (show the sensitivity, re-check slopes at 1 m) and change 4 (one reproduced measurement). An expert judge who asks questions 1-3 and gets no answer scores 3. |
| Relevance | 4 | 5 (thin) | The three gaps from CP1 are closed: HiRISE orthoimage base, Curiosity's real track, named stations with real Curiosity photos. HiRISE terrain drives the route, the reserve, the shadow, and the relay position: NASA data is the engine. It is a thin 5 because only two kinds of data do work (topographic, optical). Radiation is one constant multiplied by time, atmospheric data is one briefing fact plus a simulated slider. The challenge text suggests three kinds. | Keep it by showing layers, the Curiosity track, and a photo card in the demo. Make it solid with a third kind that changes with the plan: the REMS sol 1440 temperature curve on the EVA timeline (part of change 2). |
| Presentation | 3 | 3 | The product is clearly better: two UX passes, the map reads as Mars, the panel fits 1280x720, the relay moment works. The score does not move because judges score "the demo and the full project", and there is still no video, no slides, no pitch text, no project page text. The walk view remains the weakest screen: a smooth low-detail surface and a white strip. | Change 1. Nothing else moves this criterion. |

What changed since checkpoint 1, against its five changes:
1. Return reserve true: done (015, 022, 024).
2. Scenario where terrain decides and red turns green: mostly done. Comms goes red to green in one click. The reserve does not: it starts green.
3. Science-first with real imagery: done (016, 018, 023).
4. Demo, page, pitch: not started. No pitch owner is recorded (`docs/rounds.md` rounds 11 and 12 list it as open).
5. Validation check: a context comparison shipped (Curiosity's driven grades vs the planned route), worded honestly as "not validated". The reproducible check (blocked sky at Quela) was not attempted.

## Findings from the model (C)
Default scenario, computed with `model/reserve.js`, `map/home.js`, `model/comms.js`:
- Energy: walking 3,991 kJ (39 % of the 10,129 kJ budget), station work 3,904 kJ (39 %), 22.1 % left. At CP1 walking was 3 %. Distance now matters.
- Terrain: on flat ground at the same distances the reserve would be 26.2 %. Slope costs 4 points. The route is 5.93 km against 5.35 km in straight lines between stations (11 % detour). Route slopes on the 5 m grid: median 4 deg, 95th percentile 9.5, maximum 15.5. That is the honest answer to "what does the terrain change?": it sets where you can walk and where you lose the radio, and it costs 4 points of reserve. Do not claim more.
- Margin: 2.1 points above the 20 % buffer (about 10 min of station work, as the verdict says).
- Sensitivity of "22 %": load 0 kg 23.9 %, load 40 kg 20.0 % (turn-back appears), loose sand everywhere 20.5 %, suit metabolic offset halved 34.6 %, offset +50 % 9.5 %, Earth gravity 11.3 %. The suit offset is measured at 1 g in a Mark III; it dominates everything else.
- Average rate over the EVA is 449 W, 28 % above the 1200 BTU/hr sizing average the budget is built on. So a 4.9 h EVA uses 78 % of an "8 h" suit. Correct in the model, but a judge will ask.
- Comms: longest shadow 115 min, total out of contact 175 min of 293 (60 % of the EVA). The tile shows only the longest. With the lander itself as the radio source (2 m antenna) the crew is out of contact for 281 of 293 min. That number is the reason a relay exists and is not shown anywhere.
- Bug, walk HUD: in the guided time-lapse the reserve jumps to the after-work value on arrival at a station and stays flat during the work. `walk-026-guided.png` shows 56 % at T+1h49; the model gives about 70 % then, and 55.9 % only at T+2h58 after the 70 min drill. Cause: `route3d.js` picks the first point with `elapsed_s >= clock`, and a station point's `elapsed_s` includes its dwell. Fix: interpolate the reserve between the two points by time. Effort S. Fix it before the video; it is on screen in the walk shot.

## The 5 changes still worth doing (ranked)

**1. Demo, pitch, and project page: start now, one human owns it. Effort M (human plus `pitch`). Presentation 3 to 4. Protects every other score.**
- Local judges see the live pitch and the page; global judges see only the page and a 30 s demo. None of it exists, 24 h before submission. This was change 4 at CP1.
- Use the 18:00 stand-up as the first draft: 60 s, spoken, on the current build.
- Rough cut of the video by Sat 22:00 on today's build (the build is demoable now). Final recording Sun after freeze, on a real GPU at 1920x1080.
- The page's first paragraph: what exists (Mars Trek is regional; SEXTANT plans analog traverses and a path home), what this adds (time out of contact, a relay position that removes it, and a leave-by time for every station, on real HiRISE terrain in a browser).
- The page must also carry: how NASA data is used (per dataset, from `ui/sources.js`), all references, the AI disclosure, and a plain statement of which ideas are the team's. `notes.md` is the evidence: comms shadow and reserve as the highlight, the return constraint, the relay suggestion, the rover photo at the station, and the measured/modelled/simulated principle are all there in the humans' words.

**2. Put both signatures on one EVA timeline strip under the map. Effort M (builder, 2-3 h). Creativity firm 4, Presentation +0.5 inside the product, Relevance solid 5.**
- Problem: the default plan is feasible, so no turn-back marker exists on the map or in the walk, and the per-station "home 53 min / 20 %" is hidden in a fold. The humans' return constraint ("from every point the way back must be possible with the remaining reserve") is computed for every point and shown for none.
- Fix: one strip, x axis = EVA clock. Line 1: suit reserve. Line 2: reserve needed to get home from there (return cost plus 20 % buffer). The gap is the margin; where they touch is the turn-back. Magenta bands = out of contact. Blocks = stations. All of this is already in `route.reserve.points` and `route.shadows`; it is a drawing task.
- It shows in one picture why the drill cannot run 20 min longer, and the magenta bands vanish when the relay moves. That is the frame the video needs.
- If cheap after that: add the measured REMS sol 1440 air and ground temperature along the same clock (data is parsed, `research/data-science.md` section 2), and the Mars24 sun elevation. That makes atmospheric data a third real layer tied to the plan, from the humans' own layer table (REMS: time window for the EVA). Skip it if the strip itself is not merged by Sun 02:00.
- Include the HUD reserve fix above.
- Without any build: in the demo, type 90 into the drill minutes. "Leave station 3 by ..." appears. Use this if the strip is not built.

**3. Show how sure the 22 % is, and close the scenario's plausibility holes. Effort S (builder 1 h, plus copy). Validity from low 4 to firm 4; needed for Best Mission Concept.**
- Add a short "What moves this number" list in the reserve fold or on Sources, with the values from the model: load 0 / 23 / 40 kg, flat terrain, suit offset minus and plus 50 %. State that the 20 % buffer exists because the model is this uncertain. Showing it is a strength; hiding it is what an expert judge punishes.
- One line on screen: "suit reserve = metabolic energy budget, a proxy for oxygen, CO2 removal, cooling, and battery". Still missing since CP1.
- Slopes: the planner checks the 20 deg limit on a 5 m grid smoothed over 10 m (task 022 says steep flanks read lower). Sample the 1 m slope grid along the part of the route inside the 1 km crop (that is where the buttes are) and print the maximum next to the 15.5. If it exceeds 20, say so or nudge the station. Do not rebuild the planner on 1 m.
- Show total time out of contact next to the longest stretch, and the "lander alone: 281 of 293 min" figure as the reason for the relay.
- Scenario framing, humans decide the wording: the product says "relay rover" and has the crew walk 2.5 km each way with 23 kg. The team's own source (xEVA ConOps) gives a 2 km radius on foot. Either call the relay an uncrewed relay unit, or state that this is the walk-back case (crew rover unavailable), or accept the question in the pitch.
- Put "Prior work: SEXTANT / Johnson 2009" and the gravity-scaling assumption on the Sources page.

**4. One reproduced measurement: blocked sky at Quela. Effort S-M, hard stop after 2 h. Validity toward a solid 4; the only path to Best Use of Science.**
- Ehresmann et al. 2021: RAD measured about 4 % lower dose with the rover parked against the butte at Quela. `research/data-science.md` section 6 reports "19 % of the sky blocked" from a search summary only.
- Step 1 (30 min): read the open full text and confirm the number and its definition (which field of view). If it cannot be confirmed, stop here.
- Step 2: compute the blocked sky fraction at the Quela waypoint from the 1 m DTM with the existing ray code, same definition. Report the result in the "Check against Curiosity and RAD data" fold, whatever it is, with the DTM registration caveat.
- If it lands near the published value, the pitch gets "our terrain code reproduces a number RAD measured here". If not, one honest sentence. Either way the fold stops being context only.
- Do not turn it into a dose map layer. The effect is 4 % of 0.14 mSv.

**5. A human runs the deployed build on a real machine, tonight. Effort S (30 min, human). No score gain; removes the largest single risk.**
- Every test so far is headless software rendering. Nobody has walked freely with the mouse, dragged the relay or a station, or timed the relay search on a real GPU (`tasks/025`, `026`: "not verified").
- Open the public link in a private window, on the laptop that will be used for the pitch and on one weaker laptop. Click the full demo path twice. Check the three source links that returned 403 or failed to scripts (doi.org, JPL image policy, Mars24 algorithm page).
- I did not check that the Pages deployment is live or matches `main`. If it is not, that is a P1 before anything else.
- File what breaks as tasks before midnight, so fixes land before freeze.

Small fixes, all S, bundle with 2 or 3:
- Sources: the third column is titled "Illustrative inputs" but its chip still says SIMULATED, and the page heading says "placeholder". Pick one word.
- Briefing: "EVA REQUEST 01 of 01" advertises that there is one site. Drop "of 01".
- Map: the black wedge on the west side is the DTM edge. Label it "no HiRISE DTM coverage" once, or it reads as a rendering fault.
- Curiosity raw-frame credits: Sources says only one credit line was checked. Check the other five or keep the wording; do not delete the caveat.
- Notes claim NASA names "max time without line of sight" as a planning limit (ASCEND deck). `research/sources-validity.md` still marks it unverified. Open the deck and quote the slide, or keep saying "assumed mission rule" and do not say NASA in the pitch.

## Cut or do not build
- **AI assistant (task 009): do not build.** 19 h left, no Presentation artefact, and free-text or pre-written AI answers add unsourced text to a product whose strength is sourcing. The humans decided the product gets an AI part; my recommendation is to reverse that as a scope cut (humans decide, record in `DECISIONS.md`). AI use is disclosed either way; an AI feature earns no criterion.
- **Other sites (task 011): cut.** Mention on the page as next steps.
- **Minimap (task 010 remainder): cut.** The walk area is 128 m of a 5.9 km plan; a minimap does not fix that, and the HUD line from task 026 already says where you are.
- **No planner rewrite on the 1 m grid.** The check in change 3 is enough.
- **No THEMIS or CRISM layer.** At 100 m and 18 m per pixel they cannot drive a walking route (same judgement as at idea stage). A layer added for the count is what the Relevance criterion calls a superficial addition.
- **No more walk-view terrain or atmosphere work.** It will not reach Art & Technology level by Sunday; hours there are hours not spent on the video.
- **No more relay-search tuning, hatch fade, or new HUD cells.**
- Still out: scroll launch and landing, rover route planner, rover sizing, HUD customizer, QR and mobile.

## What a real judge would ask
1. "You have a rover. Why does the crew walk 5.9 km with 23 kg?" (change 3, framing)
2. "Your plan passes by 2 points. How good is the model?" (change 3, sensitivity)
3. "Reserve of what?" (proxy line, change 3)
4. "A 4.9 h EVA uses 78 % of an 8 h suit?" Answer: loaded walking costs about 585 W in the model against the 352 W sizing average; half of this EVA is walking.
5. "Did you validate anything?" Today: no, and the app says so. (change 4)
6. "Your slope limit is checked on smoothed 5 m data." (change 3)
7. "Why line of sight to a relay and not an orbiter?" Answer exists in `notes.md` (orbiter passes are intermittent; line of sight is the conservative case). Not on screen.
8. "Where does the 10 min rule come from?" Assumed, labelled, editable. Good. Do not attribute it to NASA.
9. "MIT planned paths home in 2009." Say it first.
10. "Radiation does nothing to the route." Correct. Present it as an exposure log.
11. "Fallen blocks are your stated hazard and a 1 m DTM cannot see them." One line on Sources or in the briefing.
12. Rules: "Did AI come up with this?" The Sources page answers in one sentence. The project page needs the same, with `docs/ai-use.md` linked.

## Global Awards
Realistic goal: Global Nominee from Heilbronn. That depends on the local field, which I cannot see. A Global Award is a long shot for any team.
- **Best Mission Concept: the one to aim at.** "Most plausible concept and design." The relay fix and leave-by times are concept-level contributions. Questions 1, 2, and 6 are exactly what a plausibility judge asks, so change 3 is the price of entry.
- **Best Use of Data: now arguable** (was weak at CP1). The claim is a unique application: one elevation model turned into time out of contact, a relay position, and a walk-home cost. Weakness: breadth, two kinds of data doing real work.
- **Best Use of Science: not realistic.** No hypothesis was tested. Change 4 makes it arguable, not likely.
- **Art & Technology: no.** The cold open and the map are good; the 3D walk is plain.
- **Best Storytelling: no.** There is no story artefact, and the story here supports a tool; it is not the product.
- Do not design for Most Inspirational, Galactic Impact, Local Impact, or Global Connection.

## What the demo and pitch must show (humans decide format and wording)
Whatever the format, a viewer must see these five things, in this order:
1. The problem in one line: on Mars an answer from Earth takes minutes (7 one way on the demo sol), so the crew decides alone. The cold open does this in 4 s.
2. Real Mars: the HiRISE image, Curiosity's track, one Curiosity photo at a named station. Say "HiRISE" and "Curiosity" on screen.
3. The plan and its problem: the loop, the magenta bands, "115 min out of contact".
4. The fix: move the relay, 115 becomes 0. Then the leave-by time: extend the drill, "Leave station 3 by ...". With change 2 both happen on the timeline strip.
5. Honesty and credit: the measured / modelled / illustrative split, 2 s.

Order matters for the walk: record it **before** moving the relay. After the move there is no shadow in the walk and, in the default plan, no turn-back either, so the walk shows a link that never drops.

30 s video, screen recordings only (no AI footage, so no watermark), English text on screen, export at 28 s:

| Time | Picture | Text |
|---|---|---|
| 0-4 s | Cold open: LINK OK to NO SIGNAL | "Mars is 4 to 22 light-minutes from help." |
| 4-6 s | Briefing | Name, team, challenge. "Mars Trek shows the region. This plans one walk." |
| 6-13 s | Map: route, Curiosity track, photo card at Quela, magenta bands, 115 min tile | "Real terrain: NASA HiRISE." "115 min out of contact." |
| 13-18 s | Guided walk: toast "Entering comms shadow", SIGNAL NONE, autonomy bar | HUD only |
| 18-23 s | Back on the map: Move relay, bands vanish, 0 min | "Move one relay. Contact all the way." |
| 23-26 s | Drill 70 to 90 min: leave-by label (or the timeline lines touching) | "And it tells you when to leave." |
| 26-28 s | Sources columns | "Measured. Modelled. Illustrative. Built on NASA open data." |

Seven slides if the humans prefer slides: title; problem; what exists and the gap (Mars Trek, SEXTANT); the map with data credits; relay before and after; leave-by and the timeline; data, limits, AI disclosure, team. Slides allow the live pitch to carry the click-through.

For the live pitch: open with question 9 and question 5 answered by yourselves. Judges mark down gaps they find, not gaps you name.

## Verified and not verified
- Verified: source of `model/reserve.js`, `model/comms.js`, `model/rad.js`, `map/home.js`, `map/scenario.js`, `map/science.js`, `ui/sources.js`, `ui/briefing.js`, `walk/hud.js`, `walk/route3d.js`; 55 tests pass; all (C) numbers computed with the app's own modules on the default scenario; screenshots viewed.
- Not verified: the live deployment; anything on a real GPU; free walking and dragging; the "Move relay back" button; whether the 1 m slope along the route exceeds 20 deg; the 19 % blocked-sky figure (one search summary); the lander-as-source figure assumes a 2 m antenna and uses the regional 5 m grid.
