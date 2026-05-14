import { apiFetch } from './client.js';

export function getMe() {
  return apiFetch('/api/me');
}

export function updateProfile(profile) {
  return apiFetch('/api/me/profile', {
    method: 'PATCH',
    body: JSON.stringify(profile),
  });
}
