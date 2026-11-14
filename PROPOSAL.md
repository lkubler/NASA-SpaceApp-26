# Proposal: a map that gets the crew home

## 1. Why
A crew on Mars is on its own. A question to Earth takes 4 to 22 minutes each way, so nobody can talk them through a problem.

Going outside is the most dangerous thing they do routinely. NASA rates injury during excursions as a red risk for a Mars mission and plans up to 24 hours outside per person per week.

Of NASA's red risks for Mars, this is the only one that depends on where the crew walks. A map can reduce it.

## 2. The risks of one excursion
| Risk | What it means |
|---|---|
| **Not getting back** | A suit, rover, or medical failure far from the habitat. Six Apollo moonwalks ended with under 10 % oxygen left |
| **Falling** | Steep slopes and loose blocks injure a person in a suit |
| **A partner down** | The other crew member has to get them home |
| **Solar storm** | Warning can be as short as 30 minutes; the crew must reach shelter |
| **Losing contact** | Terrain blocks the radio to partner and habitat |
| **Exhaustion** | Climbing in a suit with a load costs far more than walking on the flat |

Most of them come down to one question: **from where I stand, can I still get home?**

## 3. Our answer
A map for a single excursion. It plans the route by NASA's rules and answers that question at every step of the walk.

### Rules first
Where NASA documents set a limit, the planner treats it as a rule.
- It proposes only routes that keep every rule.
- If no such route exists, it shows the best route that breaks rules and marks every broken rule.

| Rule | Value | Source |
|---|---|---|
| Slope on foot | 20° | Artemis suit operations concept |
| Distance on foot from a safe haven | about 2 km, at most 3.5 km | NASA suit sizing, Artemis concept |
| Reserve kept for an emergency walk back | 20 % | Apollo practice |
| Length of an excursion | 6 ± 2 hours | Artemis suit operations concept |

The values come from NASA's lunar planning and from Apollo.

### Science first
The route links the research targets the crew chooses.

### Always a way home
At every point the map compares the cost of the way back with what is left in the suit. It tells the crew when to turn back.

### No surprises
Steep stretches and radio shadows are shown before the crew reaches them.

### Fitted to the astronaut and the suit
The plan and the helmet display use body mass, carried load, the suit, and what is left in it. A heavier load or a weaker suit gives a shorter reach and an earlier turn-back.

## 4. What the visitor experiences
1. **Launch.** A short rocket launch animation.
2. **Mission.** Ground Control sends research requests. Choosing one chooses the site.
3. **Plan.** A map of the site with points of interest. The visitor picks them. The planner proposes the safest route within the rules and shows the risks along it.
4. **Overview.** Distance, duration, climb, reserve at the end, warnings. Start.
5. **Walk.** First person on the real terrain with a helmet display.
   - Always: direction and distance to the next point, reserve, radio status, minimap.
   - Only when needed: steep stretch ahead, radio shadow ahead, turn back now, off the path.
   - At a point of interest: the real rover photo of that spot and what to look for.

### Demo time
The 3D terrain of a site is a square of 128 by 128 metres. Nobody runs out of suit in 128 metres. In the demo the suit drains faster than in reality, so turning back becomes a real decision inside the site. The helmet display states that time is compressed.

## 5. Built on real data
| Data | Used for |
|---|---|
| HiRISE elevation model, 1 m (NASA/JPL/University of Arizona) | Slope, route, way home, radio line of sight |
| HiRISE orbital image | The map |
| Curiosity photos and drive path | Points of interest and what the crew would see |
| Curiosity weather and radiation instruments | Temperature over the day, dose |
| Access Mars 3D terrain (built from Curiosity images) | The first-person walk |

First site: Murray Buttes in Gale crater, where Curiosity worked in 2016. Anything simulated is labelled as simulated.

## 6. What comes next
- More sites: Pahrump Hills, Marias Pass, the landing site.
- Hazards that do not occur at this site, such as dust storms.
- The rover drive to the site with a mission briefing.
- Rerouting when the crew leaves the path.
- An AI helper in the helmet.

## 7. Stack
Static web app with Three.js, hosted on GitHub Pages. Data prepared offline in Python. Routing runs in the browser.

## 8. Open
- Does a landing animation follow the launch?
- Which astronaut and suit values can the visitor change, and which are fixed?
