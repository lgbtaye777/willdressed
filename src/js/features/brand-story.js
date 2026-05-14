const INTRO_PORTION = 0.28;
const INTRO_EXTRA_AT = 0.1;

function clamp(value, min = 0, max = 1) {
  return Math.max(min, Math.min(max, value));
}

function getSectionProgress(section) {
  const rect = section.getBoundingClientRect();
  const max = Math.max(1, section.offsetHeight - window.innerHeight);
  const scrolled = clamp(-rect.top, 0, max);

  return scrolled / max;
}

function createMobileImageCopies(textSlides, imageSlides) {
  textSlides.forEach((slide, index) => {
    if (slide.querySelector('.brand-story__mobile-image')) return;

    const image = imageSlides[index]?.querySelector('img');
    if (!image) return;

    const figure = document.createElement('figure');
    figure.className = 'brand-story__mobile-image';

    const clone = image.cloneNode();
    clone.loading = 'lazy';
    figure.appendChild(clone);
    slide.prepend(figure);
  });
}

export function initBrandStory(root = document) {
  const section = root.querySelector('.brand-story-section');
  if (!section) return;

  const textSlides = [...section.querySelectorAll('[data-story-text-slide]')];
  const imageSlides = [...section.querySelectorAll('[data-story-image-slide]')];
  const progressEl = section.querySelector('[data-story-progress]');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  createMobileImageCopies(textSlides, imageSlides);

  let activeIndex = 0;
  let frameId = null;

  function setActive(index) {
    if (index === activeIndex) return;

    activeIndex = index;
    textSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });
    imageSlides.forEach((slide, slideIndex) => {
      slide.classList.toggle('is-active', slideIndex === index);
    });
  }

  function update() {
    frameId = null;

    if (window.matchMedia('(max-width: 860px)').matches || reducedMotion) {
      section.classList.add('is-brand-story-reduced-motion');
      section.classList.add('is-slides-active');
      section.classList.remove('is-intro-exiting');
      section.classList.add('has-intro-extra');
      setActive(0);
      if (progressEl) progressEl.style.transform = 'scaleY(1)';
      return;
    }

    const progress = getSectionProgress(section);
    const isIntro = progress < INTRO_PORTION;
    const isExitingIntro = progress > INTRO_PORTION * 0.72 && isIntro;

    section.classList.toggle('is-intro-active', isIntro);
    section.classList.toggle('is-slides-active', !isIntro);
    section.classList.toggle('has-intro-extra', progress > INTRO_EXTRA_AT);
    section.classList.toggle('is-intro-exiting', isExitingIntro);

    if (isIntro) {
      setActive(0);
      if (progressEl) progressEl.style.transform = 'scaleY(0)';
      return;
    }

    const slideProgress = clamp((progress - INTRO_PORTION) / (1 - INTRO_PORTION));
    const slideIndex = Math.min(
      textSlides.length - 1,
      Math.floor(slideProgress * textSlides.length)
    );

    setActive(slideIndex);
    if (progressEl) {
      progressEl.style.transform = `scaleY(${slideProgress})`;
    }
  }

  function requestUpdate() {
    if (frameId) return;
    frameId = window.requestAnimationFrame(update);
  }

  window.addEventListener('scroll', requestUpdate, { passive: true });
  window.addEventListener('resize', requestUpdate);
  update();
}
