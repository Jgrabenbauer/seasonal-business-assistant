import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from './db';
import { env } from './env';

const SESSION_SECRET = env.SESSION_SECRET;
export const COOKIE_NAME = 'sba_session';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signSession(userId: string): string {
  return jwt.sign({ userId }, SESSION_SECRET, { expiresIn: '7d' });
}

export async function getSessionUser(token: string | undefined) {
  if (!token) return null;
  try {
    const { userId } = jwt.verify(token, SESSION_SECRET) as { userId: string };
    return db.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });
  } catch {
    return null;
  }
}
