import { APP_CONFIG } from '../config.js';

export function initFx({ lowPower = false } = {}) {
  const defs = new Map();
  const registry = new Map();
  const shared = {
    scrollY: window.scrollY,
    prevScrollY: window.scrollY,
    mouseX: 0,
    mouseY: 0,
    viewportW: window.innerWidth,
    viewportH: window.innerHeight,
    rafId: null,
  };

  const fx = {
    define(name, def) {
      defs.set(name, def);
    },
    register(el, name, options = {}) {
      if (!el) return this;

      const def = defs.get(name);
      if (!def) return this;

      const localState = def.init ? def.init(el, options, shared) : {};
      const entries = registry.get(el) || [];
      entries.push({ name, options, state: localState, def });
      registry.set(el, entries);
      return this;
    },
  };

  function flush() {
    shared.rafId = null;
    registry.forEach((entries, el) => {
      entries.forEach(({ def, options, state }) => {
        def.onScroll?.(el, options, state, shared);
        def.onMouse?.(el, options, state, shared);
      });
    });
  }

  function requestFlush() {
    if (shared.rafId) return;
    shared.rafId = requestAnimationFrame(flush);
  }

  fx.define('parallax', {
    init(el, { speed = 0.4 }) { return { speed }; },
    onScroll(el, options, state) {
      el.style.transform = `translate3d(0, ${shared.scrollY * options.speed}px, 0)`;
    },
  });

  fx.define('fadeIn', {
    init(el, { duration = '600ms', easing = 'ease' }) {
      el.style.opacity = '0';
      el.style.transform = 'translate3d(0, 24px, 0)';
      el.style.transition = `opacity ${duration} ease, transform ${duration} ${easing}`;
      return { triggered: false };
    },
    onScroll(el, { threshold = 0.15 }, state) {
      if (state.triggered) return;

      if (el.getBoundingClientRect().top < shared.viewportH * (1 - threshold)) {
        el.style.opacity = '1';
        el.style.transform = 'translate3d(0, 0, 0)';
        state.triggered = true;
      }
    },
  });

  fx.define('heroCollapse', {
    init(el) {
      el.style.willChange = 'transform, opacity';
      return {};
    },
    onScroll(el) {
      const progress = Math.min(shared.scrollY / shared.viewportH, 1);
      const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      el.style.transform = `translateY(${-(eased * 30)}vh) scale(${1 - eased * 0.04})`;
      el.style.opacity = String(Math.max(0, 1 - eased * 1.4));

      const heroContent = document.getElementById('heroContent');
      const scrollHint = document.getElementById('scrollHint');
      if (heroContent) heroContent.style.transform = `translateY(${-(eased * 12)}px)`;
      if (scrollHint) scrollHint.style.opacity = String(Math.max(0, 1 - progress * 4) * 0.35);
    },
  });

  fx.define('blurVeil', {
    init() {
      const hero = document.getElementById('hero');
      return {
        currentR: 0,
        targetR: 0,
        heroRect: hero?.getBoundingClientRect(),
      };
    },
    onMouse(el, { radius = APP_CONFIG.blur.radius }, state) {
      if (!state.heroRect) return;

      const rect = state.heroRect;
      el.style.setProperty('--cx', `${shared.mouseX - rect.left}px`);
      el.style.setProperty('--cy', `${shared.mouseY - rect.top}px`);

      const isInHero = shared.mouseX > rect.left && shared.mouseX < rect.right && shared.mouseY > rect.top && shared.mouseY < rect.bottom;
      state.targetR = isInHero ? radius : 0;
      state.currentR += (state.targetR - state.currentR) * 0.09;
      el.style.setProperty('--r', `${Math.round(state.currentR)}px`);
    },
    onResize(el, options, state) {
      state.heroRect = document.getElementById('hero')?.getBoundingClientRect();
      return state;
    },
  });

  fx.define('buttonHoverBlur', {
    init(el) {
      document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', () => el.classList.add('button-hovered'));
        btn.addEventListener('mouseleave', () => el.classList.remove('button-hovered'));
      });
      return {};
    },
  });

  fx.define('houseParallax', {
    init(el, { speed = 0.3 }) {
      el.style.willChange = 'transform';
      return { speed };
    },
    onScroll(el, options) {
      const elTop = el.parentElement.getBoundingClientRect().top + shared.scrollY;
      const relativeScroll = Math.max(0, shared.scrollY - (elTop - shared.viewportH));
      const offset = relativeScroll * options.speed;
      el.style.transform = `translate3d(0, -${offset}px, 0)`;
    },
  });

  const hero = document.getElementById('hero');
  const heroContent = document.getElementById('heroContent');
  const blurVeil = document.getElementById('blurVeil');
  const stubSections = document.querySelectorAll('.section-stub');

  fx
    .register(hero, 'heroCollapse')
    .register(heroContent, 'parallax', { speed: 0.25 });

  if (!lowPower) {
    fx
      .register(blurVeil, 'blurVeil', { radius: APP_CONFIG.blur.radius })
      .register(blurVeil, 'buttonHoverBlur');
  }

  stubSections.forEach(el => fx.register(el, 'fadeIn', { threshold: 0.1, duration: '700ms' }));

  const houseImage = document.querySelector('.house-image');
  if (houseImage) fx.register(houseImage, 'houseParallax', { speed: 0.35 });

  window.addEventListener('scroll', () => {
    shared.prevScrollY = shared.scrollY;
    shared.scrollY = window.scrollY;
    registry.forEach(entries => {
      entries.forEach(entry => {
        if (entry.name === 'blurVeil') {
          entry.state.heroRect = document.getElementById('hero')?.getBoundingClientRect();
        }
      });
    });
    requestFlush();
  }, { passive: true });

  if (!lowPower) {
    window.addEventListener('mousemove', event => {
      shared.mouseX = event.clientX;
      shared.mouseY = event.clientY;
      requestFlush();
    }, { passive: true });
  }

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      shared.viewportW = window.innerWidth;
      shared.viewportH = window.innerHeight;
      registry.forEach(entries => entries.forEach(entry => {
        if (entry.def.onResize) {
          entry.state = entry.def.onResize(null, entry.options, entry.state, shared) ?? entry.state;
        }
      }));
      requestFlush();
    }, APP_CONFIG.scroll.debounceResize);
  }, { passive: true });

  requestFlush();
}
