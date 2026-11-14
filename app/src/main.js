import './ui/fonts.js';
import './styles/tokens.css';
import './styles/components.css';
import './styles/app.css';
import './styles/briefing.css';
import { mountBriefing } from './ui/briefing.js';
import { mountSources } from './ui/sources.js';
import { startLoadTracking } from './ui/loading.js';
import { mountNav } from './ui/nav.js';
import { mountMap } from './map/mapView.js';
import './walk/walkView.js'; // attaches its own canvas to #walk-view and loads the terrain

startLoadTracking();
mountMap(document.getElementById('map-view'));
mountNav(document.getElementById('nav'));
mountBriefing(document.getElementById('briefing'));
mountSources(document.getElementById('sources'));
import { app } from './state.js';
window.__state = app; // test hook: headless checks set reserve/comms
