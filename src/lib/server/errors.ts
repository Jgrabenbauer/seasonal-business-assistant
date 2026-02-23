import { json } from '@sveltejs/kit';
import { captureError } from './monitoring';

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Not found') {
    super('NOT_FOUND', message, 404);
    this.name = 'NotFoundError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    this.name = 'ForbiddenError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super('VALIDATION_ERROR', message, 400);
    this.name = 'ValidationError';
  }
}

export class BillingError extends AppError {
  constructor(message: string) {
    super('BILLING_LIMIT', message, 402);
    this.name = 'BillingError';
  }
}

export function apiError(e: unknown): Response {
  if (e instanceof AppError) {
    return json({ ok: false, error: e.message, code: e.code }, { status: e.status });
  }
  console.error('[SBA:error]', e);
  captureError(e as Error);
  return json({ ok: false, error: 'Internal server error', code: 'INTERNAL_ERROR' }, { status: 500 });
}
