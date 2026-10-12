import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { createDateRangePreset, filterTransactionsByDateRange } from '../src/utils/transactionFilters.js';
import { DELETE_ALL_CONFIRMATION, deleteAllAndRefresh, runAfterDeleteAllConfirmation } from '../src/utils/transactionOperations.js';

describe('transaction date filtering', () => {
  const records = [
    { id: 1, date: '2026-08-31T23:59:59', amount: 10 },
    { id: 2, date: [2026, 9, 1, 0, 0, 0], amount: 20 },
    { id: 3, date: '2026-09-30T23:59:59', amount: 30 },
    { id: 4, date: 'invalid', amount: 40 },
  ];

  test('includes both calendar-day boundaries and excludes out-of-range or invalid dates', () => {
    const selected = filterTransactionsByDateRange(records, { startDate: '2026-09-01', endDate: '2026-09-30' });
    assert.deepEqual(selected.map(({ id }) => id), [2, 3]);
    assert.equal(selected.reduce((total, transaction) => total + transaction.amount, 0), 50);
  });

  test('supports clearing and rejects a reversed custom range', () => {
    assert.equal(filterTransactionsByDateRange(records, { startDate: '', endDate: '' }).length, 4);
    assert.deepEqual(filterTransactionsByDateRange(records, { startDate: '2026-09-30', endDate: '2026-09-01' }), []);
  });

  test('preserves prior presets, current-month default, and month/year boundaries', () => {
    const now = new Date(2026, 0, 12);
    assert.deepEqual(createDateRangePreset('this-month', now), { startDate: '2026-01-01', endDate: '2026-01-31' });
    assert.deepEqual(createDateRangePreset('last-month', now), { startDate: '2025-12-01', endDate: '2025-12-31' });
    assert.deepEqual(createDateRangePreset('all-time', now), { startDate: '', endDate: '' });
  });
});

describe('delete-all transaction orchestration', () => {
  test('requires explicit destructive confirmation and leaves data untouched when cancelled', async () => {
    let actionCalled = false;
    const result = await runAfterDeleteAllConfirmation({
      confirm: (message) => {
        assert.equal(message, DELETE_ALL_CONFIRMATION);
        assert.match(message, /cannot be undone/i);
        return false;
      },
      action: async () => { actionCalled = true; },
    });
    assert.equal(result.cancelled, true);
    assert.equal(actionCalled, false);
  });

  test('runs the delete action only after explicit confirmation', async () => {
    let actionCalled = false;
    const result = await runAfterDeleteAllConfirmation({
      confirm: () => true,
      action: async () => { actionCalled = true; return 'deleted'; },
    });
    assert.equal(result.cancelled, false);
    assert.equal(result.result, 'deleted');
    assert.equal(actionCalled, true);
  });

  test('refreshes transaction and dashboard data after confirmed backend success', async () => {
    const calls = [];
    await deleteAllAndRefresh({
      deleteAll: async () => { calls.push('delete'); return { success: true }; },
      refreshTransactions: async () => calls.push('transactions'),
      refreshDashboard: async () => calls.push('dashboard'),
    });
    assert.deepEqual(calls, ['delete', 'transactions', 'dashboard']);
  });

  test('does not refresh views when backend deletion fails or is not confirmed', async () => {
    let refreshed = false;
    await assert.rejects(deleteAllAndRefresh({
      deleteAll: async () => ({ success: false, message: 'denied' }),
      refreshTransactions: async () => { refreshed = true; },
      refreshDashboard: async () => { refreshed = true; },
    }), /denied/);
    assert.equal(refreshed, false);
  });
});
