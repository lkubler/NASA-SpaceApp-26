

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