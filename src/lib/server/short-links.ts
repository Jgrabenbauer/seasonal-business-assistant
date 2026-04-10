import { randomBytes } from 'crypto';
import { db } from './db';
import { resolveBaseUrl } from './base-url';

function randomToken(length = 10) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  const bytes: Buffer = randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += alphabet[bytes[i] % alphabet.length];
  }
  return token;
}

export async function createShortLink(params: {
  organizationId: string;
  purpose: 'WORKER_MAGIC_LINK' | 'REPORT_LINK';
  target: string;
  expiresAt?: Date | null;
  baseUrl?: string | URL | null;
}) {
  let token = randomToken();
  for (let i = 0; i < 3; i++) {
    const exists = await db.shortLink.findUnique({ where: { token } });
    if (!exists) break;
    token = randomToken();
  }

  const record = await db.shortLink.create({
    data: {
      organizationId: params.organizationId,
      purpose: params.purpose,
      target: params.target,
      expiresAt: params.expiresAt ?? null,
      token
    }
  });

  const baseUrl = resolveBaseUrl(params.baseUrl);
  return { record, url: `${baseUrl}/s/${record.token}` };
}
