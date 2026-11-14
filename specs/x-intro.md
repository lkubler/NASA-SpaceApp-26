# Intro film
The visitor should understand: the rover brought me here; now I step out and the walk is mine.
Rests on: `videoprompt.md` (team), `app/public/egress_kit.zip` (the team's film and its README), `specs/4-walk.md`.

When => after the click on "Start excursion", before the walk; only for the first walk of a session, later walks start directly
Skip => a "Skip" button and any key end it at once and start the walk
Part A, film => the team's original film, unchanged, up to the first fully black frame after the push-in (about 8 s); "AI-generated" written into the picture; no NASA logos, flags or mission names
Part B, stepping out => not a film: the real walk scene moves the camera; fade in from black at the rover, step down to eye height, a few metres forward, turn to face the route; about 4 s; calm, no shaking, no effects
Part B, end => ends exactly in the view the walk starts in, for every spot and every route; then the helmet display fades in and the controls are handed over
Helmet => the helmet frame is visible during part B; the rest of the display is hidden until the end
Loading => the film is fetched in the background while Go / no-go is open; if it is not ready at the click, part A is left out and only part B plays; the walk never waits for a download
File size => the film file is at most about 1.5 MB
Suit clock => starts when the controls are handed over, not before
Dev jump (`?step=4`) => no intro
Cleanup => `egress_kit.zip` leaves `app/public`; `videoprompt.md` is deleted; an entry in `docs/ai-use.md` and on the Sources page

Not in this spec: sitting inside the rover, a rover interior, a drive inside the site, sound, a film between Mission and Plan
