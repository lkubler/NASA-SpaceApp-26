# M.H.U.D. – Pitch, Folien und Video

Arbeitsdatei für die Abgabe. Texte, die ins Video oder auf Folien kommen, stehen auf Englisch (Abgabe-Sprache). Anmerkungen fürs Team auf Deutsch.
`{…}` = Platzhalter, der erst feststeht, wenn der Prototyp so weit ist.

## 1. Kernbotschaft

**Name des Systems:** M.H.U.D. – Martian Head-Up Display, gesprochen „mud“. Schreibweise mit Punkten in Titeln, im Fließtext auch „MHUD“ möglich. Beim ersten Nennen immer ausschreiben.

| | Deutsch | English |
|---|---|---|
| Kernsatz | Eine Karte zeigt, wo es gefährlich ist. Wir zeigen, ob du zurückkommst. | A map shows where it's dangerous. We show whether you make it back. |
| Titelzeile | Mission Control für einen Ort, an dem Mission Control zu spät kommt. | Mission control for a place where mission control arrives too late. |
| Prinzip | Gelände rein, Missionskarte raus. | Terrain in, mission map out. |

Reihenfolge der Argumente, immer gleich:
1. **Problem:** Bei Apollo rechnete Houston live nach, ob die Crew es zu Fuß zurückschafft. Zum Mars braucht ein Signal Minuten.
2. **Lösung:** Der Anzug rechnet selbst, aus Marsdaten und dem Zustand des Astronauten.
3. **Beweis:** Nichts ist vorberechnet, jede Zahl hat eine Quelle.

## 2. Video (30 Sekunden)

Aufbau: Einstieg im Helm, dann das Problem, dann Planung, dann zurück in den Helm.

| Zeit | Bild | Text im Bild (English) |
|---|---|---|
| 0–4 s | Ich-Perspektive im Helm, Marslandschaft, HUD-Warnung leuchtet auf | TURN BACK NOW |
| 4–6 s | Bild friert ein, wird dunkler | How does the suit know? |
| 6–10 s | Apollo-15-Foto mit Mondauto | 1971: Houston recalculated live whether the crew could still walk back. |
| 10–13 s | Mars vom Orbit, Linie Erde–Mars | On Mars, that answer arrives minutes too late. |
| 13–20 s | EVA-Planung: Probenpunkt wählen, Route erscheint, eine Regel ist rot. Relais setzen, Funkschatten schrumpft, alles grün | Terrain + radio + suit data → one answer |
| 20–22 s | Gebietswechsel, Layer bauen sich neu auf | Terrain in, mission map out. |
| 22–27 s | Zurück im Helm: schnelles Tempo, Prognose fällt, HUD rät „Slow down“, dann Probe nehmen | Reserve at return: {pct} % |
| 27–30 s | Schwarz, „M.H.U.D. – Martian Head-Up Display“, darunter Teamname | A map shows where it's dangerous. We show whether you make it back. |

Hinweise
- Englische Untertitel sind Pflicht, wenn gesprochen wird. Am einfachsten: gar kein Sprechertext, nur Text im Bild und Musik.
- Jede Einstellung höchstens eine Textzeile, mindestens 2 Sekunden lesbar.
- Unten klein einblenden: „Terrain: NASA/JPL-Caltech · Model values labeled in app“.
- Kein NASA-Logo und keine Missionsabzeichen verwenden. Fotos mit Bildnachweis „NASA“.
- Falls der Gebietswechsel (20–22 s) nicht fertig wird: streichen und die Planung auf 9 Sekunden verlängern.

Was dafür im Prototyp funktionieren muss (Mindestumfang)
1. Helm-Ansicht mit HUD-Warnung und Reserve-Prognose, Tempo wechselbar
2. EVA-Planung mit Probenkandidaten, Route, mindestens einer Regel, die rot und grün werden kann
3. Relais setzen, Funk-Layer rechnet sichtbar neu
4. Probe nehmen (Taste, kurzer Zeitraffer)

Alles andere (Regionalkarte, Rover-Route, Freigabe, Auswertung) ist für das Video nicht nötig und kann auf Folien gezeigt werden.

## 3. Folien (max. 7 inkl. Titel, Englisch)

**Slide 1 – Title**
- M.H.U.D. – Martian Head-Up Display
- Mission control for a place where mission control arrives too late.
- Challenge: Interplanetary Survival Guide: Martian Map · Team {team name}: {names}

**Slide 2 – The problem**
- Apollo 15–17: walk-back limits were recalculated by flight controllers on Earth during each EVA.
- Earth–Mars signal delay: about 3 to 22 minutes one way.
- On EVA there is no room for error, because one mistake can cost a life
- On Mars, nobody can do that math for you in time.
- *Bild:* Apollo-Mondauto links, Mars rechts, dazwischen die Signallaufzeit.

