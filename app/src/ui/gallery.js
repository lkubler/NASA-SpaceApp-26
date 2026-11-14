// Component gallery (dev/QA page, /gallery.html). Not part of the product flow.
import './fonts.js';
import '../styles/tokens.css';
import '../styles/components.css';
import { panel, tile, chip, stateChip, badge, button, provLegend } from './components.js';

const root = document.getElementById('g');
root.style.cssText = 'padding:24px;max-width:1100px;margin:0 auto;display:grid;grid-template-columns:1fr 1fr;gap:16px;background:var(--paper);font-family:var(--font-body)';
document.body.style.cssText = 'margin:0;background:var(--paper)';
const row = (...n) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;gap:12px;align-items:center;flex-wrap:wrap'; d.append(...n); return d; };
const col = (...n) => { const d = document.createElement('div'); d.style.cssText = 'display:flex;flex-direction:column;gap:16px'; d.append(...n); return d; };

const tiles = row(
  tile({ label: 'Distance', value: '2.4', unit: 'km', prov: 'modelled' }),
  tile({ label: 'Reserve at turn-back', value: '31', unit: '%', prov: 'modelled', state: 'warn' }),
  tile({ label: 'Max slope', value: '23', unit: 'deg', prov: 'measured', state: 'danger' }),
);
const head = document.createElement('h1');
head.textContent = 'Marswalk UI kit';
head.style.cssText = 'grid-column:1/-1;margin:0;font:700 32px var(--font-display);letter-spacing:.04em;text-transform:uppercase;color:var(--mars-deep)';
const sub = document.createElement('p');
sub.textContent = 'Panels, tiles, chips and provenance. Every number says where it came from.';
sub.style.cssText = 'grid-column:1/-1;margin:-8px 0 0;color:var(--ink-muted)';

root.append(head, sub,
  col(
    panel({ label: 'Mission summary', prov: 'modelled', body: tiles }),
    panel({ label: 'Provenance legend', body: provLegend() }),
  ),
  col(
    panel({ label: 'Chips and badges', body: col(
      row(stateChip('ok'), stateChip('warn', 'Steep passage'), stateChip('danger', 'Turn back')),
      row(chip('measured'), chip('modelled'), chip('simulated')),
      row(badge(1), badge(2), badge(3)),
    ) }),
    panel({ label: 'Buttons', body: row(button('Plan route'), button('Compare', { variant: 'secondary' }), button('Reset', { variant: 'ghost' })) }),
  ),
);
