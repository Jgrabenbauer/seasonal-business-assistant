import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getSmsProvider', () => {
  beforeEach(() => {
    delete process.env.SMS_PROVIDER;
    delete process.env.TWILIO_ACCOUNT_SID;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.TWILIO_FROM_NUMBER;
    vi.resetModules();
  });

  it('returns ConsoleSmsProvider when SMS_PROVIDER is unset', async () => {
    const { getSmsProvider } = await import('../../src/lib/server/sms/index');
    const provider = await getSmsProvider();
    expect(provider.constructor.name).toBe('ConsoleSmsProvider');
  });

  it('returns ConsoleSmsProvider when SMS_PROVIDER is "console"', async () => {
    process.env.SMS_PROVIDER = 'console';
    const { getSmsProvider } = await import('../../src/lib/server/sms/index');
    const provider = await getSmsProvider();
    expect(provider.constructor.name).toBe('ConsoleSmsProvider');
  });

  it('ConsoleSmsProvider.send() returns sent status', async () => {
    const { ConsoleSmsProvider } = await import('../../src/lib/server/sms/console-provider');
    const provider = new ConsoleSmsProvider();
    const result = await provider.send({ to: '+15085551234', body: 'Test message', orgId: 'org-1' });
    expect(result.status).toBe('sent');
  });

  it('returns TwilioSmsProvider when twilio env vars are present', async () => {
    process.env.SMS_PROVIDER = 'twilio';
    process.env.TWILIO_ACCOUNT_SID = 'ACtest';
    process.env.TWILIO_AUTH_TOKEN = 'authtest';
    process.env.TWILIO_FROM_NUMBER = '+15551234567';
    const { getSmsProvider } = await import('../../src/lib/server/sms/index');
    const provider = await getSmsProvider();
    expect(provider.constructor.name).toBe('TwilioSmsProvider');
  });
});
