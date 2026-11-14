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
- On Mars, nobody can do that math for you in time.
- *Bild:* Apollo-Mondauto links, Mars rechts, dazwischen die Signallaufzeit.

**Slide 3 – Our answer: M.H.U.D.**
- A map shows where it's dangerous. We show whether you make it back.
- M.H.U.D. is an EVA planner and helmet display that continuously answers one question: with this load, at this pace, on this route, do I return with reserve?
- *Bild:* Screenshot aus dem Helm mit Reserve-Prognose.

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
> So the calculation has to move into the suit. That is what we built. We call it M.H.U.D., the Martian Head-Up Display. You say it like "mud".
>
> M.H.U.D. takes real Mars terrain and the state of the astronaut, and answers one question continuously: do you make it back?
>
> In planning, you pick where to take a sample and where to place a radio relay. The tool computes the route, shows where the suit can't climb and where you lose radio contact, and tells you what the trip costs. Place the relay here, and the radio shadow shrinks and a blocked route opens up.
>
> In the helmet, the same rules run live. Walk faster with a heavy load uphill, and the forecast for your reserve drops. The HUD tells you to slow down, or to turn back, before it becomes a problem.
>
> Nothing is precomputed, and every number is labeled: real NASA data, our model, or simulated. Give it a different terrain, and it generates the mission map for that site.
>
> A map shows where it's dangerous. We show whether you make it back.

Dauer bei ruhigem Tempo ca. 1:45–2:00 min. Während „Place the relay here“ die Demo live bedienen.

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