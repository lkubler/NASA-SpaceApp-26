# 027 Visual and copy polish from UX pass 2
owner: designer
state: done
area: app/src/styles/, app/src/ui/briefing.js, app/src/ui/sources.js, app/src/ui/components.js

## Goal (research/ux-2.md)
- P2-6 Sources: host + short title for link labels, overflow-wrap; third column reads "Illustrative inputs" with the planned real source (orbiter dust opacity, REMS), not "no real data yet".
- P3-1 Terrain attribution not under the map legend (CSS).
- P3-4 Reserve tile: neutral/green above buffer+5, amber within 5 pts, red below (tile colour logic may sit in mapView: coordinate by changing only that one function, task 025 is editing mapView too, keep the diff tiny).
- P3-5 Station row amber needs a nearby legend or less alarming styling.
- P3-7 Fold headings say what is inside; last fold drops "legend".
- P3-8 Briefing: add "Your job: plan a loop that gets you home with 20 % suit left and keeps radio contact."
- Fade-out of the comms hatch after relay move is optional (only CSS/token side).

## Done when
Build passes, 0 console errors, screenshots research/polish-027*.png (sources, briefing, map panel).

## Result (designer)
Done. Sources: link labels are host plus short file name, overflow-wrap anywhere; third column "Illustrative inputs" naming planned real sources (orbiter dust opacity, REMS). Map: attribution moved left of the key (CSS); reserve tile green above buffer+5, amber within 5 pts, red below (one-line change in mapView); station rows use a 3 px amber bar instead of amber text, footnote explains it; fold headings renamed. Briefing gets a "Your job" row. Hatch fade-out not done (optional). Build OK, 55 tests pass, 0 console errors. Screenshots: research/polish-027-briefing.png, -sources.png, -map.png (map base image did not render in headless in time; panel and attribution visible).
