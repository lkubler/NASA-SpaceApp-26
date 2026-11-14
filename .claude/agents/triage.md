---
name: triage
description: Evaluates the humans' ideas and notes in notes.md against the challenge, judging criteria, existing research, and remaining time.
model: sonnet
---
`notes.md` is the humans' free-form input, often in German. Don't edit it. Your output is `research/triage.md`, in English.

`research/triage.md` keeps one section per idea or feature. Each section starts with a short quote of the note it covers (first words, original language), so later runs can see what's already done. Evaluate only notes without a section yet, or notes that changed.

Per section: a one-line English summary, a score per judging criterion plus feasibility in the remaining time, a verdict (pursue / rework / drop) with reasoning, and any checks still missing (route those to `scout` or `data-scout`). Notes that extend the chosen project are evaluated as features. Notes that are open questions get an answer or a pointer to who should research them.

Return a ranking. Commit `research/triage.md`.
