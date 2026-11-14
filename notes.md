

- Die Wissenschaft gehört ins Zentrum, nicht nur die Sicherheit. Gefragt ist ein Marswalk, bei dem man unterwegs Wissenschaft betreibt. Die Route geht also nicht einfach von A nach B. Sie verbindet wissenschaftliche Ziele sicher und effizient miteinander.

- Die Lücke ist hyperlokal. Der Text sagt ausdrücklich, dass Mars Trek und Co. für regionale und globale Ansichten gebaut sind, nicht für den einzelnen Spacewalk. Euer Pitch lautet also: Wir sind die Ebene unter Mars Trek, auf der Skala eines einzelnen EVA.

- Rover und Arbeit in Zweierteams sind ausdrücklich als Option genannt? könnte interessant sein

- für Demo: 1. Schritt Planung im Dashboard 2. Schritt dann reine visual demo oder Cutscene von Basis via Fahrzeug / Rover (Fuel consumption, Ausrüstung, Forschungsplan, benötigte Messisntrumente und daraus resultierende größe des Rovers etc. mit einbeziehen) 3. Schritt First Person EVA interactive Walk (Highlight und Core Feature)

Datentyp	Layer	Wofür
Topografisch	HiRISE-DTM → Steigung, Rauigkeit, Sichtlinie	Gehbarkeit, Funkkontakt
Optisch	HiRISE-Orthobild, Rover-Fotos	Hindernisse, POV an den Wegpunkten
Thermal	THEMIS Thermal Inertia	Lockerer Sand vs. Fels → Energieaufwand
Spektral	CRISM-Mineralogie	Wo die Wissenschaft liegt → Wegpunkte
Strahlung	Curiosity RAD	Dosisbudget pro EVA
Atmosphärisch	REMS (Temperatur, Wind, Staub)	Zeitfenster für den EVA


Routenlogik
- Wissenschaftsziele setzen: aus CRISM vorgeschlagen oder manuell gewählt, z. B. drei Boxwork-Aufschlüsse.
- Harte Grenzen: Steigung über dem Anzuglimit und große Felsen sind tabu. Das Limit sinkt mit der getragenen Last. Den genauen Wert müsst ihr recherchieren und begründen.
- Weiche Kosten: Energie (Steigung, Untergrund, Last), Strahlungsdosis, Funkschatten.
- Richtungsabhängig: Bergauf kostet Energie, bergab birgt Sturzrisiko.
- Rückkehr-Constraint: Von jedem Punkt der Route muss der Rückweg mit der verbleibenden Reserve machbar sein.
- Optional Rover-Segmente: Der Rover trägt das Gerät bis zum Rand des steilen Geländes, das letzte Stück geht man zu Fuß.

--> vorallem Funklöcher / Blocker, Reserve sehr serh interessant. könnte uniques highlight werdem


- Missionbriefing während der Fahrt Cutscene: Ziele der Mission, Gefahren, z.B. Perseverance war hier vor so und so vielen Jahren, ein paar Bilder einblenden

- Potentielles live rerouting falls man den Pfad verlässt (mit Warnung) + neu Berechnung oder kurze Gefahren Ansicht und Hinweise, falls man sich spontan entscheidet eine Detour zu nehmen



# User Story:

Story-Website, die einen Mars-Außeneinsatz von der Anreise bis zum Spaziergang in Ich-Perspektive erzählt. Alle Routen basieren auf echten NASA-Daten.

