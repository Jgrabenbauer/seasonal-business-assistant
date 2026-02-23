import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { uploadFile, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '$lib/server/storage';
import { db } from '$lib/server/db';
import { apiError } from '$lib/server/errors';
import { logActivity } from '$lib/server/activity-log';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const form = await request.formData();
    const file = form.get('file') as File | null;
    const itemRunId = form.get('itemRunId') as string | null;

    if (!file || !itemRunId) {
      return json({ ok: false, error: 'Missing file or itemRunId', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: 'File too large (max 10MB)', code: 'VALIDATION_ERROR' }, { status: 413 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return json({ ok: false, error: 'Unsupported file type', code: 'VALIDATION_ERROR' }, { status: 415 });
    }

    let url: string;
    try {
      url = await uploadFile(file);
    } catch (e) {
      console.error('[SBA:error]', { route: '/api/upload', error: (e as Error).message });
      return json({ ok: false, error: 'Upload failed', code: 'INTERNAL_ERROR' }, { status: 500 });
    }

    const attachment = await db.attachment.create({
      data: {
        itemRunId,
        url,
        filename: file.name,
        mimeType: file.type,
        sizeBytes: file.size
      },
      include: { itemRun: { include: { run: { include: { workOrder: true } } } } }
    });

    logActivity({
      organizationId: attachment.itemRun.run.workOrder.organizationId,
      actionType: 'PHOTO_UPLOADED',
      entityType: 'Attachment',
      entityId: attachment.id,
      metadata: { filename: file.name, workOrderId: attachment.itemRun.run.workOrder.id }
    });

    return json({ ok: true, attachment });
  } catch (e) {
    return apiError(e);
  }
};