**Slide 3 – Our answer: M.H.U.D.**
- A map shows where it's dangerous. We show whether you make it back.
- M.H.U.D. is an EVA planner and helmet display that continuously answers one question: under the current conditions of this EVA, do I return with reserve?
- No two EVAs are alike. Terrain, mission goal, equipment, pace and suit status all feed into the answer.
- *Bild:* Screenshot aus dem Helm mit Reserve-Prognose.

> **Reminder für Folie 4 und 5:** Der Inhalt unten ist ein Stand vom Samstagabend und wird sich noch ändern. Vor dem Bau der Präsentation von den Agents eine genaue Liste liefern lassen und diese Folien daraus neu befüllen. Auftrag zum Weitergeben:
>
> *„Erstelle eine vollständige Liste aller inhaltlichen Features und Ansätze, die im aktuellen Stand des Prototyps tatsächlich funktionieren. Pro Eintrag: (1) was es tut, in einem Satz, (2) welche Eingangsdaten es nutzt, (3) Herkunft dieser Daten: Echt (mit Quelle), Modell oder Simuliert, (4) wo im UI man es sieht, (5) Status: fertig / teilweise / nur Konzept. Nichts aufführen, was nicht im Code ist. Zum Schluss getrennt auflisten: alle festen Kennwerte mit Quelle, und alle Annahmen.“*
>
> Punkte 1–2 und 4 gehen auf Folie 4, Punkt 3 und die Kennwerte auf Folie 5. Was „nur Konzept“ ist, gehört auf Folie 7.

**Slide 4 – How it works**
- Mars data: slope, radio line of sight, sun and shadow, hazards
- Astronaut data: consumables, workload, carried load, pace
- Combined into a live forecast: reserve at return, turn-back point, safe abort route
- *Bild:* Schema „Terrain + points → layers → route → M.H.U.D.“.

**Slide 5 – Data and honesty**
- Real: 3D terrain reconstructed from Curiosity images (NASA/JPL), points of interest, suit and rover limits from NASA documents
- Model: slope, radio shadow, workload and consumption
- Simulated: weather, space weather, suit telemetry
- Every value in the app carries one of these three labels and a source.
- *Bild:* Tabelle mit drei Spalten, darunter die wichtigsten Quellen (Abschnitt 6).

**Slide 6 – Demo**
- Before/after: placing a radio relay shrinks the radio shadow and turns a blocked route green.
- Nothing is precomputed: change the sample site, the relay position or the pace, and route, coverage and reserve are recalculated.
- Video: {link} · Project: {link}
- *Bild:* zwei Screenshots nebeneinander.

**Slide 7 – Terrain in, mission map out**
- Works for any site with a terrain model: {second site} generated with the same pipeline, no manual layers.
- Next: positioning without GPS (horizon matching, radio beacons), two-person EVAs, live weather feeds.
- *Bild:* zweites Gebiet mit erzeugten Layern.

## 4. Live-Pitch (ca. 2 Minuten, falls es vor Ort einen gibt)

> In 1971, two astronauts drove a rover across the Moon. In Houston, flight controllers kept recalculating one thing: if that rover breaks down right now, can they still walk back with the oxygen and cooling water they have left?
>
> On Mars, that safety net is gone. A radio signal takes up to twenty minutes each way. Whatever Houston calculates arrives too late.
>
> So the calculation has to move into the suit. That is what we built. We call it M.H.U.D., the Martian Head-Up Display.
>
> M.H.U.D. takes real Mars terrain and the state of the astronaut, and answers one question continuously: do you make it back?
>
> It starts at your base. Ground control sends a mission goal. You plan how to reach it, and M.H.U.D. reviews your whole plan: the route, where the suit can't climb, where you lose radio contact, and what the trip costs you in time and consumables. Change one decision, and everything is recalculated.
>
> *[Live-Demo, ein Beispiel zeigen:]* Here, placing a radio relay shrinks the radio shadow, and a blocked route opens up.
>
> In the helmet, the same rules run live. Walk faster with a heavy load uphill, and the forecast for your reserve drops. The HUD tells you to slow down, or to turn back, before it becomes a problem.
>
> Nothing is precomputed. *[optional, kurz:]* And we always show what is real NASA data and what is our model. Give it a different terrain, and it generates the mission map for that site.
>
> A map shows where it's dangerous. We show whether you make it back.

Dauer bei ruhigem Tempo ca. 1:45–2:00 min. Den Namen live als „mud“ aussprechen. Beim Relais-Beispiel die Demo live bedienen.

Offen: ob der Satz zur Kennzeichnung (echt / Modell) gesprochen wird. Sichtbar ist sie in jedem Fall auf Folie 5 und im UI.

## 5. Fragen, die kommen können