## Ablauf
1. **Start (Scroll-Animation):** Aufwändig animierter Raketenstart von der Erde, gesteuert per Scrollen.
2. **Ortswahl:** Der User wählt einen Ort auf dem Mars. Zur Auswahl stehen nur Orte, für die es ein 3D-Gelände gibt (siehe 3D-Basis).
3. **Landung (Scroll-Animation):** Die Rakete landet in einer Basis nahe dem gewählten Ort.
4. **Rover-Route (2D-Karte):** Der User setzt Wegpunkte von der Basis zum 3D-Ort. Die Route wird für den Rover geplant (eigene Grenzwerte für Steigung und Hindernisse, z. B. Sanddünen meiden).
5. **Spaziergang-Route (2D-Karte):** Startpunkt ist der 3D-Ort. Die Karte zeigt Points of Interest, an denen Messungen möglich sind. Der User wählt POIs, das Tool schlägt die sicherste Route vor, berechnet aus echten Daten (Steigung, Hindernisse).
6. **Routen-Übersicht:** Stats der Route (Strecke, Dauer, Höhenmeter, max. Steigung, Strahlungsdosis, Warnungen) und ein Button „Einsatz starten“.
7. **3D-Ansicht:** Ich-Perspektive im echten 3D-Gelände des Orts. Ein Helm-HUD zeigt die Route dynamisch an (Richtung, Entfernung zum nächsten POI) und warnt (z. B. zu steiler Hang im Blickfeld).
8. **Nächster Ort:** Danach kann der User denselben Ablauf für einen anderen Ort starten.

## Optional
- Customizer des Hud. also freie Platzierung der hud Elemente

## 3D-Basis
- Access Mars: https://github.com/googlecreativelab/access-mars
- Nur Gelände-Dateien nutzen (`public/terrain/<ort>/terrain.glb` + `tiles/`), nicht den alten App-Code
- Hauptort: Murray Buttes. Weitere, falls möglich: Landing Site, Pahrump Hills, Marias Pass, Live Site




### Gale Crater / Murray Buttes
Einsatzort am unteren Mount Sharp. Curiosity war dort Aug–Sep 2016.
Rover / Daten von: Curiosity

Gelände
- 3D-Gelände Startpunkt (Access Mars, nur glTF + Texturen nutzen, nicht den alten Code): https://github.com/googlecreativelab/access-mars
  - Ordner: public/terrain/murray_buttes/ (terrain.glb, tiles/, background.jpg)
- Höhenmodell + Orthobilder Murray Buttes (HiRISE DTM, 1 m/px): https://hirise.lpl.arizona.edu/dtm/PSP_009650_1755
  - DTM: DTEEC_009650_1755_009716_1755_U01 (833 MB)
  - Orthobild zum Start: PSP_009650_1755_RED_C_01_ORTHO (1 m, ~60 MB), farbig IRB_C (~27 MB)
  - Orthobild Nahansicht: RED_A (25 cm, ~776 MB)
- Infos zu HiRISE-DTMs (Auflösung, bekannte Fehler): https://www.uahirise.org/dtm/about.php

Rover-Daten (Position, Fotos, RAD, REMS)
- NASA PDS Analyst's Notebook (Curiosity): https://an.rsl.wustl.edu/msl/AN/an3.aspx
  - Traverse-Karte + Positionsdaten: Tab „Resources“
  - Fotos, RAD (Strahlung), REMS (Wetter): Sol-Ansicht, Marstage Aug–Sep 2016
  - TODO: Sonnenteilchen-Ereignis in RAD-Daten finden (Weltraumwetter-Szenario)

Orientierung & Hintergrund
- Mars Trek (Gale Crater): https://trek.nasa.gov/mars/#v=0.1&x=137.34923560455954&y=-4.529538328419656&z=7&p=urn%3Aogc%3Adef%3Acrs%3AEPSG%3A%3A104905&d=&locale=&b=mars&e=133.39415755333584%2C-6.644406453032323%2C141.30431365578323%2C-2.4146702038069905&sfz=&w=
- Murray Buttes aus dem Orbit (HiRISE): https://www.jpl.nasa.gov/images/pia17587-murray-buttes-at-foot-of-mount-sharp-on-mars/
- Panorama Eingang Murray Buttes (Geologie: Murray-Tonstein + Stimson-Sandstein): https://science.nasa.gov/resource/rovers-panorama-of-entrance-to-murray-buttes-on-mars
- 3D-Ansicht Murray Buttes (Stereopaar): https://www.planetary.org/space-images/3d-view-of-the-murray-buttes-zoom

