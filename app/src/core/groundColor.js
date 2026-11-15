// The plain Mars ground colour of the maps: a ramp from shadowed to lit ground (sRGB 0..255).
// The map relief (ui/mapPanel.js) shades the walk grid with it. The Walk uses the same ramp to tint
// the ground that Access Mars has no colour imagery for (its textures are grey there), so that ground
// reads as the same Mars ground the maps show, with no rock detail added. Display colours, not data.
export const GROUND_RAMP = { dark: [74, 42, 23], light: [214, 142, 94] };

/** The one honest note about that colour, for the Sources page and the labels where the visitor meets it. */
export const GROUND_NOTE = 'About half of the site has only greyscale imagery. There the ground is tinted with our own Mars colour, shaded by the terrain heights.';
/** Label for that ground colour (maps and helmet view). */
export const GROUND_TAG = { label: 'model', text: GROUND_NOTE, source: { title: 'Our display colour over the Access Mars terrain', url: '', where: '' } };

/**
 * How the ground of the walk is calmed (core/groundLook.js). Display settings of our own, not data: where
 * the photo is stretched, or the imagery is grey, the ground is shown in the local colour of the real photo
 * around it. Stretch is in tile widths per photo pixel against the tile's own pixel size (1 = undistorted).
 */
export const GROUND_LOOK = {
  smearFrom: 2.4,      // a triangle whose photo is stretched this many times starts to be calmed ...
  smearFull: 5.5,      // ... and is fully calmed at this stretch
  calmBlurLevels: 5.5, // the calm ground samples the photo this many mip levels coarser (a soft local colour)
  goodSat: 0.19,       // saturation above which a photo pixel counts as real colour (the Plan map's test)
  seamMaxGain: 0.2,    // a tile is brightened or darkened by at most this fraction to even the seams
  seamStrength: 0.9,   // share of the measured seam step that is taken out
  grainNear: 3,        // fine grain: full strength within this many metres of the eye ...
  grainFar: 16,        // ... gone beyond this
  grainAmp: 0.075,     // brightness only: +- this fraction on filled ground
  grainAmpPhoto: 0.04, // ... and on real photo ground
};

/** The walk's ground fill (core/groundLook.js): where the camera image is grey or stretched, the ground is filled in the colour of the real photo around it. */
export const GROUND_FILL_NOTE = 'Where the camera image is grey or stretched over steep ground, the ground is filled with the colour of the real photo around it, plus a fine grain near you. Our display, not camera data.';
export const GROUND_FILL_TAG = { label: 'model', text: GROUND_FILL_NOTE, source: { title: 'Our display code over the Access Mars terrain textures', url: '', where: '' } };
