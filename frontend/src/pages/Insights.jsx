import React, { useEffect, useState } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useAIBudget } from '../hooks/useAIBudget';
import { BudgetForecastCard } from '../components/insights/BudgetForecastCard';
import { InvestmentSuggestions } from '../components/insights/InvestmentSuggestions';
import { formatBudgetUsage } from '../utils/budgetForecasts.js';
import { FinancialInsightsService } from '../services/financial-insights.service.js';
import { getAuthSessionMode } from '../utils/authFlow.js';
import { getFeatureSessionKey } from '../utils/featureSession.js';
import { compareMoney } from '../utils/money.js';

export const Insights = () => {
  const { formatCurrency, profile } = useFinancial();
  const { budgets, totalBudgeted, totalSpent, totalPredicted, idleCash } = useAIBudget();
  const sessionMode = getAuthSessionMode();
  const sessionKey = getFeatureSessionKey(profile, sessionMode);
  const [insightResult, setInsightResult] = useState(null);
  const [insightsError, setInsightsError] = useState('');
  const [isInsightsLoading, setIsInsightsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setInsightResult(null);
    setInsightsError('');
    setIsInsightsLoading(false);
    if (sessionMode !== 'authenticated') {
      setInsightsError(sessionMode === 'inconsistent'
        ? 'Your session state needs to be resolved. Sign in again to view account insights.'
        : 'Verified account insights require a backend-authenticated session.');
      return () => { active = false; };
    }
    setIsInsightsLoading(true);
    FinancialInsightsService.getInsights().then((response) => {
      if (!response?.success || !response.data) throw new Error('Insights unavailable');
      if (active) setInsightResult({ sessionKey, data: response.data });
    }).catch(() => {
      if (active) setInsightsError('Account insights could not be loaded.');
    }).finally(() => {
      if (active) setIsInsightsLoading(false);
    });
    return () => { active = false; };
  }, [sessionKey, sessionMode]);

  const insights = insightResult?.sessionKey === sessionKey ? insightResult.data : null;
  const hasCurrentMonthActivity = insights
    && (compareMoney(insights.income || '0', '0') !== 0
      || compareMoney(insights.expenses || '0', '0') !== 0 || Boolean(insights.topExpenseCategory));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Financial Insights
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Verified monthly totals come from your backend ledger. Ollama may explain verified aggregate facts; browser-local budget estimates remain separate.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 space-y-3" aria-labelledby="verified-insights-heading">
          <div><h2 id="verified-insights-heading" className="text-sm font-semibold text-[var(--text-main)]">Backend financial insights</h2><p className="text-xs text-[var(--text-muted)]">{insights?.month ? `Recorded month: ${insights.month}` : 'Current calendar month'} · sourced from your recorded ledger</p></div>
        {isInsightsLoading && <p role="status" className="text-xs text-[var(--text-muted)]">Loading verified account insights…</p>}
        {insightsError && <p role="alert" className="text-xs text-[var(--text-muted)]">{insightsError}</p>}
        {insights && !hasCurrentMonthActivity && <p role="status" className="text-xs text-[var(--text-muted)]">No income or expense transactions are recorded for this month.</p>}
        {insights && <>
          <div className="grid gap-3 sm:grid-cols-3 text-sm"><p>Income: <strong>{formatCurrency(insights.income)}</strong></p><p>Expenses: <strong>{formatCurrency(insights.expenses)}</strong></p><p>Net: <strong>{formatCurrency(insights.net)}</strong></p></div>
          {insights.topExpenseCategory && <p className="text-xs text-[var(--text-muted)]">Largest expense category: {insights.topExpenseCategory} ({formatCurrency(insights.topExpenseCategoryTotal)}).</p>}
          <ul className="list-disc pl-5 text-xs text-[var(--text-muted)]">{insights.insights?.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ul>
          <p className="rounded-lg bg-[var(--bg-surface)] p-3 text-xs text-[var(--text-main)]">{insights.explanation} <span className="text-[var(--text-muted)]">{insights.aiGenerated ? 'AI explanation from verified aggregate facts.' : 'Calculated summary; AI explanation unavailable.'}</span></p>
          {insights.categoryBreakdown?.length > 0 && <div className="space-y-2"><h3 className="text-xs font-semibold">Expense categories</h3><ul className="grid gap-2 sm:grid-cols-2">{insights.categoryBreakdown.map((item) => <li key={item.category} className="flex items-center justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-xs"><span>{item.category} <span className="text-[var(--text-muted)]">({item.percentageOfExpense}%)</span></span><strong>{formatCurrency(item.total)}</strong></li>)}</ul></div>}
          {insights.expenseChangePercentage != null && <p className="text-xs text-[var(--text-muted)]">Expense change from the previous month: {formatCurrency(insights.expenseChange)} ({insights.expenseChangePercentage}%).</p>}
          {insights.budgetInsights?.length > 0 && <div className="space-y-2"><h3 className="text-xs font-semibold">Verified budget status</h3><ul className="space-y-1">{insights.budgetInsights.map((item, index) => <li key={`${item.category || 'total'}-${index}`} className="flex justify-between rounded-lg bg-[var(--bg-surface)] px-3 py-2 text-xs"><span>{item.category || 'Total monthly'} · {item.percentageConsumed}% used{item.overBudget ? ' · over budget' : ''}</span><span>{formatCurrency(item.spent)} / {formatCurrency(item.amount)}</span></li>)}</ul></div>}
        </>}
      </section>

      {/* Top Predictive Overview Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-xs text-[var(--text-muted)] font-medium">Total Monthly Budget</span>
          <h3 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mt-1.5 tabular-nums">
            {formatCurrency(totalBudgeted)}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Category budgets saved locally</p>
        </div>

        <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-xs text-[var(--text-muted)] font-medium">Current Month Spend</span>
          <h3 className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1.5 tabular-nums">
            {formatCurrency(totalSpent)}
          </h3>
          <p className="text-[11px] text-emerald-600/90 dark:text-emerald-400/90 mt-1">{formatBudgetUsage(totalSpent, totalBudgeted)}</p>
        </div>

        <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-xs text-[var(--text-muted)] font-medium">Estimated Month-End Spend</span>
          <h3 className={`text-xl sm:text-2xl font-bold mt-1.5 tabular-nums ${compareMoney(totalPredicted, totalBudgeted) > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
            {formatCurrency(totalPredicted)}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Estimate (not AI prediction)</p>
        </div>

        <div className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] p-4 shadow-xs">
          <span className="text-xs text-[var(--text-muted)] font-medium">Idle Cash Capacity</span>
          <h3 className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1.5 tabular-nums">
            {formatCurrency(idleCash)}
          </h3>
          <p className="text-[11px] text-[var(--text-muted)] mt-1">Estimate (not AI prediction) · balance minus budget</p>
        </div>
      </div>

      {/* Budget Forecast Grid */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
          Category Budget Status and Estimates (not AI predictions)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {budgets.length > 0
            ? budgets.map((b) => <BudgetForecastCard key={b.category} forecast={b} />)
            : <p className="text-xs text-[var(--text-muted)]">Set monthly budgets in Categories to see spending and estimates here.</p>}
        </div>
      </div>

      {/* Investment Suggestions Panel */}
      <InvestmentSuggestions />
    </div>
  );
};
