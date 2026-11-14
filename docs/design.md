# Design system: Marswalk (red + white)

Owner: `designer`. Theme direction decided by the humans (DECISIONS.md, "Visual theme", Sat 13:16): **Mars red + white UI**. Everything below is the designer's call and is not up for review. English UI copy only. No NASA logos, meatballs, worms, flags or mission patches anywhere. The product name on screen is the working title "Marswalk" (rename freely; use the CSS variable `--brand-name` equivalent in one place).

Implementation target: plain CSS custom properties + Three.js. No framework-specific theme. A builder copies the token block (section 11) into `src/styles/tokens.css` and uses only those variables.

## 1. Look in one sentence

A white, quiet, instrument-grade mission console wrapped around dusty red terrain: paper-white panels with rust-red accents for planning, and a near-black red-brown glass HUD with white glyphs for the walk. Terrain is the only saturated area on screen, so the route and the comms shadow are always the focal point.

Reference: the feel of a flight-dynamics or NASA Eyes-style console crossed with a Swiss-style printed field map. Not a sci-fi neon HUD. Restraint is the point.

Rules of the look:
1. One focal point per screen: the route line (planner) or the next-POI arrow plus reserve (walk).
2. Red is the terrain and the brand accent. State colors (ok/warn/danger) never rely on red-vs-red; they live on dark scrims with an icon and a word.
3. Everything numeric is monospaced and tabular. Everything labelled is uppercase small caps-style with letter spacing.
4. Every number carries provenance (section 3). Nothing "just thrown in" (Platzhalter-Prinzip from notes.md).
5. Thin hairlines (1 px), 4 px radius, no drop-shadow soup, no gradients on UI chrome. Gradients only in the sky and haze.

## 2. Palette

### Brand and surfaces (light UI: planner, dashboard, loading, sources)
| Token | Hex | Use | Contrast |
|---|---|---|---|
| `--paper` | #FBF8F5 | panel background (warm white) | base |
| `--paper-2` | #F2ECE7 | tiles, table stripes, inputs | |
| `--hairline` | #DDD2CB | borders, dividers | |
| `--ink` | #241613 | body text | 16.6:1 on paper |
| `--ink-muted` | #6B5A54 | secondary text, axis labels | 6.2:1 |
| `--mars` | #B02E17 | brand red: buttons, active tab, headings accent | 6.1:1 on paper; white on it 6.5:1 |
| `--mars-deep` | #6E1D10 | pressed state, header band | |
| `--rust` | #D9572F | route highlight on dark only, chart accent | not for text on paper |
| `--dust` | #E9B58F | soft accent, sky horizon | decorative |

### HUD surfaces (dark glass over the 3D view)
| Token | Hex | Use |
|---|---|---|
| `--scrim` | #1C0F0C at 72 % alpha | every HUD panel background (blur 6 px optional) |
| `--scrim-solid` | #1C0F0C | opaque equivalent for contrast checks |
| `--hud-line` | #FFFFFF at 28 % | HUD hairlines, brackets |
| `--hud-text` | #FFFFFF | primary HUD glyphs (18.7:1 on scrim) |

### State colors (two sets: on-dark for HUD/map, on-paper for panels)
Never use state color alone. Always pair with icon shape and a word.
| State | On scrim (HUD, map labels) | On paper (dashboard) | Icon |
|---|---|---|---|
| OK / nominal | `--ok` #58D68D (10.2:1) | `--ok-ink` #1E7A46 (5.1:1) | filled circle / check |
| Caution | `--warn` #FFB224 (10.4:1) | `--warn-ink` #8A5A00 (5.6:1) | triangle |
| Danger / turn back | `--danger` #FF5A4D (6.1:1) | `--danger-ink` #B3261E (6.2:1) | octagon / bar |

Why this works on red terrain: terrain is mid-dark red-brown, so state colors sit on a scrim chip or a casing stroke, never directly on terrain. Plain amber on terrain only reaches 4.3:1, so direct-on-terrain use is banned. Danger is a different shape (octagon, flashing bar) and text, because red-on-red hue contrast is weak.