| Frage | Kurze Antwort |
|---|---|
| Was davon ist echt? | Gelände, Punkte und Grenzwerte sind echte NASA-Daten bzw. NASA-Dokumente. Verbrauch und Funk sind unser Modell. Wetter und Anzug-Telemetrie sind simuliert. Im UI steht es an jedem Wert. |
| Eure Grenzwerte sind vom Mond. | Ja, und so gekennzeichnet. Für den Mars gibt es noch keine veröffentlichten Anzug-Anforderungen. Die Werte sind zentral einstellbar. |
| Woher weiß der Anzug, wo er ist? | Kein GPS auf dem Mars. {Wenn gebaut: Schrittzählung plus Horizontabgleich und Funkbaken, sichtbar als Unsicherheitskreis.} {Wenn nicht gebaut: in der Demo exakt und als simuliert gekennzeichnet, Konzept auf Folie 7.} |
| Was ist anders als Mars Trek? | Trek zeigt den Planeten. Wir planen einen einzelnen Einsatz im Meter-Maßstab und rechnen ihn live mit. |
| Warum keine KI? | Bei Sicherheitsentscheidungen muss jede Zahl nachvollziehbar sein. Die Rechnung ist deterministisch und belegt. |
| Wie genau ist das Verbrauchsmodell? | Bewusst einfach. Basis sind Apollo-Stoffwechselraten, die Zuschläge sind Annahmen. Wichtig ist die Wirkungskette, die Kennwerte lassen sich austauschen. |
| Funktioniert das woanders? | Ja, {zweites Gebiet} wurde mit derselben Berechnung erzeugt. Voraussetzung ist ein Geländemodell. |

## 6. Quellen für Folie 5 und Rückfragen

- Gelände: Access Mars (NASA/JPL, Google Creative Lab), https://github.com/googlecreativelab/access-mars
- Anzug: Steigung bis 20°, EVA 6±2 h: NASA EVA-EXP-0075, https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf
- Rover: 20–23°, max. 25°: Apollo LRV, https://ntrs.nasa.gov/citations/20250011301
- Rückweg zu Fuß 10 km: Walkback Test, https://doi.org/10.4271/2007-01-3133
- Apollo-Grenzen, 20 % Puffer, Stoffwechselraten: https://www.nasa.gov/wp-content/uploads/static/history/alsj/19790073512_1979073512.pdf
- Flugleiter führten die Walkback-Grenzen von Hand nach: „EVA Walk-Back Limit Calculation Using the Virtual Spacesuit“, https://www.researchgate.net/publication/327907532_EVA_Walk-Back_Limit_Calculation_Using_the_Virtual_Spacesuit
- Zeit ohne Sichtverbindung als Planungsgröße: https://ntrs.nasa.gov/api/citations/20250006988/downloads/ASCEND%20presentation%20-%20Planning%20Lunar%20EVAs.pdf
- Funkabdeckung aus Topografie bei Apollo 15: https://www.nasa.gov/wp-content/uploads/static/history/alsj/19790073210_1979073210.pdf

## 7. Vor der Abgabe prüfen

- [ ] Project Submission Guide und Judging Guide 2026 lesen (Länge Video, Folienzahl, Sprache, Hosting). Bisher gefunden: Stand 2025, Video max. 30 s oder max. 7 Folien, extern gehostet, öffentlich verlinkt.
- [ ] Ob Video **und** Folien eingereicht werden können oder nur eines als „Demo“ gilt.
- [ ] Signallaufzeit Erde–Mars (3–22 min) und die Apollo-Aussage auf Folie 2 gegen die Quelle prüfen. „1971“ bezieht sich auf Apollo 15, den ersten Einsatz mit Mondauto.
- [ ] Alle Screenshots zeigen den aktuellen Stand, keine Mock-ups ohne Kennzeichnung.
- [ ] Bildnachweise für jedes NASA-Foto, kein NASA-Logo.
- [ ] Links öffentlich und ohne Login erreichbar.
- [ ] Nur behaupten, was der Prototyp zeigt. Was fehlt, steht als „Next“ auf Folie 7.
## 8. Update Sunday morning: what the app does now, and data points for the pitch

Added by the main agent session on Sun 15.11. on the team's request. English, because agents write English. Sections 1–7 above are unchanged; where they differ from this section, this section describes the app as built. Sources are in `research/data-decisions.md`, `research/data-effort-route.md`, `research/data-radio-relay.md`, `research/data-minimap.md` and `docs/data-use.md`.

### 8.1 The data story in one chain (for slide 4 or 5)
Real terrain → slope → effort at Mars gravity → oxygen → reserve on return → turn back.
- Terrain: Access Mars 3D model of Murray Buttes, built from Curiosity images; we use it as a 0.5 m grid of height and slope.
- Effort: a published walking-effort equation (Pandolf), scaled to Mars gravity. A 2024 NASA Johnson paper (NTRS 20240001423) uses the same equation for EVA workload.
- One number to say out loud: about 68 g of oxygen per hour at 273 W (NASA source in `research/data-effort-route.md`); our own calculation gives about 70 g/h.

