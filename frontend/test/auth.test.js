import { test, describe } from 'node:test';
import assert from 'node:assert';
import AuthService from '../src/services/auth.service.js';

describe('AuthService', () => {
  test('loginWithGoogle throws an error explaining backend does not support Google OAuth', async () => {
    await assert.rejects(
      async () => AuthService.loginWithGoogle({ credential: 'dummy' }),
      (err) => {
        assert.ok(
          err.message.includes('not supported'),
          'error message should clearly indicate lack of backend Google OAuth support'
        );
        return true;
      }
    );
  });

  test('AuthService defines standard authentication methods', () => {
    assert.strictEqual(typeof AuthService.login, 'function');
    assert.strictEqual(typeof AuthService.register, 'function');
    assert.strictEqual(typeof AuthService.getMe, 'function');
  });
});