Noch offen
- Sonnenstand berechnen (Mars24-Algorithmus, NASA GISS) – Link noch suchen

- Storyline: Im Dashboard plant man 1–3 Forschungsanfragen von Ground Control → so landet der User garantiert an einer unserer verfügbaren 3D-Locations
  - Verfügbar aus Access Mars: Landing Site, Pahrump Hills, Marias Pass, Murray Buttes (live_site = Curiosity-Position 2017, Lage undokumentiert → weglassen)
  - Rover-Daten brauchen wir nur für die Sols, in denen Curiosity an diesen 4 Orten war


### Risiken / technische Klärung

Risiko 1: Access-Mars-Mesh ↔ HiRISE-DTM ausrichten
- Kleiner als gedacht: Dashboard und EVA sind durch die Fahrt-Cutscene getrennte Szenen → kein nahtloses Einpassen nötig, nur ein Marker an ungefähr richtiger Stelle im Dashboard
- Rover-Position pro Ort holen:
  - Perseverance-Wegpunkte gibt es als JSON (Felder u. a. site, drive, sol, easting, northing, lon, lat): https://mars.nasa.gov/mmgis-maps/M20/Layers/json/M20_waypoints.json
  - Curiosity vermutlich analog: https://mars.nasa.gov/mmgis-maps/MSL/Layers/json/MSL_waypoints.json (TODO: prüfen, ob es die Datei gibt)
  - Fallback: Analyst's Notebook (Karte nutzt PLACES-Positionsdaten)
- 128×128-m-Bereich als Rechteck um die Position ins Dashboard legen
- Optional: Drehung von Hand am HiRISE-Orthobild prüfen (Butte-Kanten im Mesh vs. Orthobild)
- ±10 m Genauigkeit reicht, Orbitallayer sind eh gröber

Risiko 2: 833-MB-DTM
- TODO zuerst: Deckt das DTM alle 4 Orte ab? (Murray Buttes ↔ Landestelle mehrere km auseinander) → falls nicht: gröberes Modell (CTX-DEM / MOLA) für den Ort, ehrlich als niedrigere Auflösung kennzeichnen
- GDAL-Pipeline, einmal offline:
  - gdalwarp -te … → Ausschnitt pro Ort (z. B. 3×3 km)
  - gdaldem slope → Steigungsraster vorberechnen
  - Export als Float32-Binary oder 16-bit-PNG + kleine JSON (Ausdehnung, Auflösung, Höhenbereich)
- Ergebnis: wenige MB pro Ort, A* läuft direkt auf dem Steigungsraster
- Kann eine Person parallel erledigen

Risiko 3: Steigungslimit Anzug
- Quelle: NASA xEMU Concept of Operations (Artemis, EVA-EXP-0075): Gehen auf/ab/quer am Hang bis 20°, Strecken bis 2 km vom Lander; Apollo 15 ging auf Hängen von ca. 17°
  - https://www.nasa.gov/wp-content/uploads/2020/01/topic_1-_eva_lunar_surface_concept_of_operations.pdf
- Unser Modell:
  - Harte Grenze 20° (mit Quelle, aber als Mond-Anforderung kennzeichnen; Mars-Schwerkraft gut 2× Mond → eher optimistisch)
  - Weiche Kosten ab ca. 10°, quadratisch steigend bis 20°
  - Mit Last sinkt die Grenze, z. B. auf 15° → unsere Annahme, so beschriften
- Pitch-Argument für Funklöcher: NASA-Präsentation zur Mond-EVA-Planung nennt als operative Grenzwerte u. a. max. sichere Steigung, max. Zeit ohne Sichtverbindung zum Lander, Grenzwerte für Verbrauchsgüter → unser Highlight bildet einen echten NASA-Planungsparameter ab
  - https://ntrs.nasa.gov/api/citations/20250006988/downloads/ASCEND%20presentation%20-%20Planning%20Lunar%20EVAs.pdf


