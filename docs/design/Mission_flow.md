# Mission Flow & UI – Spec Sheet (v5, final)

Verbindliche Beschreibung von Story, Ablauf und Screens. Bei Widerspruch zu notes.md gilt dieses Dokument.

## 0. Konventionen in diesem Dokument

- **`{name}` = Platzhalter.** Alles in geschweiften Klammern wird zur Laufzeit berechnet oder aus Daten geladen. Dieses Dokument enthält dafür absichtlich keine Beispielzahlen. Kein solcher Wert darf fest im Code stehen.
- **Feste Werte** stehen ausschließlich in Abschnitt 11 (Missionsregeln), jeweils mit Quelle oder als „Annahme“ gekennzeichnet.
- **Nichts ist vorberechnet.** Routen, Kosten, Funkabdeckung und Sperrflächen werden im Browser aus dem Geländeraster berechnet, sobald sich eine Eingabe ändert.
- **Keine erfundenen Orte.** Probenpunkte, Gefahrenpunkte und Fotos stammen aus echten Daten (Abschnitt 7). Fehlen Daten, bleibt die Stelle leer und ist als „keine Daten“ gekennzeichnet.

## 0a. Übergabe an die Umsetzung

- Reihenfolge: zuerst M-01 komplett durch alle sechs Phasen, dann Feinschliff, dann weitere Missionen.
- **Offene Punkte nicht selbst entscheiden und nichts erfinden.** Wo dieses Dokument „Offen“ oder „noch festzulegen“ sagt, einen klar benannten Konfigurationswert anlegen, im UI als `Annahme` kennzeichnen und die Frage ans Team zurückmelden.
- Offene Punkte derzeit: Lage der Basis (Abschnitt 4), Probenkandidaten für M-01 (Abschnitt 7), Arbeitsdauern, Gerätewerte und Kennwerte des Verbrauchsmodells (Abschnitt 11).
- Reihenfolge bei Zeitnot innerhalb von Phase 5: erst Navigation und Warnungen, dann Reserve-Prognose mit Tempo (Abschnitt 3a), dann Abbruch-Taste, zuletzt das auslösbare Ereignis.
- Fehlen echte Probenkandidaten, wird die Kandidatenliste leer mit „keine Daten“ angezeigt, nicht mit ausgedachten Punkten gefüllt.

## 1. Leitidee

Ein Astronaut in einer Mars-Basis bekommt eine Forschungsanfrage von der Erde, plant damit einen Außeneinsatz (EVA) und führt ihn in Ich-Perspektive mit Helm-HUD durch.

Der rote Faden: **Plan → Freigabe → Einsatz → Abgleich.** Was im Plan als Risiko markiert ist (zu steil, kein Funk, Umkehrpunkt), warnt später im HUD an genau derselben Stelle.

**Warum das Werkzeug im Anzug rechnen muss:** Bei Apollo haben Flugleiter auf der Erde die Rückweg-Grenzen während des Einsatzes von Hand nachgeführt. Auf dem Mars braucht ein Funksignal je nach Stellung ca. 3–22 Minuten pro Richtung, Echtzeit-Betreuung von der Erde ist unmöglich. Diese Rolle übernimmt das Werkzeug: Es rechnet Reserve, Rückweg und Regeln laufend selbst nach.

**Eine Mission, zwei Ansichten:** Planungs-Dashboard und Helm-HUD zeigen denselben Missionszustand. Das Dashboard ist zugleich die Ansicht für das Crewmitglied, das in der Basis bleibt und den Einsatz verfolgt.

**Zwei Datenwelten:** Umgebungsdaten vom Mars (Gelände, Funk, Sonne, Wetter, Strahlung) und Zustandsdaten des Astronauten (Verbrauchsgüter, Belastung, Traglast). Erst beide zusammen ergeben, ob ein Weg sicher ist. Details in Abschnitt 3a.

**Produktvision:** Das Werkzeug funktioniert überall auf dem Mars, wo ein hochaufgelöstes Geländemodell existiert. Die Demo zeigt eine Region (Gale-Krater) mit vier Beispielgebieten. Abgrenzung zu Mars Trek: Trek zeigt den ganzen Planeten, wir planen den einzelnen Einsatz im Meter-Maßstab.

## 2. Der Ablauf in 6 Phasen

