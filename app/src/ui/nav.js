import { app, viewFromHash } from '../state.js';

export function mountNav(nav) {
  nav.innerHTML = `<span class="brand">MARSWALK</span>
    <button data-view="map">Map</button><button data-view="walk">Walk</button><button data-view="sources">Sources</button>`;
  nav.addEventListener('click', (e) => {
    const v = e.target.dataset && e.target.dataset.view;
    if (v) location.hash = '#/' + v;
  });
  app.on((st) => {
    document.body.dataset.view = st.view;
    nav.querySelectorAll('button').forEach((b) => b.classList.toggle('active', b.dataset.view === st.view));
  });
  const sync = () => app.set({ view: viewFromHash() });
  addEventListener('hashchange', sync);
  sync();
}
