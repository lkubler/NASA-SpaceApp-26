// Number formats used on every screen, so all steps write values the same way.

/** 4980 s -> "1 h 23"; under an hour -> "42 min". approx adds "≈ ". Negative -> "−0 h 32". */
export function fmtDuration(seconds, { approx = false } = {}) {
  if (!isFinite(seconds)) return '–';
  const neg = seconds < 0, s = Math.abs(seconds);
  let h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60);
  if (m === 60) { h += 1; m = 0; }
  const txt = h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`;
  return (approx ? '≈ ' : '') + (neg && (h || m) ? '−' : '') + txt; // never "−0 min"
}

/** Clock "00:42:10". */
export function fmtClock(seconds) {
  const s = Math.max(0, Math.floor(seconds));
  const p = (n) => String(n).padStart(2, '0');
  return `${p(Math.floor(s / 3600))}:${p(Math.floor((s % 3600) / 60))}:${p(s % 60)}`;
}

/** 231 -> "231 m"; 1410 -> "1.41 km". */
export function fmtDistance(m) {
  if (!isFinite(m)) return '–';
  return m >= 1000 ? `${(m / 1000).toFixed(2)} km` : `${Math.round(m)} m`;
}

export function fmtDeg(d) { return `${(Math.round(d * 10) / 10).toFixed(1)}°`; }
export function fmtMSv(v) { return `${v.toFixed(v < 0.1 ? 3 : 2)} mSv`; }
export function fmtPercent(f) { return `${Math.round(f * 100)} %`; }
/** Time of day "14:05" for a Date or ms. */
export function fmtTimeOfDay(d) {
  const t = d instanceof Date ? d : new Date(d);
  return `${String(t.getHours()).padStart(2, '0')}:${String(t.getMinutes()).padStart(2, '0')}`;
}
