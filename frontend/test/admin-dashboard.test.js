import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AdminDashboardService } from '../src/services/admin-dashboard.service.js';
import { normalizeAdminSummary, normalizeAdminUsers } from '../src/utils/adminDashboard.js';

test('normalizes the real aggregate response with decimal-string totals', () => {
  const summary = normalizeAdminSummary({
    userCount: 4,
    activeUserCount: 3,
    transactionCount: 12,
    recordedIncome: '12000.50',
    recordedExpenses: '6750.25',
  });
  assert.equal(summary.recordedIncome, '12000.50');
  assert.equal(summary.recordedExpenses, '6750.25');
  assert.equal(normalizeAdminSummary({ ...summary, recordedIncome: 12000.5 }), null);
  assert.equal(normalizeAdminSummary({ ...summary, transactions: [] }), null);
});

test('normalizes the protected account directory without accepting password fields', () => {
  const users = normalizeAdminUsers([{
    id: 42,
    email: 'admin-visible@example.test',
    username: 'visible-user',
    fullName: null,
    role: 'USER',
    active: false,
    createdAt: null,
    lastLoginAt: null,
  }]);
  assert.equal(users[0].id, '42');
  assert.equal(users[0].fullName, '');
  assert.equal(users[0].active, false);
  assert.equal(normalizeAdminUsers([{ ...users[0], password: 'must-not-appear' }]), null);
  assert.deepEqual(normalizeAdminUsers([]), []);
});

test('admin service calls the existing protected aggregate and directory endpoints', async () => {
  const calls = [];
  const client = { get: async (path) => { calls.push(path); return { data: { success: true, data: [] } }; } };
  await AdminDashboardService.getSummary(client);
  await AdminDashboardService.getUsers(client);
  assert.deepEqual(calls, ['/admin/dashboard', '/v1/users']);
});

test('admin page gates requests by session and role and exposes refresh, loading, error, and empty states', () => {
  const source = readFileSync(resolve(process.cwd(), 'src/pages/Admin.jsx'), 'utf8');
  assert.match(source, /sessionMode !== 'authenticated' \|\| profile\?\.role !== 'admin'/);
  assert.match(source, /Loading platform metrics/);
  assert.match(source, /role="alert"/);
  assert.match(source, /No accounts are available/);
  assert.match(source, /Refresh data/);
  assert.match(source, /The current API does not provide account status changes/);
});
