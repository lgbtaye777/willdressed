const finalSecondThreshold = 1;
const carouselIntervalMs = 3200;

function setActiveCarouselImage(images, index) {
  images.forEach((image, imageIndex) => {
    image.classList.toggle('is-active', imageIndex === index);
  });
}

export function initLatestDropsShowcase(root = document) {
  const showcase = root.querySelector('[data-latest-showcase]');
  const video = root.querySelector('[data-latest-showcase-video]');
  const carousel = root.querySelector('[data-latest-showcase-carousel]');

  if (!showcase || !video || !carousel) return;

  const section = showcase.closest('.latest-drops-section') || showcase;
  const images = [...carousel.querySelectorAll('img')];
  let carouselIndex = 0;
  let carouselTimer = null;
  let hasCompleted = false;
  let isSectionActive = false;

  function startCarousel() {
    if (carouselTimer || images.length <= 1) return;

    carouselTimer = window.setInterval(() => {
      carouselIndex = (carouselIndex + 1) % images.length;
      setActiveCarouselImage(images, carouselIndex);
    }, carouselIntervalMs);
  }

  function stopCarousel() {
    if (!carouselTimer) return;
    window.clearInterval(carouselTimer);
    carouselTimer = null;
  }

  function setEndingState(isEnding) {
    showcase.classList.toggle('is-ending', isEnding);

    if (isEnding) {
      startCarousel();
    } else {
      stopCarousel();
      carouselIndex = 0;
      setActiveCarouselImage(images, carouselIndex);
    }
  }

  function completeShowcase() {
    if (hasCompleted) return;

    hasCompleted = true;
    showcase.classList.remove('is-transitioning');
    video.pause();
    setEndingState(true);
  }

  function syncEndingState() {
    if (hasCompleted) return;

    if (!Number.isFinite(video.duration) || video.duration <= finalSecondThreshold) {
      showcase.classList.remove('is-transitioning');
      return;
    }

    showcase.classList.toggle(
      'is-transitioning',
      video.duration - video.currentTime <= finalSecondThreshold
    );
  }

  function seekVideoToStart() {
    if (!Number.isFinite(video.duration)) return;

    try {
      video.currentTime = 0;
    } catch (error) {
      console.warn('[Latest drops] Could not reset showcase video.', error);
    }
  }

  function resetShowcase() {
    hasCompleted = false;
    showcase.classList.remove('is-paused', 'is-transitioning');
    setEndingState(false);
    seekVideoToStart();
  }

  function playFromStart() {
    resetShowcase();

    video.play().catch(() => {
      showcase.classList.add('is-paused');
    });
  }

  function pauseAndReset() {
    video.pause();
    resetShowcase();
  }

  video.loop = false;
  video.addEventListener('loadedmetadata', () => {
    if (!isSectionActive) seekVideoToStart();
  });
  video.addEventListener('timeupdate', syncEndingState);
  video.addEventListener('seeked', syncEndingState);
  video.addEventListener('ended', completeShowcase);
  video.addEventListener('play', syncEndingState);

  if (!('IntersectionObserver' in window)) {
    playFromStart();
    return;
  }

  const observer = new IntersectionObserver(entries => {
    const entry = entries[0];
    const isVisible = entry.isIntersecting && entry.intersectionRatio >= 0.35;

    if (isVisible && !isSectionActive) {
      isSectionActive = true;
      playFromStart();
      return;
    }

    if (!isVisible && isSectionActive) {
      isSectionActive = false;
      pauseAndReset();
    }
  }, {
    threshold: [0, 0.35],
  });

  observer.observe(section);
}
