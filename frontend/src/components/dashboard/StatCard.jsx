import React from 'react';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';

export const StatCard = ({ title, value, change, isPositive = true, icon: Icon, color = 'indigo', featured = false, className = '' }) => {
  const { formatCurrency } = useFinancial();

  const iconColorMap = {
    indigo: 'text-blue-500 dark:text-blue-400 bg-blue-500/10 border-blue-500/20',
    emerald: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    rose: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
    purple: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  };

  return (
    <Card className={`relative ${featured ? 'sm:min-h-[136px]' : 'min-h-[128px]'} ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-[var(--text-muted)]">
          {title}
        </span>
        <div className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${iconColorMap[color] || iconColorMap.indigo}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between gap-2">
        <h3 className={`${featured ? 'text-2xl sm:text-3xl' : 'text-xl sm:text-2xl'} font-bold tracking-tight text-[var(--text-main)] tabular-nums`}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </h3>
        {change && (
          <span
            className={`shrink-0 text-[11px] font-medium px-2 py-0.5 rounded-md border ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20'
            }`}
          >
            {change}
          </span>
        )}
      </div>
    </Card>
  );
};
