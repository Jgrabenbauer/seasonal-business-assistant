import { getResendClient, getFromEmail } from './index';
import { enqueueJob, JOBS } from '$lib/server/jobs';

export async function queueEmail(params: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  await enqueueJob(JOBS.EMAIL_SEND, params);
}

export async function sendEmailJob(data: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const resend = getResendClient();
  await resend.emails.send({
    from: getFromEmail(),
    to: data.to,
    subject: data.subject,
    html: data.html,
    text: data.text
  });
}
