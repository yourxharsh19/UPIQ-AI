import React from 'react';
import { BrainCircuit, ShieldAlert, Sparkles, AlertTriangle, ArrowRight } from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useAIBudget } from '../hooks/useAIBudget';
import { BudgetForecastCard } from '../components/insights/BudgetForecastCard';
import { InvestmentSuggestions } from '../components/insights/InvestmentSuggestions';
import { Button } from '../components/common/Button';

export const Insights = () => {
  const { budgets, fraudAlerts, setIsFraudDrawerOpen, formatCurrency } = useFinancial();
  const { totalBudgeted, totalSpent, totalPredicted, idleCash, warningCount } = useAIBudget();

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-100 light:text-slate-900 flex items-center gap-2">
            AI Budget Forecasting & Risk Intelligence
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Predictive machine learning models for spending overages, fraud alerts, and idle cash optimization
          </p>
        </div>

        <Button
          onClick={() => setIsFraudDrawerOpen(true)}
          variant="rose"
          icon={ShieldAlert}
        >
          Review Fraud Drawer ({fraudAlerts.length})
        </Button>
      </div>

      {/* Top Predictive Overview Banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Total Monthly Budget</span>
          <h3 className="text-2xl font-extrabold text-slate-100 light:text-slate-900 mt-2">
            {formatCurrency(totalBudgeted)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Cap set across 5 primary categories</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">Current Month Spend</span>
          <h3 className="text-2xl font-extrabold text-emerald-400 mt-2">
            {formatCurrency(totalSpent)}
          </h3>
          <p className="text-[11px] text-emerald-400/80 mt-1">{(totalSpent / totalBudgeted * 100).toFixed(1)}% of total cap</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-indigo-500/20">
          <span className="text-xs text-slate-400 uppercase font-semibold">AI Predicted Month-End</span>
          <h3 className={`text-2xl font-extrabold mt-2 ${totalPredicted > totalBudgeted ? 'text-rose-400' : 'text-indigo-400'}`}>
            {formatCurrency(totalPredicted)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1">Based on spending velocity</p>
        </div>

        <div className="rounded-2xl glass-panel p-5 border border-purple-500/30 bg-purple-950/20">
          <span className="text-xs text-purple-300 uppercase font-semibold">Idle Cash Capacity</span>
          <h3 className="text-2xl font-extrabold text-purple-300 mt-2">
            {formatCurrency(idleCash)}
          </h3>
          <p className="text-[11px] text-purple-400 mt-1">Ready for high-yield deployment</p>
        </div>
      </div>

      {/* Fraud Alert Highlight Banner if alerts exist */}
      {fraudAlerts.length > 0 && (
        <div className="rounded-2xl p-5 border border-rose-500/40 bg-rose-950/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-600/20 text-rose-400 border border-rose-500/30">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">
                {fraudAlerts.length} Flagged Transactions Require Immediate Review
              </h4>
              <p className="text-xs text-rose-300/80">
                High-risk anomalous transactions (Kyiv IP transfer, double Netflix charge) flagged by Guardian AI.
              </p>
            </div>
          </div>
          <Button onClick={() => setIsFraudDrawerOpen(true)} variant="rose" size="sm" icon={ArrowRight}>
            Open Security Drawer
          </Button>
        </div>
      )}

      {/* Budget Forecast Grid */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
          Category Spending vs. AI Month-End Predictions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => (
            <BudgetForecastCard key={b.category} forecast={b} />
          ))}
        </div>
      </div>

      {/* Investment Suggestions Panel */}
      <InvestmentSuggestions />
    </div>
  );
};
