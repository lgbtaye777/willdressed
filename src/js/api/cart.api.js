import { apiFetch } from './client.js';

export function getCart() {
  return apiFetch('/api/cart');
}

export function addCartItem(item) {
  return apiFetch('/api/cart/items', {
    method: 'POST',
    body: JSON.stringify(item),
  });
}

export function updateCartItem(id, data) {
  return apiFetch(`/api/cart/items/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function removeCartItem(id) {
  return apiFetch(`/api/cart/items/${id}`, {
    method: 'DELETE',
  });
}

export function syncCart(items) {
  return apiFetch('/api/cart/sync', {
    method: 'POST',
    body: JSON.stringify({ items }),
  });
}

export function clearAccountCart() {
  return apiFetch('/api/cart', {
    method: 'DELETE',
  });
}
