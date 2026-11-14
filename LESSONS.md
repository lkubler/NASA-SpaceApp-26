# Lessons from version 1

Version 1 ran Sat 14.11. from 10:30 to 16:00: an autonomous orchestrator loop, 13 agent roles, 13 rounds, 30 tasks, about 150 commits. The team's verdict: it does not communicate what we want. It is archived in the tag `archive-v1`.

## What went well
- **Research.** It caught real errors early: no boxwork at Murray Buttes, the 10 km walkback is a test distance, SEXTANT is prior art, no single elevation model covers all four sites, Quela is outside the 3D square. Sources are marked verified or not. See `KNOWLEDGE.md`.
- **Data and models.** Real HiRISE terrain cropped and aligned to the Access Mars mesh within 2 m. Reserve, line-of-sight, routing, and sun position work and have 60 tests. See `SALVAGE.md`.
- **Speed.** From the idea decision to 30 merged tasks in about two hours.
- **Honesty.** Labels for measured, modelled, simulated. Failed checks were reported as failed.

## What went wrong, and the rule that follows
| What happened | Rule now |
|---|---|
| The loop was steered by a simulated jury that could not open a browser. It rewarded what reads well in text: sources, caveats, tables. Each round added more of them | No simulated score steers the work. The humans' story does |
| The humans' story (an eight-step journey with the first-person walk as highlight) was reframed at the idea stage as "the planner is the product, the walk sells it". A dashboard was built | The story in `PLAN.md` is fixed by humans. Agents do not reframe it |
| The walk, the intended highlight, became the weakest screen: a white ribbon, overlapping HUD boxes | Depth goes to the highlight first |
| The default plan grew to 5.9 km to make the reserve numbers interesting, while the 3D walk covers 128 m | The planned terrain is the walked terrain |
| Nothing was ever removed. The map panel ended with about 15 pieces of information and text written for an imagined expert | One screen, one message. Adding means removing |
| "Verified" meant tests, zero console errors, headless screenshots. Nobody experienced the build on a real GPU | A human sees every visible change on a real machine |
| Agents decided everything except four big topics and the orchestrator was told to stay silent. Open human decisions were listed for three rounds with no answer | Short steps with a human in the room. Open decisions block the work they concern |
| Pitch, demo, and project page were never started, though the jury said so twice | Pitch runs in parallel from the first hour |
| Features were built model-first and the UI was added on top | Walking skeleton of the whole story first, then depth |
