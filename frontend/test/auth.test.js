import { test, describe } from 'node:test';
import assert from 'node:assert';
import AuthService from '../src/services/auth.service.js';
import api from '../src/services/api.js';

describe('AuthService', () => {
  test('Google sign-in status reads deployment availability from the backend endpoint', async () => {
    const originalGet = api.get;
    let requestedPath;
    api.get = async (path) => {
      requestedPath = path;
      return { data: { success: true, data: { enabled: false } } };
    };
    try {
      const response = await AuthService.getGoogleSignInStatus();
      assert.equal(requestedPath, '/auth/google/status');
      assert.equal(response.data.enabled, false);
    } finally {
      api.get = originalGet;
    }
  });

  test('AuthService defines standard authentication methods', () => {
    assert.strictEqual(typeof AuthService.login, 'function');
    assert.strictEqual(typeof AuthService.register, 'function');
    assert.strictEqual(typeof AuthService.getMe, 'function');
    assert.strictEqual(typeof AuthService.exchangeGoogleCode, 'function');
    assert.strictEqual(typeof AuthService.getGoogleSignInStatus, 'function');
  });
});
