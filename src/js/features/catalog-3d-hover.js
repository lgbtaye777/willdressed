const hoverScenes = new WeakMap();
const loadingScenes = new WeakMap();
const disabledCards = new WeakSet();
const boundCards = new WeakSet();
const activeScenes = new Set();
const hideTimers = new WeakMap();
const pendingCards = new WeakSet();
let pointerFrame = null;
let lastPointerEvent = null;

const hoverTuning = {
  hat: { targetSize: 1.2, cameraZ: 3.15, y: -0.04 },
  dress: { targetSize: 1.72, cameraZ: 5.55, y: -0.62 },
  cardigan: { targetSize: 1.72, cameraZ: 5.15, y: -0.5 },
  jeans: { targetSize: 1.58, cameraZ: 5.2, y: -0.6 },
  shirt: { targetSize: 1.86, cameraZ: 4.3, y: -0.16 },
  skirt: { targetSize: 1.58, cameraZ: 5.1, y: -0.62 },
  sweater: { targetSize: 1.66, cameraZ: 5.05, y: -0.48 },
  top: { targetSize: 1.32, cameraZ: 4.9, y: -0.32 },
};

function getHover3DStatus() {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
  const canHover = window.matchMedia('(hover: hover)').matches;
  const mobile = window.matchMedia('(max-width: 767px)').matches;
  const lowPower = document.documentElement.classList.contains('is-low-power');

  return {
    enabled: !reducedMotion && !coarsePointer && canHover && !mobile,
    reducedMotion,
    coarsePointer,
    canHover,
    mobile,
    lowPower,
  };
}

function nextFrame() {
  return new Promise(resolve => {
    window.requestAnimationFrame(resolve);
  });
}

function getHoverConfig(card) {
  const slug = card.dataset.productSlug;
  const modelUrl = card.dataset.productModelUrl;

  if (!slug || !modelUrl) return null;

  const baseConfig = {};
  const tuning = hoverTuning[slug] || {};
  const baseRotation = baseConfig.rotation || { x: 0, y: 0, z: 0 };
  const basePosition = baseConfig.position || { x: 0, y: 0, z: 0 };

  return {
    ...baseConfig,
    id: slug,
    src: modelUrl,
    targetSize: tuning.targetSize || baseConfig.targetSize || 1.9,
    scale: tuning.scale || baseConfig.scale || 1,
    position: {
      x: tuning.x ?? basePosition.x ?? 0,
      y: tuning.y ?? basePosition.y ?? 0,
      z: tuning.z ?? basePosition.z ?? 0,
    },
    rotation: {
      x: tuning.rotationX ?? baseRotation.x ?? 0,
      y: tuning.rotationY ?? baseRotation.y ?? 0,
      z: tuning.rotationZ ?? baseRotation.z ?? 0,
    },
    camera: {
      fov: tuning.fov || 36,
      position: { x: 0, y: 0.06, z: tuning.cameraZ || 4.4 },
      target: { x: 0, y: tuning.targetY || 0, z: 0 },
    },
    controls: {
      enabled: false,
      autoRotate: false,
      enableZoom: false,
      enablePan: false,
    },
  };
}

function applyEditorialMotion(config) {
  const baseRotation = { ...config.rotation };
  const basePosition = { ...config.position };
  let pointerX = 0;
  let pointerY = 0;

  return {
    ...config,
    setPointer(x, y) {
      pointerX += (x - pointerX) * 0.18;
      pointerY += (y - pointerY) * 0.18;
    },
    onBeforeRender({ model, elapsed }) {
      if (!model) return;

      const drift = Math.sin(elapsed * 1.2);
      const float = Math.sin(elapsed * 1.7);

      model.rotation.y = (baseRotation.y || 0) + elapsed * 0.28 + pointerX * 0.16;
      model.rotation.x = (baseRotation.x || 0) + drift * 0.045 + pointerY * 0.06;
      model.rotation.z = baseRotation.z || 0;
      model.position.y = (basePosition.y || 0) + float * 0.035;
    },
  };
}

async function createHoverScene(card) {
  const container = card.querySelector('[data-product-hover-3d]');
  const config = getHoverConfig(card);

  if (!container || !config) return null;

  const [{ createScene }, { loadModel }] = await Promise.all([
    import('../../3d/createScene.js'),
    import('../../3d/loadModel.js'),
  ]);
  const motionConfig = applyEditorialMotion(config);
  const rect = container.getBoundingClientRect();
  console.info('[Catalog 3D] Container size', {
    slug: card.dataset.productSlug,
    width: rect.width,
    height: rect.height,
  });
  console.info('[Catalog 3D] Loading model', motionConfig.src);
  const sceneApi = createScene(container, motionConfig);
  const model = await loadModel(motionConfig);
  sceneApi.setModel(model);
  sceneApi.resize();

  return {
    container,
    sceneApi,
    config: motionConfig,
  };
}

