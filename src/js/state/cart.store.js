import {
  addCartItem,
  clearAccountCart,
  getCart,
  removeCartItem,
  syncCart,
  updateCartItem,
} from '../api/cart.api.js';
import { getAuthState, subscribeAuth } from './auth.store.js';

const CART_STORAGE_KEY = 'wd_cart';
const listeners = new Set();

let isInitialized = false;
let isSyncing = false;
let state = {
  items: [],
  count: 0,
  total: 0,
  isLoading: false,
  error: null,
  source: 'guest',
};

function formatPriceNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.floor(number)) : 0;
}

function getLineTotal(item) {
  return formatPriceNumber(item.price) * Math.max(1, Number(item.qty || 1));
}

function normalizeGuestItem(item) {
  const slug = item.slug || item.product?.slug || '';
  const size = item.size || null;
  const qty = Math.max(1, Math.floor(Number(item.qty || 1)));
  const key = item.key || `${slug}:${size || 'default'}`;

  return {
    key,
    productId: item.productId || item.id || item.product?.id || null,
    slug,
    name: item.name || item.product?.name || 'Untitled piece',
    price: formatPriceNumber(item.price || item.product?.price),
    imageUrl: item.imageUrl || item.product?.imageUrl || '',
    size,
    qty,
    lineTotal: formatPriceNumber(item.price || item.product?.price) * qty,
  };
}

function normalizeCartPayload(payload, source = state.source) {
  const items = Array.isArray(payload?.items) ? payload.items.map(item => ({
    ...item,
    key: item.id || item.key || `${item.slug}:${item.size || 'default'}`,
    qty: Math.max(1, Math.floor(Number(item.qty || 1))),
    price: formatPriceNumber(item.price),
    lineTotal: getLineTotal(item),
  })) : [];

  return {
    items,
    count: Number.isFinite(Number(payload?.count))
      ? Number(payload.count)
      : items.reduce((sum, item) => sum + item.qty, 0),
    total: Number.isFinite(Number(payload?.total))
      ? Number(payload.total)
      : items.reduce((sum, item) => sum + item.lineTotal, 0),
    source,
  };
}

function readGuestCart() {
  try {
    const items = JSON.parse(localStorage.getItem(CART_STORAGE_KEY) || '[]');
    return normalizeCartPayload({ items: Array.isArray(items) ? items.map(normalizeGuestItem) : [] }, 'guest');
  } catch {
    return normalizeCartPayload({ items: [] }, 'guest');
  }
}

function writeGuestCart(items) {
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items.map(normalizeGuestItem)));
}

function clearGuestCart() {
  localStorage.removeItem(CART_STORAGE_KEY);
}

function emit() {
  const snapshot = getCartState();
  listeners.forEach(listener => listener(snapshot));

  document.dispatchEvent(new CustomEvent('cart:updated', {
    detail: snapshot,
  }));
}

function setState(nextState) {
  state = { ...state, ...nextState };
  emit();
}

function setGuestStateFromStorage() {
  setState({
    ...readGuestCart(),
    isLoading: false,
    error: null,
  });
}

async function loadAccountCart() {
  setState({ isLoading: true, error: null, source: 'account' });

  try {
    const cart = await getCart();
    setState({
      ...normalizeCartPayload(cart, 'account'),
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.warn('[Cart] Could not load account cart.', error);
    setState({ isLoading: false, error: error.message, source: 'account' });
  }
}

export function getCartState() {
  return {
    ...state,
    items: state.items.map(item => ({ ...item })),
  };
}

export function subscribeCart(listener) {
  listeners.add(listener);
  listener(getCartState());
  return () => listeners.delete(listener);
}

export async function syncGuestCartToAccount() {
  const { user } = getAuthState();
  const guestCart = readGuestCart();

  if (!user || isSyncing || !guestCart.items.length) {
    if (user) await loadAccountCart();
    return getCartState();
  }

  isSyncing = true;
  setState({ isLoading: true, error: null });

  try {
    const syncedCart = await syncCart(guestCart.items);
    clearGuestCart();
    setState({
      ...normalizeCartPayload(syncedCart, 'account'),
      isLoading: false,
      error: null,
    });
  } catch (error) {
    console.warn('[Cart] Could not sync guest cart.', error);
    setState({ isLoading: false, error: error.message });
  } finally {
    isSyncing = false;
  }

  return getCartState();
}

export async function addToCart(product, { size = null, qty = 1 } = {}) {
  const { user } = getAuthState();

  if (user) {
    const cart = await addCartItem({
      productId: product.id,
      slug: product.slug,
      size,
      qty,
    });
    setState({
      ...normalizeCartPayload(cart, 'account'),
      isLoading: false,
      error: null,
    });
    return getCartState();
  }

  const cart = readGuestCart();
  const normalizedItem = normalizeGuestItem({
    productId: product.id,
    slug: product.slug,
    name: product.name,
    price: product.price,
    imageUrl: product.imageUrl,
    size,
    qty,
  });
  const existing = cart.items.find(item => item.key === normalizedItem.key);
  const items = existing
    ? cart.items.map(item => item.key === normalizedItem.key
      ? normalizeGuestItem({ ...item, qty: item.qty + normalizedItem.qty })
      : item)
    : [...cart.items, normalizedItem];

  writeGuestCart(items);
  setState({
    ...normalizeCartPayload({ items }, 'guest'),
    isLoading: false,
    error: null,
  });

  return getCartState();
}

export async function updateCartQty(keyOrId, qty) {
  const { user } = getAuthState();

  if (user) {
    const cart = await updateCartItem(keyOrId, { qty });
    setState({
      ...normalizeCartPayload(cart, 'account'),
      isLoading: false,
      error: null,
    });
    return getCartState();
  }

  const cart = readGuestCart();
  const nextQty = Number(qty);
  const items = nextQty <= 0
    ? cart.items.filter(item => item.key !== keyOrId)
    : cart.items.map(item => item.key === keyOrId ? normalizeGuestItem({ ...item, qty: nextQty }) : item);

  writeGuestCart(items);
  setState({
    ...normalizeCartPayload({ items }, 'guest'),
    isLoading: false,
    error: null,
  });

  return getCartState();
}

export async function removeFromCart(keyOrId) {
  const { user } = getAuthState();

  if (user) {
    const cart = await removeCartItem(keyOrId);
    setState({
      ...normalizeCartPayload(cart, 'account'),
      isLoading: false,
      error: null,
    });
    return getCartState();
  }

  return updateCartQty(keyOrId, 0);
}

export async function clearCart() {
  const { user } = getAuthState();

  if (user) {
    try {
      const cart = await clearAccountCart();
      setState({
        ...normalizeCartPayload(cart, 'account'),
        isLoading: false,
        error: null,
      });
      return getCartState();
    } catch (error) {
      console.warn('[Cart] Could not clear account cart.', error);
      setState({ error: error.message });
      throw error;
    }
  }

  clearGuestCart();
  setState({
    items: [],
    count: 0,
    total: 0,
    isLoading: false,
    error: null,
    source: user ? 'account' : 'guest',
  });

  return getCartState();
}

export function initCartStore() {
  if (isInitialized) return;
  isInitialized = true;

  setGuestStateFromStorage();

  subscribeAuth(({ user }) => {
    if (user) {
      syncGuestCartToAccount();
      return;
    }

    setGuestStateFromStorage();
  });
}
