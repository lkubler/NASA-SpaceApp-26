# 3 Go / no-go
The visitor should understand: the excursion starts only after the plan has been checked against every NASA rule.
Rests on: `specs/rules.md`

List => one line per rule: rule, planned value, limit, status, label
Lines => slope on the route, distance from the rover, reserve on return, excursion length, sample chosen
Radio shadow => its own line with the longest stretch; yellow at most, never red
Summary => distance, time, climb of the route
Map => stays visible with the route
Click on a line => the map shows where on the route the value occurs
Every rule kept => all green; main button "Start excursion"
Rule broken => the line is red and names the rule; main button "Start with 1 broken rule"; the broken rule is carried into the walk and the debrief
Back => to Plan

Not in this spec: weather and radiation windows, cutscene.
