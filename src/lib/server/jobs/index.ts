import { getBoss } from './boss';

export const JOBS = {
  SMS_SEND: 'sms.send',
  EMAIL_SEND: 'email.send',
  SUBSCRIPTION_GRACE_EXPIRE: 'subscription.grace_expire',
  INVITE_EXPIRE: 'invite.expire'
} as const;

export async function enqueueJob<T>(name: string, data: T, options?: { delayMinutes?: number }) {
  const boss = await getBoss();
  const delay = options?.delayMinutes ? options.delayMinutes * 60 * 1000 : undefined;
  await boss.publish(name, data, delay ? { startAfter: delay } : undefined);
}