| # | Phase | Ansicht | Der User entscheidet | Ergebnis |
|---|---|---|---|---|
| 1 | Basis | Regionalkarte + Eingangspanel | welche Forschungsanfrage | Mission gewählt |
| 2 | Anfahrt | dieselbe Karte, Route eingeblendet | nichts (nur prüfen) | Rover-Route + Kennzahlen |
| 3 | EVA-Planung | Karte der EVA-Zone | welcher Probenpunkt, wo die Infrastruktur steht | Fußroute + Missionskosten |
| 4 | Freigabe | Go/No-Go-Liste | Einsatz starten | Start nur wenn alles grün |
| 5 | Einsatz | Cutscene → Ich-Perspektive mit HUD | wohin er geht, wann er umkehrt | Probe genommen, Infrastruktur gesetzt, zurück am Rover |
| 6 | Auswertung | Debrief-Karte | nächste Mission | Plan vs. tatsächlich |

Feste Reihenfolge. Zurück geht immer (bis zum Start des Einsatzes), vorwärts nur wenn die Phase abgeschlossen ist. Eine Schrittleiste oben zeigt, wo man ist.

## 3. Grundregeln für das gesamte UI

- **Ein Screen, eine Hauptaktion** (ein primärer Button unten rechts im Seitenpanel).
- **Layout Phasen 1–4:** Karte links (ca. 70 %), Seitenpanel rechts (ca. 30 %). Das Panel wechselt den Inhalt, die Karte bleibt.
- **Zwei Kartenmaßstäbe:** Regionalkarte (Phasen 1–2) und EVA-Zone (Phasen 3–4). Der Wechsel ist ein animierter Zoom.
- **Datenherkunft sichtbar:** Jeder Wert und jeder Layer trägt ein Label `Echt` (NASA-Daten), `Modell` (von uns berechnet) oder `Simuliert` (Platzhalter-Feed). Klick zeigt 1–2 Sätze Erklärung + Quelle.
- **Farben mit fester Bedeutung:** Rot = gesperrt/harte Grenze, Orange = Warnung, Blau/Cyan = Route und Navigation, Grün = Freigabe.
- **Missionsregeln zentral** (Abschnitt 11), überall aus derselben Quelle gelesen: Planung, Freigabe, HUD.

## 3a. Astronautenzustand (interne Daten)

Die Challenge nennt nur Umgebungsdaten. Der Zustand von Anzug und Mensch entscheidet aber mit, ob ein Weg sicher ist. Er wird als eigener Datenstrom geführt, in der Demo als `Simuliert` gekennzeichnet (real kämen die Werte aus den Anzugsensoren; NASA nennt für Anzug-Displays u. a. Sauerstoffstand, Anzugdruck und Herzfrequenz).

**Geführte Größen**
- Verbrauchsgüter: Sauerstoff, Kühlwasser, Batterie, CO₂-Filter. Jede hat einen eigenen Füllstand.
- Belastung: Stoffwechselrate (Watt), daraus abgeleitet eine Herzfrequenz.
- Traglast (aus der Ausrüstung) und Gehtempo.

**Wirkungskette (wird jede Sekunde neu berechnet)**
```
Steigung + Untergrund + Traglast + Tempo → Stoffwechselrate
Stoffwechselrate → Verbrauch von Sauerstoff, Kühlwasser, Batterie
Verbrauch → Füllstände → Reserve bei Rückkehr
```

**Regeln daraus**
- **„Reserve“ ist immer das knappste Verbrauchsgut**, nicht nur Sauerstoff. Das UI nennt, welches gerade begrenzt (bei Apollo war es oft das Kühlwasser).
- **Prognose statt Füllstand:** Angezeigt wird „Reserve bei Rückkehr, wenn du so weitergehst“. Sie reagiert sofort auf Tempo, Steigung und Traglast.
- **Tempo ist eine Entscheidung des Users:** normal oder schnell (Taste). Schnell spart Zeit, erhöht aber den Verbrauch überproportional. Schwer beladen und schnell bergauf lässt die Prognose sichtbar fallen.
- **Das HUD berät, bevor es warnt:** z. B. „Tempo reduzieren: Reserve bei Rückkehr sonst {pct} %“.
- In der Planung (Phase 3) wird mit Normaltempo gerechnet. Die Auswertung (Phase 6) zeigt die Abweichung.

