import React from 'react';
import { TrendingUp, ArrowUpRight } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useFinancial } from '../../context/FinancialContext';

const DEFAULT_INVESTMENT_STRATEGIES = [
  {
    id: 'inv-1',
    title: 'High-Yield Liquid Funds',
    recommendation: 'Allocate 30% of idle cash buffer',
    description: 'Instant T+0 redemption with higher returns than standard savings accounts. Low interest-rate risk.',
    potentialReturn: '6.8% – 7.2% p.a.',
    riskLevel: 'Very Low',
    badge: 'High Liquidity',
  },
  {
    id: 'inv-2',
    title: 'Arbitrage Mutual Funds',
    recommendation: 'Tax-efficient short-term parking',
    description: 'Equities arbitrage with debt-like stability. Equity taxation applies for lower capital gains tax.',
    potentialReturn: '7.4% – 7.9% p.a.',
    riskLevel: 'Low',
    badge: 'Tax Efficient',
  },
  {
    id: 'inv-3',
    title: 'Nifty 50 Index SIP Auto-Deploy',
    recommendation: 'Long-term automated wealth building',
    description: 'Disciplined monthly allocation to India top 50 bluechip companies for beating inflation.',
    potentialReturn: '12.0% – 14.5% CAGR',
    riskLevel: 'Moderate',
    badge: 'Core Wealth',
  },
];

export const InvestmentSuggestions = () => {
  const { investments, addToast } = useFinancial();
  const displayItems = Array.isArray(investments) && investments.length > 0 ? investments : DEFAULT_INVESTMENT_STRATEGIES;

  const handleApplyStrategy = (inv) => {
    addToast('Strategy Activated', `Initiated automated allocation for "${inv.title}"`, 'success');
  };

  return (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
              Idle Cash Strategy & Wealth Insights
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Rule-based yield recommendations based on unallocated liquid balance
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
        {displayItems.map((inv) => (
          <div
            key={inv.id}
            className="rounded-xl border border-[var(--border-base)] bg-[var(--bg-surface)] p-4 space-y-2.5 flex flex-col justify-between hover:border-slate-400 dark:hover:border-slate-700 transition-colors"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="info">{inv.badge}</Badge>
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums">{inv.potentialReturn}</span>
              </div>
              <h4 className="text-xs font-semibold text-[var(--text-main)]">
                {inv.title}
              </h4>
              <p className="text-xs text-[var(--text-muted)] font-medium">
                {inv.recommendation}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                {inv.description}
              </p>
            </div>

            <div className="pt-2 border-t border-[var(--border-base)] flex items-center justify-between gap-2">
              <span className="text-[11px] text-[var(--text-muted)]">Risk: <strong className="text-[var(--text-main)] font-semibold">{inv.riskLevel}</strong></span>
              <Button onClick={() => handleApplyStrategy(inv)} variant="secondary" size="sm" icon={ArrowUpRight}>
                Allocate
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
