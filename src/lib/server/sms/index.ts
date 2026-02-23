export interface SmsProvider {
  send(params: { to: string; body: string; orgId: string }): Promise<{
    externalId?: string;
    status: string;
  }>;
}

export async function getSmsProvider(): Promise<SmsProvider> {
  const provider = process.env.SMS_PROVIDER;
  if (
    provider === 'twilio' &&
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_FROM_NUMBER
  ) {
    const { TwilioSmsProvider } = await import('./twilio-provider');
    return new TwilioSmsProvider();
  }
  const { ConsoleSmsProvider } = await import('./console-provider');
  return new ConsoleSmsProvider();
}
