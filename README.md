# M.H.U.D. – Martian Head-Up Display

Built at the NASA Space Apps Challenge 2026 (Heilbronn) for the challenge
[Interplanetary Survival Guide: Martian Map](https://www.spaceappschallenge.org/2026/challenges/interplanetary-survival-guide-martian-map/).

A map for one excursion on foot on Mars that answers one question at every step: from where I stand, can I
still get home? Plan a route at Murray Buttes in Gale crater, check it go / no-go, walk it in first person on
real terrain from NASA data, and compare plan and walk in the debrief.

Live demo: https://lkubler.github.io/NASA-SpaceApp-26/

## Setup
```
git clone https://github.com/lkubler/NASA-SpaceApp-26.git
cd NASA-SpaceApp-26/app
npm ci
npm run dev      # http://localhost:5173
```

## Use of AI
The idea and the specs are the team's. The code was written with Claude Code (Anthropic) from those specs; the
full log is in [`docs/ai-use.md`](docs/ai-use.md).