**Die Verbindung von Gelände und Astronaut muss man sehen, nicht nur ablesen:**
- Die geplante Route ist in Phase 3 **nach Belastung eingefärbt** (hell = leicht, kräftig = anstrengend). Man erkennt auf einen Blick, welcher Abschnitt die Reserve kostet.
- Dieselbe Einfärbung trägt der Pfad auf dem Boden im HUD.
- Wechselt der User Probenpunkt, Infrastruktur-Standort oder Tempo, ändern sich Einfärbung und Prognose gleichzeitig.
- Das Modell bleibt bewusst einfach (wenige Faktoren, alle in Abschnitt 11). Wichtig ist die sichtbare Wirkungskette, nicht physiologische Genauigkeit. Im UI als `Modell` gekennzeichnet.

Alle Kennwerte des Modells stehen in Abschnitt 11.

## 4. Phase 1 – Basis: Missionsübersicht

```
┌─ Basis ● ─ Anfahrt ○ ─ EVA-Planung ○ ─ Freigabe ○ ───────────┬──────────────────────────┐
│ Region: {region} ▾ · Sol {sol} · {ortszeit}     [Layer ▾]    │ EINGANG VON DER ERDE     │
│                                                              │ Signallaufzeit {min} min │
│   Regionalkarte (verschieben, zoomen)                        │ ┌──────────────────────┐ │
│                                                              │ │ {kennung} {ort}      │ │
│      ⌂ Basis                                                 │ │ {auftrag_kurz}       │ │
│                              ◎ {kennung}                     │ │ {km} km · {dauer} h  │ │
│                  ◎ {kennung}                                 │ └──────────────────────┘ │
│                                   ◎ {kennung}                │ ┌──────────────────────┐ │
│  ┌────────┐                                                  │ │ ...                  │ │
│  │ Globus │  Lage auf dem Mars (nur Anzeige)                 │ └──────────────────────┘ │
│  └────────┘                                                  │        [Mission ansehen] │
└──────────────────────────────────────────────────────────────┴──────────────────────────┘
```

- **Karte:** Region um die Basis (Krater + etwas Umland), kein frei bewegbarer ganzer Mars.
- **„Ganzer Mars“ wird an drei Stellen sichtbar, ohne eine globale Karte zu bauen:**
  1. *Einstieg:* Beim Laden zoomt die Ansicht einmal vom Mars-Globus in die Region (ca. 2 s, überspringbar).
  2. *Regionswahl:* Oben links steht „Region: Gale-Krater ▾“. Das Menü listet weitere Regionen als nicht wählbar mit dem Hinweis „Daten vorhanden, noch nicht aufbereitet“. Nur echte Orte mit Rover- oder Lander-Daten: Jezero (Perseverance), Gusev (Spirit), Meridiani Planum (Opportunity), Elysium Planitia (InSight).
  3. *Globus unten links:* zeigt die aktive Region hervorgehoben und die übrigen als blasse Punkte. Nur Anzeige, nicht bedienbar.
- **Hervorgehoben:** Basis (Haus-Symbol, beschriftet) und Missionsgebiete (Ring mit Kennung). Alles andere zurückhaltend.
- **Walkback-Kreis:** Ring mit 10 km Radius um die Basis, beschriftet „Rückweg zu Fuß möglich“. Gebiete außerhalb sind gesperrt.
- **Seitenpanel:** 1–3 Forschungsanfragen als Karten mit Zeitstempel (Funk Erde–Mars braucht je nach Stellung ca. 3–22 Minuten, deshalb kein Live-Chat).
- **Interaktion:** Klick auf Karte im Panel oder Ring auf der Karte wählt die Mission. „Mission ansehen“ → Phase 2.

**Aufbau einer Forschungsanfrage (immer zwei Teile):**
1. **Probe:** Was die Erde wissen will, bewusst offen formuliert (z. B. „eine Probe aus dem Sandstein am Fuß der Buttes“), nicht „geh zu Punkt X“. Welche Stellen infrage kommen, zeigt Phase 3.
2. **Infrastruktur:** Ein Gerät, das im Gebiet aufgestellt werden soll (Funk-Relais oder Solarpanel). Den Standort wählt der Astronaut.

| Kennung | Ort | Priorität |
|---|---|---|
| M-01 | Murray Buttes | Pflicht, vollständig spielbar |
| M-02 | Marias Pass | optional |
| M-03 | Pahrump Hills | optional |
| M-04 | Landing Site | optional |

Nicht fertige Missionen bleiben sichtbar, ausgegraut mit „In dieser Demo nicht verfügbar“.

