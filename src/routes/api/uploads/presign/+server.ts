import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createPresignedUpload, ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from '$lib/server/storage';
import { apiError } from '$lib/server/errors';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const body = await request.json();
    const { filename, contentType, sizeBytes } = body ?? {};
    if (!filename || !contentType || !sizeBytes) {
      return json({ ok: false, error: 'Missing file metadata', code: 'VALIDATION_ERROR' }, { status: 400 });
    }
    if (sizeBytes > MAX_IMAGE_BYTES) {
      return json({ ok: false, error: 'File too large (max 10MB)', code: 'VALIDATION_ERROR' }, { status: 413 });
    }
    if (!ALLOWED_IMAGE_TYPES.includes(contentType)) {
      return json({ ok: false, error: 'Unsupported file type', code: 'VALIDATION_ERROR' }, { status: 415 });
    }

    const presign = await createPresignedUpload({ filename, contentType, sizeBytes });
    return json({ ok: true, ...presign });
  } catch (e) {
    return apiError(e);
  }
};
