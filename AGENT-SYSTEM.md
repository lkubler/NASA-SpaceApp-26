# Agent system

The team writes what gets built into specs. Agents decide how.

## Specs
One screen each, in `specs/`.

```
# <Name>
The visitor should understand: <one sentence>
Rests on: <research files>

<thing> => <how we handle it>

Not in this spec: <list>
```

**Main specs**, the journey:

1. `1-mission`
2. `2-plan`
3. `3-go`
4. `4-walk`
5. `5-debrief`

`0-frame`: the shell the five steps live in.
`rules`: the rules and the suit model. All five steps read it.

**Additional specs**, started only when the main journey works, in this order:

1. `x-abort`: the fastest safe way back
2. `x-pace`: normal or fast
3. `x-relay`: placing a radio relay
4. `x-effort`: the route coloured by effort
5. `x-rerouting`
6. `x-event`: dust storm warning or cooling fault
7. `x-rover-drive`: base, regional map, zoom in from the globe
8. `x-sites`: Marias Pass, Pahrump Hills, the landing site
9. `x-astronaut`: astronaut and suit settings
10. `x-display`: elapsed time, breadcrumb trail, partner
11. `x-ai-helper`

The pitch is handled by the team, outside this system.

## Roles
| Role | Does |
|---|---|
| Main session | Writes specs with the team, starts agents, merges |
| Researcher | Answers one question in one file in `research/`, with sources |
| Builder | Builds one spec in its own worktree |
| Spec check | Goes through one spec line by line in the running app: met or not met, with screenshot |
| Compliance | Checks the submission against the 2026 rules, in freeze and before submitting |
| First visitor | Walks the journey without reading the specs, writes what it understood at each step |

Reviewers write to `reviews/`. They do not fix, score, or suggest features.

## Order
1. Research
2. Main specs
3. Frame: one builder sets up the five empty steps, the data they share, and `rules`
4. Build: one builder per main spec, in parallel
5. Review: spec check per step, first visitor over the whole journey
6. Fix, until every line is met
7. Additional specs, one at a time: spec, build, review, fix
8. Feature freeze Sun 10:30: fixes only

## Cases
| Case | Handling |
|---|---|
| Not in the spec | Not built |
| Spec line unclear or not buildable | Builder stops on that line and reports |
| Agent wants to change a spec | Reports the proposal; the team decides |
| Fix fails three times | Builder stops and reports |
| Merge to `main` | Only after the spec check |

## Feedback
| Feedback | Handling |
|---|---|
| Spec check: line not met | To the builder of that step. Fix, then the spec check runs again |
| Spec check: all lines met | Merge |
| First visitor: understood what the spec says | Nothing |
| First visitor: understood something else | To the team, as one line per step: spec sentence next to visitor sentence. The team changes the spec or sends it to the builder |
| First visitor: got stuck or something broke | To the builder of that step |

## Restart
The app is built new in `app/`. No code from version 1 is reused, including its calculations. The prepared data in `app/public` and the scripts in `scripts/preprocess/` stay.

## Rules for every agent
- Run `python3 scripts/now.py` first.
- English. Tables and lists, no introductions.
- Stage only your own files. No push.
- Commit message: `<role>: <what>`.
- Never edit `notes.md`, `PROPOSAL.md`, or a spec.
- Label anything simulated.
- Report what you verified and what you could not.
