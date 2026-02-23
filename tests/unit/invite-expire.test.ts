import { describe, it, expect, vi } from 'vitest';

vi.mock('$lib/server/db', () => ({
  db: {
    inviteToken: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) }
  }
}));

import { db } from '$lib/server/db';
import { expireInvites } from '$lib/server/invites-expire';

describe('expireInvites', () => {
  it('expires pending invites past due', async () => {
    await expireInvites();
    expect(db.inviteToken.updateMany).toHaveBeenCalled();
  });
});