**Offen – Lage der Basis:** Muss so liegen, dass alle Gebiete im 10-km-Kreis sind. Anhaltspunkt aus den Access-Mars-Daten: gefahrene Strecke ab Landestelle bis Pahrump Hills 9,7 km, Marias Pass 10,8 km, Murray Buttes 14,1 km (Fahrstrecke, nicht Luftlinie). Luftlinie aus den Curiosity-Wegpunkten bestimmen, dann Basis festlegen.

## 5. Phase 2 – Anfahrt: Rover-Route

```
┌─ Basis ✓ ─ Anfahrt ● ─ EVA-Planung ○ ─ Freigabe ○ ───────────┬──────────────────────────┐
│                                                              │ {kennung} {ort}          │
│      ⌂ Basis                                                 │ {auftrag: Probe}         │
│        ╲                                                     │ {auftrag: Infrastruktur} │
│         ╲___                 ▒▒ gesperrt (Dünen)             │                          │
│             ╲____                                            │ ANFAHRT          Modell  │
│                  ╲___________◎                               │ Strecke        {km} km   │
│                                                              │ Fahrzeit       {min} min │
│  ─── Höhenprofil der Route ────────────────                  │ Energie        {pct} %   │
│  ▁▂▂▃▅▅▄▃▃▂▂▃▄▆▆▅                                            │ Max. Steigung  {x}° / 20°│
│                                                              │ Rückweg zu Fuß {km}/10 km│
│                                                              │                          │
│                                                              │ AUSRÜSTUNG               │
│                                                              │ {gerät}        {kg} kg   │
│                                                              │ {gerät}        {kg} kg   │
│                                                              │ Traglast: {kg} kg        │
│                                                              │  [Weiter zur EVA-Planung]│
└──────────────────────────────────────────────────────────────┴──────────────────────────┘
```

- Die Route wird **automatisch** berechnet, sobald die Mission gewählt ist.
- **Rover-Grenzen:** Steigung 20° normal, 25° maximal, Hindernisse bis 30 cm, Dünen gesperrt (schraffiert).
- **Kennzahlen:** Strecke, Fahrzeit, Energie (Batterie in %), maximale Steigung gegen Grenzwert, Rückweg zu Fuß gegen 10 km.
- **Höhenprofil** unter der Karte; Hover markiert die Stelle auf der Karte.
- **Ausrüstung** folgt aus der Anfrage (Probenwerkzeug + Infrastrukturgerät). Die Traglast wirkt in Phase 3 auf Steigungslimit und Verbrauch.

## 6. Phase 3 – EVA-Planung im Missionsgebiet

```
┌─ Basis ✓ ─ Anfahrt ✓ ─ EVA-Planung ● ─ Freigabe ○ ───────────┬──────────────────────────┐
│ EVA-Zone {b} × {h} m       Layer: ☑Steigung ☑Funk ☑Gefahr ☐Sonne│ 1 PROBENPUNKT WÄHLEN    │
│ ┌──────────────────────────────────────────────────────────┐ │ ◉ {kandidat}   {zeit}    │
│ │ ░░░ zu steil ░░░        ◇ Kandidat                       │ │   Reserve {pct} % ✓      │
│ │ ░░░░░░░░░                                                │ │ ○ {kandidat}   {zeit}    │
│ │            ▓▓ kein Funk ▓▓                               │ │   Reserve {pct} % ✓      │
│ │   ◆ gewählt ───────────────── ✛ Infrastruktur            │ │ ○ {kandidat}   {zeit}    │
│ │    ╲            ⚠ {gefahr}       ◇ Kandidat              │ │   ohne Funk {min} ✗      │
│ │     ╲                                                    │ │                          │
│ │      ▣ Rover                                             │ │ 2 {INFRASTRUKTUR} SETZEN │
│ └──────────────────────────────────────────────────────────┘ │ Standort: {gültig/Grund} │
│  Außerhalb der Zone: abgedunkelt, nicht klickbar             │ Wirkung: {kennzahl}      │
│                                                              │                          │
│                                                              │ MISSIONSKOSTEN   Modell  │
│                                                              │ EVA-Zeit  ██████░ {t}/{T}│
│                                                              │ Reserve am Ende  {pct} % │
│                                                              │ Ohne Funk        {min}   │
│                                                              │ Max. Steigung {x}°/{lim}°│
│                                                              │        [Zur Freigabe]    │
└──────────────────────────────────────────────────────────────┴──────────────────────────┘
```

