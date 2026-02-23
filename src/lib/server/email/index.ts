import { Resend } from 'resend';
import { env } from '../env';

export function getResendClient() {
  if (!env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is not configured');
  }
  return new Resend(env.RESEND_API_KEY);
}

export function getFromEmail() {
  return env.RESEND_FROM_EMAIL ?? 'SBA <no-reply@example.com>';
}
