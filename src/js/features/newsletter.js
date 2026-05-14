import { subscribeNewsletter } from '../api/newsletter.api.js';

function setStatus(statusElement, message, type = 'info') {
  if (!statusElement) return;

  statusElement.textContent = message;
  statusElement.dataset.status = type;
}

export function initNewsletter(root = document) {
  const form = root.querySelector('[data-newsletter-form]');
  if (!form) return;

  const statusElement = form.querySelector('[data-newsletter-status]');
  const submitButton = form.querySelector('button[type="submit"]');

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const data = new FormData(form);
    const email = String(data.get('email') || '').trim();
    const marketingConsent = data.get('marketingConsent') === 'on';

    if (!marketingConsent) {
      setStatus(statusElement, 'Для подписки нужно согласие на рассылку.', 'error');
      return;
    }

    submitButton.disabled = true;
    setStatus(statusElement, 'Оформляем подписку...', 'info');

    try {
      await subscribeNewsletter({ email, marketingConsent });
      form.reset();
      setStatus(statusElement, 'Готово. Вы узнаете о новых предложениях первыми.', 'success');
    } catch (error) {
      setStatus(statusElement, error.message || 'Не удалось оформить подписку.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });
}
