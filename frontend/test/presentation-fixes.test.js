import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { submitRegistration, resolveAuthView, navigateToRegistration } from '../src/utils/registrationFlow.js';
import { AuthService } from '../src/services/auth.service.js';
import api from '../src/services/api.js';
import { mapAuthenticatedProfile } from '../src/utils/authProfile.js';
import { getMonthlyCashFlow, getTransactionCategorySpending } from '../src/utils/dashboardAnalytics.js';

describe('active registration flow', () => {
  test('login navigation selects the rendered registration view and submits the backend field values', async () => {
    let view = 'login';
    navigateToRegistration((nextView) => { view = nextView; });
    assert.equal(resolveAuthView(view, false), 'register');
    const originalPost = api.post;
    let request = null;
    api.post = async (url, data) => { request = { url, data }; return { data: { success: true } }; };
    const result = await submitRegistration({
      authService: AuthService,
      form: { name: 'Harsh Kumar', email: 'harsh@example.test', password: 'secure1' },
      navigateToLogin: () => { view = 'login'; },
    });
    api.post = originalPost;
    assert.deepEqual(request, { url: '/auth/register', data: { email: 'harsh@example.test', password: 'secure1', userName: 'Harsh Kumar', role: 'USER' } });
    assert.deepEqual(result, { success: true });
    assert.equal(resolveAuthView(view, false), 'login');
  });

  test('registration shows backend errors and does not navigate on failure', async () => {
    let navigated = false;
    const result = await submitRegistration({
      authService: { register: async () => { throw { response: { data: { message: 'Email is already registered.' } } }; } },
      form: { name: 'Harsh Kumar', email: 'harsh@example.test', password: 'secure1' },
      navigateToLogin: () => { navigated = true; },
    });
    assert.equal(result.error, 'Email is already registered.');
    assert.equal(navigated, false);
  });

  test('registration rejects an unsuccessful or malformed ApiResponse', async () => {
    let navigated = false;
    const result = await submitRegistration({
      authService: { register: async () => ({ success: false, message: 'Registration rejected.' }) },
      form: { name: 'Harsh Kumar', email: 'harsh@example.test', password: 'secure1' },
      navigateToLogin: () => { navigated = true; },
    });
    assert.deepEqual(result, { success: false, error: 'Registration rejected.' });
    assert.equal(navigated, false);
  });

  test('rejects invalid client fields without calling backend or navigating', async () => {
    let called = false;
    const result = await submitRegistration({
      authService: { register: async () => { called = true; } },
      form: { name: 'A', email: 'a@example.test', password: '123' },
      navigateToLogin: () => assert.fail('should not navigate'),
    });
    assert.equal(result.success, false);
    assert.equal(called, false);
  });
});

test('authenticated account name uses backend fullName or username and keeps email separate', () => {
  assert.deepEqual(mapAuthenticatedProfile({ fullName: 'Harsh Kumar', username: 'harsh', email: 'harsh@example.test', role: 'USER' }, {}), {
    name: 'Harsh Kumar', email: 'harsh@example.test', role: 'user',
  });
  assert.equal(mapAuthenticatedProfile({ username: 'harsh', email: 'harsh@example.test' }).name, 'harsh');
  assert.equal(mapAuthenticatedProfile({ username: 'harsh@example.test', email: 'harsh@example.test' }).name, 'User Account');
});

test('dashboard chart data is ledger-derived, INR-compatible amounts, and expense categories reconcile', () => {
  assert.deepEqual(getMonthlyCashFlow([]), []);
  assert.deepEqual(getTransactionCategorySpending([]), []);
  const transactions = [
    { date: '2026-09-08', type: 'expense', amount: '100.50', category: 'Rent' },
    { date: '2026-09-10', type: 'income', amount: '500', category: 'Income' },
    { date: '2026-09-11', type: 'expense', amount: 25, category: '' },
    { date: '2026-08-11', type: 'expense', amount: 200, category: 'Food' },
    { date: 'not-a-date', type: 'expense', amount: 99, category: 'Invalid date' },
  ];
  const trend = getMonthlyCashFlow(transactions, 2);
  assert.deepEqual(trend, [
    { period: new Date(2026, 7, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), income: 0, expense: 200, savings: -200 },
    { period: new Date(2026, 8, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }), income: 500, expense: 125.5, savings: 374.5 },
  ]);
  const spending = getTransactionCategorySpending(transactions);
  assert.deepEqual(spending.map(({ name, value, count }) => ({ name, value, count })), [
    { name: 'Rent', value: 100.5, count: 1 },
    { name: 'Uncategorized', value: 25, count: 1 },
  ]);
  assert.equal(spending.reduce((sum, item) => sum + item.value, 0), trend[1].expense);
});
