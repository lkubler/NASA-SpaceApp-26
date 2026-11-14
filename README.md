# Martian Map

NASA Space Apps 2026, challenge "Interplanetary Survival Guide: Martian Map".

A map for one excursion on foot on Mars that answers one question at every step: from where I stand, can I
still get home? The visitor takes a sample request from Earth, plans a route at Murray Buttes in Gale crater
by NASA's rules, checks it go / no-go, walks it in first person on the Access Mars terrain while the suit
recalculates the reserve on return, and reads a debrief of plan against walk. Every value on screen is
labelled real, model, simulated or assumption; the Sources page lists where each one comes from.

## Run
```
cd app
npm ci
npm run dev      # http://localhost:5173
npm test         # unit tests of the core numbers
npm run build    # static site in app/dist
```
The whole-journey test and the dev parameters are described in `app/README.md`.

| File | Content |
|---|---|
| `PROPOSAL.md` | What we build and why |
| `AGENT-SYSTEM.md` | How the team and the agents work |
| `specs/` | What each step of the app must do |
| `research/` | Findings with sources |
| `reviews/` | Spec checks, first visitor reports, journey screenshots |
| `notes.md` | The team's notes |
| `CLAUDE.md` | Rules for agents |
| `docs/` | Challenge, rules, resources, AI-use log |
| `app/` | The app; `app/public` holds the prepared NASA data |
| `scripts/preprocess/` | Rebuilds that data from the raw NASA files |

The status line shows time, phase and plan usage (`scripts/statusline.py`, `scripts/now.py`).

## AI use
The idea and the specs are the team's. The code, the research files and the reviews in this repository were written with an AI coding agent (Claude Code, Anthropic) from those specs. The helmet frame image in the walk and the mockups in `docs/mockups/` are AI-generated or AI-assisted. Full log: `docs/ai-use.md`.
