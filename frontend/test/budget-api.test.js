import test from 'node:test';
import assert from 'node:assert/strict';
import { budgetMonth, budgetPayload, budgetsByCategory, normalizeBudgetRows } from '../src/utils/budgetApi.js';

test('backend budget rows preserve exact decimal strings and 64-bit identifiers', () => {
  const rows = normalizeBudgetRows([
    { id: '922337203685477580', category: 'Food', amount: '10000.10', spent: '1200.09', remaining: '8800.01', projectedSpend: '2400.18' },
  ]);

  assert.equal(rows[0].id, '922337203685477580');
  assert.equal(rows[0].amount, '10000.10');
  assert.equal(rows[0].spent, '1200.09');
  assert.equal(budgetsByCategory(rows).Food, '10000.10');
});

test('budget month and total/category request payloads remain explicit', () => {
  assert.equal(budgetMonth(new Date(2026, 1, 28)), '2026-02');
  assert.deepEqual(budgetPayload(' Food ', '12000.05', '2026-02'), {
    category: 'Food', amount: '12000.05', month: '2026-02',
  });
  assert.deepEqual(budgetPayload(null, '25000.00', '2026-02'), {
    category: null, amount: '25000.00', month: '2026-02',
  });
});

test('invalid response rows and missing row arrays are safely ignored', () => {
  assert.deepEqual(normalizeBudgetRows(null), []);
  assert.deepEqual(normalizeBudgetRows([{ id: 'x', category: 'Food', amount: 10 }, null]), []);
  assert.deepEqual(budgetsByCategory([{ id: '1', category: null, amount: '100.00' }]), {});
});
