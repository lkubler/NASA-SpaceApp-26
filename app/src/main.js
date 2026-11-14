import './ui/fonts.js';
import './styles/tokens.css';
import './styles/components.css';
import './styles/app.css';
import { mountNav } from './ui/nav.js';
import { mountMap } from './map/mapView.js';
import './walk/walkView.js'; // attaches its own canvas to #walk-view and loads the terrain

mountMap(document.getElementById('map-view'));
mountNav(document.getElementById('nav'));
import { app } from './state.js';
window.__state = app; // test hook: headless checks set reserve/comms
