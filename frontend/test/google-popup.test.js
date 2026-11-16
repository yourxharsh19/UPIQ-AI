import { test } from 'node:test';
import assert from 'node:assert/strict';
import { waitForGooglePopupHandoff } from '../src/utils/googlePopup.js';

const createWindow = () => {
  const listeners = new Map();
  const popup = { closed: false, close() { this.closed = true; } };
  let intervalCallback;
  return {
    listeners,
    popup,
    tick: () => intervalCallback?.(),
    open: () => popup,
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
    setInterval: (callback) => { intervalCallback = callback; return 1; },
    clearInterval: () => {},
    setTimeout: () => 2,
    clearTimeout: () => {},
  };
};

test('accepts handoff only from the expected backend origin and exact popup', async () => {
  const windowObject = createWindow();
  const result = waitForGooglePopupHandoff({
    windowObject,
    authorizationUrl: 'http://localhost:8080/oauth2/authorization/google',
    expectedOrigin: 'http://localhost:8080',
  });
  const listener = windowObject.listeners.get('message');
  listener({ origin: 'https://attacker.test', source: windowObject.popup, data: { type: 'UPIQ_GOOGLE_AUTH_SUCCESS', value: 'bad' } });
  listener({ origin: 'http://localhost:8080', source: {}, data: { type: 'UPIQ_GOOGLE_AUTH_SUCCESS', value: 'bad' } });
  listener({ origin: 'http://localhost:8080', source: windowObject.popup, data: { type: 'UPIQ_GOOGLE_AUTH_SUCCESS', value: 'single-use-code' } });
  assert.equal(await result, 'single-use-code');
  assert.equal(windowObject.listeners.has('message'), false);
});

test('handles provider failure and user cancellation without exposing provider details', async () => {
  const failedWindow = createWindow();
  const failed = waitForGooglePopupHandoff({ windowObject: failedWindow, authorizationUrl: '/oauth2/authorization/google', expectedOrigin: 'https://api.example.test' });
  failedWindow.listeners.get('message')({
    origin: 'https://api.example.test', source: failedWindow.popup,
    data: { type: 'UPIQ_GOOGLE_AUTH_FAILURE', value: 'authentication_failed' },
  });
  await assert.rejects(failed, /Google sign-in could not be completed/);

  const cancelledWindow = createWindow();
  const cancelled = waitForGooglePopupHandoff({ windowObject: cancelledWindow, authorizationUrl: '/oauth2/authorization/google', expectedOrigin: 'https://api.example.test' });
  cancelledWindow.popup.closed = true;
  cancelledWindow.tick();
  await assert.rejects(cancelled, /Google sign-in was cancelled/);
});
