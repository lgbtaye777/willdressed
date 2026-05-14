import { getModelConfig } from './modelConfig.js';
import { createScene } from './createScene.js';
import { clearModelCache, loadModel } from './loadModel.js';

const activeScenes = new Map();
const initialized = new WeakSet();
let observer = null;
let cleanupObserver = null;

function shouldDisable3D() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  return reducedMotion;
}

async function initSingleViewer(container) {
  const modelId = container.dataset.modelId;
  const config = getModelConfig(modelId);

  if (!config) {
    console.warn(`[3D] Unknown model id: ${modelId}`);
    container.classList.add('is-error');
    return;
  }

  container.classList.add('is-loading');

  let sceneApi = null;

  try {
    sceneApi = createScene(container, config);
    const model = await loadModel(config);

    sceneApi.setModel(model);
    sceneApi.resize();
    sceneApi.start();

    container.classList.remove('is-loading');
    container.classList.add('is-loaded');

    activeScenes.set(container, sceneApi);
  } catch (error) {
    console.warn(`[3D] Could not initialize model: ${modelId}`, error);
    sceneApi?.destroy();
    container.classList.remove('is-loading');
    container.classList.add('is-error');
  }
}

function syncVisibility() {
  activeScenes.forEach(sceneApi => {
    if (document.hidden) {
      sceneApi.stop();
    } else {
      sceneApi.start();
    }
  });
}

export function initModelViewers(root = document) {
  const containers = [...root.querySelectorAll('[data-model-id]')];
  if (!containers.length) return;

  if (shouldDisable3D()) {
    containers.forEach(container => container.classList.add('is-3d-disabled'));
    return;
  }

  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      const container = entry.target;
      const sceneApi = activeScenes.get(container);

      if (entry.isIntersecting) {
        if (!initialized.has(container)) {
          initialized.add(container);
          initSingleViewer(container);
        } else if (!document.hidden) {
          sceneApi?.start();
        }
      } else {
        sceneApi?.stop();
      }
    });
  }, {
    root: null,
    rootMargin: '100px',
    threshold: 0.01,
  });

  containers.forEach(container => observer.observe(container));

  cleanupObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) return;

      const container = entry.target;
      const sceneApi = activeScenes.get(container);
      if (!sceneApi) return;

      sceneApi.destroy();
      activeScenes.delete(container);
      initialized.delete(container);
      container.classList.remove('is-loaded', 'is-loading', 'is-error');
      container.innerHTML = '';
      observer?.observe(container);

      if (activeScenes.size === 0) {
        clearModelCache();
      }
    });
  }, {
    root: null,
    rootMargin: '1400px',
    threshold: 0,
  });

  containers.forEach(container => cleanupObserver.observe(container));
  document.addEventListener('visibilitychange', syncVisibility);
}

export function destroyModelViewers() {
  observer?.disconnect();
  cleanupObserver?.disconnect();
  document.removeEventListener('visibilitychange', syncVisibility);
  activeScenes.forEach(sceneApi => sceneApi.destroy());
  activeScenes.clear();
  clearModelCache();
}