### Platzhalter-Prinzip
Nichts soll einfach reingeworfen wirken. Jeder Platzhalter bekommt im UI ein Label „Simuliert“ + im Info-Panel 1–2 Sätze: woher die Daten kämen + wie sie verarbeitet würden.

- Wetter: Simulierte Vorhersage. In der Mission würden Orbiterdaten (Staub/Wolken) mit vorab aufgestellten Wetterstationen im Einsatzgebiet kombiniert (ähnlich REMS auf Curiosity), um ein lokales Zeitfenster für den EVA vorherzusagen.
- Weltraumwetter: Simulierte Warnung. Sonnenteilchen-Ereignisse würden von Sonnenbeobachtungssatelliten früh erkannt, Ankunftszeit am Mars vorhergesagt und mit Strahlungsmessungen am Boden (wie RAD) abgeglichen.
- Sauerstoff/Energie: Vereinfachtes Modell, Verbrauch abhängig von Steigung, Untergrund und Last. Real kämen die Werte live aus den Anzugsensoren.
- Funk: Berechnet aus dem Geländemodell (Sichtlinie zum Rover). Ein reales System würde zusätzlich Relais-Satelliten und deren Überflugzeiten einbeziehen.
→ Zeigt der Jury, dass wir zwischen echten Daten, Modellen und Simulation unterscheiden

- was ist mit Sandstürmen und anderen Problemen/Issues die wir auf dem Mars haben, aber nicht hier lokal? 
- Wie könnten wir es möglichst cool machen? Ich dachte an vlt web assembly mit literly graphic effecten, licht simlation, tag/Nacht simulation, usw...
- loading screen wichtig, es sollte klar sein hey, das braucht einen Moment...
- für die Erde gibt es hier und da simulationen/Modelle im sinne von wie verändert sich das environment wenn man z. B. einne baum an position x pflanzt usw. usw... vlt gibt es solche Sachen auch für den Mars? Könnte adapted werden?
- Es sollte web based sein + deployed + bereits reachable via qr code. 
- was ebenfalls relevant ist, sind dashboard bestandteile, die Grundlegende Idee ist natürlich der Routen Planer, aber mal sehen was man noch machen könnte...





Access mars visualisierung
https://experiments.withgoogle.com/access-mars


### Konsistenz-Check (Stand nach User Story)
- Ortswahl (User Story Schritt 2) und Ground-Control-Anfragen zusammenführen: Ortswahl = Auswahl einer Forschungsanfrage. Jede Anfrage gehört zu genau einem 3D-Ort → User wählt "Was soll erforscht werden?", der Ort folgt daraus
- Routenlogik Zeile "drei Boxwork-Aufschlüsse" passt nicht: an keinem unserer 4 Orte gibt es Boxwork → durch die Ziele unten ersetzen
- Spaziergang-Route (Schritt 5) auf dem Access-Mars-Mesh berechnen, nicht auf dem HiRISE-DTM: Mesh auf ein Raster sampeln (z. B. 0,5 m) → Steigung daraus. Sonst passen 2D-Plan und HUD-Warnungen im 3D nicht zusammen
- HiRISE-DTM wird damit vor allem für die Rover-Route (Schritt 4) gebraucht → Risiko 2 (Abdeckung aller Orte) betrifft genau diesen Schritt
- Live Site steht in der User Story noch als Option, im Storyline-Punkt als "weglassen" → entscheiden


### Forschungsanfragen pro Ort (Ground Control)
Format: Ziel / warum dort / Ausrüstung / Gefahr vor Ort
TODO: Prüfen, welche der genannten Stellen tatsächlich im 128×128-m-Detailbereich liegen

