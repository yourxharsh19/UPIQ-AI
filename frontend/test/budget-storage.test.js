import test from 'node:test';
import assert from 'node:assert/strict';
import { readStoredBudgets, writeStoredBudgets } from '../src/utils/budgetStorage.js';

const storageWith = (value) => ({ getItem: () => value });

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
