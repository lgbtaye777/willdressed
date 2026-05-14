import { createOrder } from '../api/orders.api.js';
import { clearCart, getCartState, subscribeCart } from '../state/cart.store.js';
import { getMeasurementsState } from '../state/measurements.store.js';
import { closeAppSplash, showAppSplash } from './app-splash.js';
import { showToast } from './toast.js';

function formatPrice(price) {
  return `${new Intl.NumberFormat('ru-RU').format(Number(price || 0))} ₽`;
}

function getLineTotal(item) {
  return Number(item.price || 0) * Number(item.qty || 1);
}

function shortOrderId(id = '') {
  return `#${String(id).slice(-8).toUpperCase()}`;
}

function renderSummary(root, cart = getCartState()) {
  const summary = root.querySelector('[data-checkout-summary]');
  if (!summary) return;

  if (!cart.items.length) {
    summary.textContent = 'Корзина пока пустая.';
    return;
  }

  const card = document.createElement('div');
  card.className = 'checkout-summary-card';

  const note = document.createElement('p');
  note.className = 'checkout-summary__note';
  note.textContent = `${cart.count} вещей. Проверь размеры и количество перед созданием заявки.`;

  const list = document.createElement('div');
  list.className = 'checkout-summary__items';

  cart.items.forEach(item => {
    const lineTotalValue = item.lineTotal || getLineTotal(item);
    const row = document.createElement('article');
    row.className = 'checkout-summary-item';

    const media = document.createElement('div');
    media.className = 'checkout-summary-item__media';

    if (item.imageUrl) {
      const image = document.createElement('img');
      image.className = 'checkout-summary-item__image';
      image.src = item.imageUrl;
      image.alt = item.name || 'Товар';
      image.loading = 'lazy';
      media.appendChild(image);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'checkout-summary-item__placeholder';
      placeholder.textContent = item.name?.slice(0, 1) || 'W';
      media.appendChild(placeholder);
    }

    const body = document.createElement('div');
    body.className = 'checkout-summary-item__body';

    const top = document.createElement('div');
    top.className = 'checkout-summary-item__top';

    const title = document.createElement('h4');
    title.textContent = item.name || 'Товар';

    const lineTotal = document.createElement('strong');
    lineTotal.textContent = formatPrice(lineTotalValue);

    top.append(title, lineTotal);

    const size = document.createElement('p');
    size.textContent = `Размер: ${item.size || 'One size'}`;

    const unit = document.createElement('p');
    unit.textContent = item.qty > 1
      ? `${formatPrice(item.price)} × ${item.qty}`
      : formatPrice(item.price);

    body.append(top, size, unit);
    row.append(media, body);
    list.appendChild(row);
  });

  const total = document.createElement('div');
  total.className = 'checkout-summary__total';

  const totalLabel = document.createElement('span');
  totalLabel.textContent = 'Итого';

  const totalPrice = document.createElement('strong');
  totalPrice.textContent = formatPrice(cart.total);

  total.append(totalLabel, totalPrice);
  card.append(note, list, total);
  summary.replaceChildren(card);
}

function formToPayload(form) {
  const data = new FormData(form);
  const cart = getCartState();
  const measurementsState = getMeasurementsState();

  return {
    customerName: data.get('customerName'),
    customerPhone: data.get('customerPhone'),
    customerEmail: data.get('customerEmail'),
    city: data.get('city'),
    address: data.get('address'),
    comment: data.get('comment'),
    measurements: measurementsState.source === 'default' ? null : measurementsState.measurements,
    items: cart.items.map(item => ({
      productId: item.productId,
      slug: item.slug,
      size: item.size,
      qty: item.qty,
    })),
  };
}

function setError(modal, message) {
  const error = modal.querySelector('[data-checkout-error]');
  if (!error) return;

  error.textContent = message || '';
  error.hidden = !message;
}

function openCheckout(modal) {
  modal.hidden = false;
  document.body.classList.add('is-checkout-open');
  setError(modal, '');
  renderSummary(modal);
  modal.querySelector('[data-checkout-close]')?.focus();
}

function closeCheckout(modal) {
  modal.hidden = true;
  document.body.classList.remove('is-checkout-open');
}

export function initCheckout(root = document) {
  const modal = root.querySelector('[data-checkout-modal]');
  const form = root.querySelector('[data-checkout-form]');

  if (!modal || !form) return;

  document.addEventListener('checkout:open', () => openCheckout(modal));

  modal.querySelectorAll('[data-checkout-close]').forEach(button => {
    button.addEventListener('click', () => closeCheckout(modal));
  });

  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !modal.hidden) {
      closeCheckout(modal);
    }
  });

  subscribeCart(() => {
    if (!modal.hidden) renderSummary(modal);
  });

  form.addEventListener('submit', async event => {
    event.preventDefault();

    if (!form.reportValidity()) {
      return;
    }

    const cart = getCartState();

    if (!cart.items.length) {
      setError(modal, 'Корзина пуста.');
      return;
    }

    const submit = form.querySelector('button[type="submit"]');
    submit.disabled = true;
    setError(modal, '');

    try {
      const { order } = await createOrder(formToPayload(form));
      await clearCart();
      closeCheckout(modal);

      showAppSplash({
        type: 'success',
        kicker: 'Готово',
        title: 'Заявка оформлена',
        message: 'Мы получили заявку и свяжемся с вами для уточнения деталей.',
        meta: [
          { label: 'Номер заявки', value: shortOrderId(order.id) },
          { label: 'Итого', value: formatPrice(order.total) },
        ],
        primaryText: 'Вернуться к каталогу',
        onPrimary: () => {
          closeAppSplash();
          document.getElementById('catalog')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        },
      });

      showToast('Заявка оформлена.', 'success');
    } catch (error) {
      console.warn('[Checkout] Could not create order.', error);
      setError(modal, error.message || 'Не удалось создать заявку.');
    } finally {
      submit.disabled = false;
    }
  });
}
