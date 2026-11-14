# Frame
The visitor should understand: this is one mission in five steps, and I always know which step I am in.
Rests on: `PROPOSAL.md`, `specs/design.md`

Stack => static web app, Vite and Three.js, in `app/`; builds to GitHub Pages with the existing workflow
Steps => Mission, Plan, Go / no-go, Walk, Debrief; each its own module, empty at first
Step bar => small, beside the project name, in steps 1, 2, 3 and 5; shows done, current, next
Forward => only when the current step is complete
Back => always possible until the walk starts
Shared state => one object: chosen request, candidates, chosen spot, route, plan numbers, walk log; every step reads and writes only this
Rules and suit model => one module, built from `specs/rules.md`; no step holds a number of its own
Terrain => loaded once from `app/public/murray`, used by Plan and Walk
Layout in steps 1 to 3 => map left, panel right, one main button at the bottom right of the panel
Labels => one component for real / model / simulated / assumption; click shows one or two sentences and the source
Sources => a page reachable from every step: all data, tools and code used, and the AI-use note
Language => English only
Screen => works at 1280 × 720 and 1920 × 1080

Look => `specs/design.md`; one style sheet for all steps

Not in this spec: the content of the five steps.
