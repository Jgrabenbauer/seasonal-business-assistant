import 'dotenv/config';
import { getBoss } from '$lib/server/jobs/boss';
import { JOBS } from '$lib/server/jobs';
import { sendSmsJob } from '$lib/server/sms/service';
import { sendEmailJob } from '$lib/server/email/service';
import { db } from '$lib/server/db';
import { expireInvites } from '$lib/server/invites-expire';

async function main() {
  const boss = await getBoss();

  await boss.work(JOBS.SMS_SEND, async (job) => {
    await sendSmsJob(job.data as { smsMessageId: string });
  });

  await boss.work(JOBS.EMAIL_SEND, async (job) => {
    await sendEmailJob(job.data as { to: string; subject: string; html: string; text?: string });
  });

  await boss.work(JOBS.SUBSCRIPTION_GRACE_EXPIRE, async () => {
    const now = new Date();
    await db.organization.updateMany({
      where: { subscriptionStatus: 'PAST_DUE', subscription: { gracePeriodEndsAt: { lte: now } } },
      data: { subscriptionStatus: 'CANCELLED' }
    });
  });

  await boss.work(JOBS.INVITE_EXPIRE, async () => {
    await expireInvites();
  });

  console.log('[SBA:worker] jobs online');
}

main().catch((err) => {
  console.error('[SBA:worker]', err);
  process.exit(1);
});
