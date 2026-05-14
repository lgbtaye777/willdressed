import { apiFetch } from './client.js';

export function createOrder(payload) {
  return apiFetch('/api/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
