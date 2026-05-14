import { getProduct } from '../api/products.api.js';
import { getMeasurementsState, subscribeMeasurements } from '../state/measurements.store.js';
import { addToCart } from '../state/cart.store.js';
import { recommendSize } from './size-recommendation.js';
import { showToast } from './toast.js';

const productCache = new Map();
let modal = null;
let content = null;
let activeProduct = null;
let galleryImages = [];
let currentIndex = 0;
let lastFocusedElement = null;
let galleryTimer = null;
let gallerySwitchTimer = null;
let selectedSize = null;
const galleryIntervalMs = 3600;
const sizeChartColumns = [
  { key: 'chestCm', label: 'Грудь' },
  { key: 'waistCm', label: 'Талия' },
  { key: 'hipsCm', label: 'Бедра' },
  { key: 'shoulderCm', label: 'Плечи' },
  { key: 'sleeveCm', label: 'Рукав' },
  { key: 'inseamCm', label: 'Шаг' },
];

function formatPrice(price) {
  if (!Number.isFinite(Number(price))) return '';
  return `${new Intl.NumberFormat('ru-RU').format(Number(price))} ₽`;
}

function getProductPayload(payload) {
  return payload?.product || payload;
}

function getProductCategory(product) {
  return product?.category || product?.type || 'piece';
}

function getGalleryImages(product) {
  if (Array.isArray(product?.gallery) && product.gallery.length) {
    return product.gallery.filter(Boolean);
  }

  return product?.imageUrl ? [product.imageUrl] : [];
}

function createElement(tag, className, text) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function normalizeSizeToken(size) {
  const token = String(size || '').trim().toLowerCase();
  return token === 'os' ? 'one size' : token;
}

function renderSizes(sizes, recommendedSize = null) {
  const list = createElement('div', 'product-size-list');
  const values = Array.isArray(sizes) && sizes.length ? sizes : ['One size'];

  values.forEach(size => {
    const option = createElement('button', 'product-size-list__option', size);
    const isRecommended = recommendedSize
      && normalizeSizeToken(size) === normalizeSizeToken(recommendedSize);
    const isSelected = normalizeSizeToken(size) === normalizeSizeToken(selectedSize);

    option.type = 'button';
    option.dataset.productSize = size;
    option.classList.toggle('is-recommended', Boolean(isRecommended));
    option.classList.toggle('is-selected', isSelected);
    option.setAttribute('aria-pressed', isSelected ? 'true' : 'false');

    if (isRecommended) {
      option.setAttribute('aria-label', `${size}, recommended size`);
    }

    option.addEventListener('click', () => {
      selectedSize = size;
      list.querySelectorAll('.product-size-list__option').forEach(button => {
        button.classList.toggle('is-selected', button === option);
        button.setAttribute('aria-pressed', button === option ? 'true' : 'false');
      });
      list.closest('.product-detail__info')?.querySelector('[data-product-size-error]')?.setAttribute('hidden', '');
    });

    list.appendChild(option);
  });

  return list;
}

function getSizeChart(product) {
  if (Array.isArray(product?.sizeChart)) return product.sizeChart;
  if (Array.isArray(product?.sizeChart?.sizes)) return product.sizeChart.sizes;
  return [];
}

function formatSizeRange(value) {
  if (Array.isArray(value) && value.length >= 2) {
    return `${value[0]}-${value[1]}`;
  }

  if (Number.isFinite(Number(value))) {
    return String(value);
  }

  return '—';
}

function renderSizeChart(product, recommendedSize = null) {
  const chart = getSizeChart(product).filter(row => row?.size);
  if (!chart.length) return null;

  const activeColumns = sizeChartColumns.filter(column =>
    chart.some(row => row[column.key] != null),
  );

  if (!activeColumns.length) return null;

  const shell = createElement('div', 'product-size-chart');
  const intro = createElement('div', 'product-size-chart__intro');
  intro.append(
    createElement('span', null, 'Размерная сетка'),
    createElement('strong', null, 'см'),
  );

  const scroller = createElement('div', 'product-size-chart__scroller');
  const table = document.createElement('table');
  table.className = 'product-size-chart__table';

  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  headRow.appendChild(createElement('th', null, 'Размер'));
  activeColumns.forEach(column => {
    headRow.appendChild(createElement('th', null, column.label));
  });
  thead.appendChild(headRow);

  const tbody = document.createElement('tbody');
  chart.forEach(row => {
    const tr = document.createElement('tr');
    const isRecommended = recommendedSize
      && normalizeSizeToken(row.size) === normalizeSizeToken(recommendedSize);

    tr.classList.toggle('is-recommended', Boolean(isRecommended));
    tr.dataset.sizeChartRow = String(row.size);
    tr.appendChild(createElement('th', null, row.size));

    activeColumns.forEach(column => {
      tr.appendChild(createElement('td', null, formatSizeRange(row[column.key])));
    });

    tbody.appendChild(tr);
  });

  table.append(thead, tbody);
  scroller.appendChild(table);
  shell.append(intro, scroller);

  return shell;
}

