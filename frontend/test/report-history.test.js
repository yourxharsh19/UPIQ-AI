import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_REPORT_KEY,
  getReportHistoryStorageKey,
  readStoredReports,
  writeStoredReports,
  createReportSnapshot,
  saveReportToHistory,
  deleteReportFromHistory,
} from '../src/utils/reportHistoryStorage.js';

const createMockStorage = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    get store() { return Object.fromEntries(store.entries()); },
  };
};

describe('Task 5: report history storage & snapshot persistence', () => {
  test('generates user-scoped storage keys and defaults to guest', () => {
    assert.equal(getReportHistoryStorageKey('u-101'), 'upiq_report_history_user_u-101');
    assert.equal(getReportHistoryStorageKey(42), 'upiq_report_history_user_42');
    assert.equal(getReportHistoryStorageKey(null), 'upiq_report_history_guest');
    assert.equal(getReportHistoryStorageKey(undefined), 'upiq_report_history_guest');
    assert.equal(getReportHistoryStorageKey('   '), 'upiq_report_history_guest');
  });

  test('recovers gracefully from malformed or unavailable storage', () => {
    const brokenStorage = { getItem: () => '{broken json' };
    assert.deepEqual(readStoredReports(brokenStorage, 'user1'), []);

    const nonArrayStorage = { getItem: () => '{"single":"object"}' };
    assert.deepEqual(readStoredReports(nonArrayStorage, 'user1'), []);

    const throwingStorage = { getItem: () => { throw new Error('blocked'); } };
    assert.deepEqual(readStoredReports(throwingStorage, 'user1'), []);
    assert.equal(writeStoredReports([], throwingStorage, 'user1'), false);
  });

  test('isolates stored reports between different authenticated users in the same browser', () => {
    const storage = createMockStorage();

    const aliceReport = { id: 'rep-1', monthKey: '2026-03', title: 'March 2026' };
    const bobReport = { id: 'rep-2', monthKey: '2026-04', title: 'April 2026' };

    writeStoredReports([aliceReport], storage, 'alice');
    writeStoredReports([bobReport], storage, 'bob');

    assert.deepEqual(readStoredReports(storage, 'alice'), [aliceReport]);
    assert.deepEqual(readStoredReports(storage, 'bob'), [bobReport]);
    assert.deepEqual(readStoredReports(storage, 'charlie'), []);
  });

  test('safely migrates legacy unpartitioned reports for first-time scoped user', () => {
    const storage = createMockStorage({
      [LEGACY_REPORT_KEY]: JSON.stringify([{ id: 'legacy-1', monthKey: '2026-01', title: 'Legacy Jan' }]),
    });

    const loaded = readStoredReports(storage, 'user-A');
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 'legacy-1');

    // Scoped key now has the migrated reports
    assert.equal(
      storage.getItem('upiq_report_history_user_user-A'),
      JSON.stringify([{ id: 'legacy-1', monthKey: '2026-01', title: 'Legacy Jan' }])
    );
  });

  test('createReportSnapshot constructs valid report preview with device-only label', () => {
    const mockReport = {
      monthKey: '2026-03',
      totalIncome: 75000,
      totalExpense: 32000,
      netCashFlow: 43000,
      transactionCount: 14,
      averageExpense: 2285.71,
      categories: [
        { category: 'Groceries', amount: 12000, percentage: 37.5 },
        { category: 'Rent', amount: 20000, percentage: 62.5 },
      ],
      transactions: [],
    };

    const snapshot = createReportSnapshot(mockReport);
    assert.ok(snapshot);
    assert.equal(snapshot.monthKey, '2026-03');
    assert.equal(snapshot.totalIncome, 75000);
    assert.equal(snapshot.totalExpense, 32000);
    assert.equal(snapshot.netCashFlow, 43000);
    assert.equal(snapshot.transactionCount, 14);
    assert.equal(snapshot.topCategory, 'Groceries');
    assert.equal(snapshot.note, 'Saved on this device only');
    assert.ok(snapshot.id.startsWith('report_2026-03_'));
  });

  test('createReportSnapshot returns null if monthly report is invalid or missing monthKey', () => {
    assert.equal(createReportSnapshot(null), null);
    assert.equal(createReportSnapshot({}), null);
    assert.equal(createReportSnapshot({ monthKey: '' }), null);
  });

  test('saveReportToHistory prepends snapshot and persists to user storage across refresh', () => {
    const storage = createMockStorage();
    const snap1 = { id: 's1', monthKey: '2026-01', title: 'Jan Report' };
    const snap2 = { id: 's2', monthKey: '2026-02', title: 'Feb Report' };

    let history = saveReportToHistory(snap1, [], storage, 'user-1');
    assert.deepEqual(history, [snap1]);

    history = saveReportToHistory(snap2, history, storage, 'user-1');
    assert.deepEqual(history, [snap2, snap1]);

    // Simulate page refresh: read back from storage
    const refreshedHistory = readStoredReports(storage, 'user-1');
    assert.deepEqual(refreshedHistory, [snap2, snap1]);
  });

  test('deleteReportFromHistory removes report by id and updates storage', () => {
    const storage = createMockStorage();
    const snap1 = { id: 's1', monthKey: '2026-01', title: 'Jan Report' };
    const snap2 = { id: 's2', monthKey: '2026-02', title: 'Feb Report' };

    let history = saveReportToHistory(snap1, [], storage, 'user-1');
    history = saveReportToHistory(snap2, history, storage, 'user-1');
    assert.equal(history.length, 2);

    const updated = deleteReportFromHistory('s1', history, storage, 'user-1');
    assert.deepEqual(updated, [snap2]);

    // Verify deletion persisted in storage
    const stored = readStoredReports(storage, 'user-1');
    assert.deepEqual(stored, [snap2]);
  });
});
