import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert';

// Mock localStorage and window in node test environment
const storage = new Map();
globalThis.localStorage = {
  getItem: (key) => storage.get(key) || null,
  setItem: (key, val) => storage.set(key, String(val)),
  removeItem: (key) => storage.delete(key),
  clear: () => storage.clear(),
};

globalThis.window = {
  location: {
    pathname: '/dashboard',
    href: 'http://localhost:5173/dashboard',
  },
};

import api from '../src/services/api.js';
import axiosClient from '../src/services/axios.js';

describe('Unified API and Axios Client', () => {
  beforeEach(() => {
    storage.clear();
    window.location.pathname = '/dashboard';
    window.location.href = 'http://localhost:5173/dashboard';
  });

  test('api and axios exports refer to the exact same client instance', () => {
    assert.strictEqual(api, axiosClient, 'api and axios should be unified on the same instance');
  });

  test('api instance has standard base configuration', () => {
    assert.strictEqual(api.defaults.timeout, 10000, 'timeout should be 10000ms');
    assert.strictEqual(api.defaults.headers['Content-Type'], 'application/json');
    assert.ok(api.defaults.baseURL.includes('/api'));
  });

  test('request interceptor attaches Bearer token from localStorage key "token"', async () => {
    storage.set('token', 'sample-jwt-token-12345');

    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    const modifiedConfig = await requestHandler(config);

    assert.strictEqual(
      modifiedConfig.headers.Authorization,
      'Bearer sample-jwt-token-12345'
    );
  });

  test('request interceptor does not set Authorization header if token is absent', async () => {
    const requestHandler = api.interceptors.request.handlers[0].fulfilled;
    const config = { headers: {} };
    const modifiedConfig = await requestHandler(config);

    assert.strictEqual(modifiedConfig.headers.Authorization, undefined);
  });

  test('response interceptor clears token, upiq_auth, upiq_demo and dispatches upiq:session-expired event on 401 from protected requests', async () => {
    storage.set('token', 'active-token');
    storage.set('upiq_auth', 'true');
    storage.set('upiq_demo', 'true');

    let eventDispatched = false;
    window.dispatchEvent = (evt) => {
      if (evt.type === 'upiq:session-expired') {
        eventDispatched = true;
      }
    };

    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error401 = {
      config: { url: '/transactions' },
      response: {
        status: 401,
        data: { message: 'Session expired' },
      },
    };

    await assert.rejects(
      async () => errorHandler(error401),
      (err) => {
        assert.strictEqual(storage.get('token'), undefined, 'token should be removed from localStorage');
        assert.strictEqual(storage.get('upiq_auth'), undefined, 'upiq_auth should be removed from localStorage');
        assert.strictEqual(storage.get('upiq_demo'), undefined, 'upiq_demo should be removed from localStorage');
        assert.strictEqual(err.userFriendlyMessage, 'Session expired');
        assert.ok(eventDispatched, 'upiq:session-expired event should be dispatched');
        return true;
      }
    );
  });

  test('response interceptor does NOT clear credentials or redirect when /auth/login returns 401', async () => {
    storage.set('token', 'prior-token');
    storage.set('upiq_auth', 'true');
    window.location.pathname = '/';
    window.location.href = 'http://localhost:5173/';

    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const loginError401 = {
      config: { url: '/auth/login' },
      response: {
        status: 401,
        data: { message: 'Invalid credentials' },
      },
    };

    await assert.rejects(
      async () => errorHandler(loginError401),
      (err) => {
        // Must preserve error message for UI without clearing or redirecting
        assert.strictEqual(err.userFriendlyMessage, 'Invalid credentials');
        assert.strictEqual(storage.get('token'), 'prior-token', 'token should not be cleared on login 401');
        assert.strictEqual(storage.get('upiq_auth'), 'true', 'upiq_auth should not be cleared on login 401');
        assert.strictEqual(window.location.href, 'http://localhost:5173/', 'should not redirect away from page on login 401');
        return true;
      }
    );
  });

  test('response interceptor does NOT redirect when /auth/register returns 401', async () => {
    window.location.pathname = '/';
    window.location.href = 'http://localhost:5173/';

    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const registerError401 = {
      config: { url: '/auth/register' },
      response: {
        status: 401,
        data: { message: 'Registration not allowed' },
      },
    };

    await assert.rejects(
      async () => errorHandler(registerError401),
      (err) => {
        assert.strictEqual(err.userFriendlyMessage, 'Registration not allowed');
        assert.strictEqual(window.location.href, 'http://localhost:5173/', 'should not redirect');
        return true;
      }
    );
  });

  test('response interceptor avoids redirect loop if already on /login', async () => {
    window.location.pathname = '/login';
    window.location.href = 'http://localhost:5173/login';

    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error401 = {
      config: { url: '/v1/users/me' },
      response: {
        status: 401,
      },
    };

    await assert.rejects(
      async () => errorHandler(error401),
      () => {
        assert.strictEqual(window.location.pathname, '/login');
        return true;
      }
    );
  });

  test('response interceptor avoids redirect loop if already on /register', async () => {
    window.location.pathname = '/register';
    window.location.href = 'http://localhost:5173/register';

    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error401 = {
      config: { url: '/v1/users/me' },
      response: {
        status: 401,
      },
    };

    await assert.rejects(
      async () => errorHandler(error401),
      () => {
        assert.strictEqual(window.location.pathname, '/register');
        return true;
      }
    );
  });
});
