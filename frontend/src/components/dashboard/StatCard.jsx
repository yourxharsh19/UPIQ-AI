import React from 'react';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';

export const StatCard = ({ title, value, change, isPositive = true, icon: Icon, color = 'indigo', featured = false, className = '' }) => {
  const { formatCurrency } = useFinancial();

  const iconBgMap = {
    indigo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    purple: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <Card glow={color === 'indigo'} className={`group relative overflow-hidden ${featured ? 'sm:min-h-[154px]' : 'min-h-[142px]'} ${className}`}>
      {featured && <div aria-hidden="true" className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-indigo-500/10 blur-3xl transition-opacity duration-300 group-hover:opacity-150" />}
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-400 light:text-slate-600">
          {title}
        </span>
        <div className={`rounded-xl border p-2.5 transition-transform duration-200 group-hover:scale-105 ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="relative mt-5 flex items-baseline justify-between gap-2">
        <h3 className={`${featured ? 'text-3xl md:text-[2.5rem]' : 'text-2xl md:text-[1.7rem]'} font-semibold tracking-tight text-slate-100 light:text-slate-900`}>
          {typeof value === 'number' ? formatCurrency(value) : value}
        </h3>
        <span
          className={`shrink-0 text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
            isPositive
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 light:bg-emerald-50 light:text-emerald-700'
              : 'bg-rose-500/10 text-rose-400 border-rose-500/20 light:bg-rose-50 light:text-rose-700'
          }`}
        >
          {change}
        </span>
      </div>
    </Card>
  );
};
