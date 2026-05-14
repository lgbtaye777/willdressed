export function showToast(message, type = 'info') {
  const stack = document.querySelector('[data-toast-stack]');
  if (!stack || !message) return;

  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  stack.appendChild(toast);

  requestAnimationFrame(() => toast.classList.add('is-visible'));

  window.setTimeout(() => {
    toast.classList.remove('is-visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, type === 'error' ? 5000 : 3200);
}
