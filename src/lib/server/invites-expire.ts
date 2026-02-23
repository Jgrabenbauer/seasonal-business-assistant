import { db } from './db';

export async function expireInvites() {
  const now = new Date();
  await db.inviteToken.updateMany({
    where: { status: 'PENDING', expiresAt: { lte: now } },
    data: { status: 'EXPIRED' }
  });
}
