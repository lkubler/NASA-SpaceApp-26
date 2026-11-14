# Proposal: a map that gets the crew home

## 1. Why
A crew on Mars is on its own. A radio signal to Earth takes 4 to 22 minutes each way.

Going outside is the most dangerous thing the crew does routinely. NASA rates injury during excursions as a red risk for a Mars mission and plans up to 24 hours outside per person per week.

During Apollo, flight controllers on Earth tracked by hand how far the astronauts could still walk back. With minutes of delay nobody on Earth can do that for Mars. The suit has to calculate it.

## 2. The risks of one excursion
| Risk | What it means |
|---|---|
| **Not getting back** | A suit, rover, or medical failure far from safety |
| **Falling** | Steep slopes and loose blocks injure a person in a suit |
| **A partner down** | The other crew member has to get them home |
| **Solar storm** | The warning can be as short as 30 minutes; the crew must reach shelter |
| **Losing contact** | Terrain blocks the radio |
| **Exhaustion** | Climbing in a suit with a load costs far more than walking on the flat |

Most of them come down to one question: **from where I stand, can I still get home?**

## 3. Our answer
A map for a single excursion on foot. It plans the route by NASA's rules and answers that question at every step of the walk.

### Mars data and astronaut data
Whether a way is safe depends on two things: the terrain, and the state of the astronaut and the suit. The map combines both. The question is not "how steep is this slope" but "do I get back with this load from here".

### Rules first
Where NASA documents set a limit, the planner treats it as a rule.
- It proposes only routes that keep every rule.
- If no such route exists, it shows the best route that breaks rules and marks every broken rule.
- Plan, go / no-go and helmet display read the same rules.

| Rule | Value | Source |
|---|---|---|
| Slope on foot | at most 20°, what the suit is built for | NASA Artemis EVA concept of operations (EVA-EXP-0042) |
| Distance on foot from a safe haven | about 2 km, at most 3.5 km (a one-hour walk) | EVA-EXP-0042; NASA suit sizing study |
| Way home | must fit into the time left in the suit, counted at a 20 % higher work rate | Apollo walk-back planning (Bellcomm, 1970) |
| Secondary oxygen | one hour, never planned with | EVA-EXP-0042 |
| Length of an excursion | 6 ± 2 hours | EVA-EXP-0042 |

The values come from NASA's planning for the Moon and from Apollo; NASA has not yet set them for Mars. The parked rover is the safe haven.

### Always a way home
At every point the map compares the way back to the rover with what is left in the suit. It shows the reserve the crew will have on return if it continues like this, and tells it when to turn back.

### The suit
The suit carries oxygen, battery, cooling water and CO2 removal. The time left is set by whichever runs out first, and the display names it.

### No surprises
What the plan marks as a risk warns at the same spot during the walk: steep stretches, radio shadows, the turn-back point.

### Real, model, simulated
Every value carries one of three labels with its source: real (NASA data), model (calculated by us), simulated (placeholder). Values without a source are marked as assumptions. No place on the map is invented.

## 4. What the visitor experiences
1. **Mission.** Research requests arrive from Earth, with the signal delay shown. A request asks for one sample and is worded openly: "a sample from the sandstone at the base of the buttes". The visitor chooses one.
2. **Plan.** The site from above. The map shows every spot where that sample can be taken, with time, reserve and broken rules for each. The visitor picks one; the planner proposes the route from the rover and back.
3. **Go / no-go.** Every rule as one line: planned value, limit, status. Start.
4. **Walk.** First person on the real terrain, through the helmet.
   - Always: direction and distance to the target, reserve on return, radio status, minimap.
   - Only when needed: steep stretch ahead, radio shadow ahead, turn back now, off the path, edge of the site.
   - At the target: take the sample; the real rover photo of that spot.
5. **Debrief.** Planned against actual: distance, time, reserve on return, time without radio, warnings. A report goes back to Earth.

### Demo time
The 3D terrain of a site is a square of 128 by 128 metres. Nobody runs out of suit in 128 metres. In the demo time runs faster than in reality, so turning back becomes a real decision inside the site. The helmet display states the factor.

## 5. Built on real data
| Data | Used for |
|---|---|
| Access Mars 3D terrain (built from Curiosity images, NASA/JPL) | The plan map and the walk |
| HiRISE elevation model, 1 m (NASA/JPL/University of Arizona) | Position of the site, slope check |
| Curiosity photos, targets and drive path | Sample spots and what the crew would see |
| Curiosity radiation and weather instruments | Dose, temperature |

First site: Murray Buttes in Gale crater, where Curiosity worked in 2016. The buttes are wind-blown dune sandstone on top of lake mudstone; the boundary marks the change from a wet to a dry Mars.

## 6. What comes next
In this order:

1. Abort key: the fastest safe way back to the rover.
2. Pace: normal or fast, with advice before a warning.
3. Placing a device: a radio relay that shrinks the radio shadow.
4. The route coloured by effort.
5. Rerouting when the crew leaves the path.
6. A sudden event: dust storm warning or a cooling fault.
7. The rover drive from the base, the regional map, the zoom in from the globe.
8. More sites: Marias Pass, Pahrump Hills, the landing site.
9. Astronaut and suit settings.
10. More on the helmet display: elapsed time, breadcrumb trail, the partner.
11. An AI helper in the helmet.

## 7. Stack
Static web app with Three.js, hosted on GitHub Pages. Data prepared offline in Python. Routing runs in the browser; nothing is precomputed.
