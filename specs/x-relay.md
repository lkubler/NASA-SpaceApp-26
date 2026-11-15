# Radio relay and contact in the route
The visitor should understand: the terrain decides where I have contact, the route prefers ground with contact, and a relay I place changes both.
Rests on: `PROPOSAL.md` §6 point 3, `specs/rules.md` (radio shadow: a caution, not a rule), `specs/2-plan.md`, `research/data-radio-relay.md`.

## Contact in the route
Time without contact => not a rule; it goes into the route calculation with a weight: ground in radio shadow costs more, so the planner prefers a way with contact where the detour is small
Weight => one value, label assumption, listed on the Sources page with a sentence on what it does
Rules => still come first: the weight never opens closed ground and never makes a route break a rule that the route without the weight keeps
Plan and walk => use the same weighted calculation (planned route, way home, route from here)
Numbers shown (distance, time, reserve) => real distance and time of the chosen route, never the weighted cost

## Relay
Relay => can be placed on the Plan map by the visitor; a place is allowed only where the relay sees the rover and the ground is open
Contact => a place has contact if it sees the rover, or sees the relay while the relay sees the rover
Relay placed or moved => radio shadow on the map, the route and the route's time without contact are calculated again
Plan => shows the route's time without contact with the relay and without it
Go / no-go, walk, Debrief => use the same shadow as the Plan (with the relay if placed)
Relay in the walk => visible at its place
Antenna heights => sourced values where a source exists, otherwise assumption
Labels => relay device: simulated; radio shadow and contact: model; the Apollo 15 comparison of predicted and measured terrain shadowing is cited as the source of the method
"Compare" and "Move" => do what they say, or are removed

Not in this spec: a search for the best relay place, signal strength, orbiters, a limit for time without contact, carrying or setting up the relay in the walk
