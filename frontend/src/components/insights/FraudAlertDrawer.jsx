import React, { useEffect, useState } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Card } from '../common/Card';
import { FraudDetectionService } from '../../services/fraud-detection.service.js';
import { getAuthSessionMode } from '../../utils/authFlow.js';
import { getFeatureSessionKey } from '../../utils/featureSession.js';
import { normalizeFraudAlerts } from '../../utils/fraudAlerts.js';

const riskClasses = {
  LOW: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
  MEDIUM: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
  HIGH: 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300',
};

export const FraudAlertDrawer = () => {
  const { formatCurrency, profile } = useFinancial();
  const sessionMode = getAuthSessionMode();
  const sessionKey = getFeatureSessionKey(profile, sessionMode);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    setResult(null);
    setError('');
    if (sessionMode !== 'authenticated') {
      setError(sessionMode === 'inconsistent'
        ? 'Your session needs to be resolved. Sign in again to review account transactions.'
        : 'Sign in to review anomaly signals from your account transactions.');
      return () => { active = false; };
    }
    setLoading(true);
    FraudDetectionService.getAlerts().then((response) => {
      const data = response?.success ? normalizeFraudAlerts(response.data) : null;
      if (!data) throw new Error('Invalid fraud alerts response');
      if (active) setResult({ sessionKey, data });
    }).catch(() => {
      if (active) setError('Transaction review signals could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [sessionKey, sessionMode]);

  const data = result?.sessionKey === sessionKey ? result.data : null;

  return (
    <main className="mx-auto w-full max-w-5xl space-y-5 p-4 sm:p-6" aria-labelledby="fraud-review-title">
      <header>
        <h1 id="fraud-review-title" className="flex items-center gap-2 text-xl font-bold text-[var(--text-main)]">
          <ShieldAlert className="h-5 w-5 text-amber-500" aria-hidden="true" /> Security &amp; Fraud Review
        </h1>
        <p className="mt-1 text-xs text-[var(--text-muted)]">Explainable rules highlight activity for your review. A flag is not proof of fraud and does not block a transaction.</p>
      </header>
      <Card className="space-y-3">
        {loading && <p role="status" className="text-sm text-[var(--text-muted)]">Reviewing recent transactions…</p>}
        {error && <p role="alert" className="text-sm text-[var(--text-muted)]">{error}</p>}
        {data && <>
          <p className="text-xs text-[var(--text-muted)]">Analysis window: {data.analysisStartDate} to {data.analysisEndDate}</p>
          {data.alerts.length === 0
            ? <p role="status" className="rounded-lg bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-muted)]">No transactions matched the current review rules in this period.</p>
            : <ul className="space-y-3">{data.alerts.map((alert) => (
              <li key={alert.transactionId} className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-words text-sm font-semibold text-[var(--text-main)]">{alert.description?.trim() || 'No description recorded'}</p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">{alert.date.replace('T', ' ')} · {alert.category || 'Uncategorized'}{alert.paymentMethod ? ` · ${alert.paymentMethod}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm tabular-nums text-[var(--text-main)]">{formatCurrency(alert.amount)}</strong>
                    <span className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${riskClasses[alert.riskLevel]}`}>{alert.riskLevel} REVIEW</span>
                  </div>
                </div>
                <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-[var(--text-muted)]">
                  {alert.reasons.map((reason) => <li key={reason.code}>{reason.description}</li>)}
                </ul>
              </li>
            ))}</ul>}
          <p className="border-t border-[var(--border-base)] pt-3 text-xs text-[var(--text-muted)]">{data.disclaimer}</p>
        </>}
      </Card>
    </main>
  );
};
