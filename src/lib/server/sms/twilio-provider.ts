import type { SmsProvider } from './index';
import { env } from '$lib/server/env';

export class TwilioSmsProvider implements SmsProvider {
  async send({ to, body }: { to: string; body: string; orgId: string }): Promise<{
    externalId?: string;
    status: string;
  }> {
    const twilio = await import('twilio');
    const client = twilio.default(
      process.env.TWILIO_ACCOUNT_SID!,
      process.env.TWILIO_AUTH_TOKEN!
    );

    const message = await client.messages.create({
      body,
      from: process.env.TWILIO_FROM_NUMBER!,
      to,
      statusCallback: env.TWILIO_STATUS_CALLBACK_URL
    });

    console.log('[SBA:sms]', { provider: 'twilio', to, sid: message.sid });
    return { externalId: message.sid, status: message.status ?? 'sent' };
  }
}