**Karte:** Draufsicht auf genau das 3D-Gelände, das später begangen wird (aus dem Access-Mars-Mesh gerendert). Außerhalb der EVA-Zone abgedunkelt und nicht klickbar.

**Layer:**
- *Zu steil für den Anzug:* rot schraffiert, harte Grenze. Hängt von der aktuellen Traglast ab.
- *Kein Funk:* orange gepunktet, Sichtlinie zum geparkten Rover (und zu einem gesetzten Relais).
- *Gefahrenpunkte:* Warnsymbol mit Beschriftung, nur aus echten Daten.
- *Sonne* (nur bei Solarpanel-Auftrag): Schattenwurf zur Einsatzzeit aus Sonnenstand + Gelände.

**Entscheidung 1 – Probenpunkt (genau einer):**
- Alle Stellen, an denen die gewünschte Probe genommen werden kann, sind als Kandidaten eingezeichnet. Quelle siehe Abschnitt 7.
- Ein EVA ist teuer, deshalb gibt es pro Einsatz nur **eine** Probe.
- Für **jeden** Kandidaten wird die Route berechnet. Die Liste im Panel zeigt pro Kandidat Zeit, Reserve und Regelverstöße und ist nach Kosten sortiert. Der günstigste ist markiert, der User entscheidet frei.
- Hover/Klick auf einen Kandidaten: echtes Rover-Foto + was dort gemessen wurde.

**Entscheidung 2 – Infrastruktur (frei platzierbar):**
- Der User klickt einen beliebigen Punkt in der EVA-Zone. Die Route wird sofort neu berechnet.
- Ungültige Standorte werden nicht gesetzt, sondern begründet („{x}° – Gerät braucht höchstens {y}°“).
- Der Standort hat eine sichtbare Wirkung:
  - **Funk-Relais:** Der Funk-Layer wird neu berechnet, Funkschatten schrumpfen. Kennzahl: Anteil der Zone mit Funk.
  - **Solarpanel:** Kennzahl Sonnenstunden pro Sol am Standort (aus dem Sonnen-Layer).
- Verschieben per Drag, alles aktualisiert sich live.

**Routenberechnung (dynamisch, nichts fest verdrahtet):**
- Start und Ende am Rover, dazwischen Probenpunkt und Infrastrukturpunkt. Das System wählt die günstigere Reihenfolge.
- Die Reihenfolge ist nicht egal: Solange das Infrastrukturgerät getragen wird, gilt das Steigungslimit mit Traglast (15°) und höherer Verbrauch, nach dem Absetzen 20°.
- Kostenfunktion: Zeit + Energie (Steigung, richtungsabhängig, Traglast), harte Grenzen als gesperrte Zellen, Funkschatten als Zusatzkosten.
- Optional: eigene Zwischenpunkte setzen.

**Missionskosten** (keine Geldbeträge): EVA-Zeit gegen Limit, Reserve bei Rückkehr (knappstes Verbrauchsgut, mit Namen), längste Zeit ohne Funk, maximale Steigung. Ein kleines Diagramm zeigt den erwarteten Verlauf der Verbrauchsgüter über die Route. Werte, die eine Regel verletzen, werden rot und nennen die Regel.

## 7. Datenquellen für Punkte im Missionsgebiet

Reihenfolge der Quellen. Was keine davon liefert, wird nicht angezeigt.

1. **Points of Interest aus Access Mars** (`public/index.html`, `poi-marker`-Einträge): Position bereits in Mesh-Koordinaten (Meter), mit Text und Foto (`public/img/cards/`). Vorhanden u. a.:
   - Marias Pass: Bohrziel „Buckskin“
   - Pahrump Hills: „Drill site“
   - Murray Buttes: vier Punkte, darunter „Interference“ (die Buttes blockieren zeitweise das Signal zwischen Curiosity und den Orbitern) → echte Begründung für den Funk-Layer
2. **Curiosity-Messziele aus dem PDS Analyst's Notebook** für die Tage, an denen das jeweilige Gelände fotografiert wurde (Murray Buttes: 1.–4. Sept. 2016; Marias Pass: 22. Mai – 6. Aug. 2015). Positionen müssen ins Mesh übertragen werden.
3. **Abgeleitet aus dem Gelände** (als `Modell` gekennzeichnet): Steigung, Funkschatten, Schatten.

