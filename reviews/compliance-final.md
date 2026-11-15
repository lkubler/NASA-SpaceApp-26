# Compliance check, final (reviews/compliance-final.md)

Checked: main at ff21b60 (app/ identical to e61d88e, the HEAD when the check started; ff21b60 changed only docs/data-use.md and docs/ai-use.md). Phase FREEZE, Sun 15.11. about 10:45; local deadline Sun 15.11. 15:45.
Method: read rules-2026.md, CLAUDE.md, values.js, sources.js, labels, datalines, grep over app/src and app/public, WebFetch and pdftotext of the three PDFs, headless Chrome on a read-only static build (app/dist) for the Go page, the Sources page and intro film frames, contact sheet of the photos. Did not run scripts/journey.mjs (it writes to reviews/journey). Nothing else edited.

Summary: no confirmed item blocks submission under docs/rules-2026.md. Four items could not be verified and would block if found (see Could not verify). Human questions are at the end.

## Findings, most severe first (rule | where | what is wrong | severity)

1. Sources accuracy, unused file | app/public/data/murray/photos/quela_drill.jpg; app/src/core/sources.js:149 | The file ships but nothing in app/src loads it (no reference to quela, photoId or 5-debrief). sources.js:149 says the Quela drill hole is shown in the report; that is not true. The same entry's 'raw frames ... with their file ids' describes only this file. Remove the file and the claim, or wire it up (team decision). | should fix
2. Labels (rule 1), Go profile callout | app/src/steps/3-go/index.js:52,57,61,67,72,76 and app/src/steps/3-go/profile.js:111-115 | Hovering a Go checklist row shows its 'at' text as plain text with values and no label chip. Verified in headless Chrome: 'Farthest in time from the rover: 2 h 37 to get back' (solar storm row). The other strings (steepest point, farthest from the rover, back at the rover after, turn-back point, longest radio shadow) follow the same code path. CLAUDE.md: label every value. | should fix
3. Labels (rule 1), relay height | app/src/steps/2-plan/extras.js:21 | The 3 m relay antenna (values.js:115, label assumption) is printed inside the contact tag, which is labelled model. The value carries the wrong label. Give it its own assumption tag, or label the sentence accordingly. | should fix
4. NASA in app prose (CLAUDE.md) | app/src/core/places.js:46 (look-at card text of Bruce Murray, point A3) | Own prose: 'director of NASA's Jet Propulsion Laboratory' and 'NASA's first missions to Mars'. Not a citation or credit line. Reword without NASA (for example JPL) or drop. | should fix
5. File name in visitor text | app/src/steps/2-plan/extras.js:19 | The label source title reads 'Curiosity waypoints (MSL_waypoints.json)' and is shown in the info popover on the Plan rover drive. Use the title without the file name. | should fix
6. Accuracy of cited source (OCHMO) | app/src/core/values.js:40-41; app/src/steps/3-go/labels.js:39; app/src/core/sources.js:47-48 | OCHMO-TB-020 Rev E (fetched PDF, text extracted with pdftotext) says protection is very high for EVAs if termination occurs within 2 hours with access to shielding, and it attaches that to real-time alert dosimetry. The app states it as a rule for any excursion without that condition. Add the real-time alert dosimetry condition to the label text. Value 2 h itself is confirmed. | should fix
7. Links for sources (rule: list all resources with links) | app/src/core/sources.js:92-95 (BANHAM), 96-99 (JPL_MARIAS), 108-111 (PIA19039) | Three documents shown with empty url. JPL_MARIAS page exists and verified: https://www.jpl.nasa.gov/news/nasa-mars-rover-moves-onward-after-marias-pass-studies/ (19 Aug 2015, says rocks unexpectedly high in silica). BANHAM: DOI https://doi.org/10.1029/2020JE006554 resolves to Wiley, which returned HTTP 403 to the fetch tool, so title and authors not confirmed; add the DOI link. PIA19039: the guessed science.nasa.gov URL returned 404; no verified URL exists yet. | should fix
8. Citation fit | app/src/core/sources.js:100-103 (JPL_MINERAL, tagged mission text: high-silica rock); app/src/steps/1-mission/requests.js:36-37 | The verified JPL page (22 Jun 2016) is about tridymite at the Buckskin site in Gale, not Marias Pass. The request text (Buckskin, 74 % silica) fits the page, but the 74 % figure was not checked. Point the Marias Pass request at JPL_MARIAS and keep JPL_MINERAL for Buckskin. | should fix
9. Citation fit | app/src/steps/1-mission/requests.js:53-58 (Pahrump text, Confidence Hills); app/src/core/sources.js:104-107 (JPL_LAKES) | The verified JPL lakes page (8 Oct 2015) mentions lake mudstone but not Pahrump Hills or Confidence Hills. The Confidence Hills statement has no verified source. | note
10. Name vs use | app/src/core/sources.js:133 | DATA name says 'HiRISE elevation model ... and orthoimage'; the orthoimage is not shipped or used (its own use text says so). Drop 'and orthoimage' from the name. | note
11. AI disclosure consistency | app/src/core/sources.js:240 and :250 vs docs/ai-use.md:33 | Sources page says the intro film was rendered by scripts an AI agent wrote. ai-use.md line 33 says the film is the team's kit and the kit README does not say which parts were AI. The claim rests on the team statement logged at ai-use.md line 56. Confirm with the team before submission. | note
12. Label of computed values | app/src/core/values.js:122-125 | airTempK is labelled real, but its 13 values are hour-bin means computed by us from REMS data (data-use.md row 11 says so). Label model, or say 'real, averaged by us'. | note
13. Dev states reachable on the public build | app/src/steps/2-plan/index.js:168 (?broken=1), app/src/steps/3-go/index.js:309, app/src/frame/devjump.js (?step=, ?spot=) | Test fixtures open by URL; the broken fixture shows 'Start with 1 broken rule'. Harmless if judges do not type URLs; drop from the linked build if possible. | note
14. Repo hygiene (not visitor-facing) | kek.md (untracked, German, repo root); reviews/preview/ (untracked); pitch.md (tracked; German team annotations, English script text) | None of these is in app/. Do not link pitch.md or kek.md from the project page; the submission materials must be English. | note
15. Process | HEAD during check | HEAD moved from e61d88e to ff21b60 during the check (docs only). app/dist was built at 10:36:55, before the e61d88e commit at 10:37:24; I browsed dist, I did not rebuild. | note
15b. Labels (rule 1), HiRISE limit | app/src/steps/3-go/index.js:248 (limit steeper than 20 deg) and the at the 20 deg limit note on the slope row | The 20 deg limit printed in the HiRISE row and the slope note carries no label chip; every other limit has one (checked on the Go screenshot). | note

