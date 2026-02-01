import { Context } from 'hono';
import type { ErrorResponse } from '../../../shared/types';

export function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  const errorResponse: ErrorResponse = {
    success: false,
    error: err.message || 'Internal server error',
  };

  return c.json(errorResponse, 500);
}
