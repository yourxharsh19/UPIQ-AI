import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  mapDashboardSummary,
  mapCategorySpending,
} from '../src/utils/financialDisplay.js';
import { persistTransactionChange } from '../src/utils/transactionOperations.js';

describe('dashboard & transaction consistency', () => {
  test('empty summary resets all KPI figures to zero without stale numbers', () => {
    const emptySummary = mapDashboardSummary({});
    assert.equal(emptySummary.totalBalance, 0);
    assert.equal(emptySummary.monthlyIncome, 0);
    assert.equal(emptySummary.monthlyExpense, 0);
    assert.equal(emptySummary.savingsRate, 0);
    assert.equal(emptySummary.transactionCount, 0);
  });

  test('backend financial summary matches mapped KPI metrics exactly', () => {
    const backendResponse = {
      netBalance: 15450.50,
      totalIncome: 25000.00,
      totalExpense: 9549.50,
      savingsRate: 61.80,
      incomeTransactionCount: 3,
      expenseTransactionCount: 14,
    };

    const mapped = mapDashboardSummary(backendResponse);
    assert.equal(mapped.totalBalance, 15450.50);
    assert.equal(mapped.monthlyIncome, 25000.00);
    assert.equal(mapped.monthlyExpense, 9549.50);
    assert.equal(mapped.savingsRate, 61.80);
    assert.equal(mapped.transactionCount, 17);
  });

  test('category spending percentages and totals reconcile with expense totals without rounding drift', () => {
    const backendCategories = [
      { categoryName: 'Food & Dining', totalAmount: 3500.50, percentage: 36.66, transactionCount: 5 },
      { categoryName: 'Shopping', totalAmount: 4000.00, percentage: 41.89, transactionCount: 4 },
      { categoryName: 'Bills & Utilities', totalAmount: 2049.00, percentage: 21.46, transactionCount: 2 },
    ];

    const mapped = mapCategorySpending(backendCategories, () => '#6366f1');
    const calculatedTotal = mapped.reduce((sum, c) => sum + c.value, 0);
    assert.equal(calculatedTotal, 9549.50);

    const totalPercentage = mapped.reduce((sum, c) => sum + c.percentage, 0);
    assert.ok(Math.abs(totalPercentage - 100.01) < 0.05); // Standard rounding tolerance
  });

  test('add transaction mutation triggers both transaction list and dashboard refetch from backend', async () => {
    const events = [];
    const mockCreatedTx = { id: 101, amount: 250, description: 'Coffee', type: 'expense' };

    await persistTransactionChange({
      request: async () => ({ success: true, data: mockCreatedTx }),
      refreshTransactions: async () => { events.push('refetched-transactions'); },
      refreshDashboard: async () => { events.push('refetched-dashboard'); },
      requireData: true,
    });

    assert.ok(events.includes('refetched-transactions'));
    assert.ok(events.includes('refetched-dashboard'));
    assert.equal(events.length, 2);
  });

  test('edit transaction mutation triggers both transaction list and dashboard refetch from backend', async () => {
    const events = [];
    const mockUpdatedTx = { id: 101, amount: 300, description: 'Special Coffee', type: 'expense' };

    await persistTransactionChange({
      request: async () => ({ success: true, data: mockUpdatedTx }),
      refreshTransactions: async () => { events.push('refetched-transactions'); },
      refreshDashboard: async () => { events.push('refetched-dashboard'); },
      requireData: false,
    });

    assert.ok(events.includes('refetched-transactions'));
    assert.ok(events.includes('refetched-dashboard'));
    assert.equal(events.length, 2);
  });

  test('delete transaction mutation triggers both transaction list and dashboard refetch from backend', async () => {
    const events = [];

    await persistTransactionChange({
      request: async () => ({ success: true }),
      refreshTransactions: async () => { events.push('refetched-transactions'); },
      refreshDashboard: async () => { events.push('refetched-dashboard'); },
      requireData: false,
    });

    assert.ok(events.includes('refetched-transactions'));
    assert.ok(events.includes('refetched-dashboard'));
    assert.equal(events.length, 2);
  });
});