Murray Buttes (Hauptort)
- Ziel: Kreuzschichtung im Stimson-Sandstein vermessen → Windrichtung und Form alter Dünen rekonstruieren; Probe am Fuß eines Buttes
- Warum dort: Buttes = Erosionsreste von windabgelagertem Sandstein über dem Murray-Tonstein; Curiosity war dort ca. Sol 1383–1455 (2016) und hat am Fuß von "Murray Butte 12" gebohrt (Ziel "Quela")
- Ausrüstung: Kamera mit Maßstab, Kompass/Neigungsmesser, Probenbohrer
- Gefahr: am Butte-Fuß liegen abgestürzte Blöcke → Hindernisse/Steinschlagzone, Buttes blockieren Funk-Sichtlinie
- Quellen: https://science.nasa.gov/blog/sols-1456-1458-settling-in-at-quela/ , https://svs.gsfc.nasa.gov/30812

Marias Pass
- Ziel: Hochsilika-Gestein beproben + Kontakt Murray-Tonstein / Stimson-Sandstein dokumentieren
- Warum dort: Curiosity fand hier ungewöhnlich hohe Silika-Werte; Bohrprobe "Buckskin" enthielt Tridymit (auf der Erde v. a. aus Vulkanen bekannt, Herkunft auf dem Mars ungeklärt). Hohe Silika-Gehalte setzen viel Wasser voraus
- Ausrüstung: tragbares Spektrometer (Chemie vor Ort), Probenbohrer, Probenbehälter
- Gefahr: Anstieg zum Pass → Steigung
- Quellen: https://www.jpl.nasa.gov/news/rocks-rich-in-silica-present-puzzles-for-mars-rover-team/

Pahrump Hills
- Ziel: Profil durch die Schichten von unten nach oben beproben (ca. 12 m mächtiger Abschnitt) → wie sich das Wasser im alten See verändert hat
- Warum dort: Basis von Mount Sharp, Murray-Formation; Curiosity hat hier 3 Proben gebohrt (Confidence Hills, Mojave 2, Telegraph Peak), Jarosit deutet auf saures Wasser hin
- Ausrüstung: Probenbohrer mit niedriger Schlagstärke (Gestein ist brüchig, Curiosity musste dafür extra sanfter bohren)
- Passt gut zum Routing: Probenpunkte liegen übereinander → Route mit Höhengewinn
- Quellen: https://ntrs.nasa.gov/citations/20150006016 , https://www.jpl.nasa.gov/news/nasas-curiosity-analyzing-sample-of-martian-mountain/

Landing Site (Bradbury Landing)
- Ziel: alte Flussablagerungen untersuchen → Korngröße und Rundung der Kiesel ergeben Tiefe und Geschwindigkeit des früheren Flusses
- Warum dort: Konglomerat "Goulburn" direkt an der Landestelle, "Link" und "Hottah" ca. 50 und 100 m südöstlich; erste Flussbett-Kiesel, die auf dem Mars gefunden wurden
- Ausrüstung: Kamera mit Maßstab, Probenbeutel
- Zusatzauftrag: Wetterstation aufstellen → verknüpft mit Platzhalter "Wetter" (Sensorstationen im Einsatzgebiet)
- Quelle: https://www.jpl.nasa.gov/news/pebbly-rocks-testify-to-old-streambed-on-mars/


### Reserve-Modell (Highlight)
- Startwert: EVA-Dauer 8 h (xEMU ConOps: 6±2 h) → Anteil davon für den Spaziergang, Rest für Fahrt + Puffer
- Verbrauch pro Wegabschnitt = Basisverbrauch × Faktor Steigung × Faktor Untergrund × Faktor Last
  - Faktoren sind unsere Annahmen → so beschriften (Platzhalter-Prinzip: "Vereinfachtes Modell")
- Umkehrpunkt: sobald Reserve < Kosten des Rückwegs × Sicherheitsfaktor (z. B. 1,5) → HUD "Umkehren in X m"
- Rückweg wird richtungsabhängig berechnet (bergab ≠ bergauf)
- Walkback-Regel für die Rover-Route: Fällt der Rover aus, muss der Rückweg zur Basis zu Fuß machbar sein. NASA nimmt auf Basis der Apollo-Erfahrung 10 km als maximale Entfernung an (Lunar Walkback Test) → Basis höchstens 10 km vom 3D-Ort
  - Quelle: https://core.ac.uk/works/15254764