### docs/data-use.md statements that no longer match the build (not fixed, owner updates in parallel)
16. docs/data-use.md row 8 | 'quela_drill.jpg (Debrief fallback, 5-debrief/index.js)' is listed as loaded. False: no code loads it (see finding 1). | should fix
17. docs/data-use.md Section 2, relay row | 'Relay antenna height 3 m | none': values.js:115 cites LSRM (section V) as the source. | note
18. docs/data-use.md Section 2 | HiRISE spacing (1 m, real) and HiRISE alignment (2 m, model) from values.js:126-129 are missing from the table. | note
19. docs/data-use.md Section 2, rover antenna row | 'LSRM: NASA Glenn lunar surface radio model, section V': the verified paper is a relay concept (Lunar Surface Relay-Mobile). The 2 m figure is confirmed; 'radio model', 'NASA Glenn' and section V were not checked. | note
20. docs/data-use.md row 1, Go / no-go text | Lists five rule lines. The solar storm time-to-shelter row (3-go/labels.js shelter, datalines.js timeToShelter) is a rule that also depends on the Access Mars grid. | note
21. docs/data-use.md row 10 | 'Go / no-go: radiation line': Go shows Radiation dose as a number tile (3-go/index.js:137), not a checklist line. | note
22. docs/data-use.md row 2, provider cell | Still names card photos by NASA/JPL-Caltech; the card images were removed. | note
23. docs/data-use.md Section 5 | 'about 20 % smoother' (Access Mars vs HiRISE) and the row 5 scale figures were not checked against scripts/preprocess/README.md or the build. | note

