const GUEST_MEASUREMENTS_KEY = 'guest_measurements';

export function getGuestMeasurements() {
  try {
    return JSON.parse(localStorage.getItem(GUEST_MEASUREMENTS_KEY) || '{}');
  } catch {
    return {};
  }
}

export function saveGuestMeasurements(measurements) {
  localStorage.setItem(GUEST_MEASUREMENTS_KEY, JSON.stringify(measurements));
}

export function clearGuestMeasurements() {
  localStorage.removeItem(GUEST_MEASUREMENTS_KEY);
}
