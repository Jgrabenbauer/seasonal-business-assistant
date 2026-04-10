import { randomBytes } from 'crypto';
import { db } from './db';
import { queueEmail } from './email/service';
import { resolveBaseUrl } from './base-url';

function randomToken(length = 32) {
  const alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  const bytes: Buffer = randomBytes(length);
  for (let i = 0; i < length; i++) {
    token += alphabet[bytes[i] % alphabet.length];
  }
  return token;
}

export async function createInvite(params: {
  organizationId: string;
  email: string;
  role: 'WORKER' | 'SUPERVISOR';
}, baseUrl?: string | URL | null) {
  const token = randomToken();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  const invite = await db.inviteToken.create({
    data: {
      organizationId: params.organizationId,
      email: params.email,
      role: params.role,
      token,
      expiresAt
    }
  });

  await sendInviteEmail(invite.email, invite.role, invite.token, baseUrl);

  return invite;
}

export async function sendInviteEmail(email: string, role: string, token: string, baseUrl?: string | URL | null) {
  const link = `${resolveBaseUrl(baseUrl)}/auth/invite/${token}`;
  await queueEmail({
    to: email,
    subject: 'You have been invited to SBA',
    html: `<p>You have been invited to join SBA as ${role}. Click to accept:</p><p><a href="${link}">${link}</a></p>`,
    text: `You have been invited to join SBA as ${role}. Accept: ${link}`
  });
}
