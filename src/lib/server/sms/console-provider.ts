import type { SmsProvider } from './index';

export class ConsoleSmsProvider implements SmsProvider {
  async send({ to, body }: { to: string; body: string; orgId: string }): Promise<{
    externalId?: string;
    status: string;
  }> {
    console.log('[SBA:sms]', { provider: 'console', to, body });
    console.log(`\n📱 [SMS → ${to}]\n${body}\n`);
    return { status: 'sent' };
  }
}
