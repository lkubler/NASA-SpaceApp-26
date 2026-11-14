// The intro film (specs/x-intro.md, part A): fetched in the background while Go / no-go is open, so the walk
// never waits for a download. Step 3 calls preloadIntroFilm() on mount; the walk takes the film with
// takeIntroFilm() at the click and gets null when it cannot play through yet (still loading, blocked, no decoder).
const FILM_URL = () => (import.meta.env.BASE_URL || './') + 'egress/egress.mp4';
const FILM_TYPE = 'video/mp4; codecs="avc1.640028"'; // H.264 (app/public/egress/egress.mp4)

let film = null; // { video, url, ready, failed }

/** Start fetching the film once (later calls do nothing). */
export function preloadIntroFilm() {
  if (film || typeof document === 'undefined') return;
  const video = document.createElement('video');
  film = { video, url: null, ready: false, failed: false };
  // no decoder for this film (e.g. a browser without H.264): no download at all
  if (!video.canPlayType || !video.canPlayType(FILM_TYPE)) { film.failed = true; return; }
  const f = film;
  video.muted = true; video.defaultMuted = true; video.playsInline = true; video.preload = 'auto';
  video.setAttribute('muted', ''); video.setAttribute('playsinline', '');
  video.addEventListener('canplaythrough', () => { if (!f.failed) f.ready = true; }, { once: true });
  video.addEventListener('error', () => { f.failed = true; f.ready = false; });
  // the whole file as a blob first: once it is here, playback can never stall on the network
  fetch(FILM_URL())
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(`intro film: HTTP ${r.status}`))))
    .then((blob) => {
      if (film !== f) return;
      f.url = URL.createObjectURL(blob);
      video.src = f.url;
      video.load();
    })
    .catch(() => { f.failed = true; });
}

/** The film, ready to play through from the start, or null (part A is then left out). Taken once. */
export function takeIntroFilm() {
  const f = film;
  if (!f || f.failed || !f.ready || f.video.error || f.video.readyState < 4) return null;
  return f.video;
}

/** Free the film once it has played (or was left out). */
export function releaseIntroFilm() {
  const f = film;
  if (!f) return;
  f.failed = true;
  try { f.video.pause(); f.video.removeAttribute('src'); f.video.load(); } catch { /* already gone */ }
  if (f.url) URL.revokeObjectURL(f.url);
  f.url = null;
}
