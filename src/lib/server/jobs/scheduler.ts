import { getBoss } from './boss';
import { JOBS } from './index';

let scheduled = false;

export async function ensureSchedules() {
  if (scheduled) return;
  const boss = await getBoss();
  await boss.createQueue(JOBS.SUBSCRIPTION_GRACE_EXPIRE);
  await boss.createQueue(JOBS.INVITE_EXPIRE);
  await boss.schedule(JOBS.SUBSCRIPTION_GRACE_EXPIRE, '0 */6 * * *');
  await boss.schedule(JOBS.INVITE_EXPIRE, '0 */6 * * *');
  scheduled = true;
}
