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
  lockSettleMs: 150,      // after the pointer lock is taken, mouse moves are ignored this long (the first event can carry a jump)
  mouseJumpPx: 300,       // a single mouse move larger than this is a jump (seen right after the lock), not a look: ignored
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
};
