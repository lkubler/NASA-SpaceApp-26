Task: finish the rover egress film. Keep the original film up to the fade to black, then render a new
first-person ending in the app's real 3D walk scene and join both into one film.

This prompt is in videoprompt.md at the repo root. Delete that file when the task is done.

Run `python3 scripts/now.py` first and read CLAUDE.md.

Inputs
- Kit: app/public/egress_kit.zip. Unzip it into a scratch folder, not into the repo. It holds the
  original film and the render scripts. egress_render.py holds the camera timeline shot(t): drive-in,
  orbit, push-in to the hatch with a fade to black, then first person stepping out of the rover.

Steps
1. Keep the original film unchanged up to the first fully black frame after the push-in (about 8.3 s).
2. Find the app's 3D first-person scene yourself (terrain, sky, rover, camera, helmet). Render the new
   ending in that real scene. Do not rebuild it from the kit's placeholder terrain.
3. New ending: fade in from black, step out of the rover's hatch down to eye height, walk a few metres,
   and turn to face the route. Follow the motion of the kit's first-person shot. The last frame must
   be exactly the view the walk starts in, so the film cuts into the live app without a jump.
4. Show the astronaut's helmet as it looks in the scene, and hide the other HUD elements.
5. Join both parts with ffmpeg at the original's fps and resolution, libx264, yuv420p. Keep the total
   under 30 s.
6. Add a visible "AI-generated" watermark, with no NASA logos, flags or mission names. Add an entry to
   docs/ai-use.md.

Output: app/public/egress/egress.mp4. Do not commit raw frames or the zip.
Verify: look at frames around the cut and at the last frame. Compare the last frame with the app's
walk start screen. Report what matches and what does not.
Finally: delete videoprompt.md from the repo root.
