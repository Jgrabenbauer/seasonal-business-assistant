import { db } from '$lib/server/db';
import { getSmsProvider } from './index';
import { enqueueJob, JOBS } from '$lib/server/jobs';
import { env } from '$lib/server/env';

const RETRY_MINUTES = [1, 5, 15, 60, 360];

export async function queueSms(params: { orgId: string; to: string; body: string }) {
  const message = await db.smsMessage.create({
    data: {
      organizationId: params.orgId,
      to: params.to,
      body: params.body,
      provider: env.SMS_PROVIDER,
      status: 'queued',
      attemptCount: 0
    }
  });
  await enqueueJob(JOBS.SMS_SEND, { smsMessageId: message.id });
  return message;
}

export async function sendSmsJob(data: { smsMessageId: string }) {
  const sms = await db.smsMessage.findUnique({ where: { id: data.smsMessageId } });
  if (!sms) return;

  const provider = await getSmsProvider();
  try {
    const result = await provider.send({
      to: sms.to,
      body: sms.body,
      orgId: sms.organizationId
    });
    await db.smsMessage.update({
      where: { id: sms.id },
      data: {
        externalId: result.externalId,
        status: result.status ?? 'sent',
        sentAt: new Date(),
        attemptCount: sms.attemptCount + 1
      }
    });
  } catch (err) {
    const attempt = sms.attemptCount + 1;
    const errorMessage = err instanceof Error ? err.message : 'SMS failed';
    await db.smsMessage.update({
      where: { id: sms.id },
      data: {
        status: 'failed',
        errorMessage,
        attemptCount: attempt
      }
    });
    const delayMinutes = RETRY_MINUTES[Math.min(attempt - 1, RETRY_MINUTES.length - 1)];
    if (attempt <= RETRY_MINUTES.length) {
      await enqueueJob(JOBS.SMS_SEND, { smsMessageId: sms.id }, { delayMinutes });
    }
  }
}
