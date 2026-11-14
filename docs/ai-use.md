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
- Review and data (Claude Code agents jury/ux-tester/data-scout): prototype scoring, UX pass, HiRISE ortho, Curiosity track and photos. Files: `research/jury-prototype.md`, `research/ux-1.md`, `app/public/data/murray/`.
- Wave 3 code (Claude Code agents builder/designer/data-scout): science map layers, walk time-lapse and station cards, regional 4 km terrain layer and walkback planning. Files: `app/src/`, `scripts/preprocess/build_regional.py`, `app/public/data/murray/regional*`.
- UX pass 2 and fixes (Claude Code agents ux-tester/builder/designer): usability report and map/walk/copy fixes. Files: `research/ux-2.md`, `app/src/map/`, `app/src/walk/`, `app/src/ui/`, `app/src/styles/`.
- Jury checkpoint 2, EVA timeline, sensitivity and Quela sky check (Claude Code agents jury/builder/data-scout). Files: `research/jury-prototype-2.md`, `app/src/map/timeline.js`, `app/src/model/sensitivity.js`, `app/src/terrain/slope1m.js`, `research/quela-sky.md`, `scripts/preprocess/quela_sky.py`.
- Restart (Claude Code, Sat 14.11. 16:00): the team judged version 1 as not communicating its story. Claude Code reviewed how it was built, extracted the team's story from `notes.md` and the research findings into `PLAN.md`, `KNOWLEDGE.md`, `SALVAGE.md`, `LESSONS.md`, and replaced the agent setup. Version 1 is kept in the git tag `archive-v1`. The story and all decisions in `PLAN.md` part 1 are the team's.
