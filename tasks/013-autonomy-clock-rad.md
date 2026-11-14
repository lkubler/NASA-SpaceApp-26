# 013 Autonomy clock and radiation dose counter
owner: builder
state: open
area: app/src/model/rad.js, app/src/ui/autonomy.js, app/src/walk/hud.js

## Goal
Science extras 1 and 2 from research/science.md (sources and corrected numbers in research/data-science.md):
1. Autonomy clock: one-way light time Earth–Mars for the scenario date (4–22 min range; compute from a simple orbital approximation or Mars24 heliocentric distances, labelled modelled) shown as a small bar "Earth would hear you in N min · answer in 2N min" in the HUD and on the planner panel. Story: the crew decides alone.
2. RAD dose counter: cumulative EVA dose from the measured Gale surface rate 0.67 mSv/day ≈ 0.028 mSv/h (MEASURED, inside-rover detector looking up, note in tooltip), driven by EVA elapsed time (walk time / guided walk; route time_s if present). "SPE replay" toggle: Sept 2017 solar particle event, dose rate ×2–3 for ~12 h (Zeitlin 2018), labelled SIMULATED, with a HUD caution.
Pure model in app/src/model/rad.js with node --test tests. UI with app/src/ui/components.js chips.

## Done when
Both visible in Walk HUD (and light-time also in the planner panel if app/src/map is not being edited by another agent — otherwise leave a hook), tests pass, build passes, 0 console errors, screenshot docs/ui-013.png.
