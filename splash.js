/* El Guapo — session welcome. Decorative resources never gate application startup. */
(() => {
  const root = document.documentElement;
  const key = 'eg-splash-seen-v1';
  const params = new URLSearchParams(location.search);
  let skip = !!location.hash || params.get('mode') === 'kitchen' || params.get('view') === 'index';
  try { skip ||= sessionStorage.getItem(key) === 'true'; sessionStorage.setItem(key, 'true'); } catch { /* Still fail open when storage is unavailable. */ }
  if (skip) {
    document.addEventListener('DOMContentLoaded', () => document.getElementById('splash')?.remove(), {once:true});
    return;
  }
  root.classList.add('eg-splash-pending');
  let ended = false, ready = false, artworkReady = false, fontsReady = false;
  let exitTimer, minimumTimer, visibleSince;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const abort = new AbortController();
  const remove = () => {
    root.classList.remove('eg-splash-pending');
    document.getElementById('splash')?.remove();
    clearTimeout(exitTimer);
    clearTimeout(minimumTimer);
    abort.abort();
  };
  function finish(immediate = false) {
    if (ended) { if (immediate) remove(); return; }
    ended = true;
    clearTimeout(safety);
    const splash = document.getElementById('splash');
    if (immediate || reduced.matches || !splash) { remove(); return; }
    splash.classList.add('eg-splash--leaving');
    splash.setAttribute('aria-hidden', 'true');
    exitTimer = setTimeout(remove, 220);
  }
  function maybeFinish() {
    if (ended || !ready || !artworkReady || !fontsReady) return;
    if (reduced.matches) { finish(true); return; }
    if (visibleSince === undefined) return;
    // Let the entrance and a full 1.2s hand cycle be perceived before exit.
    // This minimum is measured from its first frame, not from resource readiness.
    const remaining = 1700 - (performance.now() - visibleSince);
    if (remaining <= 0) { finish(); return; }
    if (minimumTimer === undefined) minimumTimer = setTimeout(() => {
      minimumTimer = undefined;
      maybeFinish();
    }, remaining);
  }
  // Includes the 220ms exit; does not depend on transitionend or app script success.
  const safety = setTimeout(() => finish(), 1780);
  document.addEventListener('eg:ready', () => { ready = true; maybeFinish(); }, {once:true,signal:abort.signal});
  document.addEventListener('keydown', e => { if (e.key === 'Tab' || e.key === 'Escape') finish(true); }, {signal:abort.signal});
  document.addEventListener('focusin', () => finish(true), {signal:abort.signal});
  document.addEventListener('DOMContentLoaded', () => {
    const splash = document.getElementById('splash');
    if (ended) { remove(); return; }
    if (!splash) { finish(true); return; }
    requestAnimationFrame(() => { visibleSince = performance.now(); maybeFinish(); });
    splash.addEventListener('pointerdown', () => finish(true), {signal:abort.signal});
    const image = splash.querySelector('img');
    image.decode().then(() => { artworkReady = true; maybeFinish(); }, () => finish(true));
    // Only the two fonts needed by this cover; never await the complete page's assets.
    Promise.all([document.fonts.load('italic 600 64px Fraunces'), document.fonts.load('400 14px "DM Sans"')])
      .then(() => { fontsReady = true; maybeFinish(); }, () => finish(true));
  }, {once:true,signal:abort.signal});
})();
