import test from 'node:test';
import assert from 'node:assert/strict';
import { FinancialChatService, FINANCIAL_CHAT_TIMEOUT_MS } from '../src/services/financial-chat.service.js';
import { requestFinancialChatAnswer } from '../src/utils/financialChat.js';
import { categoryListFromResponse } from '../src/utils/categoryData.js';
import { resolveAppTab } from '../src/utils/appNavigation.js';
import { getFinancialChatPrompts } from '../src/utils/financialChatPrompts.js';

test('financial chat sends the typed question to its authenticated endpoint with time for Ollama', async () => {
  let call;
  const client = { post: async (...args) => { call = args; return { data: { success: true, data: { answer: 'Verified answer' } } }; } };
  const result = await FinancialChatService.ask('What was my food expense?', client);
  assert.deepEqual(call, [
    '/financial-chat',
    { question: 'What was my food expense?' },
    { timeout: FINANCIAL_CHAT_TIMEOUT_MS },
  ]);
  assert.equal(FINANCIAL_CHAT_TIMEOUT_MS, 125000);
  assert.equal(result.data.answer, 'Verified answer');
});

test('chat uses only the documented ApiResponse.data.answer and never fabricates a replacement', async () => {
  assert.deepEqual(await requestFinancialChatAnswer(async () => ({ data: { answer: 'Wrong envelope' } }), 'q'), {
    success: false,
    error: 'The assistant could not complete this request. Please retry.',
  });
  assert.deepEqual(await requestFinancialChatAnswer(async () => ({ success: true, data: { answer: '₹3620.00' } }), 'q'), {
    success: true,
    answer: '₹3620.00',
  });
  assert.deepEqual(await requestFinancialChatAnswer(async () => ({
    success: true,
    data: { error: false, answer: 'No income or expense transactions are available for October 2026.' },
  }), 'q'), {
    success: true,
    answer: 'No income or expense transactions are available for October 2026.',
  });
});

test('chat reports backend errors, authorization failures, provider failures, and timeout for retry', async () => {
  const backendError = await requestFinancialChatAnswer(async () => ({
    success: true,
    data: { error: true, answer: 'Your verified calculation is ready, but the AI service is currently unavailable. Please try again shortly.' },
  }), 'q');
  const timeout = await requestFinancialChatAnswer(async () => { throw { code: 'ECONNABORTED' }; }, 'q');
  const unauthorized = await requestFinancialChatAnswer(async () => { throw { response: { status: 401 } }; }, 'q');
  const serverError = await requestFinancialChatAnswer(async () => { throw { response: { status: 503 } }; }, 'q');
  const providerFailure = await requestFinancialChatAnswer(async () => { throw new Error('provider detail'); }, 'q');
  assert.equal(backendError.success, false);
  assert.match(backendError.error, /verified calculation is ready/);
  assert.match(timeout.error, /timed out/);
  assert.match(unauthorized.error, /sign in again/);
  assert.match(serverError.error, /temporarily unavailable/);
  assert.match(providerFailure.error, /Could not reach the assistant service/);
  assert.doesNotMatch(providerFailure.error, /provider detail/);
});

test('category API envelope maps its data list and no malformed payload becomes sample categories', () => {
  const categories = [{ id: 4, name: 'Food', type: 'expense' }];
  assert.deepEqual(categoryListFromResponse({ data: categories }), categories);
  assert.deepEqual(categoryListFromResponse({ data: { data: categories } }), []);
  assert.deepEqual(categoryListFromResponse(null), []);
});

test('active navigation resolves Categories and does not route upcoming Security into Insights', () => {
  assert.equal(resolveAppTab('categories'), 'categories');
  assert.equal(resolveAppTab('security'), 'dashboard');
  assert.equal(resolveAppTab('unexpected-tab'), 'dashboard');
});

test('suggested chat prompts always include education and use the latest transaction month for ledger questions', () => {
  const emptyPrompts = getFinancialChatPrompts([]);
  assert.deepEqual(emptyPrompts, ['What is a budget?', 'What is compound interest?']);
  const prompts = getFinancialChatPrompts([
    { date: '2026-07-01T00:00:00' }, { date: '2026-09-28T23:59:00' }, { date: 'invalid' },
  ]);
  assert.ok(prompts.includes('What were my total expenses in September 2026?'));
  assert.ok(prompts.includes('Compare Food and Groceries in September 2026'));
  assert.ok(prompts.every((prompt) => !prompt.includes('this month')));
});
