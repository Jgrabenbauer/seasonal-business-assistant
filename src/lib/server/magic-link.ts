import jwt from 'jsonwebtoken';
import { env } from './env';
import { db } from './db';

const EXPIRY_MS = env.MAGIC_LINK_EXPIRY_HOURS * 60 * 60 * 1000;

// Creates a DB-backed one-time-use token for a work order
export async function createWorkerToken(workOrderId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + EXPIRY_MS);

  const record = await db.magicLinkToken.create({
    data: { workOrderId, token: '', expiresAt }
  });

  const token = jwt.sign(
    { workOrderId, type: 'worker', jti: record.id },
    env.MAGIC_LINK_SECRET,
    { expiresIn: `${env.MAGIC_LINK_EXPIRY_HOURS}h` }
  );

  // Store the actual JWT in the record
  await db.magicLinkToken.update({
    where: { id: record.id },
    data: { token }
  });

  return token;
}

// Verifies and marks the token as used on first access (idempotent for refresh)
export async function verifyAndConsumeWorkerToken(
  token: string
): Promise<{ workOrderId: string; isFirstUse: boolean }> {
  const payload = jwt.verify(token, env.MAGIC_LINK_SECRET) as {
    workOrderId: string;
    type: string;
    jti: string;
  };

  if (payload.type !== 'worker') throw new Error('Invalid token type');

  const record = await db.magicLinkToken.findUnique({ where: { id: payload.jti } });
  if (!record) throw new Error('Token record not found');
  if (new Date() > record.expiresAt) throw new Error('Token expired');

  const isFirstUse = record.usedAt === null;
  if (isFirstUse) {
    await db.magicLinkToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() }
    });
  }

  return { workOrderId: payload.workOrderId, isFirstUse };
}

// Legacy shim: pure JWT tokens without jti (no DB record, just verify signature)
export function verifyLegacyWorkerToken(token: string): { workOrderId: string } | null {
  try {
    const payload = jwt.verify(token, env.MAGIC_LINK_SECRET) as {
      workOrderId: string;
      type: string;
      jti?: string;
    };
    if (payload.type !== 'worker' || payload.jti) return null; // not a legacy token
    return { workOrderId: payload.workOrderId };
  } catch {
    return null;
  }
}

// Kept for backward compat in existing callers until all tokens are new-style
export function signWorkerToken(workOrderId: string): string {
  return jwt.sign(
    { workOrderId, type: 'worker' },
    env.MAGIC_LINK_SECRET,
    { expiresIn: `${env.MAGIC_LINK_EXPIRY_HOURS}h` }
  );
}

// Legacy verify used by existing routes still referencing old function name
export function verifyWorkerToken(token: string): { workOrderId: string } {
  const payload = jwt.verify(token, env.MAGIC_LINK_SECRET) as {
    workOrderId: string;
    type: string;
  };
  if (payload.type !== 'worker') throw new Error('Invalid token type');
  return { workOrderId: payload.workOrderId };
}
