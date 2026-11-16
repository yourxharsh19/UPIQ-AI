import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeInvestmentSuggestions } from '../src/utils/investmentSuggestions.js';

const response = {
  month: '2026-11',
  income: '12500.00',
  expenses: '8750.25',
  monthlySurplus: '3749.75',
  savingsRatePercentage: '29.99',
  cashFlowStatus: 'POSITIVE_SURPLUS',
  suggestions: [{ code: 'learn', title: 'Review your foundation', description: 'Learn about risk and liquidity.' }],
  explanation: 'Review near-term needs before making decisions.',
  aiGenerated: true,
  disclaimer: 'Educational information only.',
};

test('normalizes the authenticated backend investment suggestion contract without numeric coercion', () => {
  const result = normalizeInvestmentSuggestions(response);
  assert.equal(result.income, '12500.00');
  assert.equal(result.monthlySurplus, '3749.75');
  assert.equal(result.suggestions[0].code, 'learn');
});

test('rejects malformed amounts, status values, and suggestion rows', () => {
  assert.equal(normalizeInvestmentSuggestions({ ...response, monthlySurplus: 'NaN' }), null);
  assert.equal(normalizeInvestmentSuggestions({ ...response, income: 12500 }), null);
  assert.equal(normalizeInvestmentSuggestions({ ...response, cashFlowStatus: 'BUY_NOW' }), null);
  assert.equal(normalizeInvestmentSuggestions({ ...response, suggestions: [{ title: 'missing fields' }] }), null);
});

test('accepts empty-history response without inferring a savings rate', () => {
  const result = normalizeInvestmentSuggestions({
    ...response,
    income: '0.00',
    expenses: '0.00',
    monthlySurplus: '0.00',
    savingsRatePercentage: null,
    cashFlowStatus: 'NO_DATA',
    suggestions: [{ code: 'record', title: 'Record activity', description: 'Add transaction history.' }],
  });
  assert.equal(result.savingsRatePercentage, null);
  assert.equal(result.cashFlowStatus, 'NO_DATA');
});
