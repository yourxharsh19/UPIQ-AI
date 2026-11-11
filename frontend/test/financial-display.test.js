import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatInrAmount,
  formatSavingsRate,
  mapCategorySpending,
  mapDashboardSummary,
  toFinancialNumber,
} from '../src/utils/financialDisplay.js';

test('formats stored INR amounts without applying an exchange-rate multiplier', () => {
  assert.equal(formatInrAmount(3620), '₹3,620.00');
  assert.equal(formatInrAmount('123456.7'), '₹1,23,456.70');
  assert.equal(formatInrAmount(Number.NaN), '₹0.00');
});

test('maps backend summary fields to monthly KPI values and transaction counts', () => {
  assert.deepEqual(mapDashboardSummary({
    netBalance: 6380,
    totalIncome: '10000.00',
    totalExpense: 3620,
    savingsRate: '63.80',
    incomeTransactionCount: 2,
    expenseTransactionCount: 6,
  }), {
    totalBalance: 6380,
    monthlyIncome: 10000,
    monthlyExpense: 3620,
    savingsRate: 63.8,
    transactionCount: 8,
  });
  assert.equal(formatSavingsRate(63.8), '63.80%');
});

test('maps backend category totals to the chart value fields', () => {
  const mapped = mapCategorySpending([{
    category: 'Food',
    total: '3620.00',
    percentageOfTotalExpense: '27.50',
    transactionCount: 6,
  }], () => '#123456');

  assert.deepEqual(mapped, [{
    id: 'cat-0',
    name: 'Food',
    value: 3620,
    percentage: 27.5,
    count: 6,
    color: '#123456',
  }]);
  assert.equal(mapped.reduce((total, category) => total + category.value, 0), 3620);
  assert.equal('amount' in mapped[0], false);
});

test('maps multiple backend categories and safely handles empty, null, and missing data', () => {
  const colorFor = (name) => name === 'Food' ? '#123456' : '#654321';
  const mapped = mapCategorySpending([
    { category: 'Food', total: '120.50', percentageOfTotalExpense: '60.25', transactionCount: 2 },
    { category: 'Travel', total: 79.5, percentageOfTotalExpense: 39.75, transactionCount: 3 },
  ], colorFor);

  assert.deepEqual(mapped.map(({ name, value, percentage, count, color }) => ({
    name, value, percentage, count, color,
  })), [
    { name: 'Food', value: 120.5, percentage: 60.25, count: 2, color: '#123456' },
    { name: 'Travel', value: 79.5, percentage: 39.75, count: 3, color: '#654321' },
  ]);
  assert.deepEqual(mapCategorySpending([]), []);
  assert.deepEqual(mapCategorySpending(null), []);
  assert.deepEqual(mapCategorySpending([null, {}]), [
    { id: 'cat-0', name: 'Uncategorized', value: 0, percentage: 0, count: 0, color: '#6B7280' },
  ]);
});

test('normalizes numeric transaction amounts without scaling or string concatenation', () => {
  assert.equal(toFinancialNumber('3620.00'), 3620);
  assert.equal(toFinancialNumber(3620), 3620);
  assert.equal(toFinancialNumber('not-a-number'), 0);
});