### Data provenance (the honesty layer; used on every number, layer, legend)
Three classes, mapping to notes.md "Platzhalter-Prinzip". Color AND line style AND tag word, so it survives grayscale and colorblindness.

| Class | Meaning | On scrim | On paper | Line style | Tag |
|---|---|---|---|---|---|
| MEASURED | real NASA/partner data used as is (HiRISE DTM, rover images, Access Mars mesh) | `--prov-measured` #4CC9F0 | `--prov-measured-ink` #0A6C8C | solid | `MEASURED` |
| MODELLED | computed by us from measured data with stated assumptions (slope, line of sight, reserve model, sun position) | `--prov-modelled` #B3A9FF | `--prov-modelled-ink` #5B4BC4 | dashed (6 3) | `MODELLED` |
| SIMULATED | placeholder, no real feed yet (weather, space weather, live suit telemetry) | `--prov-sim` #CFC4BE | `--prov-sim-ink` #5E5550 | dotted (1 3), diagonal hatch fill | `SIMULATED` |

Cyan and lavender are cool hues chosen because they are complementary to the red terrain and so remain readable on it. All provenance text colors pass 5:1 or better.

Provenance chip: 18 px high, 1 px outline in the class color, 10 px uppercase mono label, a 6 px dot (solid / half / hollow-dotted). Hover or click opens the info popover: 1-2 sentences "where the data would come from, how it is processed" (copy source: notes.md).

### Map and scene semantic colors
| Token | Hex | Use |
|---|---|---|
| `--route` | #FFFFFF with 3 px `--scrim-solid` casing | planned EVA route: white line with dark casing (always legible on red) |
| `--route-done` | #FFFFFF at 45 % | already walked part |
| `--route-return` | #FFFFFF dashed, 3 px casing | return leg |
| `--comms-shadow` | #FF4FA0 (6.1:1 on scrim) | comms-shadow overlay: 35 % fill + diagonal hatch + 2 px edge; always labelled "NO SIGNAL" |
| `--comms-ok` | #4CC9F0 at 0 % fill, edge only | line-of-sight boundary hint |
| `--turnback` | #FFB224 | turn-back point marker: amber ring with "T" glyph and distance |
| `--poi` | #FFFFFF fill, `--mars` ring | science targets, numbered 1..n |
| `--slope-ok` / `--slope-soft` / `--slope-hard` | transparent / #FFB224 at 40 % / #FF5A4D at 55 % | slope overlay: <10 deg none, 10-20 deg caution, >20 deg limit (20 deg hard limit, 10 deg soft cost start per notes.md) |
| `--terrain-lo` / `--terrain-hi` | #4A1D14 / #D98B62 | hillshade tint ramp in 2D planner |
| `--sky-zenith` / `--sky-horizon` | #3B2A33 / #D9A07A | daytime Mars sky (butterscotch horizon, dusky zenith) |

Comms shadow is the signature feature and the only magenta in the product. Nothing else may use `--comms-shadow`.

## 3. Typography (Google Fonts only)
Load once in `index.html`:
`Barlow Semi Condensed` (500, 600, 700), `IBM Plex Sans` (400, 500, 600), `IBM Plex Mono` (400, 500, 600). All are open-licensed (SIL OFL). Record in `docs/ai-use.md`/credits: "Fonts: Google Fonts, SIL OFL". Fallbacks: `system-ui`, `ui-monospace`.

| Role | Family | Size / line | Weight | Case, tracking |
|---|---|---|---|---|
| Display (title, loading) | Barlow Semi Condensed | 56 / 56 | 700 | uppercase, +0.02em |
| H1 panel title | Barlow Semi Condensed | 24 / 28 | 600 | uppercase, +0.04em |
| Label (tile heads, legend) | Barlow Semi Condensed | 12 / 16 | 600 | uppercase, +0.12em |
| Body | IBM Plex Sans | 14 / 20 | 400 | normal |
| Body small / captions | IBM Plex Sans | 12 / 16 | 400 | normal |
| Numeric value (tiles) | IBM Plex Mono | 32 / 36 | 500 | tabular |
| HUD big (distance, reserve) | IBM Plex Mono | 40 / 40 | 500 | tabular |
| HUD small | IBM Plex Mono | 14 / 16 | 500 | uppercase, +0.06em |
| Provenance tag | IBM Plex Mono | 10 / 12 | 600 | uppercase, +0.1em |

