import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/errors';
import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '$lib/server/storage';
import { logActivity } from '$lib/server/activity-log';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { itemRunId, url, filename, mimeType, sizeBytes } = body ?? {};
    if (!itemRunId || !url || !filename || !mimeType || !sizeBytes) {
      return json({ ok: false, error: 'Missing upload data', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: 'File too large (max 10MB)', code: 'VALIDATION_ERROR' }, { status: 413 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) {
      return json({ ok: false, error: 'Unsupported file type', code: 'VALIDATION_ERROR' }, { status: 415 });
    }

    const attachment = await db.attachment.create({
      data: {
        itemRunId,
        url,
        filename,
        mimeType,
        sizeBytes
      },
      include: { itemRun: { include: { run: { include: { workOrder: true } } } } }
    });

    logActivity({
      organizationId: attachment.itemRun.run.workOrder.organizationId,
      actionType: 'PHOTO_UPLOADED',
      entityType: 'Attachment',
      entityId: attachment.id,
      metadata: { filename, workOrderId: attachment.itemRun.run.workOrder.id }
    });

    return json({ ok: true, attachment });
  } catch (e) {
    return apiError(e);
  }
};
