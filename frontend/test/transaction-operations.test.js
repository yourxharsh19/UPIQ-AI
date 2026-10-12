import test from 'node:test';
import assert from 'node:assert/strict';
import { persistTransactionChange, submitTransactionForm } from '../src/utils/transactionOperations.js';

test('keeps transaction dialog open when the save did not persist', async () => {
  let closed = false;

  const saved = await submitTransactionForm({
    save: async () => false,
    close: () => { closed = true; },
  });

  assert.equal(saved, false);
  assert.equal(closed, false);
});

test('closes transaction dialog after the save completes successfully', async () => {
  const order = [];

  const saved = await submitTransactionForm({
    save: async () => { order.push('saved'); return true; },
    close: () => order.push('closed'),
  });

  assert.equal(saved, true);
  assert.deepEqual(order, ['saved', 'closed']);
});

test('does not refresh or accept a backend-rejected transaction mutation', async () => {
  let refreshCount = 0;
  const refresh = async () => { refreshCount += 1; };

  await assert.rejects(persistTransactionChange({
    request: async () => ({ success: false, message: 'Rejected' }),
    refreshTransactions: refresh,
    refreshDashboard: refresh,
  }), /Rejected/);

  assert.equal(refreshCount, 0);
});

test('requires a created transaction before refreshing after a create request', async () => {
  let refreshCount = 0;
  const refresh = async () => { refreshCount += 1; };

  await assert.rejects(persistTransactionChange({
    request: async () => ({ success: true, data: null }),
    refreshDashboard: refresh,
    requireData: true,
  }), /did not confirm/);

  assert.equal(refreshCount, 0);
});

test('refreshes transaction views only after the backend accepts a mutation', async () => {
  const refreshed = [];

  const response = await persistTransactionChange({
    request: async () => ({ success: true, data: { id: 17 } }),
    refreshTransactions: async () => refreshed.push('transactions'),
    refreshDashboard: async () => refreshed.push('dashboard'),
    requireData: true,
  });

  assert.deepEqual(response.data, { id: 17 });
  assert.deepEqual(refreshed.sort(), ['dashboard', 'transactions']);
});
