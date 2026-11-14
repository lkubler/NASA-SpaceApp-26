// The plain Mars ground colour of the maps: a ramp from shadowed to lit ground (sRGB 0..255).
// The map relief (ui/mapPanel.js) shades the walk grid with it. The Walk uses the same ramp to tint
// the ground that Access Mars has no colour imagery for (its textures are grey there), so that ground
// reads as the same Mars ground the maps show, with no rock detail added. Display colours, not data.
export const GROUND_RAMP = { dark: [74, 42, 23], light: [214, 142, 94] };

/** The one honest note about that colour, for the Sources page and the labels where the visitor meets it. */
export const GROUND_NOTE = 'About half of the walk square has only greyscale imagery in Access Mars. There the ground is tinted with a plain Mars colour of our own choosing, shaded by the terrain heights: the colour is ours, not NASA’s.';
/** Label for that ground colour (maps and helmet view). */
export const GROUND_TAG = { label: 'model', text: GROUND_NOTE, source: { title: 'Our display colour (src/core/groundColor.js) over the Access Mars terrain', url: '', where: '' } };