Minimum text size anywhere: 12 px in panels, 14 px in HUD (video is recorded at 1280x720 or larger; 14 px stays readable at 720p, 10 px tags are decoration only and always accompanied by color and shape).

## 4. Spacing, radius, motion tokens
Spacing scale (4 px base): 4, 8, 12, 16, 24, 32, 48. Radius 4 px (panels, chips), 999 px (pills). Border 1 px. Panel padding 16. Tile gap 12. Page gutter 16.
Motion: `--ease: cubic-bezier(0.2, 0.7, 0.2, 1)`; `--t-fast` 120 ms (hover), `--t-mid` 240 ms (panel, chip), `--t-slow` 600 ms (overlays), `--t-draw` 2400 ms (route draw). Honor `prefers-reduced-motion`: disable draw animation, pulses, day/night scrub tween (jump instead), haze animation.

## 5. Components
- **Panel**: `--paper` bg, 1 px `--hairline`, radius 4, header row = Label type + optional provenance chip on the right.
- **Tile** (dashboard): `--paper-2`, label (top-left), value (Mono 32), unit (Plex Sans 12 muted), sparkline or bar below, provenance chip bottom-right. One value per tile.
- **Button**: primary = `--mars` bg, white text, 36 px high, radius 4; secondary = paper bg + 1 px `--mars` border and `--mars` text; ghost = text only. Focus ring: 2 px `--ink` outline with 2 px white offset (visible on red and white).
- **Chip / pill**: 24 px high, label type. Variants: state (icon + word), provenance (section 2), POI number badge (circle 22 px).
- **Legend**: three-row block, each row: line sample in class style + tag + 4-word description. Always visible in planner (bottom of right column) and as a collapsible card in the walk (key `L`).
- **Info popover**: paper card, max 280 px, title, 2 sentences, "Source:" line with link text. Used for every SIMULATED/MODELLED item.
- **Toast** (HUD, bottom center): scrim bg, state icon + 1 line; auto-dismiss 4 s.
- **POI list row**: number badge, name, distance from base (mono), "why here" line in muted, small thumbnail slot (real rover image with credit line).
- **Slider** (day/night, dust): 2 px track, 14 px round thumb in `--mars`, value readout in mono, tick marks at hours.

## 6. Layout: planner and dashboard (desktop first, target 1440x900, min 1280x720)

```
+--------------------------------------------------------------------------------+
| MARSWALK  | 1 Site: Murray Buttes v | 2 Targets | 3 Route | 4 Walk  | Sources  |  <- 48 px header, paper, red active underline
+---------------------------------------------------------+----------------------+
|                                                         | MISSION               |
|   2D MAP (hillshade of terrain, red ramp)               |  Targets (POI list)   |
|                                                         |  1 Butte base  0.4 km |
|     (3)o                                                |  2 Layered rock 1.1km |
|        / \  ~~~~ comms shadow (magenta hatch) ~~~~      |  3 Float rock  1.9 km |
|   (1)o---o(2)----T  turn-back                           |-----------------------|
|        route = white line + dark casing                 |  SUMMARY              |
|   [B] base/rover                                        |  Distance  3.1 km     |
|                                                         |  Out of contact  9 min|
|  layers: [Slope][Comms][Sun] [ ] POI    scale  N        |  Reserve @ return 24% |
|                                                         |  [ START WALK > ]     |
+---------------------------------------------------------+----------------------+
| ELEVATION PROFILE (route distance on x)                 | TIME WINDOW | RESERVE |
| line = height; magenta band under line where NO SIGNAL; | sun 08:10-17:40       |
| amber tick = turn-back; white dots = POIs               | [====o======] 14:20   |
|                                                         | dust tau 0.6 [SIM]    |
+---------------------------------------------------------+-----------------------+
| LEGEND:  ---- MEASURED   - - - MODELLED   ..... SIMULATED          Data: HiRISE...|  <- 32 px footer
+--------------------------------------------------------------------------------+
```
- Map takes about 62 % width, 58 % height: it is the focal area. Right column 360 px. Bottom strip (elevation + time/reserve tiles) 220 px.
- Dashboard tiles: elevation profile with comms-shadow segments (wide), reserve (bar from 100 % down to 20 % buffer line), time window (sun, daylight left, EVA clock), POI list, legend. All tiles carry provenance chips.
- Elevation profile rules: x = route distance, y = elevation m, 2 px white line on paper-dark chart or `--ink` line on paper; comms-shadow = magenta band under the curve with hatch and a "9 min NO SIGNAL" label; turn-back = amber vertical rule; POIs = numbered dots; hover shows a vertical cursor synchronized with a marker on the map.
- Controls hierarchy: one primary button per screen (`START WALK`).

