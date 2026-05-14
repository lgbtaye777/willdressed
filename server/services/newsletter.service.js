import { prisma } from '../prisma.js';

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function createNewsletterSubscription(payload = {}) {
  const email = normalizeEmail(payload.email);
  const marketingConsent = payload.marketingConsent === true;

  if (!isValidEmail(email)) {
    const error = new Error('Введите корректный email.');
    error.status = 400;
    throw error;
  }

  if (!marketingConsent) {
    const error = new Error('Для подписки нужно согласие на рассылку.');
    error.status = 400;
    throw error;
  }

  const subscriber = await prisma.newsletterSubscriber.upsert({
    where: { email },
    update: {
      marketingConsent,
    },
    create: {
      email,
      marketingConsent,
    },
  });

  return {
    id: subscriber.id,
    email: subscriber.email,
  };
}
