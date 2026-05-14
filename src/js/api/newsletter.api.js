import { apiFetch } from './client.js';

export function subscribeNewsletter(payload) {
  return apiFetch('/api/newsletter', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
