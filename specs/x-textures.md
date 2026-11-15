# Ground look in the walk
The visitor should understand: this is real Martian ground seen by Curiosity, and it looks like a place, not like a broken scan.
Rests on: `specs/4-walk.md`, the team's notes (the texture is messy in many places and looks bad; make it look better without breaking the data).

First => the builder walks the site and sorts the bad places by kind (smeared photo, grey patch, brightness jump between tiles, blur near the camera), with a screenshot of each kind before any change
Good photo ground => stays untouched
Smeared ground (one photo pixel stretched over too much ground) => found by calculation; there a calm ground in the local colour of the real image around it is blended in, with soft edges
Grey patches (no colour image) => the same treatment; replaces the flat tint used today
Brightness jumps between tiles => evened out between neighbours so the seams are not visible
Near the camera => a fine grain against the blur, made in code, changing brightness only, fading out with distance
Terrain shape, slopes, routes, rules => not touched; only the look changes
Label => a legend line "Ground without a clear camera image: filled", label model; the Sources page says the same in one sentence
Loading => no new download over about 0.3 MB; the walk does not start later than today
Proof => before and after screenshots at the same six places and directions in `reviews/`
If a measure does not look clean, or looks less real than before => it is left out

Not in this spec: new terrain data, AI-generated textures, rocks or objects that are not in the data, changes to the maps in Plan, Go / no-go and Debrief
