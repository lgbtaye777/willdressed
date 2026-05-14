import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export const SESSION_COOKIE = 'wd_session';
const SESSION_DAYS = 30;
const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60 * 1000;

export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function createSessionToken() {
  return crypto.randomBytes(32).toString('base64url');
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  };
}

export function publicUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    role: user.role,
    profile: user.profile || null,
  };
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function createSession(userId) {
  const token = createSessionToken();
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE);

  await prisma.session.create({
    data: {
      userId,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function getSessionUser(token) {
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: { profile: true },
      },
    },
  });

  if (!session) return null;

  if (session.expiresAt <= new Date()) {
    await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
    return null;
  }

  return session.user;
}

export async function clearSession(token) {
  if (!token) return;

  await prisma.session
    .delete({ where: { tokenHash: hashToken(token) } })
    .catch(() => {});
}

export async function requireAuth(req, res, next) {
  try {
    const user = await getSessionUser(req.cookies?.[SESSION_COOKIE]);

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
}

export async function optionalAuth(req, res, next) {
  try {
    const user = await getSessionUser(req.cookies?.[SESSION_COOKIE]);
    req.user = user || null;
    return next();
  } catch (error) {
    return next(error);
  }
}
