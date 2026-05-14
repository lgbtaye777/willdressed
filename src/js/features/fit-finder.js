import {
  defaultMeasurements,
  getMeasurementsState,
  initMeasurementsStore,
  saveMeasurements,
  subscribeMeasurements,
  updateMeasurementsDraft,
} from '../state/measurements.store.js';
import { getAuthState } from '../state/auth.store.js';

const units = {
  heightCm: 'см',
  weightKg: 'кг',
  chestCm: 'см',
  waistCm: 'см',
  hipsCm: 'см',
};

let autosaveTimer = null;
let isEditingLocally = false;
let draftFrame = null;

function beginLocalEdit() {
  isEditingLocally = true;
}

function endLocalEdit() {
  window.setTimeout(() => {
    isEditingLocally = false;
  }, 80);
}

function debounceAutosave(callback) {
  if (autosaveTimer) {
    window.clearTimeout(autosaveTimer);
  }

  autosaveTimer = window.setTimeout(callback, 300);
}

function scheduleDraftUpdate(measurements) {
  if (draftFrame) {
    window.cancelAnimationFrame(draftFrame);
  }

  draftFrame = window.requestAnimationFrame(() => {
    draftFrame = null;
    updateMeasurementsDraft(measurements);
  });
}

function collectMeasurements(form) {
  return {
    heightCm: Number(form.elements.heightCm?.value || defaultMeasurements.heightCm),
    weightKg: Number(form.elements.weightKg?.value || defaultMeasurements.weightKg),
    chestCm: Number(form.elements.chestCm?.value || defaultMeasurements.chestCm),
    waistCm: Number(form.elements.waistCm?.value || defaultMeasurements.waistCm),
    hipsCm: Number(form.elements.hipsCm?.value || defaultMeasurements.hipsCm),
    preferredFit: form.elements.preferredFit?.value || defaultMeasurements.preferredFit,
  };
}

function updateOutput(form, name, value) {
  const output = form.querySelector(`[data-fit-output="${name}"]`);
  if (!output) return;

  output.textContent = `${value} ${units[name] || ''}`.trim();
}

function updateOutputs(form, measurements) {
  Object.entries(measurements).forEach(([name, value]) => {
    updateOutput(form, name, value);
  });
}

function updateRangeProgress(input) {
  const min = Number(input.min || 0);
  const max = Number(input.max || 100);
  const value = Number(input.value || 0);
  const range = max - min || 1;
  const progress = ((value - min) / range) * 100;
  const clampedProgress = Math.max(0, Math.min(100, progress));
  const unit = input.dataset.unit || units[input.name] || 'см';
  const measure = input.closest('[data-fit-measure]');
  const shell = input.closest('.fit-slider-shell');
  const valueElement = measure?.querySelector('[data-fit-floating-value]');

  input.style.setProperty('--range-progress', `${clampedProgress}%`);
  measure?.style.setProperty('--range-progress', `${clampedProgress}%`);
  shell?.style.setProperty('--range-progress', `${clampedProgress}%`);

  if (valueElement) {
    valueElement.textContent = `${value} ${unit}`;
  }
}

function updateRangeProgressAll(form) {
  form.querySelectorAll('input[type="range"]').forEach(updateRangeProgress);
}

function ensureSliderVisual(input) {
  const shell = input.closest('.fit-slider-shell');
  if (!shell || shell.querySelector('.fit-slider-visual')) return;

  shell.querySelectorAll(':scope > .fit-slider-value').forEach(element => {
    element.remove();
  });

  const visual = document.createElement('div');
  visual.className = 'fit-slider-visual';
  visual.setAttribute('aria-hidden', 'true');
  visual.innerHTML = `
    <div class="fit-slider-track">
      <div class="fit-slider-track-fill"></div>
      <div class="fit-slider-track-empty"></div>
      <div class="fit-slider-thumb">
        <div class="fit-slider-thumb-line"></div>
        <div class="fit-slider-value" data-fit-floating-value></div>
      </div>
      <div class="fit-slider-end-dot"></div>
    </div>
  `;

  shell.append(visual);
}

function enhanceRangeFields(form) {
  form.querySelectorAll('input[type="range"]').forEach(input => {
    const measure = input.closest('[data-fit-measure]');
    measure?.classList.add('fit-range');
    ensureSliderVisual(input);

    input.addEventListener('pointerdown', () => {
      beginLocalEdit();
      measure?.classList.add('is-scrubbing');
    });

    input.addEventListener('pointerup', () => {
      measure?.classList.remove('is-scrubbing');
      endLocalEdit();
    });

    input.addEventListener('pointercancel', () => {
      measure?.classList.remove('is-scrubbing');
      endLocalEdit();
    });

    input.addEventListener('focus', () => {
      beginLocalEdit();
      measure?.classList.add('is-scrubbing');
    });
    input.addEventListener('blur', () => {
      measure?.classList.remove('is-scrubbing');
      endLocalEdit();
    });
    updateRangeProgress(input);
  });
}