### 8.2 Three decisions that come from data (for slide 5)
1. The terrain plans the route: ground steeper than 20° is closed, the route is the shortest way over open ground, and the way home is known from every point.
2. HiRISE checks the route: Go / no-go shows how many metres of the route are steeper than 20° in the HiRISE 1 m elevation model, an independent dataset. On the demo routes it finds 2 to 29 m. Shown as a caution.
3. Radiation guidance limits the distance in time: Go / no-go checks the longest time back to the rover against 2 hours (NASA-STD-3001 technical brief OCHMO-TB-020: an EVA is protected in a solar particle event "if termination occurs within 2 hours and there is access to shielding"). The far spot (06) breaks this rule in demo time.

### 8.3 Radio shadow and relay (for slide 6 and the live demo)
- The relay is now calculated: the visitor places it on the Plan map; a place has contact if it sees the rover, or sees the relay while the relay sees the rover.
- Demo line that is true in the app: for spot 06, placing the relay cut the time without contact from 3 h 14 to 34 min.
- NOT true in the app: "a blocked route opens up" / "turns a blocked route green". Radio shadow is a caution, not a rule, so the relay does not unblock a route. Say "the radio shadow shrinks" instead.
- Contact also enters the route with a weight (assumption): ground without contact costs more. The visible effect on this site is small; do not make it a headline.
- NASA backing: Apollo 15 Mission Report Suppl. 6 (MSC-05161) compared measured radio loss with a terrain-shadow prediction: "The technique of predicting shadow losses due to obstacles in the radio line-of-sight provides a good estimate of the actual shadowing loss." NASA Glenn's Lunar Surface Relay-Mobile (2023) is a movable relay "placed in optimal locations".

### 8.4 New in the walk
- Route from here: off the planned path, the display shows the way from where the crew stands to the next goal; after "Turn back now" it shows the way to the rover. The planned route stays as a faint line.
- Turn-back line on the small map: the edge of the ground from which the crew still finishes the plan and gets home with reserve; ground beyond it is dimmed. This is the picture for the core sentence. No NASA display of such a line was found; Apollo planned with a walk-back distance limit. Say it as our own model with the Apollo precedent.

### 8.5 Say it before a judge asks
- Rule values come from Moon and Apollo planning; NASA has not set them for Mars. The app marks them.
- The Access Mars terrain is about 20 % smoother than HiRISE. That is why HiRISE checks the route.
- Oxygen-optimal route: we tested 200 routes on the real grid. With our effort model the least-oxygen route and the shortest route differ by under 1 % (median 0.00 %, maximum 0.75 %). Present it as a finding, not a feature.
- No GPS on Mars: not built; the walk knows its position exactly. Outlook for slide 7: Mars rovers are still located by people on Earth who match a panorama to the orbital map (JPL, ICRA 2024: 0.36 m against the HiRISE map), and Perseverance's longest drive without that review was "limited by growth in position uncertainty". Horizon-only matching is "on the order of 100 m, at best 10 m", so it would not help inside a 128 m site; rover and relay as radio beacons are the next step.

### 8.6 Lines in sections 1–7 that no longer match the app
- Video 22–27 s and the live pitch: "HUD advises Slow down" and pace advice are not built. Fast walk exists (Shift), with the reserve falling; there is no advice.
- Video "Reserve at return: {pct} %": the app shows reserve as time (e.g. 1 h 12), not percent.
- Video 20–22 s, slide 7, question "Funktioniert das woanders?": a second site is not built. Marias Pass and Pahrump Hills appear only as requests marked "soon".
- Slide 4: "sun and shadow, hazards" and "safe abort route" are not built as such; built are slope, radio contact, suit use, reserve, turn-back and the way back to the rover.
- Slide 5 "Simulated: weather, space weather, suit telemetry": temperature is a real Curiosity REMS measurement and the dose rate a real Curiosity RAD value; the suit levels are our model.
- Slide 6 and live pitch: "turns a blocked route green" (see 8.3).
- Section 6: the app cites the slope and excursion values from EVA-EXP-0042; section 6 names EVA-EXP-0075. The 10 km walk-back and the rover slope values are not used in the app.
- The app's own text does not use the name "NASA" outside source citations (team decision); slides and video may name sources with credit, but no logo or mission patch.
- AI disclosure for the submission text: the helmet frame image was generated with ChatGPT and carries a visible mark; the intro film was rendered by AI-written scripts and carries a visible mark; the code was written with Claude Code (`docs/ai-use.md`).
