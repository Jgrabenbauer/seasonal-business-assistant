import { db } from './db';
import { env } from './env';
import { createShortLink } from './short-links';

export async function createReportLink(turnoverId: string) {
  const turnover = await db.turnover.findUnique({
    where: { id: turnoverId },
    include: {
      organization: true,
      property: true,
      workOrder: {
        include: { checklistRun: { include: { items: { include: { attachments: true } } } } }
      }
    }
  });
  if (!turnover) throw new Error('Turnover not found');

  const short = await createShortLink({
    organizationId: turnover.organizationId,
    purpose: 'REPORT_LINK',
    target: turnover.id,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  });

  const reportUrl = `${env.PUBLIC_BASE_URL ?? 'http://localhost:5173'}/reports/${short.record.token}`;
  return { turnover, reportUrl };
}

export function renderCompletionEmail(params: {
  orgName: string;
  brandAccentColor?: string | null;
  brandLogoUrl?: string | null;
  brandContactInfo?: string | null;
  propertyName: string;
  workOrderTitle: string;
  completedAt?: Date | null;
  checklistSummary: { title: string; status: string }[];
  photoUrls?: string[];
  reportUrl: string;
}) {
  const accent = params.brandAccentColor ?? '#0f766e';
  const logo = params.brandLogoUrl
    ? `<img src="${params.brandLogoUrl}" alt="${params.orgName} logo" style="height:40px;" />`
    : `<div style="font-weight:700;font-size:18px;color:${accent};">${params.orgName}</div>`;

  const rows = params.checklistSummary
    .map(
      (item) =>
        `<tr><td style="padding:8px 0;border-bottom:1px solid #eee;">${item.title}</td><td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;">${item.status}</td></tr>`
    )
    .join('');

  const photos =
    params.photoUrls && params.photoUrls.length > 0
      ? `<div style="margin:16px 0;display:flex;flex-wrap:wrap;gap:8px;">
          ${params.photoUrls
            .slice(0, 5)
            .map(
              (url) =>
                `<img src="${url}" alt="photo" style="width:96px;height:96px;object-fit:cover;border-radius:6px;border:1px solid #eee;" />`
            )
            .join('')}
        </div>`
      : '';

  return `
  <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
      ${logo}
    </div>
    <h2 style="margin:0 0 8px;">Turnover Ready</h2>
    <p style="margin:0 0 16px;color:#444;">
      ${params.workOrderTitle} at ${params.propertyName} is verified and guest-ready.
    </p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      ${rows}
    </table>
    ${photos}
    <p style="margin:16px 0;">
      <a href="${params.reportUrl}" style="background:${accent};color:#fff;text-decoration:none;padding:10px 14px;border-radius:6px;display:inline-block;">View readiness certificate</a>
    </p>
    ${
      params.brandContactInfo
        ? `<p style="margin-top:24px;color:#777;font-size:12px;">${params.brandContactInfo}</p>`
        : ''
    }
  </div>`;
}