### 6.1 Walk screen (3D + HUD), full-bleed

```
+--------------------------------------------------------------------------------+
|[ ^ N 340 ]  compass tape top center                       [ SOL 1043  14:20 ]   |
|                                                                                 |
|                          3D TERRAIN, first person                               |
|                                                                                 |
|               ==>  ground arrows (white chevrons, projected on terrain)         |
|                       ( 2 ) NEXT: LAYERED ROCK   240 m                          |
|                                                                                 |
|  [!] STEEP 17 deg AHEAD (caution chip, center-top, only when needed)            |
|                                                                                 |
|+-----------+                                                   RESERVE  62 %    |
|| MINIMAP   |                                                  [=======---|20]  |
|| route,    |                                    COMMS  LINK OK   (or NO SIGNAL) |
|| arrow     |                                    TURN BACK IN 410 m              |
|+-----------+          [ Esc: planner ]  [ L legend ]  [ H hide HUD ]             |
+--------------------------------------------------------------------------------+
   helmet glass: soft vignette + faint curved rim + subtle top reflection
```

## 7. HUD style (3D view)
Principle: a visor, not a game. White glyphs, thin lines, glass scrims, little color. HUD elements are DOM/SVG layered over the canvas (not drawn in WebGL) except ground chevrons (WebGL, see below).

- **Helmet frame**: CSS overlay with `radial-gradient(ellipse at center, transparent 62%, rgba(10,4,3,.55) 100%)` vignette, a 1 px inner rim arc in `--hud-line`, and a very faint top highlight (white 6 % linear gradient, 8 % height). A 6 s slow "breath" fog on the rim is optional and off with reduced motion. Whole overlay `pointer-events: none`.
- **Normal mode** (always visible): compass tape (top center), next-POI label with distance (center-low, HUD big), reserve gauge (right-low), comms status pill (right), minimap (bottom-left), clock.
- **Warn mode** (only when triggered; the HUD calms down otherwise): a single banner at top-center, 44 px high, scrim bg, left 6 px bar in state color, state icon, uppercase Label text + mono value. Triggers: steep passage ahead (caution, shows angle), comms shadow ahead (caution, shows length in m), entering shadow (danger-style "NO SIGNAL", magenta edge pulse), turn-back reached (danger, "TURN BACK NOW", persistent), off path (caution). Only one banner at a time; priority danger > caution; banners stack as a small list of max 2 beneath.
- **Ground guidance**: white chevron decals on terrain along the next 60 m of route, 1 m wide, spaced 4 m, opacity fading with distance, depth-tested with a small polygon offset, slow forward pulse (1.2 s). Steep sections along the route tint the chevrons `--warn`; shadow sections tint `--comms-shadow`. POI = vertical thin white beacon line with number badge, visible through haze (fog disabled on beacon material).
- **Reserve gauge**: horizontal bar, 240 x 10 px; fill white; below 40 % fill turns `--warn`; below the required return cost x 1.5 (the turn-back rule from notes.md) a notch and "TURN BACK" appear and fill turns `--danger`. Numeric % in HUD big. Always show "MODELLED" chip small under it.
- **Comms pill**: `LINK OK` with 3 ascending bars in `--ok`; `NO SIGNAL` with struck bars in `--comms-shadow` and a mono timer counting seconds out of contact. When no signal, the scrim edges of the helmet gain a faint magenta inner glow (box-shadow inset, 10 % alpha) and bars flicker once.
- **Minimap (bottom-left)**: 200 x 200 px, round-cornered 4 px, scrim frame with 1 px `--hud-line`, hillshade backdrop at 70 % opacity, white route with casing, walked part dimmed, comms-shadow hatched, POIs numbered, player arrow white with `--mars` outline, rotates with view (north arrow tick at rim) with toggle. Auto-fit: fit route bounding box + 12 % padding on load and whenever the route changes (animated 400 ms). Clicking the minimap expands to 320 px.
- **POI arrival card**: when within 15 m of a POI, a card slides up center-right: rover photo (real, with credit line, MEASURED chip), target name, "what to look for" 1-2 lines, `[ Continue ]`.
- **Layout customizer** (notes.md says roadmap-only): not built. Keep HUD elements in named anchors (`--hud-anchor-*` classes) so it stays feasible.
- **Type on HUD**: Mono for numbers, Barlow Semi Condensed uppercase for labels, minimum 14 px, `text-shadow: 0 1px 2px rgba(0,0,0,.6)` on any text not on a scrim.

