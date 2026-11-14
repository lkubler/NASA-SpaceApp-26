# Plan: the story, how we build, how we get there

This is the one file everybody works from. Part 1 is the humans' story, extracted from `notes.md` and the chat decisions of Sat 14.11. Humans own part 1 and edit it freely; agents never change its meaning. Parts 2 and 3 are the working agreement and the route to submission.

Lines marked **OPEN (humans)** are gaps only the team can fill. Agents do not fill them.

---

## 1. The story

### What it is
A story website that tells one Mars surface excursion (EVA) from arrival to a first-person walk. Every route is computed from real NASA data.

### The pitch line (from notes.md)
Mars Trek and similar tools are built for regional and global views. We are the layer below Mars Trek: the scale of a single EVA.

### What must come across
- Science is at the centre, not only safety. The walk does not go from A to B; it links science targets safely and efficiently.
- The gap is hyperlocal: one crew, one walk, one day.
- The unique highlight is comms shadows (terrain blocks the radio) and the return reserve (from every point the way home must still be possible with what is left in the suit).
- The first-person walk is the highlight and core feature of the demo.
- We are honest about what is real: measured data, modelled values, and simulated placeholders are labelled as such.

**OPEN (humans):** one sentence: what should a judge understand or feel after 30 seconds? Everything on screen is measured against this sentence.

### The flow (user story from notes.md)
| # | Beat | What the user does and sees | Priority (notes.md) |
|---|---|---|---|
| 1 | Launch | Scroll-driven rocket launch from Earth | optional |
| 2 | Choose the mission | Pick a research request from Ground Control. Each request belongs to exactly one 3D site, so the site follows from "what should be explored?" | fixed |
| 3 | Landing | Scroll animation: the rocket lands at a base near the site | optional |
| 4 | Rover route | 2D map: set waypoints from the base to the site. Rover has its own slope and obstacle limits (e.g. avoid dunes). Mission briefing plays during the drive: goals, hazards, "Curiosity was here in 2016", a few photos | fixed, but simple |
| 5 | Walk route | 2D map of the site with points of interest where measurements are possible. The user picks them; the tool proposes the safest route from real data (slope, obstacles) | fixed |
| 6 | Route overview | Distance, duration, climb, max slope, radiation dose, warnings. Button "Start the EVA" | fixed |
| 7 | First-person walk | Real 3D terrain. Helmet HUD shows the route (direction, distance to next point) and warns (steep slope ahead, comms shadow ahead, turn-back point reached, off the path). At a point of interest: the real rover photo of that spot plus what to look for | fixed, the highlight |
| 8 | Next site | Run the same flow for another site | optional |

Demo idea from notes.md: (1) planning in the dashboard, (2) a visual drive or cutscene from the base, (3) the interactive first-person walk.

### Sites and research requests (from notes.md, corrected by research)
Main site: **Murray Buttes** (Gale crater, Curiosity was there Aug to Sep 2016). Other Access Mars sites if time allows: Pahrump Hills, Marias Pass, Landing Site. Live Site is out (position undocumented).

| Site | Goal | Why there | Equipment | Hazard |
|---|---|---|---|---|
| Murray Buttes | Measure cross-bedding in the sandstone to reconstruct ancient wind and dune shape; sample at the foot of a butte | Buttes are eroded remnants of wind-deposited sandstone over lake mudstone; Curiosity drilled "Quela" at a butte foot | Camera with scale, compass/inclinometer, sample drill | Fallen blocks at the butte foot; buttes block the radio line of sight |
| Marias Pass | Sample high-silica rock; document the mudstone/sandstone contact | Curiosity found tridymite in the "Buckskin" drill sample | Portable spectrometer, drill, sample containers | Climb to the pass |
| Pahrump Hills | Sample a profile through the layers bottom to top (about 12 m) | Base of Mount Sharp; three Curiosity drill sites | Low-percussion drill (rock is brittle) | Route gains height |
| Landing Site | Study old river deposits: pebble size and rounding | "Goulburn" conglomerate at the landing site | Camera with scale, sample bags; also set up a weather station | none named |

Which targets really lie inside each 3D area: see `KNOWLEDGE.md` section 2.

### Model ideas from notes.md
- Hard limits: slope above the suit limit and big rocks are forbidden. Soft costs: energy (slope, ground, load), radiation dose, comms shadow.
- Direction matters: uphill costs energy, downhill risks a fall.
- Return constraint: from every point the way back must be possible with the remaining reserve. HUD: "turn back in X m".
- Walking speed in the 3D walk depends on slope, so the slope can be felt.
- Comms: line of sight computed from the terrain. Idea: the tool proposes where to place a radio repeater.
- Placeholder principle: nothing is just thrown in. Each placeholder is labelled "Simulated" and has one or two sentences on where the data would come from in a real mission (weather, space weather, oxygen/energy, radio).
- Minimap in the HUD, bottom left, scaled to the route.
- A loading screen that makes clear "this takes a moment".
- Roadmap only (slides, not built): HUD customizer, two-person teams, rover sizing, live weather feeds.

