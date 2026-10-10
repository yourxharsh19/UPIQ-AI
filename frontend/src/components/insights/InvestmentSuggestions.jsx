import React from 'react';
import { Sparkles, TrendingUp, ArrowUpRight, ShieldCheck, DollarSign } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useFinancial } from '../../context/FinancialContext';

export const InvestmentSuggestions = () => {
  const { investments, addToast } = useFinancial();

  const handleApplyStrategy = (inv) => {
    addToast('Strategy Activated', `Initiated automated allocation for "${inv.title}"`, 'success');
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-100 light:text-slate-900">
              AI Idle Cash Optimization & Wealth Insights
            </h3>
            <p className="text-xs text-slate-400">
              Rule-based yield triggers based on unallocated liquid balance
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
        {investments.map((inv) => (
          <div
            key={inv.id}
            className="rounded-2xl border border-indigo-500/20 bg-slate-900/60 light:bg-slate-50 light:border-slate-300 p-5 space-y-3 flex flex-col justify-between hover:border-indigo-500/40 transition-all"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="ai">{inv.badge}</Badge>
                <span className="text-xs font-bold text-emerald-400">{inv.potentialReturn}</span>
              </div>
              <h4 className="text-sm font-bold text-slate-100 light:text-slate-900">
                {inv.title}
              </h4>
              <p className="text-xs text-slate-300 light:text-slate-700 font-medium">
                {inv.recommendation}
              </p>
              <p className="text-[11px] text-slate-400 leading-normal">
                {inv.description}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-800 light:border-slate-200 flex items-center justify-between gap-2">
              <span className="text-[10px] text-slate-400">Risk: <strong className="text-slate-200">{inv.riskLevel}</strong></span>
              <Button onClick={() => handleApplyStrategy(inv)} variant="ai" size="sm" icon={ArrowUpRight}>
                Allocate Funds
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
