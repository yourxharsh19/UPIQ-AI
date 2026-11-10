import React, { useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';
import { getMonthlyCashFlow } from '../../utils/dashboardAnalytics.js';

export const IncomeExpenseChart = () => {
  const { transactions, transactionsError, loading, formatCurrency } = useFinancial();
  const [timeRange, setTimeRange] = useState('6M');
  const trends = getMonthlyCashFlow(transactions, { '1M': 1, '3M': 3, '6M': 6, '1Y': 12 }[timeRange]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] p-3 rounded-lg shadow-sm text-xs space-y-1.5">
          <p className="font-semibold text-[var(--text-main)] border-b border-[var(--border-base)] pb-1">
            {label}
          </p>
          <p className="text-emerald-600 dark:text-emerald-400 font-medium flex items-center justify-between gap-4">
            <span>Income:</span>
            <span className="tabular-nums font-semibold">{formatCurrency(payload.find((item) => item.dataKey === 'income')?.value)}</span>
          </p>
          <p className="text-rose-600 dark:text-rose-400 font-medium flex items-center justify-between gap-4">
            <span>Expense:</span>
            <span className="tabular-nums font-semibold">{formatCurrency(payload.find((item) => item.dataKey === 'expense')?.value)}</span>
          </p>
          <p className="text-blue-600 dark:text-blue-400 font-medium flex items-center justify-between gap-4">
            <span>Savings:</span>
            <span className="tabular-nums font-semibold">{formatCurrency(payload.find((item) => item.dataKey === 'savings')?.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
            Cash Flow Trend
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Income, expenses, and net savings over time
          </p>
        </div>

        <div className="flex items-center gap-1 p-0.5 bg-[var(--bg-surface)] border border-[var(--border-base)] rounded-lg">
          {['1M', '3M', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              aria-pressed={timeRange === range}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                timeRange === range
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Container */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-xs text-[var(--text-muted)]" role="status">Loading transaction history…</div>
      ) : transactionsError ? (
        <div className="flex h-64 items-center justify-center text-xs text-rose-500" role="alert">{transactionsError}</div>
      ) : trends.length === 0 ? (
        <div className="flex h-64 items-center justify-center text-center text-xs text-[var(--text-muted)]">Add transactions to see your cash flow.</div>
      ) : (
      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.12)" />
            <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} tickFormatter={(value) => formatCurrency(value, 0)} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#ef4444"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              fill="none"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      )}

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-3 border-t border-[var(--border-base)] text-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
          <span className="text-[var(--text-muted)]">Income</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" />
          <span className="text-[var(--text-muted)]">Expenses</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm bg-blue-500" />
          <span className="text-[var(--text-muted)]">Net Savings</span>
        </div>
      </div>
    </Card>
  );
};