**Offen – Probenkandidaten für M-01:** Das Murray-Buttes-Gelände stammt vom 1.–4. Sept. 2016. Die Bohrung „Quela“ fand später an anderer Stelle statt und liegt vermutlich nicht im Mesh. Kandidaten müssen deshalb aus den Messzielen dieser Tage kommen. Prüfen, wie viele es sind. Falls zu wenige: Marias Pass (mit „Buckskin“) als Pflichtmission erwägen.

## 8. Phase 4 – Freigabe (Go/No-Go)

Das Seitenpanel zeigt die Missionsregeln als Checkliste, die Karte bleibt sichtbar.

```
FREIGABE {kennung}
{✓/✗} Steigung auf der Route        {x}° ≤ {limit}°
{✓/✗} Reserve bei Rückkehr          {pct} % ≥ 20 %
{✓/✗} Längste Strecke ohne Funk     {t} ≤ {limit} min
{✓/✗} Rückweg zu Fuß zur Basis      {km} ≤ 10 km
{✓/✗} Auftrag vollständig           Probe ✓ · Infrastruktur ✓
{✓/✗} Wetterfenster                 {status}             Simuliert
{✓/✗} Strahlung                     {status}             Simuliert

                         [ Einsatz starten ]
```

- Jede Zeile: Regel, geplanter Wert, Grenzwert, Status.
- Bei Rot ist der Start-Button gesperrt. Klick auf die rote Zeile springt zur Ursache in der Planung.
- Dieselben Regeln warnen später im HUD.

## 9. Phase 5 – Einsatz

### 9a. Cutscene (max. 10 Sekunden, überspringbar)
Kameraflug über das Gelände entlang der Rover-Route, endet am Parkplatz. Briefing-Einblendung: Auftrag in einem Satz, die zwei wichtigsten Gefahren, wann Curiosity hier war, ein echtes Foto.

### 9b. Ich-Perspektive mit Helm-HUD

```
╭──────────────────────────────────────────────────────────────────────────────╮
│  (Helmrand, unscharf)                                                        │
│      ┌ Funk {stärke} ┐         ▲ {ziel} · {m} m           ┌ Reserve ───────┐ │
│      └───────────────┘                                    │ bei Rückkehr   │ │
│      ┌ Anzug ────────┐                                    │ ███████░ {pct}%│ │
│      │ O₂ {pct} H₂O {pct}│                                │ knapp: {gut}   │ │
│      │ Akku {pct}  ♥ {bpm}│                               │ Umkehr in {t}  │ │
│      │ Tempo {normal/schnell}│                            └────────────────┘ │
│      └───────────────┘                                                       │
│                  ┌───────────────────────────────────┐                       │
│                  │ ⚠ {warnung} in {m} m              │   ← nur bei Bedarf    │
│                  └───────────────────────────────────┘                       │
│                                                                              │
│                        › › ›  (Pfad auf dem Boden)                           │
│      ┌ Karte ┐                              ┌ Steigung {x}° / {limit}° ┐     │
│      └───────┘                              └──────────────────────────┘     │
╰──────────────────────────────────────────────────────────────────────────────╯
```

