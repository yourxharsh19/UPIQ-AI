import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

const values = new Map();
globalThis.localStorage = {
  getItem: (key) => values.get(key) ?? null,
  setItem: (key, value) => values.set(key, String(value)),
  removeItem: (key) => values.delete(key),
  clear: () => values.clear(),
};

let lastDispatchedEvent = null;
globalThis.window = {
  location: { pathname: '/dashboard', href: 'http://localhost:5173/dashboard' },
  dispatchEvent: (event) => { lastDispatchedEvent = event; },
  addEventListener: () => {},
  removeEventListener: () => {},
};

if (typeof globalThis.CustomEvent === 'undefined') {
  globalThis.CustomEvent = class CustomEvent {
    constructor(type) { this.type = type; }
  };
}

import { getInitialAuthState } from '../src/utils/authUtils.js';
import { activateDemoSession, applySessionExpiration, authenticateWithBackend, clearAuthSession, isWellFormedJwt } from '../src/utils/authFlow.js';
import api from '../src/services/api.js';
import { AuthService } from '../src/services/auth.service.js';

const encode = (value) => Buffer.from(JSON.stringify(value)).toString('base64url');
const validJwt = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: 'user@example.test' })}.${Buffer.from('sig').toString('base64url')}`;

const makeStorage = (initial = {}) => {
  const map = new Map(Object.entries(initial));
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
    entries: () => Object.fromEntries(map.entries()),
  };
};

const makeProfile = () => ({ email: 'user@example.test', name: 'Test User', role: 'user' });
const runBackendLogin = (response, storage = makeStorage()) => authenticateWithBackend({
  authService: { login: async () => response },
  email: 'user@example.test',
  password: 'secret',
  profile: makeProfile(),
  currency: 'INR',
  storage,
});

const resetGlobals = () => {
  values.clear();
  lastDispatchedEvent = null;
  window.location.pathname = '/dashboard';
};

describe('auth startup and stale-session cleanup', () => {
  beforeEach(resetGlobals);

  test('restores a backend session only when auth flag and a token exist', () => {
    assert.equal(getInitialAuthState(), false);
    values.set('upiq_auth', 'true');
    assert.equal(getInitialAuthState(), false);
    assert.equal(values.has('upiq_auth'), false, 'stale auth flag is removed');

    values.set('token', validJwt);
    assert.equal(getInitialAuthState(), false, 'token alone is insufficient');
    assert.equal(values.has('token'), false, 'orphaned token is removed');
    values.set('token', validJwt);
    values.set('upiq_auth', 'true');
    assert.equal(getInitialAuthState(), true);
  });

  test('malformed and empty saved JWTs clear session keys but retain unrelated preferences', () => {
    for (const token of ['not-a-jwt', '']) {
      values.clear();
      values.set('token', token);
      values.set('upiq_auth', 'true');
      values.set('upiq_demo', 'false');
      values.set('upiq_profile', '{"name":"Stale User"}');
      values.set('upiq_currency', '"INR"');
      values.set('upiq_theme', 'dark');

      assert.equal(getInitialAuthState(), false);
      assert.equal(values.has('token'), false);
      assert.equal(values.has('upiq_auth'), false);
      assert.equal(values.has('upiq_demo'), false);
      assert.equal(values.has('upiq_profile'), false);
      assert.equal(values.get('upiq_currency'), '"INR"');
      assert.equal(values.get('upiq_theme'), 'dark');
    }
  });

  test('a structurally valid-looking JWT restores backend auth without claiming authenticity', () => {
    values.set('upiq_auth', 'true');
    values.set('token', validJwt);

    assert.equal(isWellFormedJwt(validJwt), true);
    assert.equal(getInitialAuthState(), true);
    assert.equal(values.get('token'), validJwt);
  });

  test('explicit demo sessions still restore without a backend JWT', () => {
    values.set('upiq_demo', 'true');
    values.set('upiq_profile', '{"name":"Demo User"}');

    assert.equal(getInitialAuthState(), true);
    assert.equal(values.get('upiq_demo'), 'true');
    assert.equal(values.has('upiq_profile'), true);
  });

  test('clears expired credentials on a protected-request 401 using the production interceptor', async () => {
    values.set('token', 'expired-token');
    values.set('upiq_auth', 'true');
    values.set('upiq_demo', 'false');
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = { config: { url: '/v1/transactions' }, response: { status: 401, data: { message: 'Token expired' } } };

    await assert.rejects(errorHandler(error));
    assert.equal(values.has('token'), false);
    assert.equal(values.has('upiq_auth'), false);
    assert.equal(values.has('upiq_demo'), false);
    assert.equal(lastDispatchedEvent?.type, 'upiq:session-expired');
  });

  test('does not clear an existing session on a login 401', async () => {
    values.set('token', 'prior-token');
    values.set('upiq_auth', 'true');
    const errorHandler = api.interceptors.response.handlers[0].rejected;
    const error = { config: { url: '/auth/login' }, response: { status: 401, data: { message: 'Invalid credentials' } } };

    await assert.rejects(errorHandler(error), (err) => {
      assert.equal(err.userFriendlyMessage, 'Invalid credentials');
      return true;
    });
    assert.equal(values.get('token'), 'prior-token');
    assert.equal(values.get('upiq_auth'), 'true');
    assert.equal(lastDispatchedEvent, null);
  });

  test('logout cleanup helper clears token, auth/demo flags, and optionally profile', () => {
    const storage = makeStorage({ token: validJwt, upiq_auth: 'true', upiq_demo: 'false', upiq_profile: '{"name":"Test"}' });
    clearAuthSession(storage, { clearProfile: true });
    assert.deepEqual(storage.entries(), {});
  });

  test('session expiration clears profile, resets in-memory auth/profile, shows Login, and notifies only once', () => {
    const storage = makeStorage({
      token: validJwt,
      upiq_auth: 'true',
      upiq_demo: 'false',
      upiq_profile: '{"name":"Stale User"}',
      upiq_currency: '"INR"',
    });
    const handledRef = { current: false };
    const initialProfile = { name: 'Guest' };
    let isAuthenticated = true;
    let currentView = 'app';
    let profile = { name: 'Stale User' };
    let toastCount = 0;
    const applyExpiry = () => applySessionExpiration({
      storage,
      handledRef,
      setIsAuthenticated: (value) => { isAuthenticated = value; },
      setCurrentView: (value) => { currentView = value; },
      setProfile: (value) => { profile = value; },
      initialProfile,
      addToast: () => { toastCount += 1; },
    });

    assert.equal(applyExpiry(), true);
    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('upiq_auth'), null);
    assert.equal(storage.getItem('upiq_demo'), null);
    assert.equal(storage.getItem('upiq_profile'), null);
    assert.equal(storage.getItem('upiq_currency'), '"INR"', 'display currency preference is retained');
    assert.equal(isAuthenticated, false);
    assert.equal(currentView, 'login');
    assert.equal(profile, initialProfile);
    assert.equal(toastCount, 1);

    assert.equal(applyExpiry(), false, 'repeated expiry events are ignored until a new successful login');
    assert.equal(toastCount, 1, 'duplicate 401 events do not create duplicate toasts');
  });
});

describe('production backend login helper', () => {
  test('accepts the backend ApiResponse shape returned by AuthService and persists its JWT', async () => {
    const storage = makeStorage({ upiq_demo: 'true' });
    let loginArguments;
    let registerCalls = 0;
    const authService = {
      login: async (...args) => {
        loginArguments = args;
        return { success: true, data: { token: validJwt } };
      },
      register: async () => { registerCalls += 1; },
    };

    const result = await authenticateWithBackend({
      authService,
      email: 'user@example.test',
      password: 'secret',
      profile: makeProfile(),
      currency: 'INR',
      storage,
    });

    assert.deepEqual(result, { success: true, mode: 'backend' });
    assert.deepEqual(loginArguments, ['user@example.test', 'secret']);
    assert.equal(storage.getItem('token'), validJwt);
    assert.equal(storage.getItem('upiq_auth'), 'true');
    assert.equal(storage.getItem('upiq_demo'), null, 'backend login clears stale demo mode');
    assert.equal(registerCalls, 0, 'login failure/success never invokes registration');
  });

  test('AuthService.login returns axios response.data, preserving the documented data.token path', async () => {
    const originalPost = api.post;
    api.post = async () => ({ data: { success: true, data: { token: validJwt }, message: 'Login successful' } });
    try {
      const response = await AuthService.login('user@example.test', 'secret');
      assert.equal(response.data.token, validJwt);
    } finally {
      api.post = originalPost;
    }
  });

  test('backend rejection returns failure and preserves the login screen state', async () => {
    const storage = makeStorage();
    let registerCalls = 0;
    const result = await authenticateWithBackend({
      authService: {
        login: async () => { throw Object.assign(new Error('Unauthorized'), { userFriendlyMessage: 'Invalid credentials' }); },
        register: async () => { registerCalls += 1; },
      },
      email: 'user@example.test', password: 'bad', profile: makeProfile(), currency: 'INR', storage,
    });
    assert.deepEqual(result, { success: false, error: 'Invalid credentials' });
    assert.deepEqual(storage.entries(), {});
    assert.equal(registerCalls, 0, 'failed login never triggers automatic registration');
  });

  test('missing token cannot authenticate', async () => {
    const storage = makeStorage();
    const result = await runBackendLogin({ success: true, data: null }, storage);
    assert.equal(result.success, false);
    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('upiq_auth'), null);
  });

  test('empty or malformed JWT cannot authenticate', async () => {
    for (const token of ['', '  ', 'not-a-jwt', 'eyJhbGciOiJIUzI1NiJ9.e30.', 'bm90LWpzb24.e30.signature']) {
      assert.equal(isWellFormedJwt(token), false, `${JSON.stringify(token)} is rejected`);
      const storage = makeStorage();
      const result = await runBackendLogin({ success: true, data: { token } }, storage);
      assert.equal(result.success, false);
      assert.equal(storage.getItem('token'), null);
      assert.equal(storage.getItem('upiq_auth'), null);
    }
  });

  test('unsupported token locations are rejected', async () => {
    for (const response of [{ token: validJwt }, { accessToken: validJwt }]) {
      const storage = makeStorage();
      const result = await runBackendLogin(response, storage);
      assert.equal(result.success, false);
      assert.equal(storage.getItem('upiq_auth'), null);
    }
  });

  test('a token inside an unsuccessful ApiResponse cannot authenticate', async () => {
    const storage = makeStorage();
    const result = await runBackendLogin({ success: false, data: { token: validJwt } }, storage);
    assert.equal(result.success, false);
    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('upiq_auth'), null);
  });

  test('explicit demo login is separate from backend auth and clears a stale JWT', () => {
    const storage = makeStorage({ token: validJwt, upiq_auth: 'true' });
    const result = activateDemoSession({ storage, profile: makeProfile(), currency: 'INR' });
    assert.deepEqual(result, { success: true, mode: 'demo' });
    assert.equal(storage.getItem('token'), null);
    assert.equal(storage.getItem('upiq_demo'), 'true');
    assert.equal(storage.getItem('upiq_auth'), '"demo"');
  });
});