### Decided by the humans (Sat 14.11.)
- Idea confirmed 13:42: EVA route planner at Murray Buttes, signature = comms shadow + return reserve, first-person 3D walk with strong visuals (lighting, day/night, dust).
- Deadline: we work to the local **Sun 15:45**.
- Walkback distance 2 to 3.5 km (not 10 km). Reserve buffer 20 %.
- Desktop first. Judges watch on a PC. No QR code, no phone version.
- Stack: static web app, Three.js/WebGL, data preprocessed offline in Python, routing in the browser. No WebAssembly. Hosting on GitHub Pages (repo may be public).
- Visual theme: Mars red + white.
- An AI feature in the product is wanted (notes.md "AI USECASE": ask the HUD about what you look at; it answers from a measurement plus suit specs). How it is built is **OPEN (humans)**; v1 proposed pre-generated answers plus in-browser retrieval, never decided.

**OPEN (humans):**
- Who owns the pitch, the 30 s video or 7 slides, and the project page?
- Which beats are in the 30 s demo, and in which order?
- Is the rover route (beat 4) in or out for this build?

---

## 2. How we build

Version 1 produced working models and a product nobody wanted to show. `LESSONS.md` says why. These rules follow from it.

1. **Story first.** Nothing is built that is not a beat in part 1. Each task names its beat.
2. **One screen, one message.** A screen shows what the user needs for the next step. Evidence, caveats, and sources live on a Sources page, not in the main view.
3. **A human sees every visible change before the next one starts.** The agent shows a screenshot or a short recording and the running URL. Passing tests means "not broken", never "good".
4. **Walking skeleton before depth.** First every fixed beat exists in rough form and can be clicked through from start to end. Then the highlight (beat 7) gets the depth.
5. **The planned terrain is the walked terrain.** The walk route is computed on the same mesh the user walks on (notes.md consistency check). No plan that the 3D view cannot show.
6. **Adding means removing.** If a screen gets a new element, say which one it replaces. Text for an imagined expert is not a reason to add anything.
7. **Reuse, do not rebuild.** Terrain data, alignment, models, and tests from version 1 are in the tag `archive-v1`. `SALVAGE.md` lists them. Take what a beat needs, nothing else.
8. **Real machine.** The 3D walk is checked on a real GPU by a human at every step that changes it.
9. **Pitch runs in parallel from the first hour**, not at the end. The demo script decides what gets polished.
10. **Honest labels.** Measured, modelled, simulated. Use only claims `KNOWLEDGE.md` marks as verified, or verify first.

### Who does what
- **Humans:** the story (part 1), every decision marked OPEN, the look at each visible change, the pitch voice.
- **Main Claude session:** works with the human in the room. Breaks a beat into tasks, starts agents, shows results. No autonomous loop, no simulated jury score.
- **Agents** (`.claude/agents/`): `builder` builds one beat, `researcher` answers one question, `viewer` looks at the running product as a first-time visitor, `pitch` writes demo and page text, `compliance` checks the rules before submitting.

### Hard rule (Space Apps 2026)
AI must not come up with the idea. Agents implement and research the humans' story and may suggest fixes and improvements. Log AI use in `docs/ai-use.md`.

---

## 3. How we get there

Times are Europe/Berlin. `python3 scripts/now.py` prints the countdown. This is a proposal; humans adjust it.

| When | Goal |
|---|---|
| Sat, now | Humans fill the OPEN lines in part 1 (15 minutes) |
| Sat 18:00 | Stand-up: tell the story in 60 seconds from this file. No build needed |
| Sat evening | Walking skeleton: beats 2, 5, 6, 7 clickable start to end on a real laptop, rough but true to the story |
| Sat night | Depth for beat 7 (first-person walk with HUD, comms shadow, turn-back). Pitch: demo script and first page text |
| Sun 09:00 | Demo path complete and seen by the whole team. Optional beats only if this is done |
| Sun 10:30 | Feature freeze, mentor round #2. After this: fixes, polish, recording |
| Sun 12:00 | Demo video or slides recorded on a real GPU |
| Sun 13:15 | Project page text, data list, references, AI disclosure filled in |
| Sun 14:30 | Submission checkpoint: submitted once, links tested in a private window |
| Sun 15:45 | Hard deadline. Resubmitting is allowed until then |
| Sun 16:00 | Live pitch |
