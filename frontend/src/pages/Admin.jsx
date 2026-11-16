import { useEffect, useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { AdminDashboardService } from '../services/admin-dashboard.service.js';
import { getAuthSessionMode } from '../utils/authFlow.js';
import { getFeatureSessionKey } from '../utils/featureSession.js';

const Metric = ({ label, value }) => <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4"><p className="text-xs text-[var(--text-muted)]">{label}</p><p className="mt-1 text-xl font-bold text-[var(--text-main)]">{value}</p></div>;

export const Admin = () => {
  const { profile } = useFinancial();
  const sessionMode = getAuthSessionMode();
  const sessionKey = getFeatureSessionKey(profile, sessionMode);
  const [summaryResult, setSummaryResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setSummaryResult(null);
    setError('');
    setLoading(false);
    if (sessionMode !== 'authenticated') {
      setError(sessionMode === 'inconsistent'
        ? 'Your session state needs to be resolved. Sign in again to view platform metrics.'
        : 'Platform metrics require a backend-authenticated administrator account.');
      return () => { active = false; };
    }
    setLoading(true);
    AdminDashboardService.getSummary().then((response) => {
      const data = response?.data;
      const validCount = (value) => Number.isInteger(value) && value >= 0;
      const validAmount = (value) => typeof value === 'number' && Number.isFinite(value) && value >= 0;
      if (!response?.success || !data
          || !validCount(data.userCount) || !validCount(data.activeUserCount)
          || !validCount(data.transactionCount)
          || !validAmount(data.recordedIncome) || !validAmount(data.recordedExpenses)
          || Object.hasOwn(data, 'transactions')) {
        throw new Error('Admin metrics are unavailable.');
      }
      if (active) setSummaryResult({ sessionKey, data });
    }).catch(() => {
      if (active) setError('Admin metrics could not be loaded. Check your account access and try again.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [sessionKey, sessionMode]);
  const summary = summaryResult?.sessionKey === sessionKey ? summaryResult.data : null;
  return <div className="space-y-5">
    <header><h1 className="text-2xl font-bold text-[var(--text-main)]">Administrator Dashboard</h1><p className="mt-1 text-sm text-[var(--text-muted)]">Platform-wide aggregate metrics. No individual transaction details are shown.</p></header>
    {loading && <p role="status" className="text-sm text-[var(--text-muted)]">Loading platform metrics…</p>}
    {error && <p role="alert" className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-800 dark:text-amber-200">{error}</p>}
    {summary && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><Metric label="Accounts" value={summary.userCount} /><Metric label="Active accounts" value={summary.activeUserCount} /><Metric label="Recorded transactions" value={summary.transactionCount} /><Metric label="Recorded income total" value={summary.recordedIncome} /><Metric label="Recorded expense total" value={summary.recordedExpenses} /></div>}
    <p className="text-xs text-[var(--text-muted)]">These are database aggregates, not fraud detection, model, or service-health telemetry.</p>
  </div>;
};
