import './styles/base.css';
import { startShell } from './frame/shell.js';
import { devPrefill } from './frame/devjump.js';

const params = new URLSearchParams(location.search);
devPrefill(params)
  .then((startStep) => startShell(document.getElementById('app'), { startStep }))
  .catch((e) => { console.error(e); startShell(document.getElementById('app')); });
