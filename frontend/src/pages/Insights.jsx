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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 light:text-slate-900 flex items-center gap-2">
            Local Budgets & Estimates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browser-local budgets and estimates are available now. Cloud budget sync and advanced AI predictions are Coming Soon; these estimates are not AI-generated or synced to the backend.
          </p>
        </div>

      </div>

      {/* Top Predictive Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Monthly Budget</span>
          <h3 className="text-2xl font-extrabold text-slate-100 light:text-slate-900 mt-2">
            {formatCurrency(totalBudgeted)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Category budgets are available locally in this browser.</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Current Month Spend</span>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(totalSpent)}
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1">{formatBudgetUsage(totalSpent, totalBudgeted)}</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Estimated Month-End Spend</span>
          <h3 className={`text-2xl font-extrabold mt-2 ${totalPredicted > totalBudgeted ? 'text-rose-400' : 'text-indigo-400'}`}>
            {formatCurrency(totalPredicted)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Frontend estimate; not an AI forecast</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-purple-500/30 bg-purple-950/20">
          <span className="text-xs text-purple-300 uppercase font-semibold">Idle Cash Capacity</span>
          <h3 className="text-2xl font-extrabold text-purple-300 mt-2">
            {formatCurrency(idleCash)}
          </h3>
          <p className="text-[11px] text-purple-400 mt-1">Simple balance less budget estimate</p>
        </div>
      </div>

      <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5" aria-labelledby="security-upcoming-title">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-300" aria-hidden="true" />
          <div>
            <h2 id="security-upcoming-title" className="text-sm font-bold text-slate-100 light:text-slate-900">Security and fraud monitoring — Upcoming</h2>
            <p className="mt-1 text-xs text-slate-400">UPIQ does not currently provide transaction fraud detection, threat monitoring, or dispute actions.</p>
          </div>
        </div>
      </section>

      {/* Budget Forecast Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
          Category Budget Status and Frontend Estimates
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.length > 0
            ? budgets.map((b) => <BudgetForecastCard key={b.category} forecast={b} />)
            : <p className="text-sm text-slate-400">Set monthly budgets in Categories to see spending and estimates here.</p>}
        </div>
      </div>

      {/* Investment Suggestions Panel */}
      <InvestmentSuggestions />
    </div>
  );
};
