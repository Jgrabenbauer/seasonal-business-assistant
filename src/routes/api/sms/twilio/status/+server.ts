import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { env } from '$lib/server/env';

export const POST: RequestHandler = async ({ request, url }) => {
  const twilio = await import('twilio');
  const signature = request.headers.get('x-twilio-signature');
  const bodyText = await request.text();
  const params = new URLSearchParams(bodyText);

  if (!signature || !process.env.TWILIO_AUTH_TOKEN) {
    return new Response('Missing signature', { status: 400 });
  }

  const valid = twilio.validateRequest(
    process.env.TWILIO_AUTH_TOKEN,
    signature,
    env.TWILIO_STATUS_CALLBACK_URL ?? url.toString(),
    Object.fromEntries(params.entries())
  );

  if (!valid) {
    return new Response('Invalid signature', { status: 403 });
  }

  const sid = params.get('MessageSid');
  const status = params.get('MessageStatus');
  const errorCode = params.get('ErrorCode');
  const errorMessage = params.get('ErrorMessage');

  if (sid && status) {
    await db.smsMessage.updateMany({
      where: { externalId: sid },
      data: {
        status,
        errorCode: errorCode ?? undefined,
        errorMessage: errorMessage ?? undefined,
        deliveredAt: status === 'delivered' ? new Date() : undefined
      }
    });
  }

  return new Response('ok');
};
