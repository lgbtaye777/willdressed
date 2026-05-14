import { getProducts } from '../api/products.api.js';

const imageFallback = '';
const catalogModelUrls = {
  hat: '/models/hat.glb',
  dress: '/models/dress.glb',
  cardigan: '/models/cardigan.glb',
  jeans: '/models/jeans.glb',
  shirt: '/models/shirt-top.glb',
  skirt: '/models/skirt-bottom.glb',
  sweater: '/models/sweater-top.glb',
  top: '/models/top-upper.glb',
};

function getProductModelUrl(product) {
  const modelUrl = product.modelUrl || catalogModelUrls[product.slug] || '';
  return modelUrl.startsWith('public/') ? modelUrl.replace(/^public/, '') : modelUrl;
}

function formatPrice(price) {
  if (!Number.isFinite(Number(price))) return '';

  return new Intl.NumberFormat('ru-RU', {
    maximumFractionDigits: 0,
  }).format(Number(price)) + ' ₽';
}

function getProductCategory(product) {
  return product.category || product.type || 'piece';
}

function getProductsPayload(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.products)) return payload.products;
  return [];
}

function createMessage(className, message) {
  const element = document.createElement('div');
  element.className = className;
  element.textContent = message;
  return element;
}

function renderProductImage(product) {
  const media = document.createElement('div');
  media.className = 'catalog-card__media';

  if (!product.imageUrl || product.imageUrl === imageFallback) {
    const placeholder = document.createElement('div');
    placeholder.className = 'catalog-card__placeholder';
    placeholder.textContent = product.name?.slice(0, 1) || 'W';
    media.appendChild(placeholder);
    return media;
  }

  const image = document.createElement('img');
  image.className = 'catalog-card__image';
  image.src = product.imageUrl;
  image.alt = product.name || 'Catalog item';
  image.loading = 'lazy';
  image.addEventListener('error', () => {
    image.remove();
    const placeholder = document.createElement('div');
    placeholder.className = 'catalog-card__placeholder';
    placeholder.textContent = product.name?.slice(0, 1) || 'W';
    media.appendChild(placeholder);
  }, { once: true });

  media.appendChild(image);

  if (getProductModelUrl(product)) {
    const hover3d = document.createElement('div');
    hover3d.className = 'catalog-card__hover-3d';
    hover3d.setAttribute('data-product-hover-3d', '');
    hover3d.setAttribute('aria-hidden', 'true');
    hover3d.hidden = true;
    media.appendChild(hover3d);
  }

  return media;
}

export function renderProductCard(product) {
  const article = document.createElement('article');
  article.className = 'catalog-card';
  article.id = `catalog-${product.slug}`;
  article.dataset.productCard = '';
  article.dataset.productSlug = product.slug;
  const modelUrl = getProductModelUrl(product);
  if (modelUrl) {
    article.dataset.productModelUrl = modelUrl;
  }
  article.tabIndex = 0;
  article.setAttribute('role', 'button');
  article.setAttribute('aria-label', `Open ${product.name || 'catalog item'} details`);

  const body = document.createElement('div');
  body.className = 'catalog-card__body';

  const meta = document.createElement('div');
  meta.className = 'catalog-card__meta';

  const category = document.createElement('span');
  category.textContent = getProductCategory(product);

  const price = document.createElement('span');
  price.textContent = formatPrice(product.price);

  const title = document.createElement('h3');
  title.textContent = product.name || 'Untitled piece';

  const description = document.createElement('p');
  description.textContent = product.description || 'Capsule wardrobe piece.';

  meta.append(category, price);
  body.append(meta, title, description);
  article.append(renderProductImage(product), body);

  return article;
}

export function renderCatalog(products, grid, countElement) {
  grid.replaceChildren();

  if (!products.length) {
    grid.appendChild(createMessage('catalog-empty', 'No pieces available yet.'));
    if (countElement) countElement.textContent = '0 pieces';
    return;
  }

  products.forEach(product => {
    grid.appendChild(renderProductCard(product));
  });

  if (countElement) {
    countElement.textContent = `${products.length} pieces`;
  }

  grid.dispatchEvent(new CustomEvent('catalog:rendered', {
    bubbles: true,
    detail: { products },
  }));
}

export async function initCatalog(root = document) {
  const grid = root.querySelector('[data-catalog-grid]');
  const countElement = root.querySelector('[data-catalog-count]');

  if (!grid) return;

  grid.replaceChildren(createMessage('catalog-loading', 'Loading catalog...'));
  if (countElement) countElement.textContent = 'Loading pieces...';

  try {
    const payload = await getProducts();
    renderCatalog(getProductsPayload(payload), grid, countElement);
  } catch (error) {
    console.warn('[Catalog] Could not load products.', error);
    grid.replaceChildren(createMessage('catalog-error', 'Catalog is temporarily unavailable.'));
    if (countElement) countElement.textContent = 'Catalog unavailable';
  }
}
