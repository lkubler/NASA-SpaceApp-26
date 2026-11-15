// Display and control settings of the helmet view. These are NOT rule, suit or demo values (those all
// come from src/core/values.js): they only say when the display shows something and how the view moves.
export const DISPLAY = {
  tickS: 1 / 30,          // simulation step in real seconds
  maxFrameS: 0.25,        // longest real time one frame may advance (tab switch, slow frame)
  steepAheadM: 6,         // "Steep stretch ahead": closed ground within this distance in the walking direction
  radioAheadM: 10,        // "Radio shadow ahead": shadow within this distance in the walking direction
  onRouteM: 1,            // on the band: within this distance of the planned route (steep check follows the route)
  nearBandM: 2,           // near the band: "Steep stretch ahead" only where the plan marks a steep stretch on the route
  reenterM: 1,            // a broken rule counts again only after this many metres walked outside it (no count per frame on an edge)
  relogM: 8,              // walk log: the same warning again within this distance counts as the same one
  offPathM: 6,            // "Off the path": farther than this from the planned route
  edgeBandM: 4,           // "Edge of the site": closer than this to the edge of the mapped square
  warnHoldS: 2,           // a warning shows as long as its cause lasts and this long after it ends (spec: at least about 2 s); a cause flickering at its limit never blinks it (holdset.js)
  warnFadeS: 0.3,         // ... and fades in and out over this time (the large warning and its chips)
  aheadHoldS: 1.2,        // keep the walking direction this long after the visitor stops
  homeTurnM: 1.5,         // "heads home": the way home got this much shorter since the warning
  atTargetM: 2.5,         // close enough to take the sample
  atRoverM: 4,            // close enough to end the excursion
  legStartM: 1,           // a round: standing this close to where the planned leg to the next target starts, that leg is shown (else the way from here)
  leftRoverM: 6,          // the visitor has left the rover (before that, no "end excursion")
  // the rover: NASA's Space Exploration Vehicle model (public/models/sev.glb), scaled to the vehicle's length
  // (4.5 m, 2008 SEV design as given on en.wikipedia.org/wiki/Space_Exploration_Vehicle; no primary NASA
  // figure found: label assumption). At that scale the model is 3.02 m high (the same source: 3 m).
  // Measured on the model at that scale (scripts/preprocess/README.md, SEV rover model):
  roverLengthM: 4.5,
  // the visitor cannot walk into the rover: its footprint (nose to tail, wheel to wheel) plus a margin for
  // the suit; the same box hides what lies behind it from the look-at cards (look.js)
  roverHalfLenM: 2.25,
  roverHalfWidthM: 1.54,
  roverTopM: 3.02,
  roverMarginM: 0.4,
  lockDriftEvents: 2,     // the cursor moved this many times under the pointer lock: the lock does not hold it, free look instead
  lockOffsetPx: 150,      // ... or this many movementX events in a row, all the same way and each at least lockOffsetPx:
  lockOffsetEvents: 8,    //     offsets from the lock point, not steps (assumption: no real hand moves 1200 px in 8 events)
  lockPendingMs: 1000,    // after a lock request, the cursor's own way does not turn the view until locked or refused, at most this long
  // free look (no pointer lock): the plain cursor movement turns the view; resting near an edge keeps turning
  edgeZoneFrac: 0.06,     // edge zone: this share of the view's width (left / right) and height (top / bottom)
  edgeZoneMinPx: 24,      // ... but at least this many pixels
  edgeTurnDegS: 90,       // turning speed while the cursor rests in the left / right edge zone
  edgePitchDegS: 40,      // looking up / down while it rests in the top / bottom edge zone
  // wheels on the ground (scene3d.js placeRover): axles along the long axis from the centre (+ = forward),
  // and the wheels' contact this far out to each side
  roverFrontAxleM: 0.95,
  roverMidAxleM: -0.35,
  roverRearAxleM: -1.65,
  roverTrackHalfM: 1.3,
  // side hatches (one on each side, intro.js): centre this far forward of the footprint centre and this high
  // above the ground; door opening radius
  roverHatchAlongM: 0.29,
  roverHatchUpM: 1.71,
  roverHatchRadiusM: 0.58,
  // loading and look (display choices, assumption): the walk's first frame waits at most this long for the
  // model (the simple stand-in shows until then); a model that comes later fades in over this time
  roverWaitMs: 6000,
  roverFadeMs: 600,
  roverRoughness: 0.6,
  // light on the rover only (the terrain is unlit photo texture with its own light): sun direction from
  // north, clockwise, and elevation; sun and sky fill strength; contact shadow under the rover
  sunAzimuthDeg: 250,
  sunElevationDeg: 45,
  sunIntensity: 2.4,
  fillIntensity: 1.5,
  shadowAlpha: 0.62,
  shadowWheelAlpha: 0.75,
  shadowSpreadM: 0.6,
  lockDriftEvents: 2,     // the cursor moved this many times under the pointer lock: the lock does not hold it, drag look instead
  clickMaxPx: 6,         // a press that moves the mouse less than this is a click (aim mode: jump), more is a drag (look)
  tapMaxMs: 250,          // a Shift press shorter than this is a tap (longer: a hold for fast walk)
  doubleTapMs: 400,       // two Shift taps within this time: demo speed on / off
  repeatGapMs: 30,        // a Shift keydown this soon after its keyup is the same press (auto-repeat sent as up + down pairs)
  jumpMaxM: 40,           // aim mode (F): the crosshair ray meets the ground within this distance
  jumpStepM: 0.25,        // a jump is logged in steps of at most this length (warnings, radio time as walked)
  jumpNoteS: 4,           // "Jump: counted as walked" stays this long after a jump
  startClearM: 3.6,       // start this far along the route, beside the rover
  turnDegS: 80,           // arrow keys: turning speed
  pitchDegS: 50,
  mouseRadPerPx: 0.0022,
  pitchMaxDeg: 25,        // looking up or down: the horizon stays in view (vertical field of view 66°)
  lookMaxM: 110,          // look-at cards: farthest point
  lookAngleDeg: 5,        // look-at cards: an Access Mars point within this angle of the reticle
  // look-at cards: a butte wall as in research/walk-targets.md §3 (wall >= 30°, rising >= 3 m within 6 m)
  butteWallDeg: 30,
  butteMinReliefM: 3,
  butteNearM: 6,
  butteRadiusM: 12,       // look-at cards: area for the shown butte height
  // rover model: Access Mars has no imagery under and behind Curiosity (a grey patch and a strip running
  // north-north-west from the start point); the model is parked along that strip, centred this far up it
  roverHeadingDeg: -19,
  roverShiftM: 0.8,
  // ground patch over that strip: plain ground following the walk grid, from behind the rover up the strip
  patchFromM: -4,
  patchToM: 26,
  patchWidthM: 8,
  patchRightM: 1.5,       // patch centre this far right (east) of the rover's long axis
  patchColor: 0xb4876a,   // the mean colour of the Access Mars ground around the start point
  miniRadiusM: 32,        // minimap: metres from the centre to the rim
  fovDeg: 66,
  bandWidthM: 0.4,        // route band on the ground
  bandFadeNearM: 2.2,     // the band fades in from this far in front of the eye ...
  bandFadeFullM: 6,       // ... to full strength here, so it stays a calm, even band
  // ground cues (specs/feedback-1.md, Walk: display); all assumption: display choices, not measurements
  cueFadeFullM: 8,        // steep border and radio dots at full strength up to this far from the walker (assumption) ...
  cueFadeMaxM: 15,        // ... fading out to nothing here, not visible beyond (assumption; spec: about 15 m)
  // steep ground: one border wall along the outline of the closed ground (steepBorder.js). The outline
  // starts from the planner's own slope test and is cleaned for the eye only (assumption: display choices)
  steepCloseM: 1,         // ... gaps and notches in closed ground narrower than about twice this are joined (morphological close radius; assumption)
  steepHoleMaxM2: 25,     // ... open holes inside closed ground smaller than this are filled (assumption)
  steepMinAreaM2: 12,     // ... closed patches (and leftover outlines) smaller than this get no border of their own (assumption)
  steepKeepOpenM: 1,      // ... open ground within this distance of the planned routes to the candidate spots stays open, so the border never crosses a route (assumption)
  steepSmoothPasses: 3,   // ... Chaikin corner-cutting passes: no 0.5 m stair steps (assumption)
  steepSpacingM: 0.4,     // ... one wall vertex per this many metres of outline (assumption)
  steepRelaxPasses: 6,    // ... relaxation passes after that, rounding the corners of one-cell notches (assumption)
  steepMinLineM: 5,       // ... pieces of outline shorter than this (cut by the edge of the square) are left out (assumption)
  steepEdgeClearM: 0.4,   // ... no wall along the edge of the mapped square itself (outline points closer than this to it are left out; assumption)
  steepWallHeightM: 1.5,  // ... wall height above the walk grid (assumption; spec: about 1.5 m)
  steepWallBelowM: 0.3,   // ... the wall reaches this far below the walk grid, so it never floats where the Access Mars mesh lies lower (assumption)
  steepLineM: 0.035,      // ... bright line at the foot of the wall: this tall ... (assumption)
  steepLinePx: 2.5,       // ... and at least this many drawing-buffer pixels, so it stays crisp far away (assumption)
  steepFillAlpha: 0.3,    // ... translucent fill at the foot, fading to nothing at the top (assumption)
  steepStripeM: 0.6,      // ... faint vertical stripes this far apart, drifting slowly along the wall ... (assumption)
  steepStripeMS: 0.12,    // ... at this speed in metres per second (assumption)
  radioDotSpacingM: 0.6,  // radio shadow: one dot per this many metres of the shadow edge (assumption)
  radioDotRadiusM: 0.07,  // ... dot radius on the ground (assumption)
  radioDotLiftM: 0.07,    // ... lifted this far above the walk grid, like the route band (assumption)
};
