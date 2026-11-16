import test from 'node:test';
import assert from 'node:assert/strict';
import { appendChatMessage, clearChatMessages, getChatMessages, getChatSessionKey } from '../src/utils/chatSession.js';

test('chat history is retained per user session and is not shared between profiles', () => {
  const first = getChatSessionKey({ id: 7, email: 'one@example.test' });
  const second = getChatSessionKey({ id: 8, email: 'two@example.test' });
  const sameProfileDemo = getChatSessionKey({ id: 7 }, 'demo');
  const message = { id: 'user-1', sender: 'user', text: 'private question' };
  const conversations = appendChatMessage({}, first, first, message);

  assert.equal(getChatMessages(conversations, first).at(-1), message);
  assert.notEqual(getChatMessages(conversations, second).at(-1), message);
  assert.notEqual(getChatMessages(conversations, sameProfileDemo).at(-1), message);
  assert.equal(appendChatMessage(conversations, first, second, { id: 'late' }), conversations);
  assert.deepEqual(clearChatMessages(conversations), {});
});
