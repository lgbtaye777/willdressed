export function initDynamicHeader() {
  const header = document.querySelector('[data-dynamic-header]');
  const hero = document.getElementById('hero');

  if (!header || !hero) return;

  let scrollTimer = null;
  let lastScrollY = window.scrollY;
  const idleDelay = 220;

  function getRevealPoint() {
    return Math.max(hero.offsetHeight * 0.82, window.innerHeight * 0.82);
  }

  function isPastHero() {
    return window.scrollY > getRevealPoint();
  }

  function showHeader() {
    if (!isPastHero()) {
      hideHeader();
      return;
    }

    header.classList.add('is-visible');
    header.classList.remove('is-scrolling');
    header.setAttribute('aria-hidden', 'false');
  }

  function hideHeader() {
    header.classList.remove('is-visible');
    header.classList.add('is-scrolling');
    header.setAttribute('aria-hidden', 'true');
  }

  function syncHeader() {
    if (!isPastHero()) {
      hideHeader();
      return;
    }

    showHeader();
  }

  function onScroll() {
    const nextScrollY = window.scrollY;
    const moved = Math.abs(nextScrollY - lastScrollY) > 2;
    lastScrollY = nextScrollY;

    if (!isPastHero()) {
      hideHeader();
      return;
    }

    if (moved) {
      hideHeader();
    }

    window.clearTimeout(scrollTimer);
    scrollTimer = window.setTimeout(showHeader, idleDelay);
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncHeader, { passive: true });
  syncHeader();
}