async function showPreview(card) {
  if (disabledCards.has(card)) return;

  const container = card.querySelector('[data-product-hover-3d]');
  if (!container) {
    console.warn('[Catalog 3D] Missing hover container', card);
    return;
  }

  if (!card.dataset.productModelUrl) {
    console.warn('[Catalog 3D] Missing modelUrl', card.dataset.productSlug);
    return;
  }

  console.info('[Catalog 3D] Show preview', card.dataset.productSlug, card.dataset.productModelUrl);

  const hideTimer = hideTimers.get(card);
  if (hideTimer) {
    window.clearTimeout(hideTimer);
    hideTimers.delete(card);
  }

  card.classList.add('is-3d-hover-active');
  pendingCards.add(card);
  container.hidden = false;
  await nextFrame();

  try {
    let entry = hoverScenes.get(card);

    if (!entry) {
      card.classList.add('is-3d-hover-loading');
      let loadingScene = loadingScenes.get(card);
      if (!loadingScene) {
        loadingScene = createHoverScene(card).finally(() => {
          loadingScenes.delete(card);
        });
        loadingScenes.set(card, loadingScene);
      }

      entry = await loadingScene;
      if (!entry) return;
      hoverScenes.set(card, entry);
    }

    if (!pendingCards.has(card)) {
      entry.sceneApi.stop();
      return;
    }

    card.classList.remove('is-3d-hover-loading');
    card.classList.add('is-3d-hover-loaded');
    activeScenes.add(entry.sceneApi);
    entry.sceneApi.start();
  } catch (error) {
    console.warn('[Catalog 3D] Failed model URL:', card.dataset.productModelUrl, error);
    disabledCards.add(card);
    pendingCards.delete(card);
    card.classList.remove('is-3d-hover-active');
    card.classList.remove('is-3d-hover-loading');
    container.hidden = true;
  }
}

function hidePreview(card) {
  const entry = hoverScenes.get(card);
  const container = card.querySelector('[data-product-hover-3d]');

  pendingCards.delete(card);
  card.classList.remove('is-3d-hover-active');
  card.classList.remove('is-3d-hover-loading');
  if (container) {
    const timer = window.setTimeout(() => {
      container.hidden = true;
      hideTimers.delete(card);
    }, 260);
    hideTimers.set(card, timer);
  }

  if (entry) {
    entry.sceneApi.stop();
    activeScenes.delete(entry.sceneApi);
  }
}

function updatePointer(event) {
  const card = event.target.closest('[data-product-card]');
  const entry = card ? hoverScenes.get(card) : null;
  if (!entry?.config?.setPointer) return;

  const rect = card.querySelector('.catalog-card__media')?.getBoundingClientRect();
  if (!rect) return;

  const x = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
  const y = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  entry.config.setPointer(x, y);
}

function requestPointerUpdate(event) {
  lastPointerEvent = event;
  if (pointerFrame) return;

  pointerFrame = window.requestAnimationFrame(() => {
    pointerFrame = null;
    if (lastPointerEvent) updatePointer(lastPointerEvent);
  });
}

function getCardFromHoverEvent(event) {
  const card = event.target.closest?.('[data-product-card]');
  if (!card || card.contains(event.relatedTarget)) return null;
  return card;
}

function bindCard(card) {
  if (boundCards.has(card)) return;
  boundCards.add(card);

  card.addEventListener('mouseenter', () => showPreview(card));
  card.addEventListener('mouseleave', () => hidePreview(card));
  card.addEventListener('mousemove', event => {
    if (!card.classList.contains('is-3d-hover-active')) return;
    requestPointerUpdate(event);
  }, { passive: true });

  card.addEventListener('focusin', () => showPreview(card));
  card.addEventListener('focusout', event => {
    if (card.contains(event.relatedTarget)) return;
    hidePreview(card);
  });
}

function bindCards(root) {
  const cards = root.querySelectorAll('[data-product-card]');
  cards.forEach(bindCard);
  console.info('[Catalog 3D] Bound cards:', cards.length);
}

export function initCatalog3DHover(root = document) {
  const status = getHover3DStatus();
  document.documentElement.classList.toggle('is-catalog-3d-hover-disabled', !status.enabled);

  if (!status.enabled) {
    console.info('[Catalog 3D] Hover disabled', status);
    return;
  }

  console.info('[Catalog 3D] Hover enabled', status);

  bindCards(root);

  root.addEventListener('catalog:rendered', event => {
    console.info('[Catalog 3D] Catalog rendered, binding cards', event.detail);
    bindCards(root);
  });

  root.addEventListener('pointerover', event => {
    if (event.pointerType === 'touch') return;
    const card = getCardFromHoverEvent(event);
    if (!card) return;
    showPreview(card);
  });

  root.addEventListener('pointerout', event => {
    if (event.pointerType === 'touch') return;
    const card = getCardFromHoverEvent(event);
    if (!card) return;
    hidePreview(card);
  });

  root.addEventListener('mouseover', event => {
    const card = getCardFromHoverEvent(event);
    if (!card) return;
    showPreview(card);
  });

  root.addEventListener('mouseout', event => {
    const card = getCardFromHoverEvent(event);
    if (!card) return;
    hidePreview(card);
  });

  root.addEventListener('pointermove', event => {
    const card = event.target.closest('[data-product-card]');
    if (!card || !card.classList.contains('is-3d-hover-active')) return;
    requestPointerUpdate(event);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) return;
    activeScenes.forEach(sceneApi => sceneApi.stop());
    activeScenes.clear();
    root.querySelectorAll('.catalog-card.is-3d-hover-active').forEach(card => hidePreview(card));
  });
}
