import { apiFetch } from './client.js';

export function getProducts() {
  return apiFetch('/api/products');
}

export function getProduct(slug) {
  return apiFetch(`/api/products/${encodeURIComponent(slug)}`);
}
