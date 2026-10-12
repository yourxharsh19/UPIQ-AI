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

test('maps category API totals to the chart value field as numeric INR amounts', () => {
  const mapped = mapCategorySpending([{
    categoryName: 'Food',
    totalAmount: '3620.00',
    percentage: '27.50',
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

test('normalizes numeric transaction amounts without scaling or string concatenation', () => {
  assert.equal(toFinancialNumber('3620.00'), 3620);
  assert.equal(toFinancialNumber(3620), 3620);
  assert.equal(toFinancialNumber('not-a-number'), 0);
});
