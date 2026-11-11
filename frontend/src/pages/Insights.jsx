import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAIBudget } from '../hooks/useAIBudget';
import { BudgetForecastCard } from '../components/insights/BudgetForecastCard';
import { InvestmentSuggestions } from '../components/insights/InvestmentSuggestions';
import { formatBudgetUsage } from '../utils/budgetForecasts.js';

export const Insights = () => {
  const { formatCurrency } = useFinancial();
  const { budgets, totalBudgeted, totalSpent, totalPredicted, idleCash } = useAIBudget();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-main)]">
          Local Budgets & Estimates
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Browser-local budgets and estimates are available now. Cloud budget sync and advanced AI predictions are Coming Soon; these estimates are not AI-generated or synced to the backend.
        </p>
      </div>

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
          <h3 className={`text-xl sm:text-2xl font-bold mt-1.5 tabular-nums ${totalPredicted > totalBudgeted ? 'text-rose-600 dark:text-rose-400' : 'text-[var(--text-main)]'}`}>
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

      <section className="rounded-xl border border-amber-500/25 bg-amber-500/5 p-4" aria-labelledby="security-upcoming-title">
        <div className="flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" aria-hidden="true" />
          <div>
            <h2 id="security-upcoming-title" className="text-xs font-semibold text-[var(--text-main)]">Security and fraud monitoring — Coming soon</h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">UPIQ does not currently provide transaction fraud detection, threat monitoring, or dispute actions (Coming soon).</p>
          </div>
        </div>
      </section>

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