## 8. Loading screen
Full-screen `--paper` background with a faint contour-line pattern in `--hairline` (SVG, static). Center: wordmark (Display type), progress bar 360 x 4 px (`--mars` fill on `--hairline` track) bound to the Three.js `LoadingManager` (true progress, never fake), percentage and the current asset name in mono below ("terrain mesh 62 %"). Below it a single rotating tip (every 6 s, 240 ms crossfade, max 2 lines, Plex Sans 16). Tip topics (all true, sourced): the 20 deg slope limit and why; why return reserve is 20 %; "MEASURED vs MODELLED vs SIMULATED" legend; comms shadow explained in one line; Mars facts (day length 24 h 39 m, pressure under 1 % of Earth, light delay 3-22 min, per research/triage.md); data credits (HiRISE, Access Mars, Mars Trek). Bottom strip: credit line "Built on NASA open data" with text only, no logos. Fades out in 400 ms to the planner. If loading finishes under 800 ms the screen still shows for 800 ms so the first tip is readable.

## 9. Data-viz rules
(After the `dataviz` skill; kept short.)
1. One focal series per chart in white/ink; context in `--ink-muted`. Color only for meaning: provenance, state, comms shadow.
2. Direct labels over legends (label the line end, the shadow band, the turn-back rule). Axes in mono 12 px, `--ink-muted`; 4-5 ticks max; no gridlines except hairlines at major ticks.
3. Units on every value; one decimal at most for km and %; minutes as integers.
4. Comms-shadow is a band, not a line style: fill + hatch + label, same representation in map, profile, minimap and HUD.
5. Reserve is always shown against the 20 % buffer line and the turn-back threshold.
6. Never show a MODELLED or SIMULATED number without its chip. Never dress simulated values in more precision than the model has (round).
7. Chart backgrounds are the panel color; no chart borders; no 3D, no pie.
8. Colorblind-safe check: shadow = hatch, simulated = dotted, modelled = dashed; state uses icon shape. Verified by design in grayscale.

## 10. Map styling (2D planner and minimap)
- Basemap: hillshade of the DTM (sun azimuth 315, altitude 35, z-factor 2 for visible relief) tinted with the ramp `--terrain-lo` to `--terrain-hi`, desaturated about 15 % so overlays pop. Optional toggle: HiRISE orthoimage (true color, MEASURED).
- Contour lines: 5 m interval at 12 % white, index lines every 25 m at 25 % white with mono labels. This gives the "field map" feel and reads well in video.
- Overlays: slope (soft amber, hard coral), comms shadow (magenta hatch), route (white + casing), POIs, base marker (square, white with `--mars` fill), turn-back (amber ring).
- Controls: layer toggles bottom-left as pills (state: filled `--mars` when on), scale bar and north arrow bottom-right, attribution line text-only in the footer.
- Labels: Barlow Semi Condensed uppercase 12 px, white with 3 px dark halo (paint-order stroke) so they work on any terrain tone.
- Rendering: 2D in Canvas/SVG or Leaflet-like custom; no map tiles from commercial providers.

## 11. Design tokens (CSS custom properties; the only code in this document)
Copy to `src/styles/tokens.css`. Builders use only these.

