// The plain Mars ground colour of the maps: a ramp from shadowed to lit ground (sRGB 0..255).
// The map relief (ui/mapPanel.js) shades the walk grid with it. The Walk uses the same ramp to tint
// the ground that Access Mars has no colour imagery for (its textures are grey there), so that ground
// reads as the same Mars ground the maps show, with no rock detail added. Display colours, not data.
export const GROUND_RAMP = { dark: [74, 42, 23], light: [214, 142, 94] };
