import { useEffect, useMemo, useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { getAuthSessionMode } from '../utils/authFlow.js';
import { getFeatureSessionKey } from '../utils/featureSession.js';
import { normalizeAdminSummary, normalizeAdminUsers } from '../utils/adminDashboard.js';

const Metric = ({ label, value }) => (
  <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4">
    <p className="text-xs text-[var(--text-muted)]">{label}</p>
    <p className="mt-1 text-xl font-bold text-[var(--text-main)]">{value}</p>
  </div>
);

const displayDate = (value) => value ? value.replace('T', ' ').slice(0, 16) : '—';

export const Admin = () => {
  const { formatCurrency, profile } = useFinancial();
  const sessionMode = getAuthSessionMode();
  const sessionKey = getFeatureSessionKey(profile, sessionMode);
  const [summaryResult, setSummaryResult] = useState(null);
  const [usersResult, setUsersResult] = useState(null);
  const [summaryError, setSummaryError] = useState('');
  const [usersError, setUsersError] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshIndex, setRefreshIndex] = useState(0);

  useEffect(() => {
    let active = true;
    setSummaryResult(null);
    setUsersResult(null);
    setSummaryError('');
    setUsersError('');
    setSummaryLoading(false);
    setUsersLoading(false);
    if (sessionMode !== 'authenticated' || profile?.role !== 'admin') {
      const message = sessionMode === 'inconsistent'
        ? 'Your session needs to be resolved. Sign in again to view administrator data.'
        : 'Administrator data requires a backend-authenticated administrator account.';
      setSummaryError(message);
      setUsersError(message);
      return () => { active = false; };
    }

    setSummaryLoading(true);
    AdminDashboardService.getSummary().then((response) => {
      const data = response?.success ? normalizeAdminSummary(response.data) : null;
      if (!data) throw new Error('Invalid aggregate response');
      if (active) setSummaryResult({ sessionKey, data });
    }).catch(() => {
      if (active) setSummaryError('Platform metrics could not be loaded. Check your account access and retry.');
    }).finally(() => {
      if (active) setSummaryLoading(false);
    });

    setUsersLoading(true);
    AdminDashboardService.getUsers().then((response) => {
      const data = response?.success ? normalizeAdminUsers(response.data) : null;
      if (!data) throw new Error('Invalid account directory response');
      if (active) setUsersResult({ sessionKey, data });
    }).catch(() => {
      if (active) setUsersError('The account directory could not be loaded. Check your account access and retry.');
    }).finally(() => {
      if (active) setUsersLoading(false);
    });
    return () => { active = false; };
  }, [sessionKey, sessionMode, profile?.role, refreshIndex]);

  const summary = summaryResult?.sessionKey === sessionKey ? summaryResult.data : null;
  const users = usersResult?.sessionKey === sessionKey ? usersResult.data : null;
  const visibleUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return (users || []).filter((user) => {
      const matchesStatus = statusFilter === 'all'
        || (statusFilter === 'active' ? user.active : !user.active);
      const matchesQuery = !normalizedQuery
        || [user.fullName, user.email, user.username, user.role]
          .some((value) => value.toLowerCase().includes(normalizedQuery));
      return matchesStatus && matchesQuery;
    });
  }, [users, query, statusFilter]);

  const isLoading = summaryLoading || usersLoading;

  return <div className="space-y-5">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-main)]">Administrator Dashboard</h1>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Platform aggregates and a read-only account directory. Financial transaction rows are not exposed here.</p>
      </div>
      <button type="button" onClick={() => setRefreshIndex((index) => index + 1)} disabled={isLoading}
        className="inline-flex items-center gap-2 rounded-lg border border-[var(--border-base)] px-3 py-2 text-xs text-[var(--text-main)] hover:bg-[var(--bg-surface)] disabled:opacity-50">
        <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Refresh data
      </button>
    </header>

    <section aria-labelledby="admin-metrics-title" className="space-y-3">
      <h2 id="admin-metrics-title" className="text-sm font-semibold text-[var(--text-main)]">Platform overview</h2>
      {summaryLoading && <p role="status" className="text-sm text-[var(--text-muted)]">Loading platform metrics…</p>}
      {summaryError && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{summaryError}</p>}
      {summary && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <Metric label="Accounts" value={summary.userCount} />
        <Metric label="Active accounts" value={summary.activeUserCount} />
        <Metric label="Recorded transactions" value={summary.transactionCount} />
        <Metric label="Recorded income total" value={formatCurrency(summary.recordedIncome)} />
        <Metric label="Recorded expense total" value={formatCurrency(summary.recordedExpenses)} />
      </div>}
      {summary && <p className="text-xs text-[var(--text-muted)]">Database aggregates only; no transaction-level details, fraud findings, or service-health telemetry are exposed.</p>}
    </section>

    <section aria-labelledby="admin-accounts-title" className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="admin-accounts-title" className="text-sm font-semibold text-[var(--text-main)]">Account directory</h2>
          <p className="mt-1 text-xs text-[var(--text-muted)]">Read-only account identity and status from the administrator-protected user endpoint.</p>
        </div>
        {users && <span className="text-xs text-[var(--text-muted)]">{visibleUsers.length} shown · {users.length} total</span>}
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search accounts"
          placeholder="Search name, email, username, or role"
          className="min-w-0 flex-1 rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-main)]" />
        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter account status"
          className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] px-3 py-2 text-xs text-[var(--text-main)]">
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>
      {usersLoading && <p role="status" className="text-sm text-[var(--text-muted)]">Loading account directory…</p>}
      {usersError && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{usersError}</p>}
      {users && users.length === 0 && <p role="status" className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">No accounts are available.</p>}
      {users && users.length > 0 && visibleUsers.length === 0 && <p role="status" className="rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] p-4 text-sm text-[var(--text-muted)]">No accounts match the current filters.</p>}
      {visibleUsers.length > 0 && <div className="overflow-x-auto rounded-xl border border-[var(--border-base)]">
        <table className="min-w-full divide-y divide-[var(--border-base)] text-left text-xs">
          <caption className="sr-only">Read-only administrator account directory</caption>
          <thead className="bg-[var(--bg-surface)] text-[var(--text-muted)]"><tr>
            <th scope="col" className="px-3 py-2.5 font-medium">Account</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Role</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Status</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Created</th>
            <th scope="col" className="px-3 py-2.5 font-medium">Last login</th>
          </tr></thead>
          <tbody className="divide-y divide-[var(--border-base)] bg-[var(--bg-card)]">
            {visibleUsers.map((user) => <tr key={user.id}>
              <td className="px-3 py-2.5"><p className="font-medium text-[var(--text-main)]">{user.fullName || user.username}</p><p className="mt-0.5 text-[var(--text-muted)]">{user.email}</p></td>
              <td className="px-3 py-2.5 text-[var(--text-main)]">{user.role}</td>
              <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-1 text-[10px] ${user.active ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-slate-500/10 text-slate-600 dark:text-slate-300'}`}>{user.active ? 'Active' : 'Inactive'}</span></td>
              <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">{displayDate(user.createdAt)}</td>
              <td className="whitespace-nowrap px-3 py-2.5 text-[var(--text-muted)]">{displayDate(user.lastLoginAt)}</td>
            </tr>)}
          </tbody>
        </table>
      </div>}
      <p className="text-[11px] text-[var(--text-muted)]">Account status is displayed for review. The current API does not provide account status changes or other write actions.</p>
    </section>
  </div>;
};