- **Dauerhaft (klein, am Rand):** Funkstatus, nächstes Ziel mit Richtung und Entfernung, Steigung gegen aktuelles Limit, Minikarte.
- **Anzug-Anzeige:** Füllstände der Verbrauchsgüter, Herzfrequenz, Tempo. Kompakt, wird nur bei Auffälligkeit hervorgehoben.
- **Reserve-Anzeige:** Prognose der Reserve bei Rückkehr, Name des knappsten Verbrauchsguts, Zeit bis zum Umkehrpunkt (Abschnitt 3a).
- **Tempo wechseln:** Taste für normal/schnell. Die Prognose reagiert sofort.
- **Im Gelände:** geplante Route als Linie/Pfeile auf dem Boden, Ziele als Marker, zu steile Flächen im Blickfeld rot eingefärbt.
- **Warnungen (Mitte, eine zur Zeit, nach Dringlichkeit):** steile Passage voraus, Funkschatten voraus, Pfad verlassen, Verbrauch zu hoch (mit Rat), Umkehrpunkt erreicht, Rand der EVA-Zone.
- **Abbruch jederzeit:** Eine Taste zeigt den schnellsten sicheren Rückweg zum Rover und schaltet die Navigation darauf um. Der Rückweg wird laufend mitgerechnet, nicht erst beim Drücken.
- **Ein auslösbares Ereignis für die Demo** (Taste für den Vorführenden, im UI als `Simuliert` gekennzeichnet): z. B. Staubsturm-Vorwarnung oder Störung im Kühlkreislauf. Das Werkzeug rechnet neu und empfiehlt „Auftrag fortsetzen“ oder „Abbruch“, mit Begründung in einem Satz.
- **Am Probenpunkt:** „E: Probe nehmen“, kurzer Zeitraffer, Missionszeit springt um die Arbeitsdauer weiter, dazu das Rover-Foto.
- **Am Infrastrukturpunkt:** „E: {gerät} aufstellen“. Danach sinkt die Traglast, das Steigungslimit im HUD springt auf 20°, bei einem Relais verbessert sich die Funkanzeige sichtbar.
- **Pfad verlassen:** Warnung, nach 3 s neue Route von der aktuellen Position.
- **Rand der EVA-Zone:** Warnung „Missionsgrenze – außerhalb keine geprüfte Route“, Bewegung wird gebremst und gestoppt.
- **Zeitraffer beim Gehen** (Faktor siehe Abschnitt 11), klein im HUD angezeigt.
- **Ende:** Zurück am Rover „E: Einsatz beenden“ → Phase 6.
- Ebenen: 3D-Szene → HUD → Helm-Overlay.

## 10. Phase 6 – Auswertung

| | Geplant | Tatsächlich |
|---|---|---|
| Auftrag | Probe + {gerät} | {erfüllt/offen} |
| Strecke zu Fuß | {m} m | {m} m |
| EVA-Zeit | {t} | {t} |
| Reserve bei Rückkehr | {pct} % | {pct} % |
| Zeit ohne Funk | {t} | {t} |
| Warnungen | – | {anzahl} ({liste}) |

Zusätzlich eine Zeile „Verbrauch“: geplant gegen tatsächlich je Verbrauchsgut, und wie lange im schnellen Tempo gegangen wurde.

**Bericht an die Erde:** Der Einsatz endet mit einer kurzen Rückmeldung an die anfragende Stelle: Probe mit Ort, Zeit und Foto, Standort der Infrastruktur, Auffälligkeiten. Damit schließt sich der Kreis zur Forschungsanfrage. Button „Bericht senden“ (Signallaufzeit wird angezeigt).

Darunter die Draufsicht mit geplanter und tatsächlich gegangener Route. „Zurück zur Basis“ → Phase 1, Mission als erledigt markiert, gesetzte Infrastruktur bleibt auf der Regionalkarte sichtbar.

## 11. Missionsregeln (einzige Stelle mit festen Werten)

| Regel | Wert | Art | Quelle |
|---|---|---|---|
| Anzug: max. Steigung | 20° | Echt (Mond) | xEMU ConOps EVA-EXP-0075 |
| Anzug: max. Steigung mit Traglast | 15° | **Annahme** | – |
| Rover: max. Steigung | 20° normal, 25° max. | Echt (Mond) | Apollo LRV, NTRS 20250011301 |
| Rover: Hindernisse | bis 30 cm | Echt (Mond) | Apollo LRV |
| Rückweg zu Fuß zur Basis | max. 10 km | Echt (Mond) | Walkback Test, SAE 2007-01-3133 |
| Reserve bei Rückkehr | mind. 20 % | Echt (Apollo) | Apollo-Walkback-Puffer |
| EVA-Dauer | 6 h (max. 8 h) | Echt (Mond) | xEMU ConOps |
| Gehtempo in der Ebene | 2 km/h | Echt (Mond) | xEVA ConOps EVA-EXP-0042 |
| Längste Zeit ohne Funk | 2 min, einstellbar | **Annahme** | NASA nennt den Parameter, keinen Wert |
| Stoffwechselrate Gehen | ca. 350 W (1200 BTU/h bei 3,3 km/h) | Echt (Apollo, Mond) | Apollo-EVA-Planung, ALSJ 19790073512 |
| Stoffwechselrate Arbeit am Ziel | ca. 310 W (1050 BTU/h) | Echt (Apollo, Mond) | wie oben |
| Stoffwechselrate Rover-Fahrt | ca. 205 W (700 BTU/h) | Echt (Apollo, Mond) | wie oben |
| Stoffwechselrate Notfall-Rückweg | ca. 420 W (1440 BTU/h) | Echt (Apollo, Mond) | wie oben |
| Zuschläge für Steigung, Traglast, schnelles Tempo | noch festzulegen | **Annahme** | – |
| Vorräte je Verbrauchsgut und Verbrauch pro Watt | noch festzulegen | **Annahme** | – |
| Zeitraffer beim Gehen | 1 s = 20 s | **Annahme** (Demo) | – |
| Arbeitsdauer Probe / Aufstellen | noch festzulegen | **Annahme** | – |
| Gerätegewichte, Standortgrenzen Infrastruktur | noch festzulegen | **Annahme** | – |

