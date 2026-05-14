import { getAuthState, subscribeAuth } from './auth.store.js';
import { getProfileState, saveProfile, subscribeProfile } from './profile.store.js';
import { getGuestMeasurements, saveGuestMeasurements, clearGuestMeasurements } from './guest.store.js';

const listeners = new Set();
let isInitialized = false;
let isSyncingGuest = false;
let state = {
  measurements: null,
  source: 'default',
  status: 'idle',
};

export const defaultMeasurements = {
  heightCm: 170,
  weightKg: 60,
  chestCm: 88,
  waistCm: 68,
  hipsCm: 94,
  preferredFit: 'regular',
};

const measurementFields = Object.keys(defaultMeasurements);

function emit() {
  const snapshot = getMeasurementsState();
  listeners.forEach(listener => listener(snapshot));

  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent('measurements:updated', {
      detail: snapshot,
    }));
  }
}

function normalizeMeasurements(measurements = {}) {
  return measurementFields.reduce((result, field) => {
    const value = measurements[field];

    if (field === 'preferredFit') {
      result[field] = value || defaultMeasurements[field];
    } else {
      const number = Number(value);
      result[field] = Number.isFinite(number) && number > 0 ? number : defaultMeasurements[field];
    }

    return result;
  }, {});
}

function hasMeasurements(measurements) {
  return Boolean(measurements && measurementFields.some(field => measurements[field] != null && measurements[field] !== ''));
}

function setState(nextState) {
  state = { ...state, ...nextState };
  emit();
}

function resolveStateFromSources() {
  const { user } = getAuthState();
  const profile = getProfileState();

  if (user) {
    const profileMeasurements = hasMeasurements(profile) ? profile : state.measurements;
    setState({
      measurements: normalizeMeasurements(profileMeasurements || defaultMeasurements),
      source: hasMeasurements(profile) ? 'profile' : 'default',
      status: 'ready',
    });
    return;
  }

  const guestMeasurements = getGuestMeasurements();
  setState({
    measurements: normalizeMeasurements(hasMeasurements(guestMeasurements) ? guestMeasurements : defaultMeasurements),
    source: hasMeasurements(guestMeasurements) ? 'guest' : 'default',
    status: 'ready',
  });
}

export function getMeasurementsState() {
  return {
    ...state,
    measurements: normalizeMeasurements(state.measurements || defaultMeasurements),
  };
}

export function subscribeMeasurements(listener) {
  listeners.add(listener);
  listener(getMeasurementsState());
  return () => listeners.delete(listener);
}

export async function saveMeasurements(measurements) {
  const normalized = normalizeMeasurements(measurements);
  const { user } = getAuthState();

  if (user) {
    setState({ measurements: normalized, source: 'profile', status: 'saving' });
    const profile = await saveProfile(normalized);
    setState({
      measurements: normalizeMeasurements(profile || normalized),
      source: 'profile',
      status: 'ready',
    });
    return getMeasurementsState().measurements;
  }

  saveGuestMeasurements(normalized);
  setState({ measurements: normalized, source: 'guest', status: 'ready' });
  return normalized;
}

export function updateMeasurementsDraft(measurements) {
  const normalized = normalizeMeasurements(measurements);
  const { user } = getAuthState();

  setState({
    measurements: normalized,
    source: user ? 'draft' : 'guest',
    status: 'ready',
  });

  return getMeasurementsState().measurements;
}

export async function syncGuestMeasurementsToAccount() {
  const { user } = getAuthState();
  const guestMeasurements = getGuestMeasurements();

  if (!user || !hasMeasurements(guestMeasurements) || isSyncingGuest) {
    return getMeasurementsState().measurements;
  }

  isSyncingGuest = true;

  try {
    const normalized = normalizeMeasurements(guestMeasurements);
    const profile = await saveProfile(normalized);
    clearGuestMeasurements();
    setState({
      measurements: normalizeMeasurements(profile || normalized),
      source: 'profile',
      status: 'ready',
    });
    return getMeasurementsState().measurements;
  } catch (error) {
    console.warn('[Measurements] Could not sync guest measurements to account.', error);
    resolveStateFromSources();
    return getMeasurementsState().measurements;
  } finally {
    isSyncingGuest = false;
  }
}

export function initMeasurementsStore() {
  if (isInitialized) return;
  isInitialized = true;

  resolveStateFromSources();

  subscribeAuth(({ user }) => {
    if (user && hasMeasurements(getGuestMeasurements())) {
      syncGuestMeasurementsToAccount();
      return;
    }

    resolveStateFromSources();
  });

  subscribeProfile(() => {
    if (!getAuthState().user || isSyncingGuest) return;
    resolveStateFromSources();
  });
}
