import { login as loginRequest, logout as logoutRequest, register as registerRequest } from '../api/auth.api.js';
import { getMe } from '../api/me.api.js';

const listeners = new Set();
let state = {
  user: null,
  status: 'idle',
  error: null,
};

function emit() {
  listeners.forEach(listener => listener(getAuthState()));
}

function setState(nextState) {
  state = { ...state, ...nextState };
  emit();
}

export function getAuthState() {
  return { ...state };
}

export function subscribeAuth(listener) {
  listeners.add(listener);
  listener(getAuthState());
  return () => listeners.delete(listener);
}

export async function initAuthStore() {
  setState({ status: 'loading', error: null });

  try {
    const { user } = await getMe();
    setState({ user, status: 'authenticated', error: null });
  } catch {
    setState({ user: null, status: 'guest', error: null });
  }
}

export async function login(credentials) {
  setState({ status: 'loading', error: null });

  try {
    const { user } = await loginRequest(credentials);
    setState({ user, status: 'authenticated', error: null });
    return user;
  } catch (error) {
    setState({ status: 'guest', error: error.message });
    throw error;
  }
}

export async function register(credentials) {
  setState({ status: 'loading', error: null });

  try {
    const { user } = await registerRequest(credentials);
    setState({ user, status: 'authenticated', error: null });
    return user;
  } catch (error) {
    setState({ status: 'guest', error: error.message });
    throw error;
  }
}

export async function logout() {
  await logoutRequest();
  setState({ user: null, status: 'guest', error: null });
}