Mond-Werte sind im UI als „Mond-Referenz, für Mars übernommen“ gekennzeichnet.

## 12. Der Demo-Pfad

Für das 30-Sekunden-Video wird eine feste **Eingabefolge** verwendet. Die Ergebnisse werden dabei live berechnet, nicht abgespielt.

1. Basis: M-01 wählen
2. Anfahrt: Route und Kennzahlen erscheinen
3. EVA-Planung: Probenkandidaten vergleichen, einen wählen; Relais setzen, Funkschatten schrumpft sichtbar
4. Freigabe: alles grün, Start
5. Cutscene (gekürzt)
6. EVA: loslaufen, kurz ins schnelle Tempo (Prognose fällt, HUD rät), eine Warnung, Probe nehmen
7. Auswertung

Ein Szenario eignet sich, wenn mindestens ein Kandidat ohne Relais gegen die Funkregel verstößt und mit Relais freigegeben wird. Das zeigt alle Kernfunktionen in einem Zug.

## 13. Nicht Teil dieses Flows

- Flug Erde → Mars, Landung
- frei bewegbare Karte des ganzen Mars
- Verlassen der EVA-Zone, Fahren des Rovers in Ich-Perspektive
- mehrere Proben pro Einsatz
- Zweierteam, HUD-Customizer, echte Wetter-Feeds (Roadmap)

## 14. Roadmap (nur erklären, nicht bauen)

Jeder Punkt bekommt in der Präsentation ein bis zwei Sätze, wie er umgesetzt würde.

- **Ortung ohne GPS:** Auf dem Mars gibt es kein Satellitennavigationssystem. Position aus Kamerabild und Geländeabgleich, gestützt durch Rover und Relais als Funkbaken. In der Demo ist die Position exakt (`Simuliert`).
- **Zweierteam:** EVAs finden zu zweit statt. Sichtverbindung und Abstand zum Partner als weitere Regel, gegenseitige Rettung im Abbruchplan.
- **Tageszeit und Licht:** Tiefstehende Sonne lässt Hänge steiler wirken und verdeckt Hindernisse im Schatten. Einsatzfenster nach Sonnenstand und Bodentemperatur wählen.
- **Staub:** Sichtweite und Staubbelastung aus Atmosphärendaten als Layer und Regel.
- **Persönliches Verbrauchsprofil:** Die Abweichung „geplant gegen tatsächlich“ aus jeder Auswertung verbessert das Modell für den nächsten Einsatz dieser Person.
- **Sprachbedienung:** Mit Handschuhen sind Tasten unpraktisch; Bedienung per Sprache und Blick.
- **Echte Feeds:** Wetterstationen, Orbiter und Sonnenbeobachtung statt simulierter Werte.

## 15. Kernaussagen für den Pitch (für das Team, nicht für die Umsetzung)

1. **Die Lücke:** Mars Trek zeigt den Planeten. Wir planen den einzelnen Einsatz im Meter-Maßstab.
2. **Die Notwendigkeit:** Bei Apollo rechneten Flugleiter auf der Erde die Rückweg-Grenzen live nach. Zum Mars braucht ein Signal Minuten. Der Anzug muss selbst rechnen.
3. **Der Unterschied:** Wir verbinden Marsdaten mit dem Zustand des Astronauten. Die Frage ist nicht „wie steil ist der Hang“, sondern „komme ich mit dieser Last in diesem Tempo sicher zurück“.
4. **Der Beweis:** Nichts ist vorberechnet. Jede Änderung an Probenpunkt, Standort oder Tempo rechnet Route, Funkabdeckung und Reserve neu.
5. **Die Ehrlichkeit:** Jeder Wert ist als Echt, Modell oder Simuliert gekennzeichnet, mit Quelle.