import 'dotenv/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import cookieParser from 'cookie-parser';
import express from 'express';
import {
  SESSION_COOKIE,
  clearSession,
  createSession,
  hashPassword,
  publicUser,
  requireAuth,
  sessionCookieOptions,
  verifyPassword,
} from './auth.js';
import { prisma } from './prisma.js';
import { cartRouter } from './routes/cart.routes.js';
import { newsletterRouter } from './routes/newsletter.routes.js';
import { ordersRouter } from './routes/orders.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const port = Number(process.env.PORT || 3001);

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.post('/api/auth/register', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Valid email is required' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        profile: { create: {} },
      },
      include: { profile: true },
    });
    const session = await createSession(user.id);

    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions());
    return res.status(201).json({ user: publicUser(user) });
  } catch (error) {
    if (error?.code === 'P2002') {
      return res.status(409).json({ error: 'Email is already registered' });
    }

    return next(error);
  }
});

app.post('/api/auth/login', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');

    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });

    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const session = await createSession(user.id);
    res.cookie(SESSION_COOKIE, session.token, sessionCookieOptions());
    return res.json({ user: publicUser(user) });
  } catch (error) {
    return next(error);
  }
});

app.post('/api/auth/logout', async (req, res, next) => {
  try {
    await clearSession(req.cookies?.[SESSION_COOKIE]);
    res.clearCookie(SESSION_COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
    return res.json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  res.json({ user: publicUser(req.user) });
});

app.patch('/api/me/profile', requireAuth, async (req, res, next) => {
  try {
    const allowedFields = [
      'heightCm',
      'weightKg',
      'chestCm',
      'waistCm',
      'hipsCm',
      'shoulderCm',
      'sleeveCm',
      'inseamCm',
      'footLengthCm',
      'preferredFit',
    ];
    const data = {};

    for (const field of allowedFields) {
      if (!(field in req.body)) continue;

      if (field === 'preferredFit') {
        const value = req.body[field];
        data[field] = value == null || value === '' ? null : String(value).slice(0, 64);
      } else {
        const value = req.body[field];
        data[field] = value == null || value === '' ? null : Number(value);

        if (data[field] !== null && !Number.isFinite(data[field])) {
          return res.status(400).json({ error: `${field} must be a number` });
        }
      }
    }

    const profile = await prisma.userProfile.upsert({
      where: { userId: req.user.id },
      update: data,
      create: {
        userId: req.user.id,
        ...data,
      },
    });

    return res.json({ profile });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/products', async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    return res.json({ products });
  } catch (error) {
    return next(error);
  }
});

app.get('/api/products/:slug', async (req, res, next) => {
  try {
    const product = await prisma.product.findUnique({
      where: { slug: req.params.slug },
    });

    if (!product || !product.isActive) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error) {
    return next(error);
  }
});

app.use('/api/cart', cartRouter);
app.use('/api/newsletter', newsletterRouter);
app.use('/api/orders', ordersRouter);

if (process.env.NODE_ENV === 'production') {
  const clientDist = path.resolve(__dirname, '../dist/client');

  app.use(express.static(clientDist, {
    index: false,
    maxAge: '30d',
    immutable: true,
  }));

  app.get('*', (req, res) => {
    res.set('Cache-Control', 'no-cache');
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({ error: error.status ? error.message : 'Internal server error' });
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