### Rover-Route (User Story Schritt 4)
- Eigene Grenzwerte, als Annahme beschriften (Steigung z. B. 15°, Sanddünen tabu)
- Bei Murray Buttes passt das gut: Curiosity fuhr durch einen sandfreien Streifen zwischen den Buttes und dem Dünenfeld → Dünen sind dort echtes Hindernis
  - Quelle: https://www.planetary.org/articles/09181704-curiosity-update-sols-1073-1107
- Dünen erkennen: aus HiRISE-Orthobild (manuell eingezeichnet reicht) oder THEMIS (niedrige Thermal Inertia = lockerer Sand)
- Stats für Routen-Übersicht: Fahrstrecke, Fahrzeit, Energie, Walkback-Distanz


### HUD-Elemente
- Normalmodus: Pfeile auf dem Gelände, Distanz zum nächsten POI, kleine Reserve-Anzeige, Funk-Status
- Warnmodus (nur bei Bedarf): steile Passage voraus, Funkschatten voraus (Länge in m), Umkehrpunkt erreicht, Pfad verlassen
- Am POI: echtes Rover-Foto der Stelle + Kurzinfo (Ziel aus der Forschungsanfrage, wonach suchen)
- Optional: Partner-Position + Sichtkontakt (Zweierteam), Customizer


### Priorisierung (fest / optional / Roadmap)
- fest: Forschungsanfrage wählen (= Ortswahl), Spaziergang-Route, Routen-Übersicht, 3D-Ansicht mit HUD, Reserve + Funklöcher
- fest, aber einfach: Rover-Route (wenige Wegpunkte, Grenzwerte)
- optional: Scroll-Animationen Start + Landung (aufwändig, siehe Abgabe), Live-Rerouting, nächster Ort
- Roadmap (nur Folie): HUD-Customizer, Zweierteam-Logik, Rover-Dimensionierung, echte Wetter-/Weltraumwetter-Feeds


### EVA-Steuerung
- WASD + Maus, Höhe über das Kollisionsmesh aus Access Mars (SIMPLE-Node im glb)
- Gehgeschwindigkeit an Steigung koppeln (bergauf langsamer) → macht die Steigung im Demo spürbar


### Sonnenstand (offener Punkt)
- Mars24 (NASA GISS): https://www.giss.nasa.gov/tools/mars24/
- Algorithmus: Allison & McEwen (2000), Doku: https://marstime.readthedocs.io/en/latest/marstime.html
- Fertige JS-Implementierung (BSD-Lizenz): https://github.com/ashima/pyMarsTime


### Abgabe Space Apps
- Pflicht: Projekt-Demo als Video (max. 30 s) oder Folien (max. 7 inkl. Titel), extern gehostet, öffentlich verlinkt
- Video: englische Untertitel; Folien: Englisch
- Muss zeigen, wie offene Daten der Raumfahrtagenturen das Projekt ermöglicht haben → Datenquellen sichtbar machen
- TODO: Guide 2026 prüfen (bisher nur Version von 2025 gefunden): https://www.spaceappschallenge.org/resources/project-submission-guide/
- Folge für uns: 30 s sind sehr kurz → Video-Storyboard früh planen; die Scroll-Animationen bekommen darin höchstens ein paar Sekunden




### AI USECASE
wahrscheinlich erhöht es die win chances wenn wir ki in unser Projekt einbauen. wir haben aber gerade noch keinen guten usecase gefunden. 
potentielle usecases:
- RAG in irgendeinem context: im hud kann man etwas angucken, und das rag fragen, welches basierend auf vorher extrahierten informationen antwortet. Beispiel: man guckt einen Fels an, gibt fragt sein hud, ob man mit seinen Anzug diesen schritt schafft. das hud misst nach, und benutzt ein rag, um Anzug Spezifizierungen zu lesen, und antwortet basierend auf den informationen aus beidem. 
