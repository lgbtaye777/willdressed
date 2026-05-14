import { prisma } from '../prisma.js';
import { clearCart } from './cart.service.js';

function normalizeString(value) {
  return String(value || '').trim();
}

function normalizeOptionalString(value) {
  const normalized = normalizeString(value);
  return normalized || null;
}

function normalizeQty(value) {
  const qty = Number(value);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : 0;
}

async function resolveOrderItems(items) {
  const normalizedItems = [];

  for (const item of items) {
    const qty = normalizeQty(item.qty);
    const productId = normalizeOptionalString(item.productId);
    const slug = normalizeOptionalString(item.slug);

    if (!qty) {
      const error = new Error('Invalid order item quantity');
      error.status = 400;
      throw error;
    }

    if (!productId && !slug) {
      const error = new Error('Product is required');
      error.status = 400;
      throw error;
    }

    const product = productId
      ? await prisma.product.findUnique({ where: { id: productId } })
      : await prisma.product.findUnique({ where: { slug } });

    if (!product || !product.isActive) {
      const error = new Error('Product not found');
      error.status = 400;
      throw error;
    }

    normalizedItems.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      size: normalizeOptionalString(item.size),
      qty,
      imageUrl: product.imageUrl,
    });
  }

  return normalizedItems;
}

async function validateOrderPayload(payload) {
  const customerName = normalizeString(payload.customerName);
  const customerPhone = normalizeString(payload.customerPhone);
  const items = Array.isArray(payload.items) ? payload.items : [];

  if (!customerName) {
    const error = new Error('Customer name is required');
    error.status = 400;
    throw error;
  }

  if (!customerPhone) {
    const error = new Error('Customer phone is required');
    error.status = 400;
    throw error;
  }

  if (!items.length) {
    const error = new Error('Order items are required');
    error.status = 400;
    throw error;
  }

  return {
    customerName,
    customerPhone,
    customerEmail: normalizeOptionalString(payload.customerEmail),
    city: normalizeOptionalString(payload.city),
    address: normalizeOptionalString(payload.address),
    comment: normalizeOptionalString(payload.comment),
    measurements: payload.measurements && typeof payload.measurements === 'object' ? payload.measurements : null,
    items: await resolveOrderItems(items),
  };
}

export async function createOrder({ userId = null, payload }) {
  const data = await validateOrderPayload(payload);
  const total = data.items.reduce((sum, item) => sum + (item.price * item.qty), 0);

  const order = await prisma.order.create({
    data: {
      userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      city: data.city,
      address: data.address,
      comment: data.comment,
      measurements: data.measurements,
      total,
      items: {
        create: data.items.map(item => ({
          productId: item.productId,
          slug: item.slug,
          name: item.name,
          price: item.price,
          size: item.size,
          qty: item.qty,
          imageUrl: item.imageUrl,
        })),
      },
    },
    include: { items: true },
  });

  if (userId) {
    await clearCart(userId);
  }

  return {
    id: order.id,
    status: order.status,
    total: order.total,
  };
}