function setPreferredFit(form, value, { dispatch = true } = {}) {
  const input = form.elements.preferredFit;
  const options = form.querySelectorAll('[data-fit-value]');
  if (!input || !options.length) return;

  input.value = value || defaultMeasurements.preferredFit;

  options.forEach(option => {
    const isActive = option.dataset.fitValue === input.value;
    option.classList.toggle('is-active', isActive);
    option.setAttribute('aria-checked', isActive ? 'true' : 'false');
    option.tabIndex = isActive ? 0 : -1;
  });

  const preferenceLabel = form.querySelector('[data-fit-preference-label]');
  if (preferenceLabel) {
    const activeOption = [...options].find(option => option.dataset.fitValue === input.value);
    preferenceLabel.textContent = activeOption?.textContent?.trim() || input.value;
  }

  if (dispatch) {
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
}

function initFitPreference(form) {
  const preference = form.querySelector('[data-fit-preference]');
  if (!preference) return;

  preference.addEventListener('click', event => {
    const option = event.target.closest('[data-fit-value]');
    if (!option) return;
    setPreferredFit(form, option.dataset.fitValue);
    option.focus();
  });

  preference.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter', ' '].includes(event.key)) return;

    const options = [...preference.querySelectorAll('[data-fit-value]')];
    const activeIndex = Math.max(0, options.findIndex(option => option.classList.contains('is-active')));
    let nextIndex = activeIndex;

    if (event.key === 'ArrowLeft') nextIndex = Math.max(0, activeIndex - 1);
    if (event.key === 'ArrowRight') nextIndex = Math.min(options.length - 1, activeIndex + 1);
    if (event.key === 'Home') nextIndex = 0;
    if (event.key === 'End') nextIndex = options.length - 1;

    event.preventDefault();
    const nextOption = options[nextIndex] || options[activeIndex];
    setPreferredFit(form, nextOption.dataset.fitValue);
    nextOption.focus();
  });
}

function updateFigure(figure, measurements) {
  if (!figure) return;

  figure.style.setProperty('--fit-height', String(measurements.heightCm));
  figure.style.setProperty('--fit-chest', String(measurements.chestCm));
  figure.style.setProperty('--fit-waist', String(measurements.waistCm));
  figure.style.setProperty('--fit-hips', String(measurements.hipsCm));
}

function fillForm(form, measurements) {
  Object.entries(measurements).forEach(([name, value]) => {
    const field = form.elements[name];
    if (!field) return;
    field.value = value;
  });

  setPreferredFit(form, measurements.preferredFit, { dispatch: false });
  updateOutputs(form, measurements);
  updateRangeProgressAll(form);
}

function autosaveGuestMeasurements(form, measurements) {
  if (getAuthState().user) return;

  debounceAutosave(async () => {
    try {
      await saveMeasurements(measurements);
    } catch (error) {
      console.warn('[Fit Finder] Could not autosave guest measurements.', error);
    }
  });
}

function setResult(result, message, type = 'info') {
  if (!result) return;

  result.textContent = message;
  result.dataset.state = type;
}

export function initFitFinder(root = document) {
  const form = root.querySelector('[data-fit-finder-form]');
  if (!form) return;

  initMeasurementsStore();

  const figure = root.querySelector('[data-fit-figure]');
  const result = root.querySelector('[data-fit-finder-result]');
  enhanceRangeFields(form);
  initFitPreference(form);

  subscribeMeasurements(({ measurements }) => {
    if (isEditingLocally) return;
    fillForm(form, measurements);
    updateFigure(figure, measurements);
  });

  form.addEventListener('input', event => {
    beginLocalEdit();

    const measurements = collectMeasurements(form);
    updateOutputs(form, measurements);
    if (event.target?.matches?.('input[type="range"]')) {
      updateRangeProgress(event.target);
    }
    updateFigure(figure, measurements);
    scheduleDraftUpdate(measurements);

    autosaveGuestMeasurements(form, measurements);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    const measurements = collectMeasurements(form);
    const submitButton = form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    setResult(result, 'Сохраняем параметры...', 'info');

    try {
      await saveMeasurements(measurements);

      if (getAuthState().user) {
        setResult(result, 'Параметры сохранены в аккаунте.', 'success');
      } else {
        setResult(result, 'Параметры сохранены на этом устройстве. При регистрации перенесём их в аккаунт.', 'success');
      }
    } catch (error) {
      console.warn('[Fit Finder] Could not save measurements.', error);
      setResult(result, 'Не удалось сохранить параметры. Попробуй ещё раз.', 'error');
    } finally {
      submitButton.disabled = false;
    }
  });

  document.addEventListener('pointerup', () => {
    form.querySelectorAll('.fit-measure.is-scrubbing').forEach(measure => {
      measure.classList.remove('is-scrubbing');
    });
    endLocalEdit();
  });

  const initialMeasurements = getMeasurementsState().measurements;
  fillForm(form, initialMeasurements);
  updateRangeProgressAll(form);
  updateFigure(figure, initialMeasurements);
}
