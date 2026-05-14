export function initHeroVideo({ breakpoint = 767 } = {}) {
  const desktop = document.querySelector('.video-desktop');
  const mobile = document.querySelector('.video-mobile');

  if (!desktop || !mobile) return;

  const media = window.matchMedia(`(max-width: ${breakpoint}px)`);

  function attachSource(video) {
    if (video.dataset.src && video.getAttribute('src') !== video.dataset.src) {
      video.setAttribute('src', video.dataset.src);
      video.load();
    }
  }

  function detachSource(video) {
    video.pause();
    video.removeAttribute('autoplay');
    if (video.getAttribute('src')) {
      video.removeAttribute('src');
      video.load();
    }
  }

  function syncVideo() {
    const isMobile = media.matches;
    const active = isMobile ? mobile : desktop;
    const inactive = isMobile ? desktop : mobile;

    detachSource(inactive);
    inactive.style.opacity = '0';
    inactive.style.pointerEvents = 'none';

    attachSource(active);
    active.muted = true;
    active.playsInline = true;
    active.setAttribute('autoplay', '');
    active.style.opacity = '1';
    active.style.pointerEvents = 'none';
    active.play().catch(() => {});
  }

  syncVideo();

  if (media.addEventListener) {
    media.addEventListener('change', syncVideo);
  } else {
    media.addListener(syncVideo);
  }
}