```css
:root {
  /* surfaces (light UI) */
  --paper: #FBF8F5;
  --paper-2: #F2ECE7;
  --hairline: #DDD2CB;
  --ink: #241613;
  --ink-muted: #6B5A54;

  /* brand */
  --mars: #B02E17;
  --mars-deep: #6E1D10;
  --rust: #D9572F;
  --dust: #E9B58F;

  /* HUD (dark glass) */
  --scrim-solid: #1C0F0C;
  --scrim: rgba(28, 15, 12, 0.72);
  --hud-line: rgba(255, 255, 255, 0.28);
  --hud-text: #FFFFFF;

  /* states, on dark */
  --ok: #58D68D;
  --warn: #FFB224;
  --danger: #FF5A4D;
  /* states, on paper */
  --ok-ink: #1E7A46;
  --warn-ink: #8A5A00;
  --danger-ink: #B3261E;

  /* data provenance, on dark / on paper */
  --prov-measured: #4CC9F0;
  --prov-measured-ink: #0A6C8C;
  --prov-modelled: #B3A9FF;
  --prov-modelled-ink: #5B4BC4;
  --prov-sim: #CFC4BE;
  --prov-sim-ink: #5E5550;

  /* map and scene */
  --route: #FFFFFF;
  --route-casing: #1C0F0C;
  --comms-shadow: #FF4FA0;
  --turnback: #FFB224;
  --terrain-lo: #4A1D14;
  --terrain-hi: #D98B62;
  --sky-zenith: #3B2A33;
  --sky-horizon: #D9A07A;

  /* type */
  --font-display: "Barlow Semi Condensed", system-ui, sans-serif;
  --font-body: "IBM Plex Sans", system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;

  /* spacing, shape, motion */
  --s-1: 4px; --s-2: 8px; --s-3: 12px; --s-4: 16px; --s-5: 24px; --s-6: 32px; --s-7: 48px;
  --radius: 4px;
  --ease: cubic-bezier(0.2, 0.7, 0.2, 1);
  --t-fast: 120ms; --t-mid: 240ms; --t-slow: 600ms; --t-draw: 2400ms;
}
@media (prefers-reduced-motion: reduce) {
  :root { --t-fast: 0ms; --t-mid: 0ms; --t-slow: 0ms; --t-draw: 0ms; }
}
```

## 12. Signature moments (the 30 s video)
Chosen to match the storyboard in `research/jury-idea.md` (0-3 NO SIGNAL cold open, 3-7 Trek zoom, 7-15 planner, 15-23 walk, 23-28 sources). Each becomes a task in `tasks/` (see list at the end). Rule: moments 1 and 2 are mandatory; 3 and 4 are polish and cut first.

1. **NO SIGNAL cold open (0-3 s)**. First-person view at the butte in low golden sun. Compass and reserve are on. The player steps behind the butte; the comms pill flips from LINK OK to NO SIGNAL in `--comms-shadow`, helmet rim glows magenta once, bars flicker, the out-of-contact timer starts running next to the shrinking reserve. No logo, one subtitle line. This is the problem in one image.
2. **Comms-shadow reveal in the planner (7-15 s)**. After three POIs are clicked the white route draws itself over the hillshade in `--t-draw` (stroke dash animation, 2.4 s, ease-out). Then the comms-shadow overlay sweeps in as a radial viewshed from the rover (magenta hatch growing outward in 600 ms), the matching band appears under the elevation profile at the same moment, and the amber turn-back marker drops onto the route with a small ring pulse. Stat tiles count up (mono numbers). One focal point at a time: route, then shadow, then turn-back.
3. **Golden-hour light and day/night scrub (walk, 15-23 s)**. Directional sun with real terrain shadows (Mars24-based sun position tied to the EVA clock). A time slider in the dashboard (and a hotkey in the walk) drags the sun: long butte shadows, sky from `--sky-horizon` butterscotch to dusky zenith, stars fade in below -2 deg sun altitude (Mars sunsets are blue near the sun; give a faint cool glow around the sun disc: Three.js sky shader, blue-ish halo at the horizon, reference: Curiosity sunset images). Show the HUD's "daylight left" shrinking as the sun falls.
4. **Dust haze (walk, 20-23 s)**. A dust slider (tau, labelled SIMULATED) raises exponential-squared fog in `--dust` tones, desaturates the sky, and drops sun disc intensity; the HUD "visibility" readout shrinks from 800 m to 120 m and a caution banner appears: "DUST: visibility 120 m [SIMULATED]". Implementation: `scene.fog = FogExp2`, tweak sky uniform; blow a few instanced dust motes on the wind vector. Keep GPU cost small.

