import test from 'node:test';
import assert from 'node:assert/strict';
import { createMonthlyReportCsv, getAvailableReportMonths, getMonthlyReport } from '../src/utils/monthlyReport.js';
import { getTransactionCoverage, hasTransactionsInMonth } from '../src/utils/transactionCoverage.js';

const ledger = [
  { id: 1, date: '2026-10-03T10:00:00', type: 'income', amount: '10000', category: 'Salary', title: 'October "pay", bonus' },
  { id: 2, date: '2026-10-05T11:00:00', type: 'expense', amount: '3620.00', category: 'Food', title: 'Café, "Lunch"\nvisit' },
  { id: 3, date: '2026-10-07T11:00:00', type: 'expense', amount: 380, category: 'Travel', title: 'Metro' },
  { id: 4, date: '2026-09-08T09:00:00', type: 'expense', amount: 100, category: 'Food', title: 'Prior month' },
  { id: 5, date: '2026-10-08T09:00:00', type: 'transfer', amount: 5000, category: 'Transfer', title: 'Transfer' },
  { id: 6, date: '2026-10-09T09:00:00', type: 'expense', amount: 1, category: 'Other', title: '=1+1' },
];

test('calculates selected-month summaries and categories from income/expense transactions only', () => {
  const report = getMonthlyReport(ledger, '2026-10');
  assert.equal(report.totalIncome, 10000);
  assert.equal(report.totalExpense, 4001);
  assert.equal(report.netCashFlow, 5999);
  assert.equal(report.transactionCount, 4);
  assert.equal(report.averageExpense, 1333.67);
  assert.deepEqual(report.categories.map(({ category, amount, percentage }) => ({ category, amount, percentage: Number(percentage.toFixed(2)) })), [
    { category: 'Food', amount: 3620, percentage: 90.48 },
    { category: 'Travel', amount: 380, percentage: 9.5 },
    { category: 'Other', amount: 1, percentage: 0.02 },
  ]);
});

test('handles a month with no transactions and offers prior months through current month', () => {
  const empty = getMonthlyReport(ledger, '2026-08');
  assert.equal(empty.totalIncome, 0);
  assert.equal(empty.totalExpense, 0);
  assert.equal(empty.transactionCount, 0);
  assert.deepEqual(empty.categories, []);
  assert.deepEqual(getAvailableReportMonths(ledger, new Date(2026, 9, 11)), ['2026-10', '2026-09']);
});

test('coverage uses valid transaction dates, defaults to the latest data month, and handles empty/current periods', () => {
  const coverage = getTransactionCoverage([
    { date: '2026-07-01T00:00:00Z' },
    { date: 'invalid' },
    { date: '2026-09-28T23:59:00' },
  ]);
  assert.deepEqual(coverage, { earliestDate: '2026-07-01', latestDate: '2026-09-28', defaultMonth: '2026-09' });
  assert.equal(hasTransactionsInMonth(ledger, '2026-10'), true);
  assert.equal(hasTransactionsInMonth(ledger, '2026-08'), false);
  assert.deepEqual(getTransactionCoverage([]), { earliestDate: null, latestDate: null, defaultMonth: null });
  assert.deepEqual(getAvailableReportMonths([], new Date(2026, 9, 11)), []);
});

test('CSV includes period, summaries, category breakdown, and correctly escapes special characters', () => {
  const csv = createMonthlyReportCsv(getMonthlyReport(ledger, '2026-10'));
  assert.ok(csv.startsWith('\uFEFF'));
  assert.match(csv, /UPIQ Monthly Financial Report.*2026-10/);
  assert.match(csv, /"Total expenses","4001\.00"/);
  assert.match(csv, /"Food","3620\.00","90\.48"/);
  assert.match(csv, /"Café, ""Lunch""\nvisit"/);
  assert.match(csv, /"'=1\+1"/);
});