function renderProductNote(title, text, fallback) {
  const section = createElement('div', 'product-detail__section product-detail__section--note');
  section.append(
    createElement('h3', null, title),
    createElement('p', 'product-detail__note', text || fallback),
  );
  return section;
}

function getRecommendedSize(product) {
  const measurementState = getMeasurementsState();
  if (measurementState.source === 'default') return null;
  return recommendSize(product, measurementState.measurements);
}

function getProductSizes(product) {
  return Array.isArray(product?.sizes) && product.sizes.length ? product.sizes : ['One size'];
}

function getInitialSelectedSize(product, recommendedSize) {
  const sizes = getProductSizes(product);

  if (recommendedSize) {
    const match = sizes.find(size => normalizeSizeToken(size) === normalizeSizeToken(recommendedSize));
    if (match) return match;
  }

  return sizes.length === 1 ? sizes[0] : null;
}

function requiresSize(product) {
  return getProductSizes(product).length > 1;
}

function updateProductFitLabel() {
  if (!activeProduct || !content) return;

  const fitElement = content.querySelector('[data-product-detail-fit]');
  if (!fitElement) return;

  const measurementState = getMeasurementsState();
  const size = getRecommendedSize(activeProduct);
  const value = fitElement.querySelector('[data-product-detail-fit-value]');
  const note = fitElement.querySelector('[data-product-detail-fit-note]');

  fitElement.classList.toggle('is-muted', measurementState.source === 'default' || !size);

  if (value) {
    value.textContent = size || 'Fit Finder';
  }

  if (note) {
    note.textContent = measurementState.source === 'default' || !size
      ? 'Укажи параметры, чтобы увидеть рекомендацию.'
      : 'На основе твоих параметров';
  }

  const sizeButtons = content.querySelectorAll('.product-size-list__option');
  sizeButtons.forEach(button => {
    const isRecommended = size
      && normalizeSizeToken(button.textContent) === normalizeSizeToken(size);

    button.classList.toggle('is-recommended', Boolean(isRecommended));
    button.classList.toggle('is-selected', normalizeSizeToken(button.textContent) === normalizeSizeToken(selectedSize));
    button.setAttribute('aria-pressed', normalizeSizeToken(button.textContent) === normalizeSizeToken(selectedSize) ? 'true' : 'false');
  });

  const chartRows = content.querySelectorAll('[data-size-chart-row]');
  chartRows.forEach(row => {
    const isRecommended = size
      && normalizeSizeToken(row.dataset.sizeChartRow) === normalizeSizeToken(size);

    row.classList.toggle('is-recommended', Boolean(isRecommended));
  });
}

function shouldAutoPlayGallery() {
  return galleryImages.length > 1
    && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function stopGalleryAutoplay() {
  if (!galleryTimer) return;
  window.clearInterval(galleryTimer);
  galleryTimer = null;
}

function clearGalleryTransition() {
  if (!gallerySwitchTimer) return;
  window.clearTimeout(gallerySwitchTimer);
  gallerySwitchTimer = null;
}

function startGalleryAutoplay(stageImage, thumbs) {
  stopGalleryAutoplay();

  if (!shouldAutoPlayGallery()) return;

  galleryTimer = window.setInterval(() => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    updateGallery(stageImage, thumbs);
  }, galleryIntervalMs);
}

function restartGalleryAutoplay(stageImage, thumbs) {
  stopGalleryAutoplay();
  startGalleryAutoplay(stageImage, thumbs);
}

