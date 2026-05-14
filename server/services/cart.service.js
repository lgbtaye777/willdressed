import { prisma } from '../prisma.js';

function toPositiveQty(value, fallback = 1) {
  const qty = Number(value);
  return Number.isFinite(qty) && qty > 0 ? Math.floor(qty) : fallback;
}

function normalizeSize(size) {
  const value = String(size || '').trim();
  return value || 'One size';
}

function formatCartItem(item) {
  const lineTotal = item.product.price * item.qty;

  return {
    id: item.id,
    productId: item.productId,
    slug: item.product.slug,
    name: item.product.name,
    price: item.product.price,
    imageUrl: item.product.imageUrl,
    size: item.size,
    qty: item.qty,
    lineTotal,
  };
}

export function formatCart(items = []) {
  const formattedItems = items.map(formatCartItem);

  return {
    items: formattedItems,
    count: formattedItems.reduce((sum, item) => sum + item.qty, 0),
    total: formattedItems.reduce((sum, item) => sum + item.lineTotal, 0),
  };
}

export async function getCart(userId) {
  const items = await prisma.cartItem.findMany({
    where: { userId },
    include: { product: true },
    orderBy: { createdAt: 'asc' },
  });

  return formatCart(items);
}

export async function addCartItem(userId, { productId, slug, size, qty = 1 }) {
  const product = productId
    ? await prisma.product.findUnique({ where: { id: productId } })
    : await prisma.product.findUnique({ where: { slug } });

  if (!product || !product.isActive) {
    const error = new Error('Product not found');
    error.status = 404;
    throw error;
  }

  const normalizedSize = normalizeSize(size);
  const normalizedQty = toPositiveQty(qty);
  const existing = await prisma.cartItem.findUnique({
    where: {
      userId_productId_size: {
        userId,
        productId: product.id,
        size: normalizedSize,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: { id: existing.id },
      data: { qty: existing.qty + normalizedQty },
    });
  } else {
    await prisma.cartItem.create({
      data: {
        userId,
        productId: product.id,
        size: normalizedSize,
        qty: normalizedQty,
      },
    });
  }

  return getCart(userId);
}

export async function updateCartItem(userId, itemId, qty) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
  });

  if (!item) {
    const error = new Error('Cart item not found');
    error.status = 404;
    throw error;
  }

  const normalizedQty = Number(qty);

  if (!Number.isFinite(normalizedQty) || normalizedQty <= 0) {
    await prisma.cartItem.delete({ where: { id: item.id } });
    return getCart(userId);
  }

  await prisma.cartItem.update({
    where: { id: item.id },
    data: { qty: Math.floor(normalizedQty) },
  });

  return getCart(userId);
}

export async function removeCartItem(userId, itemId) {
  const item = await prisma.cartItem.findFirst({
    where: { id: itemId, userId },
  });

  if (item) {
    await prisma.cartItem.delete({ where: { id: item.id } });
  }

  return getCart(userId);
}

export async function syncCartItems(userId, items = []) {
  for (const item of items) {
    await addCartItem(userId, {
      productId: item.productId,
      slug: item.slug,
      size: item.size,
      qty: item.qty,
    });
  }

  return getCart(userId);
}

export async function clearCart(userId) {
  await prisma.cartItem.deleteMany({ where: { userId } });
  return getCart(userId);
}
