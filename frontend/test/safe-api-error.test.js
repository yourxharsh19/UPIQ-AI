import { test } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeApiError } from '../src/services/safeApiError.js';

test('normalizes auth errors without exposing payload, credentials, or request configuration', () => {
  const normalized = normalizeApiError({
    code: 'ERR_BAD_REQUEST',
    message: 'private request data',
    config: { url: '/auth/login', headers: { Authorization: 'Bearer private-token' }, data: 'private-body' },
    response: { status: 401, data: { message: 'database internals' } },
  });
  assert.deepEqual(normalized, {
    status: 401,
    code: 'ERR_BAD_REQUEST',
    message: 'Invalid email or password.',
  });
  assert.equal(JSON.stringify(normalized).includes('private-token'), false);
});

test('provides a stable safe message for rate limiting and server errors', () => {
  assert.equal(normalizeApiError({ response: { status: 429 } }).message, 'Too many attempts. Please wait and try again.');
  assert.equal(normalizeApiError({ response: { status: 500, data: { message: 'private' } } }).message, 'The service is temporarily unavailable.');
});
