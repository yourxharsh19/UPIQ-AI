import React, { useEffect, useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';
import { InvestmentSuggestionsService } from '../../services/investment-suggestions.service.js';
import { getAuthSessionMode } from '../../utils/authFlow.js';
import { getFeatureSessionKey } from '../../utils/featureSession.js';
import { normalizeInvestmentSuggestions } from '../../utils/investmentSuggestions.js';

export const InvestmentSuggestions = () => {
  const { formatCurrency, profile } = useFinancial();
  const sessionMode = getAuthSessionMode();
  const sessionKey = getFeatureSessionKey(profile, sessionMode);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    setResult(null);
    setError('');
    if (sessionMode !== 'authenticated') {
      setError(sessionMode === 'inconsistent'
        ? 'Your session needs to be resolved. Sign in again to view account-based suggestions.'
        : 'Sign in to view educational prompts based on your recorded cash flow.');
      return () => { active = false; };
    }
    setLoading(true);
    InvestmentSuggestionsService.getSuggestions().then((response) => {
      const data = response?.success ? normalizeInvestmentSuggestions(response.data) : null;
      if (!data) throw new Error('Invalid investment suggestions response');
      if (active) setResult({ sessionKey, data });
    }).catch(() => {
      if (active) setError('Educational suggestions could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [sessionKey, sessionMode]);

  const data = result?.sessionKey === sessionKey ? result.data : null;

  return (
    <Card className="space-y-3">
      <div className="flex items-center gap-2.5">
        <TrendingUp className="w-4 h-4 text-[var(--text-muted)]" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-[var(--text-main)]">Investment education prompts</h3>
      </div>
      {loading && <p role="status" className="text-xs text-[var(--text-muted)]">Reviewing your recorded cash flow…</p>}
      {error && <p role="alert" className="text-xs text-[var(--text-muted)]">{error}</p>}
      {data && <>
        <div className="grid gap-2 text-xs sm:grid-cols-3">
          <p>Recorded income: <strong>{formatCurrency(data.income)}</strong></p>
          <p>Recorded expenses: <strong>{formatCurrency(data.expenses)}</strong></p>
          <p>Monthly surplus: <strong>{formatCurrency(data.monthlySurplus)}</strong></p>
        </div>
        {data.savingsRatePercentage != null && <p className="text-xs text-[var(--text-muted)]">Recorded savings rate: {data.savingsRatePercentage}%</p>}
        <ul className="space-y-2">{data.suggestions.map((item) => (
          <li key={item.code} className="rounded-lg bg-[var(--bg-surface)] p-3">
            <p className="text-xs font-medium text-[var(--text-main)]">{item.title}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{item.description}</p>
          </li>
        ))}</ul>
        <p className="text-xs text-[var(--text-muted)]">{data.explanation} {data.aiGenerated ? 'Qualitative explanation only.' : 'Calculated explanation; AI unavailable.'}</p>
        <p className="border-t border-[var(--border-base)] pt-2 text-[11px] text-[var(--text-muted)]">{data.disclaimer}</p>
      </>}
    </Card>
  );
};
