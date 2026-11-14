# Rules and suit model
The visitor should understand: every limit comes from NASA, and the same limits apply in the plan, at go / no-go and in the helmet.
Rests on: `research/suit-values.md`, `research/source-check.md`, `research/risks.md`

## Rules
Slope on foot => at most 20°; steeper ground is closed to the route
Distance from the rover => planning value 2 km, limit 3.5 km
Way home => the walk back to the rover from here must fit into the time left in the suit
Secondary oxygen => 1 hour; shown, never counted as time left
Excursion length => 6 hours planned, 8 hours limit
Radio shadow => no line of sight to the rover at eye height; a caution, not a rule
No route keeps every rule => the best route is still shown; each broken rule is marked on the route and at go / no-go
Home => the parked rover at the start point

## Astronaut and suit
Astronaut => fixed: 82 kg body mass, 23 kg carried load; shown
Suit => fixed: NASA Mars suit study, 104 kg; shown
Mars gravity => weights and effort use it
Consumables => oxygen, battery, cooling water, CO2 removal; each has its own level
Work rate => from slope, load and pace; about 350 W on the flat at 2 km/h; label: model
Time left => set by the consumable that runs out first; the display names it
Reserve on return => time left minus the time of the way home from here, if the crew continues as planned
Turn-back point => where the reserve on return reaches zero

## Demo
Demo time => one factor speeds up the clock and the consumption; label: assumption; always shown
Tuning => the round trip to the farthest sample spot uses most of the suit; a detour makes turning back necessary

## Everywhere
Values => all in one place in the app
Labels => every value is real, model, simulated or assumption, with its source
Unconfirmed in `source-check.md` => label: assumption
Colours => red: warning, rule broken. Yellow: caution. Blue: advisory. Cyan: route. Green: go
Places => only from `research/walk-targets.md`; none invented

Not in this spec: pace, astronaut and suit settings, partner, events.
