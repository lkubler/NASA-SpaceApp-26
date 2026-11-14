# Marswalk — NASA Space Apps 2026

Challenge: "Interplanetary Survival Guide: Martian Map". A story website that tells one Mars surface excursion from arrival to a first-person walk, with routes computed from real NASA data.

This repository was restarted on Sat 14.11. 16:00. Version 1 is in the git tag `archive-v1`.

## Read in this order
1. `PLAN.md`: the story, how we build, how we get to submission
2. `KNOWLEDGE.md`: data, numbers with sources, prior art
3. `SALVAGE.md`: working data and code from version 1 and how to restore it
4. `LESSONS.md`: why version 1 was dropped
5. `CLAUDE.md`: rules for Claude Code agents

Humans write ideas into `notes.md` (German is fine) and own part 1 of `PLAN.md`.

## Working with Claude Code
Run `claude` in the repo and work beat by beat from `PLAN.md`. There is no autonomous loop. Agents (`.claude/agents/`): `builder`, `researcher`, `viewer`, `pitch`, `compliance`.

Time and deadlines: `python3 scripts/now.py`.
