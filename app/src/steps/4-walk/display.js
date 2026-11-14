// Display and control settings of the helmet view. These are NOT rule, suit or demo values (those all
// come from src/core/values.js): they only say when the display shows something and how the view moves.
export const DISPLAY = {
  tickS: 1 / 30,          // simulation step in real seconds
  maxFrameS: 0.25,        // longest real time one frame may advance (tab switch, slow frame)
  steepAheadM: 6,         // "Steep stretch ahead": closed ground within this distance in the walking direction
  radioAheadM: 10,        // "Radio shadow ahead": shadow within this distance in the walking direction
  offPathM: 6,            // "Off the path": farther than this from the planned route
  edgeBandM: 4,           // "Edge of the site": closer than this to the edge of the mapped square
  aheadHoldS: 1.2,        // keep the walking direction this long after the visitor stops
  homeTurnM: 1.5,         // "heads home": the way home got this much shorter since the warning
  atTargetM: 2.5,         // close enough to take the sample
  atRoverM: 4,            // close enough to end the excursion
  leftRoverM: 6,          // the visitor has left the rover (before that, no "end excursion")
  roverClearM: 2.8,       // the visitor cannot walk into the rover model
  startClearM: 3.6,       // start this far along the route, beside the rover
  turnDegS: 80,           // arrow keys: turning speed
  pitchDegS: 50,
  mouseRadPerPx: 0.0022,
  pitchMaxDeg: 60,
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
  miniRadiusM: 32,        // minimap: metres from the centre to the rim
  fovDeg: 66,
  bandWidthM: 0.7,        // route band on the ground
};
