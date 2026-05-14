export function initCursor() {
  if (window.matchMedia('(pointer: coarse)').matches) return;

  const dot = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');

  if (!dot || !ring) return;

  let ringX = 0;
  let ringY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let rafId = null;
  const lerp = (a, b, t) => a + (b - a) * t;

  function animateRing() {
    ringX = lerp(ringX, mouseX, 0.12);
    ringY = lerp(ringY, mouseY, 0.12);
    ring.style.left = `${ringX}px`;
    ring.style.top = `${ringY}px`;
    rafId = requestAnimationFrame(animateRing);
  }

  window.addEventListener('mousemove', ({ clientX, clientY }) => {
    mouseX = clientX;
    mouseY = clientY;
    dot.style.left = `${clientX}px`;
    dot.style.top = `${clientY}px`;
  }, { passive: true });

  const interactiveSelector = 'a, button, .btn, input, select, textarea, [role="button"]';

  document.addEventListener('mouseover', event => {
    if (event.target.closest(interactiveSelector)) {
      document.body.classList.add('cursor-hover');
    }
  });

  document.addEventListener('mouseout', event => {
    const fromInteractive = event.target.closest(interactiveSelector);
    const toInteractive = event.relatedTarget?.closest?.(interactiveSelector);

    if (fromInteractive && !toInteractive) {
      document.body.classList.remove('cursor-hover');
    }
  });

  animateRing();

  return () => {
    if (rafId) cancelAnimationFrame(rafId);
  };
}