## Checked and found in order
- Solar storm 2 h limit, contact weight 0.5, relay mast 3 m, turn-back line and HiRISE row all carry a label in code (values.js, labels.js, extras.js, hud.js, 3-go/index.js). Contact weight appears only on the Sources page (assumption). Turn-back and live route not seen in the Walk screen.
- Go page (built app, F7 fixture): 7 checklist rows, each value has an info chip except the HiRISE limit (finding 15b). Solar storm row shows 2 h 37 against 2 h, as data-use.md says. Farthest spot 60 m, as data-use.md says.
- Sources page: 45 external links, no relative or repo-path hrefs. All app/public files have a source entry; only quela_drill.jpg lacks a use. Tools cover package.json (three, vite, vitest, fontsource), script imports (numpy, PIL, DracoPy, gltf-transform, meshoptimizer), ffmpeg, Draco.
- Verified links and texts: OCHMO-TB-020 Rev E (2 h text present); MSC-05161 Apollo 15 Supplement 6 (suit antenna 1.83 m, 6 ft, line 357 of extracted text); LSR-M paper (2 m booms on rover, 10 m relay boom); PIA21043 page (cross-bedding caption); JPL Marias Pass page (silica); JPL mineral page (tridymite, 2016); JPL lakes page (lake mudstone); chatgpt.com loads.
- AI marks: helmet frame shows 'AI-generated image' bottom left (verified in the image). Intro film shows 'AI-generated' in the corner of every sampled frame (0.3 to 8 s).
- No German strings in app/src (JS, CSS, HTML), app/index.html, app/public text and json, app/README.md (grep). Visitor text has no repo paths (the only hit is finding 5).
- Persons: no person in the six photos checked (3 Curiosity photos, 2 mission photos, skyline background, sky stars). No portrait file in app/public (the Murray card portrait is excluded in places.js comments).
- docs/ai-use.md covers today's work: lines 56 to 68 (Sun 15.11., builder and main session entries: sources, text fixes, Go and Debrief rebuild, drag list, relay, turn-back line, live route, datalines, prepared-file removal, data-use update).
- Code and data notes: Sources AI note and tools list name Claude Code and ChatGPT; package.json description names the AI agent; credits.json ai_note says no AI images among the photos.

## Could not verify (blocks submission if the check fails)
- Intro film (app/public/egress/egress.mp4, 8.33 s): sampled frames at 0.3, 1.5, 2.5, 3.5, 4, 5.5, 6.5, 7.5 and 8 s are black apart from the AI mark, so the rover render was not seen. NASA branding (logos, flags, mission identifiers) and people were not checked. Needs a human look at the full film. | blocks if NASA branding or a person is in the film
- Public link and no-login test: no deployment URL is recorded in the repo; no private-window test was run.
- Demo video or slides: not in the repo; length, format and visible AI marks cannot be checked here.
- Team registration: cannot be checked from the repo (see question 1).
- Walk screen (turn-back line, live route, relay mast, Walk labels) and the Plan relay card: not seen in a browser; checked in code only.
- Not checked at source: Hassler et al. 2014 / SwRI link and 0.67 mSv; PIA21041, PIA16769, PIA20765 links; Gale 208 x 276 km; Banham title and authors (publisher blocked); Apollo 15 section 2.1.2; LSR-M NASA Glenn affiliation and section V; the Bruce Murray text source; 74 % silica; 85,062 triangles; the 64 Access Mars tiles (not viewed).
- Chinese funding restriction review: not checkable from the repo.

## Questions for the humans
1. Are all team members registered at the same local event (Heilbronn), not waitlisted? The repo cannot show this.
2. Keep or remove app/public/data/murray/photos/quela_drill.jpg? It is unused; the Sources page currently claims it is shown.
3. Is the intro film's provenance as stated on the Sources page (scripts written by an AI agent) correct? docs/ai-use.md line 33 says the README does not say which parts are AI.

## Commands and state
- Browser: headless Chrome against a read-only static server on app/dist, stopped after use. No file in the repo changed except this report.
- Working tree left as found: kek.md and reviews/preview/ untracked (not mine), reviews/journey/ modified (not mine).
