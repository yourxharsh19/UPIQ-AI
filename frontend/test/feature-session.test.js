import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getFeatureSessionKey,
  getUndismissedNotifications,
  isCurrentFeatureRequest,
} from '../src/utils/featureSession.js';

test('feature request scope changes across users and authentication modes', () => {
  const profile = { id: 17, email: 'person@example.test', role: 'user' };
  const authenticated = getFeatureSessionKey(profile, 'authenticated');

  assert.notEqual(authenticated, getFeatureSessionKey({ ...profile, id: 18 }, 'authenticated'));
  assert.notEqual(authenticated, getFeatureSessionKey(profile, 'demo'));
  assert.notEqual(authenticated, getFeatureSessionKey(profile, 'inconsistent'));
});

test('late feature responses are rejected after a session or request change', () => {
  const request = { id: 3, sessionKey: 'authenticated:user:17:user' };

  assert.equal(isCurrentFeatureRequest(request, request), true);
  assert.equal(isCurrentFeatureRequest(request, { id: 4, sessionKey: request.sessionKey }), false);
  assert.equal(isCurrentFeatureRequest(request, { id: 3, sessionKey: 'authenticated:user:18:user' }), false);
});

test('notification dismissal filters visible items and tolerates empty responses', () => {
  const notifications = [{ id: 'a' }, { id: 'b' }, { id: null }];

  assert.deepEqual(getUndismissedNotifications(notifications, ['a']), [{ id: 'b' }]);
  assert.deepEqual(getUndismissedNotifications(null, []), []);
  assert.deepEqual(getUndismissedNotifications(notifications, null), [{ id: 'a' }, { id: 'b' }]);
});
