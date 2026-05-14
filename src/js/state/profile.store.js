import { updateProfile } from '../api/me.api.js';
import { getAuthState, subscribeAuth } from './auth.store.js';

const listeners = new Set();
let profile = null;

function emit() {
  listeners.forEach(listener => listener(profile));
}

export function getProfileState() {
  return profile ? { ...profile } : null;
}

export function subscribeProfile(listener) {
  listeners.add(listener);
  listener(getProfileState());
  return () => listeners.delete(listener);
}

export function initProfileStore() {
  subscribeAuth(({ user }) => {
    profile = user?.profile || null;
    emit();
  });
}

export async function saveProfile(data) {
  const { user } = getAuthState();
  if (!user) throw new Error('Login is required');

  const response = await updateProfile(data);
  profile = response.profile;
  emit();
  return profile;
}
