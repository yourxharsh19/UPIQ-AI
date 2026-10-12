import test from 'node:test';
import assert from 'node:assert/strict';
import { buildLocalBudgetForecasts, formatBudgetUsage } from '../src/utils/budgetForecasts.js';

test('builds local monthly estimates from saved category budgets and expense transactions', () => {
  const now = new Date(2026, 9, 15, 12);
  const forecasts = buildLocalBudgetForecasts({ Food: '600', Transport: 0 }, [
    { type: 'expense', category: 'food', amount: '100', date: '2026-10-05T10:00:00' },
    { type: 'expense', category: 'Food', amount: 200, date: '2026-10-10T10:00:00' },
    { type: 'income', category: 'Food', amount: 5000, date: '2026-10-12T10:00:00' },
    { type: 'expense', category: 'Food', amount: 900, date: '2026-09-30T10:00:00' },
  ], now);

  assert.equal(forecasts.length, 1);
  assert.deepEqual({
    category: forecasts[0].category,
    budget: forecasts[0].budget,
    spent: forecasts[0].spent,
    predicted: forecasts[0].predicted,
  }, { category: 'Food', budget: 600, spent: 300, predicted: 620 });
  assert.match(forecasts[0].color, /^#/);
});

test('shows a useful empty-budget message instead of a NaN percentage', () => {
  assert.deepEqual(buildLocalBudgetForecasts({}, [], new Date(2026, 9, 1)), []);
  assert.equal(formatBudgetUsage(0, 0), 'Set category budgets to see usage');
  assert.equal(formatBudgetUsage(300, 600), '50.0% of total cap');
});
