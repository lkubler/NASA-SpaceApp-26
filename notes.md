

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
