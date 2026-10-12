import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';
import { Card } from '../common/Card';
import { useFinancial } from '../../context/FinancialContext';
import { getTransactionCategorySpending } from '../../utils/dashboardAnalytics.js';

export const CategoryDonutChart = () => {
  const { transactions, transactionsError, loading, formatCurrency } = useFinancial();
  const categories = getTransactionCategorySpending(transactions);
  const totalSpent = categories.reduce((acc, category) => acc + category.value, 0);

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-slate-900/95 border border-slate-700/80 p-3 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1 light:bg-white light:border-slate-300">
          <p className="font-bold text-slate-100 light:text-slate-900">{data.name}</p>
          <p className="text-indigo-400 font-semibold">
            {formatCurrency(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <div className="mb-4">
        <h3 className="text-base font-semibold tracking-tight text-slate-100 light:text-slate-900">
          Spending mix
        </h3>
      <p className="text-xs text-slate-400">Expense categories for your latest transaction month</p>
      </div>

      {loading ? (
        <div className="flex h-56 items-center justify-center text-sm text-[var(--text-muted)]" role="status">Loading transactions…</div>
      ) : transactionsError ? (
        <div className="flex h-56 items-center justify-center text-center text-sm text-rose-400" role="alert">{transactionsError}</div>
      ) : categories.length === 0 ? (
        <div className="flex h-56 items-center justify-center text-center text-sm text-[var(--text-muted)]">No categorized expenses yet.</div>
      ) : (
      <>
      <div className="h-56 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={85}
              paddingAngle={4}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(15, 23, 42, 0.8)" strokeWidth={2} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Summary text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-400">Total Spent</span>
          <span className="text-base font-extrabold text-slate-100 light:text-slate-900">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto border-t border-slate-800/80 light:border-slate-200 pt-3">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Spending totals by transaction category</caption>
          <thead className="text-[var(--text-muted)]">
            <tr><th scope="col" className="pb-2 font-medium">Category</th><th scope="col" className="pb-2 text-right font-medium">Transactions</th><th scope="col" className="pb-2 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {categories.map((category) => (
              <tr key={category.name} className="border-t border-slate-800/50 light:border-slate-200">
                <th scope="row" className="py-2 pr-2 font-medium text-[var(--text-main)]"><span className="mr-2 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</th>
                <td className="py-2 text-right text-[var(--text-muted)]">{category.count}</td>
                <td className="py-2 text-right font-semibold text-[var(--text-main)]">{formatCurrency(category.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-slate-700 light:border-slate-300"><th scope="row" colSpan="2" className="pt-2 text-[var(--text-main)]">Total expenses</th><td className="pt-2 text-right font-bold text-[var(--text-main)]">{formatCurrency(totalSpent)}</td></tr></tfoot>
        </table>
      </div>
      </>
      )}
    </Card>
  );
};