function updateGallery(stageImage, thumbs, { immediate = false } = {}) {
  const src = galleryImages[currentIndex];

  if (immediate) {
    stageImage.src = src;
    stageImage.alt = `${activeProduct.name} view ${currentIndex + 1}`;
  } else {
    clearGalleryTransition();
    stageImage.classList.add('is-switching');
    gallerySwitchTimer = window.setTimeout(() => {
      gallerySwitchTimer = null;
      stageImage.addEventListener('load', () => {
        stageImage.classList.remove('is-switching');
      }, { once: true });
      stageImage.addEventListener('error', () => {
        stageImage.classList.remove('is-switching');
      }, { once: true });
      stageImage.src = src;
      stageImage.alt = `${activeProduct.name} view ${currentIndex + 1}`;
    }, 140);
  }

  thumbs.querySelectorAll('.product-gallery__thumb').forEach((thumb, index) => {
    thumb.classList.toggle('is-active', index === currentIndex);
    thumb.setAttribute('aria-pressed', index === currentIndex ? 'true' : 'false');
  });
}

function renderGallery(product) {
  const gallery = createElement('section', 'product-detail__gallery');
  gallery.setAttribute('aria-label', 'Product gallery');

  const stage = createElement('div', 'product-gallery__stage');
  const image = document.createElement('img');
  image.className = 'product-gallery__image';
  image.loading = 'lazy';

  const prev = createElement('button', 'product-gallery__nav product-gallery__nav--prev', '‹');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous image');

  const next = createElement('button', 'product-gallery__nav product-gallery__nav--next', '›');
  next.type = 'button';
  next.setAttribute('aria-label', 'Next image');

  const thumbs = createElement('div', 'product-gallery__thumbs');

  galleryImages.forEach((src, index) => {
    const thumb = createElement('button', 'product-gallery__thumb');
    thumb.type = 'button';
    thumb.setAttribute('aria-label', `${product.name} image ${index + 1}`);
    thumb.dataset.galleryIndex = String(index);

    const thumbImage = document.createElement('img');
    thumbImage.src = src;
    thumbImage.alt = `${product.name} thumbnail ${index + 1}`;
    thumbImage.loading = 'lazy';

    thumb.appendChild(thumbImage);
    thumbs.appendChild(thumb);
  });

  if (galleryImages.length <= 1) {
    prev.hidden = true;
    next.hidden = true;
    thumbs.hidden = true;
  }

  stage.append(prev, image, next);
  gallery.append(stage, thumbs);

  prev.addEventListener('click', () => {
    currentIndex = (currentIndex - 1 + galleryImages.length) % galleryImages.length;
    updateGallery(image, thumbs);
    restartGalleryAutoplay(image, thumbs);
  });

  next.addEventListener('click', () => {
    currentIndex = (currentIndex + 1) % galleryImages.length;
    updateGallery(image, thumbs);
    restartGalleryAutoplay(image, thumbs);
  });

  thumbs.addEventListener('click', event => {
    const thumb = event.target.closest('[data-gallery-index]');
    if (!thumb) return;
    currentIndex = Number(thumb.dataset.galleryIndex);
    updateGallery(image, thumbs);
    restartGalleryAutoplay(image, thumbs);
  });

  gallery.addEventListener('mouseenter', stopGalleryAutoplay);
  gallery.addEventListener('mouseleave', () => startGalleryAutoplay(image, thumbs));
  gallery.addEventListener('focusin', stopGalleryAutoplay);
  gallery.addEventListener('focusout', event => {
    if (gallery.contains(event.relatedTarget)) return;
    startGalleryAutoplay(image, thumbs);
  });

  updateGallery(image, thumbs, { immediate: true });
  startGalleryAutoplay(image, thumbs);
  return gallery;
}

