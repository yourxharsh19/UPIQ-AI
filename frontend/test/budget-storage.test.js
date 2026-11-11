import test, { describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  LEGACY_STORAGE_KEY,
  getBudgetStorageKey,
  readStoredBudgets,
  writeStoredBudgets,
  exportBudgetsToJson,
  parseImportedBudgetsJson,
} from '../src/utils/budgetStorage.js';

const storageWith = (value) => ({ getItem: () => value });

const createMockStorage = (initial = {}) => {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => { store.set(key, String(value)); },
    removeItem: (key) => { store.delete(key); },
    get store() { return Object.fromEntries(store.entries()); },
  };
};

test('loads a saved budget object', () => {
  assert.deepEqual(readStoredBudgets(storageWith('{"Food":500}')), { Food: 500 });
});

test('recovers from malformed or non-object budget storage', () => {
  assert.deepEqual(readStoredBudgets(storageWith('{broken')), {});
  assert.deepEqual(readStoredBudgets(storageWith('null')), {});
  assert.deepEqual(readStoredBudgets(storageWith('[]')), {});
});

test('recovers when browser storage is unavailable', () => {
  assert.deepEqual(readStoredBudgets({ getItem: () => { throw new Error('storage blocked'); } }), {});
  assert.equal(writeStoredBudgets({ Food: 500 }, { setItem: () => { throw new Error('storage blocked'); } }), false);
});

describe('user-scoped budget persistence', () => {
  test('derives user-specific storage keys and defaults to guest', () => {
    assert.equal(getBudgetStorageKey('user-42'), 'upiq_budgets_user_user-42');
    assert.equal(getBudgetStorageKey(101), 'upiq_budgets_user_101');
    assert.equal(getBudgetStorageKey(null), 'upiq_budgets_guest');
    assert.equal(getBudgetStorageKey(undefined), 'upiq_budgets_guest');
    assert.equal(getBudgetStorageKey('   '), 'upiq_budgets_guest');
  });

  test('isolates stored budgets between different users in same browser', () => {
    const storage = createMockStorage();

    writeStoredBudgets({ Food: 500, Travel: 200 }, storage, 'alice');
    writeStoredBudgets({ Rent: 1500, Utilities: 300 }, storage, 'bob');

    assert.deepEqual(readStoredBudgets(storage, 'alice'), { Food: 500, Travel: 200 });
    assert.deepEqual(readStoredBudgets(storage, 'bob'), { Rent: 1500, Utilities: 300 });
    assert.deepEqual(readStoredBudgets(storage, 'charlie'), {});
  });

  test('safely migrates legacy unpartitioned budgets for first-time scoped user', () => {
    const storage = createMockStorage({
      [LEGACY_STORAGE_KEY]: JSON.stringify({ Groceries: 450, Entertainment: 150 }),
    });

    // Alice reads for the first time with no user-scoped entry
    const aliceBudgets = readStoredBudgets(storage, 'alice');
    assert.deepEqual(aliceBudgets, { Groceries: 450, Entertainment: 150 });

    // Should have migrated into alice's scoped key
    assert.equal(
      storage.getItem('upiq_budgets_user_alice'),
      JSON.stringify({ Groceries: 450, Entertainment: 150 })
    );

    // If Alice updates her budgets, legacy remains intact or untouched
    writeStoredBudgets({ Groceries: 600 }, storage, 'alice');
    assert.deepEqual(readStoredBudgets(storage, 'alice'), { Groceries: 600 });
  });
});

describe('budget export & import JSON handling', () => {
  test('exportBudgetsToJson formats payload with device-only note and metadata', () => {
    const jsonStr = exportBudgetsToJson({ Dining: 350, Fuel: 150 }, 'user_123');
    const parsed = JSON.parse(jsonStr);

    assert.equal(parsed.appName, 'UPIQ AI');
    assert.equal(parsed.user, 'user_123');
    assert.equal(parsed.note, 'Budgets are saved on this device only');
    assert.deepEqual(parsed.budgets, { Dining: 350, Fuel: 150 });
  });

  test('parseImportedBudgetsJson parses structured export payload correctly', () => {
    const exported = JSON.stringify({
      appName: 'UPIQ AI',
      schemaVersion: 1,
      budgets: {
        Groceries: 5000,
        Electricity: 1200.5,
      },
    });

    const result = parseImportedBudgetsJson(exported);
    assert.deepEqual(result, {
      Groceries: 5000,
      Electricity: 1200.5,
    });
  });

  test('parseImportedBudgetsJson also accepts a raw category-to-amount map', () => {
    const flat = JSON.stringify({
      Education: 2500,
      Healthcare: 800,
    });

    const result = parseImportedBudgetsJson(flat);
    assert.deepEqual(result, {
      Education: 2500,
      Healthcare: 800,
    });
  });

  test('parseImportedBudgetsJson rejects invalid JSON, empty data, or non-object payloads', () => {
    assert.throws(() => parseImportedBudgetsJson(''), /select a valid budget JSON file/);
    assert.throws(() => parseImportedBudgetsJson('{not json'), /Invalid JSON format/);
    assert.throws(() => parseImportedBudgetsJson('null'), /No valid budgets object found/);
    assert.throws(() => parseImportedBudgetsJson('[]'), /No valid budgets object found/);
    assert.throws(() => parseImportedBudgetsJson(JSON.stringify({ appName: 'UPIQ AI' })), /No valid category budget entries/);
  });

  test('parseImportedBudgetsJson ignores negative or non-numeric entries and strips metadata keys', () => {
    const mixed = JSON.stringify({
      appName: 'UPIQ AI',
      user: 'alice',
      budgets: {
        ValidCategory: 150,
        NegativeCategory: -100,
        InvalidType: 'abc',
        appName: 'ignore me',
      },
    });

    const result = parseImportedBudgetsJson(mixed);
    assert.deepEqual(result, {
      ValidCategory: 150,
    });
  });
});
