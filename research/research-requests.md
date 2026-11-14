# Research requests: real Curiosity science at Murray Buttes (researcher, Sat 14.11.)

Builds on `research/science.md`, `research/data-sites.md`, `research/data-science.md` (waypoints, POI table and RAD shielding are already there and are not repeated here).
Marks: **V** = I opened the source and read the text myself today. **S** = second-hand (search-result summary or a page quoted by another page), not opened.
Coordinates = rover waypoint from `MSL_waypoints.json` (lon E, lat), taken from `data-science.md` section 1. They give the rover position, not the target. Arm reach is about 1-2 m, Mastcam/ChemCam targets can be metres to tens of metres away.

## 1. What the buttes are (geology in one table)

| Fact | Source | Mark |
|---|---|---|
| Buttes and mesas are eroded remnants of a sandstone laid down by wind *after* lower Mount Sharp had formed. The layering is cross-bedding, meaning the sand was deposited by migrating dunes. The sandstone is the Stimson formation | PIA21043 caption, sol 1454, Mastcam, https://science.nasa.gov/resource/farewell-to-murray-buttes-image-3/ ; same text at https://svs.gsfc.nasa.gov/30812 | V |
| Below the buttes is the Murray formation: mudstone from mud at the bottom of ancient lakes, about 180 m thick, nearly half climbed by Oct 2016 | JPL release "NASA's Curiosity Rover Begins Next Mars Chapter", 3 Oct 2016, https://www.jpl.nasa.gov/news/nasas-curiosity-rover-begins-next-mars-chapter/ | V |
| Stimson lies **unconformably** on the lacustrine Murray; the contact "records a significant break in time". Dunes about 10 m high, net transport to the north-east | Banham et al. 2018, Sedimentology, doi 10.1111/sed.12469, abstract at https://www.usgs.gov/publications/ancient-martian-aeolian-processes-and-palaeomorphology-reconstructed-stimson-formation | V (abstract) |
| At Murray Buttes the Stimson records compound dunes: large draas with smaller dunes migrating over their lee slopes, complex wind regime, net transport north. Arid, in contrast to the humid lake time of the Murray | Banham et al. 2021, JGR Planets, doi 10.1029/2020JE006554, abstract at https://www.usgs.gov/publications/a-rock-record-complex-aeolian-bedforms-a-hesperian-desert-landscape-stimson-formation | V (abstract) |
| The contact is an **erosional unconformity** formed by wind erosion during a wet-to-dry climate change. "At the Murray Buttes ... the contact is interpreted to largely follow the base of the buttes." Mastcam mosaic of the buttes used: mcam07069, sol 1429 | Watkins et al. 2022, JGR Planets, doi 10.1029/2022JE007293, PDF https://lamb.caltech.edu/documents/22311/JGR_Planets_-_2022_-_Watkins_-_Burial_and_Exhumation_of_Sedimentary_Rocks_Revealed_by_the_Base_Stimson_Erosional.pdf | V (abstract, key points, section 3.1) |
| Why the route went through the buttes: a relatively sand-free path past the Bagnold dune field | Planetary Society, sols 1373-1427, https://www.planetary.org/articles/08111530-curiosity-update-sols-1373-1427 | V |

## 2. Named targets and features (sols 1405-1474)

