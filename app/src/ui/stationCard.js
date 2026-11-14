// Station photo card: real Curiosity photo, credit line, sol, camera. Used by the Map; Walk can reuse it:
//   const card = createStationCard(parentEl); card.show(station)   // station from loadScience().stations
// `station` = {name, note, photos:[{url,title,sol,camera,credit}]}.
import { chip } from './components.js';

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

export function createStationCard(parent) {
  const root = el('aside', 'poi-card'); root.hidden = true; root.setAttribute('aria-label', 'Station photo');
  const close = el('button', 'poi-x', '×'); close.type = 'button'; close.setAttribute('aria-label', 'Close photo');
  const title = el('div', 'poi-t'), note = el('div', 'poi-n'), img = el('img', 'poi-img'), cap = el('div', 'poi-cap'), meta = el('div', 'poi-meta'), credit = el('div', 'poi-credit'), tabs = el('div', 'poi-tabs');
  img.alt = '';
  root.append(close, title, note, img, cap, meta, credit, tabs);
  parent.append(root);
  let cur = null;
  function showPhoto(i) {
    const p = cur.photos[i];
    img.src = p.url; img.alt = p.title; cap.textContent = p.title;
    meta.replaceChildren(chip('measured', 'Unprocessed image from Curiosity, resized only.'), document.createTextNode(` Sol ${p.sol} · ${p.camera}`));
    credit.textContent = 'Credit: ' + p.credit + ' (raw, unprocessed)';
    [...tabs.children].forEach((b, j) => b.setAttribute('aria-pressed', String(j === i)));
  }
  close.addEventListener('click', () => { root.hidden = true; });
  return {
    el: root,
    show(st) {
      cur = st; title.textContent = st.name; note.textContent = st.note;
      tabs.replaceChildren(...st.photos.map((_, i) => { const b = el('button', 'poi-tab', String(i + 1)); b.type = 'button'; b.addEventListener('click', () => showPhoto(i)); return b; }));
      tabs.hidden = st.photos.length < 2;
      if (st.photos.length) showPhoto(0);
      root.hidden = false;
    },
    hide() { root.hidden = true; },
  };
}
