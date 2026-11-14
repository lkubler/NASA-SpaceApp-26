# Rules and suit model
The visitor should understand: every limit comes from NASA, and the same limits apply in the plan, at go / no-go and in the helmet.
Rests on: `research/suit-values.md`, `research/source-check.md`, `research/walk-targets.md`

## Rules
Slope on foot => at most 20°, what NASA's suit is built for (EVA-EXP-0042 §4.2.1.3); steeper ground is closed to the route
Distance from the rover => planning value 2 km, limit 3.5 km (a one-hour walk); both from NASA's lunar planning
Way home => the walk back to the rover from here must fit into the time left in the suit; it is counted at a 20 % higher work rate than normal walking (Apollo practice)
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
Work rate => from slope, load and pace; about 350 W walking (Apollo: 1200 BTU/h), about 310 W working at the spot (1050 BTU/h); label: model
Time left => set by the consumable that runs out first; the display names it
Reserve on return => time left minus the time of the way home from here, if the crew continues as planned
Turn-back point => where the reserve on return reaches zero

## Demo
Demo time => one factor speeds up the clock and the consumption; label: assumption; always shown
Tuning => the sample spots lie 14 to 78 m of path from the rover; the factor is set so the round trip to the farthest one uses most of the suit, and a detour makes turning back necessary

Moon values => every value taken from lunar planning says so in its label

## Everywhere
Values => all in one place in the app
Labels => every value is real, model, simulated or assumption, with its source
Unconfirmed in `source-check.md` => label: assumption
Warning levels => warning (red): a rule is broken or about to be. Caution (yellow). Advisory (blue). Other colours: `specs/design.md`
Places => only from `research/walk-targets.md`; none invented
Radiation dose => Curiosity's measured dose rate times the time outside; label: model
Body readings (heart rate, core temperature, suit pressure, CO2) => shown in the helmet; label: simulated

Not in this spec: pace, astronaut and suit settings, partner, events.
