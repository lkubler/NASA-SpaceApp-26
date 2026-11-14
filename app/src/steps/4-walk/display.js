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
  aheadHoldS: 1.2,        // keep the walking direction this long after the visitor stops
  homeTurnM: 1.5,         // "heads home": the way home got this much shorter since the warning
  atTargetM: 2.5,         // close enough to take the sample
  atRoverM: 4,            // close enough to end the excursion
  leftRoverM: 6,          // the visitor has left the rover (before that, no "end excursion")
  roverClearM: 2.8,       // look-at cards: the rover model hides points within this distance of its centre (minus 0.8 m)
  // the visitor cannot walk into the rover model: its footprint (scene3d.js roverModel, arm to power
  // unit and wheel to wheel) plus a margin for the suit
  roverHalfLenM: 2.3,
  roverHalfWidthM: 1.45,
  roverMarginM: 0.4,
  lockDriftEvents: 2,     // the cursor moved this many times under the pointer lock: the lock does not hold it, drag look instead
  clickMaxPx: 6,         // a press that moves the mouse less than this is a click (aim mode: jump), more is a drag (look)
  tapMaxMs: 250,          // a Shift press shorter than this is a tap (longer: a hold for fast walk)
  doubleTapMs: 400,       // two Shift taps within this time: demo speed on / off
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
  cueFadeFullM: 8,        // steep lines and radio dots at full strength up to this far from the walker (assumption) ...
  cueFadeMaxM: 15,        // ... fading out to nothing here, not visible beyond (assumption; spec: about 15 m)
  steepLineHeightM: 1.5,  // steep ground: vertical lines rise this high from the edge of the closed area (assumption; spec: about 1.5 m)
  steepLineBelowM: 0.3,   // ... and start this far below the walk grid, so they never float where the Access Mars mesh lies lower (assumption)
  steepLineWidthPx: 2,    // ... each this many drawing-buffer pixels wide: thin, still seen on the orange ground (assumption)
  steepLineSpacingM: 0.7, // ... at most one line per this many metres of edge (assumption)
  radioDotSpacingM: 0.6,  // radio shadow: one dot per this many metres of the shadow edge (assumption)
  radioDotRadiusM: 0.07,  // ... dot radius on the ground (assumption)
  radioDotLiftM: 0.07,    // ... lifted this far above the walk grid, like the route band (assumption)
};
