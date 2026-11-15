# M.H.U.D. – Martian Head-Up Display

**A map shows where it's dangerous. We show whether you make it back.**

Live demo: https://lkubler.github.io/NASA-SpaceApp-26/

## The project
A crew on Mars is on its own. A radio signal to Earth takes 4 to 22 minutes each way. During Apollo, flight
controllers tracked by hand how far the astronauts could still walk back. On Mars nobody on Earth can do that in
time, so the suit has to.

M.H.U.D. is a map for one excursion on foot. At every step it answers one question: from where I stand, can I
still get home? It combines Mars terrain data with the state of the astronaut and the suit.

The visitor goes through one excursion at Murray Buttes in Gale crater, where Curiosity worked in 2016:

1. **Mission:** take a sample request from Earth.
2. **Plan:** pick a sample spot. The planner draws the fastest route that keeps every rule (slope, distance, way
   home, suit time). The rules come from NASA EVA planning documents and Apollo.
3. **Go / no-go:** every rule checked on that route.
4. **Walk:** first person through the helmet on the real terrain. The reserve on return is recalculated at every
   step. The display warns before steep ground and radio shadows and says when to turn back.
5. **Debrief:** planned next to actual, and the warnings.

Every value on screen is labelled real, model, simulated or assumption. The Sources page in the app lists where
each one comes from.

**Data:** Access Mars 3D terrain (built from Curiosity images, NASA/JPL-Caltech), the HiRISE 1 m elevation model
(NASA/JPL/University of Arizona), the HRSC Gale crater model (ESA/DLR/FU Berlin, via NASA Science), MOLA,
Curiosity waypoints and photos, RAD radiation and REMS temperature data. The full list with links and how each
is used: [`docs/data-use.md`](docs/data-use.md).

## Hackathon
Built at the NASA Space Apps Challenge 2026, local event Heilbronn, 14–15 November 2026.

## The challenge
[Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/):
create a map, tool or interface a Mars astronaut could use during a surface exploration mission. It should
layer data from several NASA missions and help a human explorer plan and carry out a safe Marswalk. Full text:
[`docs/challenge.md`](docs/challenge.md).

## Setup
Requires Node.js 20 or newer.

```
git clone https://github.com/lkubler/NASA-SpaceApp-26.git
cd NASA-SpaceApp-26/app
npm ci
npm run dev      # http://localhost:5173
npm test         # unit tests of the core numbers
npm run build    # static site in app/dist
```

The prepared data is already in `app/public`. Rebuilding it from the raw NASA files is described in
[`scripts/preprocess/README.md`](scripts/preprocess/README.md). The whole-journey test and the dev options are
in [`app/README.md`](app/README.md).

## Use of AI
The idea, the concept and the specs (`PROPOSAL.md`, `specs/`, `notes.md`) are the team's. The code, the
research files and the reviews were written with an AI coding agent (Claude Code, Anthropic) from those specs.
The helmet frame image was generated with ChatGPT (OpenAI). The intro film was rendered by AI-written scripts
from the NASA Space Exploration Vehicle model and is marked as AI-generated in the picture. The UI mockups in
`docs/mockups/` were made by a team member with Claude. No NASA data or images were made or altered by AI.
Full log: [`docs/ai-use.md`](docs/ai-use.md).
