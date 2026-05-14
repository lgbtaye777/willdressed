import {
  getCartState,
  removeFromCart,
  subscribeCart,
  updateCartQty,
} from '../state/cart.store.js';
import { showToast } from './toast.js';

function formatPrice(price) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(price || 0))} ₽`;
}

function getItemKey(item) {
  return item.id || item.key;
}

function updateCartTriggers(cart) {
  document.querySelectorAll('[data-cart-count]').forEach(element => {
    element.textContent = String(cart.count || 0);
    element.hidden = !cart.count;
  });

  document.querySelectorAll('[data-cart-open]').forEach(button => {
    button.setAttribute('aria-label', `Открыть корзину, ${cart.count || 0} вещей`);
  });

  document.querySelectorAll('[data-floating-cart]').forEach(button => {
    button.hidden = !cart.count;
  });

  document.querySelectorAll('[data-floating-cart-count]').forEach(element => {
    element.textContent = String(cart.count || 0);
  });
}

function createCartItem(item) {
  const element = document.createElement('article');
  element.className = 'cart-item';
  element.dataset.cartItem = getItemKey(item);

  const image = document.createElement('img');
  image.src = item.imageUrl || '';
  image.alt = item.name || 'Cart item';
  image.loading = 'lazy';

  const media = document.createElement('div');
  media.className = 'cart-item__media';
  media.appendChild(image);

  const title = document.createElement('h3');
  title.textContent = item.name || 'Untitled piece';

  const meta = document.createElement('p');
  meta.className = 'cart-item__meta';
  meta.textContent = `Размер: ${item.size || 'One size'}`;

  const price = document.createElement('p');
  price.className = 'cart-item__price';
  price.textContent = item.qty > 1
    ? `${formatPrice(item.price)} × ${item.qty}`
    : formatPrice(item.price);

  const lineTotal = document.createElement('strong');
  lineTotal.className = 'cart-item__line-total';
  lineTotal.textContent = formatPrice(item.lineTotal || (item.price * item.qty));

  const minus = document.createElement('button');
  minus.type = 'button';
  minus.textContent = '−';
  minus.setAttribute('aria-label', `Decrease ${item.name}`);

  const qty = document.createElement('span');
  qty.textContent = String(item.qty);

  const plus = document.createElement('button');
  plus.type = 'button';
  plus.textContent = '+';
  plus.setAttribute('aria-label', `Increase ${item.name}`);

  const qtyControls = document.createElement('div');
  qtyControls.className = 'cart-item__qty';
  qtyControls.append(minus, qty, plus);

  const remove = document.createElement('button');
  remove.type = 'button';
  remove.className = 'cart-item__remove';
  remove.textContent = 'Удалить';

  const body = document.createElement('div');
  body.className = 'cart-item__body';
  body.append(title, meta, price, lineTotal, qtyControls, remove);

  element.append(media, body);

  minus.addEventListener('click', async () => {
    try {
      await updateCartQty(getItemKey(item), item.qty - 1);
    } catch (error) {
      showToast(error.message || 'Could not update cart.', 'error');
    }
  });

  plus.addEventListener('click', async () => {
    try {
      await updateCartQty(getItemKey(item), item.qty + 1);
    } catch (error) {
      showToast(error.message || 'Could not update cart.', 'error');
    }
  });

  remove.addEventListener('click', async () => {
    try {
      await removeFromCart(getItemKey(item));
      showToast('Товар удалён из корзины.', 'info');
    } catch (error) {
      showToast(error.message || 'Could not remove item.', 'error');
    }
  });

  return element;
}

function renderCart(drawer, cart) {
  const itemsElement = drawer.querySelector('[data-cart-items]');
  const countLabel = drawer.querySelector('[data-cart-count-label]');
  const totalElement = drawer.querySelector('[data-cart-total]');
  const checkoutButton = drawer.querySelector('[data-checkout-open]');

  updateCartTriggers(cart);

  if (countLabel) {
    countLabel.textContent = `${cart.count || 0} вещей`;
  }

  if (totalElement) {
    totalElement.textContent = formatPrice(cart.total);
  }

  if (checkoutButton) {
    checkoutButton.disabled = !cart.items.length;
  }

  if (!itemsElement) return;

  if (!cart.items.length) {
    const empty = document.createElement('p');
    empty.className = 'cart-empty';
    empty.textContent = 'Корзина пока пустая. Добавь вещь из каталога.';
    itemsElement.replaceChildren(empty);
    return;
  }

  itemsElement.replaceChildren(...cart.items.map(createCartItem));
}

function openDrawer(drawer) {
  drawer.hidden = false;
  document.body.classList.add('is-cart-open');
  drawer.querySelector('[data-cart-close]')?.focus();
}

function closeDrawer(drawer) {
  drawer.hidden = true;
  document.body.classList.remove('is-cart-open');
}

export function initCartDrawer(root = document) {
  const drawer = root.querySelector('[data-cart-drawer]');
  if (!drawer) return;

  root.querySelectorAll('[data-cart-open]').forEach(button => {
    button.addEventListener('click', () => openDrawer(drawer));
  });

  drawer.querySelectorAll('[data-cart-close]').forEach(button => {
    button.addEventListener('click', () => closeDrawer(drawer));
  });

  drawer.querySelector('[data-checkout-open]')?.addEventListener('click', () => {
    closeDrawer(drawer);
    document.dispatchEvent(new CustomEvent('checkout:open'));
  });

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !drawer.hidden) {
      closeDrawer(drawer);
    }
  });

  subscribeCart(cart => renderCart(drawer, cart));
  renderCart(drawer, getCartState());
}
