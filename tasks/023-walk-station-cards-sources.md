# 023 Station cards in Walk; source link fixes
owner: designer
state: open
area: app/src/walk/route3d.js, app/src/ui/stationCard.js, app/src/ui/sources.js

## Goal
- Walk: when the player (or guided walk) is within ~8 m of a named station inside the walk square, show the real Curiosity photo card (app/src/ui/stationCard.js, createStationCard(parent).show(station); stations from loadScience()) as a small corner card; dismissable; doesn't block the HUD.
- Sources page: the Earth background 2.4 mSv/yr link points to an UNSCEAR page that doesn't show the number — replace with a page that states it (verify by opening it), or rephrase with what the linked source says.
- Sources page: mark the 5 Curiosity raw-frame credits as "credit per NASA/JPL image use policy" (only PIA21042's credit is verified on its page; see app/public/data/murray/credits.json).

## Done when
Build, tests, 0 console errors, screenshot docs/ui-023-walk-card.png.