function renderInfo(product) {
  const info = createElement('section', 'product-detail__info');

  const category = createElement('p', 'product-detail__category', getProductCategory(product));
  const title = createElement('h2', null, product.name || 'Untitled piece');
  title.id = 'product-modal-title';
  const price = createElement('p', 'product-detail__price', formatPrice(product.price));
  const description = createElement('p', 'product-detail__description', product.description || 'Capsule wardrobe piece.');

  const sizesSection = createElement('div', 'product-detail__section');
  const fit = createElement('div', 'product-detail__fit');
  fit.dataset.productDetailFit = '';
  const measurementState = getMeasurementsState();
  const recommendedSize = measurementState.source === 'default'
    ? null
    : recommendSize(product, measurementState.measurements);
  selectedSize = getInitialSelectedSize(product, recommendedSize);

  fit.classList.toggle('is-muted', measurementState.source === 'default' || !recommendedSize);
  fit.append(
    createElement('span', 'product-detail__fit-label', 'Recommended fit'),
    createElement('strong', 'product-detail__fit-value', recommendedSize || 'Fit Finder'),
    createElement(
      'span',
      'product-detail__fit-note',
      recommendedSize ? 'На основе твоих параметров' : 'Укажи параметры, чтобы увидеть рекомендацию.',
    ),
  );
  fit.querySelector('.product-detail__fit-value').dataset.productDetailFitValue = '';
  fit.querySelector('.product-detail__fit-note').dataset.productDetailFitNote = '';

  const sizeError = createElement('p', 'product-size-error', 'Choose a size first.');
  sizeError.dataset.productSizeError = '';
  sizeError.hidden = true;

  const addButton = createElement('button', 'btn btn-primary product-detail__add', 'Добавить в корзину');
  addButton.type = 'button';
  addButton.dataset.addToCart = '';
  addButton.addEventListener('click', async () => {
    if (requiresSize(product) && !selectedSize) {
      sizeError.hidden = false;
      return;
    }

    addButton.disabled = true;

    try {
      await addToCart(product, { size: selectedSize, qty: 1 });
      showToast('Добавлено в корзину.', 'success');
    } catch (error) {
      console.warn('[Product] Could not add item to cart.', error);
      showToast(error.message || 'Не удалось добавить товар.', 'error');
    } finally {
      addButton.disabled = false;
    }
  });

  const sizeChart = renderSizeChart(product, recommendedSize);
  sizesSection.append(
    createElement('h3', null, 'Sizes'),
    fit,
    renderSizes(product.sizes, recommendedSize),
  );
  if (sizeChart) {
    sizesSection.appendChild(sizeChart);
  }
  sizesSection.append(sizeError, addButton);

  const compositionSection = renderProductNote(
    'Composition',
    product.composition,
    'Textile composition prepared for prototype display.',
  );

  const careSection = renderProductNote(
    'Care',
    product.care,
    'Handle with care. Avoid high heat.',
  );

  info.append(category, title, price, description, sizesSection, compositionSection, careSection);
  return info;
}

function renderProduct(product) {
  activeProduct = product;
  galleryImages = getGalleryImages(product);
  currentIndex = 0;

  if (!galleryImages.length) {
    galleryImages = [''];
  }

  const detail = createElement('div', 'product-detail');
  detail.append(renderGallery(product), renderInfo(product));
  content.replaceChildren(detail);
}

function renderLoading() {
  stopGalleryAutoplay();
  clearGalleryTransition();
  content.replaceChildren(createElement('div', 'product-modal__message', 'Loading product...'));
}

function renderError() {
  stopGalleryAutoplay();
  clearGalleryTransition();
  content.replaceChildren(createElement('div', 'product-modal__message', 'Product details are temporarily unavailable.'));
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modal.hidden = false;
  document.body.classList.add('is-modal-open');
  modal.querySelector('[data-product-close]')?.focus();
}

function closeModal() {
  stopGalleryAutoplay();
  clearGalleryTransition();
  modal.hidden = true;
  document.body.classList.remove('is-modal-open');
  activeProduct = null;
  galleryImages = [];
  currentIndex = 0;
  selectedSize = null;
  content.replaceChildren();
  lastFocusedElement?.focus?.();
}

async function openProduct(slug) {
  if (!slug) return;

  openModal();
  renderLoading();

  try {
    let product = productCache.get(slug);

    if (!product) {
      product = getProductPayload(await getProduct(slug));
      productCache.set(slug, product);
    }

    renderProduct(product);
  } catch (error) {
    console.warn(`[Product] Could not load product: ${slug}`, error);
    renderError();
  }
}

function handleCatalogClick(event) {
  const card = event.target.closest('[data-product-card]');
  if (!card) return;

  event.preventDefault();
  openProduct(card.dataset.productSlug);
}

function handleCatalogKeydown(event) {
  if (event.key !== 'Enter' && event.key !== ' ') return;

  const card = event.target.closest('[data-product-card]');
  if (!card) return;

  event.preventDefault();
  openProduct(card.dataset.productSlug);
}

function handleEscape(event) {
  if (event.key === 'Escape' && !modal.hidden) {
    closeModal();
  }
}

export function initProductModal(root = document) {
  modal = root.querySelector('[data-product-modal]');
  content = root.querySelector('[data-product-modal-content]');

  if (!modal || !content) return;

  root.addEventListener('click', handleCatalogClick);
  root.addEventListener('keydown', handleCatalogKeydown);
  root.addEventListener('keydown', handleEscape);

  modal.querySelectorAll('[data-product-close]').forEach(button => {
    button.addEventListener('click', closeModal);
  });

  subscribeMeasurements(updateProductFitLabel);
  root.addEventListener('measurements:updated', updateProductFitLabel);
}
