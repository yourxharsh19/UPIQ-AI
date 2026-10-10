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

export const IncomeExpenseChart = () => {
  const { trends, formatCurrency } = useFinancial();
  const [timeRange, setTimeRange] = useState('6M');

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 light:bg-white light:border-slate-300">
          <p className="font-bold text-slate-200 light:text-slate-900 border-b border-slate-800 pb-1">
            {label} Financial Overview
          </p>
          <p className="text-emerald-400 font-semibold flex items-center justify-between gap-4">
            <span>Income:</span>
            <span>{formatCurrency(payload[0]?.value)}</span>
          </p>
          <p className="text-rose-400 font-semibold flex items-center justify-between gap-4">
            <span>Expense:</span>
            <span>{formatCurrency(payload[1]?.value)}</span>
          </p>
          <p className="text-indigo-400 font-semibold flex items-center justify-between gap-4">
            <span>Savings:</span>
            <span>{formatCurrency(payload[2]?.value)}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-semibold tracking-tight text-slate-100 light:text-slate-900">
            Cash flow over time
          </h3>
          <p className="text-xs text-slate-400">
            Income, spending, and savings at a glance
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl light:bg-slate-100 light:border-slate-300">
          {['1M', '3M', '6M', '1Y'].map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              aria-pressed={timeRange === range}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                timeRange === range
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200 light:hover:text-slate-800'
              }`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      {/* Recharts Area Container */}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.1)" />
            <XAxis dataKey="period" stroke="#64748b" fontSize={11} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
            <RechartsTooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="income"
              stroke="#10b981"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#incomeGrad)"
            />
            <Area
              type="monotone"
              dataKey="expense"
              stroke="#f43f5e"
              strokeWidth={2.5}
              fillOpacity={1}
              fill="url(#expenseGrad)"
            />
            <Area
              type="monotone"
              dataKey="savings"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4 4"
              fillOpacity={1}
              fill="url(#savingsGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-slate-800/80 light:border-slate-200 text-xs font-semibold">
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-slate-300 light:text-slate-700">Monthly Income</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-rose-500" />
          <span className="text-slate-300 light:text-slate-700">Monthly Expenses</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-slate-300 light:text-slate-700">Net Savings</span>
        </div>
      </div>
    </Card>
  );
};