| Target | Sol(s) | Rover waypoint | Instrument(s) | What it was meant to find out | Image / update URL | Mark |
|---|---|---|---|---|---|---|
| Bimbe (blocky deposit seen from orbit) | 1405-1410 | 137.35567, -4.68518 (1405) | ChemCam, Mastcam, MAHLI, APXS | Origin of the blocky deposits seen from orbit; last chance to see one up close. Conglomerate or breccia (angular clasts) left open | https://www.planetary.org/articles/08111530-curiosity-update-sols-1373-1427 | V |
| Marimba (drill site 13) | arrived 1417, drill 1420 (short), 1422 (full), left 1427 | 137.35447, -4.68718 | Drill, MAHLI, ChemCam (LIBS across the hole, depth profile), Mastcam multispectral, CheMin, later SAM (sol 1456) | "characterize the composition of the Murray mudstone" and use the shallow hole "to assess variations in chemistry with depth" | NASA blog sol 1421 (L. Edgar) https://science.nasa.gov/blog/sol-1421-determining-drill-activities-at-marimba ; sol 1420 (K. Herkenhoff) https://science.nasa.gov/blog/sol-1420-drilling-marimba/ | V |
| Cabinda, Epukiro | 1421 | same as Marimba | ChemCam | Cabinda: alternative drill site; Epukiro: a vein | sol 1421 blog above | V |
| Entrance panorama | 1421 (Planetary Society also lists a 1419 panorama) | same as Marimba | Mastcam 360 | Geologic context for the drill site and the buttes ahead | sol 1421 blog above | V |
| Butte "M9a" | 1 Sept 2016 (about sol 1446, my date-to-sol estimate) | ~137.35300, -4.69305 (wp 1446) | Mastcam | Scenic/context: butte top about 16 ft (5 m) above the rover, about 82 ft (25 m) to the ESE. Date falls inside the Access Mars scene dates (Sep 1-4 2016) | PIA20843 caption in the JPL release above | V (caption); sol is my estimate |
| Stimson cross-bedding view | 1454 | 137.35314, -4.69539 | Mastcam | Cross-bedding = wind-blown dunes | PIA21042 https://science.nasa.gov/resource/farewell-to-murray-buttes-image-2/ , PIA21043 (link in section 1) | V |
| Karasburg (Murray/Stimson contact) | 1454, 1462, 1468; given up 1470-1472 | near Quela, ~137.3530, -4.6952 | Mastcam mosaics | Contact science on the Murray/Stimson contact. Abandoned: "covered in sand and not very steep" | https://www.planetary.org/articles/10131553-curiosity-update-sols-1428-1488 | V |
| Quela (drill site 14), at the base of a butte | arrived 1455, drill fault 1461, hole 1464 (18 Sept 2016), sample processing 1465-1466, left 1468 | 137.3530064, -4.69520223 | DRT, MAHLI, APXS (1457), ChemCam (hole wall, Humpata), Drill, CHIMRA, CheMin | NASA posts give no specific goal beyond routine Murray sampling ("sampling the upper Murray Formation at 25 m intervals", Bristow 2017). Lakdawalla speculates the butte-base site tests "if SAM could tell the difference between exposure age and rock age" (blogger's guess, not a team statement) | Blogs sol 1455 https://science.nasa.gov/blog/sol-1455-driving-to-quela , sols 1456-1458 https://science.nasa.gov/blog/sols-1456-1458-settling-in-at-quela/ , sol 1466 https://science.nasa.gov/blog/sol-1466-a-new-drill-hole ; Planetary Society 1428-1488 | V |
| Uutapi, Cuimba (Stimson blocks next to Quela) | 1458 | Quela | ChemCam, Mastcam | Chemistry of Stimson float blocks next to the Murray drill site | sols 1456-1458 blog | V |
| Butte shielding (RAD) | parked 9-21 Sept 2016 = Quela | Quela | RAD | 4 % drop in total dose, 7.5 % drop in neutral particles behind the butte; "now looking for other locations where RAD can repeat these kinds of measurements" | JPL 15 Nov 2021 https://www.jpl.nasa.gov/news/how-nasas-curiosity-rover-is-making-mars-safer-for-astronauts/ (Ehresmann et al. 2021, JGR Planets) | V |
| Kopong, Jwaneng, Munhango (cross-bedded Murray outcrop) | 1473-1476 | 137.35470, -4.69731 (1473) | MAHLI (grain size, cross-bedding), DRT, APXS, ChemCam, Mastcam | Contact science after Karasburg failed | Planetary Society 1428-1488 | V |
| "Murray Butte number 12" (name for the Quela butte) | -- | -- | -- | Name found only in Universe Today; no NASA page I opened uses it (JPL names one butte "M9a") | https://www.universetoday.com/articles/drilling-at-unfathomable-alien-landscapes-all-in-a-days-work-for-curiosity | S |

## 3. Published results and what stayed open

| Result | Source | Mark |
|---|---|---|
| Marimba, Quela (and Sebina, just after the buttes) come from a ~30 m package of finely laminated lake mudstone. Clay ~15-25 wt %, plus plagioclase, **hematite**, Ca-sulfates, amorphous; mafic minerals < 5 wt % | Bristow et al., "Surveying clay mineral diversity in the Murray formation", LPSC 2017, https://ntrs.nasa.gov/api/citations/20170001744/downloads/20170001744.pdf | V |
| Clays are **dioctahedral smectite, not seen before in Gale** (Yellowknife Bay had trioctahedral). Fits stronger water alteration and oxidation upward: magnetite to hematite, more Ca-sulfate | same | V |
| SAM on Marimba: water release at 610 and 780 °C, which is too hot for plain nontronite, so a mix of di- and trioctahedral smectites | same | V |
| Final paper: Bristow et al. 2018, Science Advances 4(6) eaar3330 | cited in later papers (search) | S |
| Stimson = arid dune field long after the lake; erosional unconformity | Banham 2018/2021, Watkins 2022 (section 1) | V (abstracts) |
| Butte cuts dose by 4 % (7.5 % neutrals) | JPL 2021 | V |

**Open (sourced):**
- Which clay exactly: CheMin's dry cell cannot separate smectite from illite; illite is "possibly present ... a few wt % at most" (Bristow 2017, V). "Future work is needed to unravel the influence of global and local controls" (same, V).
- Why the Marimba hole was different (the first attempt stopped short, harder rock was one option); cause of the drill short (Planetary Society 1373-1427, V).
- Bimbe: conglomerate or breccia, and its origin (Planetary Society 1373-1427, V). No published answer found by me.
- Karasburg contact never examined up close (sand-covered) (Planetary Society 1428-1488, V).
- Whether the lake record continues: "The more vertical thickness we see, the longer the lakes were present" (Vasavada, JPL Oct 2016, V).
- Where the water came from: "A lingering question surrounds the original source of the water" (JPL 8 Oct 2015, https://www.jpl.nasa.gov/news/nasas-curiosity-rover-team-confirms-ancient-lakes-on-mars/ , V).
- Radiation: repeat shielding measurements at other spots (JPL 2021, V).

## 4. The other three sites (main question)

| Site | Main science question | Source | Mark |
|---|---|---|---|
| Bradbury landing site (sols 0-~40; Hottah, Link, Goulburn) | Did water flow here? Rounded gravel in Hottah and Link (sand grain to golf ball) showed an ancient streambed: water about 3 ft/s (~1 m/s), ankle to hip deep. Goulburn = rocks blasted clean by the descent engines | JPL 27 Sept 2012, https://www.jpl.nasa.gov/news/nasa-rover-finds-old-streambed-on-martian-surface/ | V |
| Pahrump Hills (Sept 2014 - Mar 2015; Confidence Hills, Mojave 2, Telegraph Peak) | Is the base of Mount Sharp (Murray formation) a lake deposit, and how was the mountain built? First Mount Sharp drill at Confidence Hills, done after a field-geologist-style walkabout. Confidence Hills had much more hematite than earlier samples (S). Team result in 2015: finely laminated mudstones = long-lived lakes | PIA19039 https://www.jpl.nasa.gov/images/pia19039-mars-rover-curiositys-walkabout-at-pahrump-hills/ (V); JPL 8 Oct 2015 (link above, V); hematite: https://www.jpl.nasa.gov/news/nasa-rover-drill-pulls-first-taste-from-mars-mountain/ (S) | V / S |
| Marias Pass (May-Aug 2015; Buckskin drill) | Why are the rocks here so high in silica and hydrogen? The site was chosen for the contact of pale mudstone under darker sandstone (Murray/Stimson). Buckskin (74 wt % SiO2) held tridymite, a high-temperature mineral, inside lake mudstone; volcanic source debated | JPL 19 Aug 2015, https://www.jpl.nasa.gov/news/nasa-mars-rover-moves-onward-after-marias-pass-studies/ (V); tridymite: https://www.jpl.nasa.gov/news/nasa-scientists-discover-unexpected-mineral-on-mars/ and NTRS 20160003878 (S) | V / S |

## 5. Candidate research requests for Murray Buttes

**The wording is mine (researcher agent). The science, targets and open questions are sourced (see the cited rows above).**

1. **Marimba** (137.35447, -4.68718; sols 1417-1427): "Bring back a fresh, sealed sample of the laminated Murray mudstone at Marimba so we can finally tell which clay is in it: CheMin could not separate smectite from illite, and SAM's water release points to a mix." Source: Bristow 2017 (V), sol 1421 blog (V).
2. **Karasburg / butte base near Quela** (~137.3530, -4.6952; sols 1454-1472): "Walk to the base of the butte where Curiosity tried and failed to reach the Murray/Stimson contact at Karasburg, and document the erosional surface where the lake record ends and the desert begins." Source: Planetary Society 1428-1488 (V), Watkins 2022 (V).
3. **Stimson cross-bedding on the butte flanks** (sol 1454 view, PIA21042/21043): "Measure the dip direction of the cross-beds in the butte sandstone up close, to test the north-moving draa-and-dune pattern that has so far been read only from Mastcam images." Source: PIA21043 (V), Banham 2021 (V abstract).
4. **Quela, foot of the butte** (137.35301, -4.69520; sols 1455-1468): "Set up a radiation monitor at Quela against the butte and a second one on open ground, to repeat the 4 % (7.5 % neutron) shielding drop Curiosity measured there in September 2016." Source: JPL 2021 (V).
5. **Bimbe** (137.35567, -4.68518; sols 1405-1410), optional: "Sample the blocky Bimbe deposit and tell us whether it is a conglomerate or a breccia, and where its mixed blocks came from." Source: Planetary Society 1373-1427 (V). Caveat: Bimbe's waypoint lies ~0.6 km NNW of Quela (my arithmetic), outside the 128 m Access Mars scene.

## Not verified
- Bristow et al. 2018 Science Advances full text (only the 2017 LPSC abstract read).
- Ehresmann et al. 2021 paper itself (only the JPL release).
- "Murray Butte number 12" (only Universe Today, via search); exact sol of PIA20843 (M9a).
- Bimbe final interpretation; whether any paper resolved it.
- Per-target coordinates (only rover waypoints).
- Pahrump hematite and Marias tridymite details beyond the two JPL pages I opened.
