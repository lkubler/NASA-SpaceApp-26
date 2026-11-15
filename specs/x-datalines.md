# Two more lines in Go / no-go
The visitor should understand: a second elevation dataset checks my route, and the radiation data has a consequence for how far I may be from shelter.
Rests on: `PROPOSAL.md` §2 (solar storm), §5 (HiRISE: slope check), `specs/3-go.md`, `research/data-decisions.md`.

## Slope check against HiRISE
Planned route => Go / no-go shows how many metres of it are steeper than the slope rule in the HiRISE elevation model
Status => a caution, never a broken rule; 0 m reads as ok
Info text => says the route is planned on the Access Mars terrain, that HiRISE is an independent elevation model at 1 m, and that the two are aligned to about 2 m
Label => model; source HiRISE with its product id
Sources page => HiRISE entry says it is used in the app for this check

## Solar storm: time to shelter
Planned route => Go / no-go shows the longest time back to the rover from any point of the route, against 2 hours
Limit => from the NASA guidance that an excursion is protected if it ends within 2 hours with access to shielding; value real, the line model
Status => ok within the limit, broken rule above it
Info text => names the rover as the shelter (assumption) and the radiation measurement already shown
Label and source => as every other rule line

Not in this spec: changing the route by these lines, a storm event in the walk, dose as a rule, HiRISE on the map