Closing beat (23-28 s): the **Sources panel**, not a wow moment but a design obligation: full-width paper card, three columns MEASURED / MODELLED / SIMULATED, each with chip, item list and one-line source, red underline draw-in (240 ms). This is where "NASA data is a core component" is shown.

Shot-readiness check for each moment: legible at 1280x720, text 14 px or larger, only one animation running at a time, no UI clutter behind it.

## 13. Accessibility and contrast
- Text contrast: all text and chip colors listed above are 4.5:1 or better against their stated background (measured with WCAG formula): ink on paper 16.6, muted 6.2, red on paper 6.1, white on `--mars` 6.5, white on scrim 18.7, ok 10.2, warn 10.4, danger 6.1, comms-shadow 6.1, cyan 9.7, lavender 8.9, sim 10.9 on the solid scrim. Over a 72 %-alpha scrim on bright terrain the worst case is still 4.5:1 or better; HUD blur and 72 % alpha are the floor, never go below.
- Non-text contrast (3:1): route white-with-casing, chips' outlines and icons all exceed 3:1. Terrain never carries essential information without a casing or scrim.
- Never color-only: state = icon + word; provenance = line style + tag; comms shadow = hatch + label.
- Keyboard: the planner is fully operable by keyboard (tab order: header, map layers, targets, summary, start). Walk: WASD/arrows move, mouse look via pointer lock, `Esc` leaves, `L` legend, `H` hides HUD, `T` jumps sun time. Visible focus ring everywhere.
- Motion: `prefers-reduced-motion` disables route-draw animation, pulses, fog drift, flicker. Nothing flashes more than 3 times per second; the NO SIGNAL flicker is a single event.
- Language: plain English, short; tooltips explain jargon (comms shadow, reserve, tau). Units always shown.
- Zoom: layouts hold at 125 % browser zoom at 1280 px width (right column collapses to tabs).
- Copy tone: calm, imperative, mission-ops: "TURN BACK IN 410 m", "NO SIGNAL 00:42", not alarmist.

## 14. Assets and credits
- Fonts: Google Fonts (Barlow Semi Condensed, IBM Plex Sans, IBM Plex Mono), SIL OFL.
- Icons: hand-drawn inline SVG (circle, triangle, octagon, signal bars, compass, arrow) made by us, no icon pack, no attribution needed.
- Textures and imagery: only NASA/ESA open data per `research/data.md` (credit lines on-screen next to any rover or orbiter image). Sky/sun are procedural shaders. If any AI-generated image is used, it carries a visible watermark "AI-generated" and is logged in `docs/ai-use.md`.
- No NASA logos or insignia, no persons in imagery (no under-18 likeness risk). Suit/astronaut silhouettes, if any, are our own abstract SVG.

## 15. Design decisions log (designer's calls)
- Light "paper" planner with dark glass HUD instead of an all-dark UI: satisfies "white UI", differentiates from hackathon dark dashboards, and projects well on venue screens. Dark only where it sits on the 3D view.
- Cool cyan/lavender for provenance because red terrain makes warm colors muddy; magenta reserved for comms shadow only.
- Route is white with casing, not a colored line, to stay legible on any red tone and under haze.
- HUD calms down by default; warnings are single-banner, one at a time.
- Customizer, partner position and live feeds are roadmap-only (slide), not designed in detail.

## 16. Tasks derived from this document
Created in `tasks/` by the designer after this commit (not part of this commit): tokens.css + fonts, panel/tile/chip components, walk HUD overlay, comms-shadow reveal (moment 2), NO SIGNAL cold open (moment 1), sun/day-night + sky shader (moment 3), dust haze (moment 4), loading screen, sources panel.
