# AI use log

For the submission's "Use of Super Intelligence" field and for labeling. One line per use: what, tool, which files.

- Agent system (Claude Code) used to coordinate research, coding, design, and testing. The idea itself comes from the team (`notes.md`).
- Research (Claude Code agents triage/scout/data-scout): evaluated the team's ideas, mapped prior art, tested Mars data endpoints. Files: `research/triage.md`, `research/prior-art.md`, `research/data.md`.
- Jury simulation (Claude Code agent jury): scored the team's idea candidates. File: `research/jury-idea.md`.
- Source research (Claude Code agents scout/intel): citations for slope, metabolic, comms and submission rules. Files: `research/sources-validity.md`, `research/submission-guide.md`.
- Data checks (Claude Code agent data-scout): Access Mars scene inspection, DTM coverage via HTTP Range reads. File: `research/data-sites.md`.
- Design system and dust/Quela sources (Claude Code agents designer/data-scout). Files: `docs/design.md`, `research/sources-validity.md`.
- 3D feasibility spike (Claude Code agent builder): Three.js walk on Access Mars terrain, branch `spike-3d`. File: `research/spike-3d.md`.
- Science backing (Claude Code agent scout): papers, why-it-matters facts, model upgrades, science-backed feature list. File: `research/science.md`.
- Data checks for science extras (Claude Code agent data-scout): Curiosity waypoints, REMS sol 1440, Mars24 constants, RAD dose, gravity factor. File: `research/data-science.md`.
- Wave 1 code (Claude Code agents builder/designer): app shell, terrain preprocessing, reserve model, comms shadow, UI components. Files: `app/`, `scripts/preprocess/`.
- Wave 2 code (Claude Code agents builder/designer): planner, route in 3D, sun/dust (Mars24), briefing/sources, autonomy clock, RAD dose. Files: `app/src/`.
