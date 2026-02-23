import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('$lib/server/db', () => ({
  db: {
    smsMessage: {
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn()
    }
  }
}));

vi.mock('$lib/server/jobs', () => ({
  enqueueJob: vi.fn(),
  JOBS: { SMS_SEND: 'sms.send' }
}));

vi.mock('$lib/server/env', () => ({
  env: { SMS_PROVIDER: 'console' }
}));

vi.mock('$lib/server/sms/index', () => ({
  getSmsProvider: vi.fn().mockResolvedValue({
    send: vi.fn().mockResolvedValue({ status: 'sent' })
  })
}));

import { db } from '$lib/server/db';
import { enqueueJob } from '$lib/server/jobs';
import { queueSms, sendSmsJob } from '$lib/server/sms/service';

describe('sms service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('queues SMS and enqueues job', async () => {
    vi.mocked(db.smsMessage.create).mockResolvedValue({ id: 'sms1' } as any);
    await queueSms({ orgId: 'org1', to: '+15551234', body: 'Hi' });
    expect(enqueueJob).toHaveBeenCalled();
  });

  it('sends SMS job and updates status', async () => {
    vi.mocked(db.smsMessage.findUnique).mockResolvedValue({
      id: 'sms1',
      organizationId: 'org1',
      to: '+15551234',
      body: 'Hi',
      attemptCount: 0
    } as any);
    await sendSmsJob({ smsMessageId: 'sms1' });
    expect(db.smsMessage.update).toHaveBeenCalled();
  });
});
