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
        <div className="bg-[var(--bg-card)] border border-[var(--border-base)] p-2.5 rounded-lg shadow-sm text-xs space-y-1">
          <p className="font-semibold text-[var(--text-main)]">{data.name}</p>
          <p className="text-blue-500 font-medium">
            {formatCurrency(data.value)} ({data.percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="flex flex-col">
      <div className="mb-3">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--text-main)]">
          Category Spending Mix
        </h3>
        <p className="text-xs text-[var(--text-muted)]">Expense distribution for latest month</p>
      </div>

      {loading ? (
        <div className="flex h-52 items-center justify-center text-xs text-[var(--text-muted)]" role="status">Loading transactions…</div>
      ) : transactionsError ? (
        <div className="flex h-52 items-center justify-center text-center text-xs text-rose-500" role="alert">{transactionsError}</div>
      ) : categories.length === 0 ? (
        <div className="flex h-52 items-center justify-center text-center text-xs text-[var(--text-muted)]">No categorized expenses recorded yet.</div>
      ) : (
      <>
      <div className="h-52 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={categories}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={78}
              paddingAngle={2}
              dataKey="value"
            >
              {categories.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="var(--bg-card)" strokeWidth={1.5} />
              ))}
            </Pie>
            <RechartsTooltip content={<CustomPieTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* Center Summary text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-medium tracking-wider text-[var(--text-muted)]">Total Spent</span>
          <span className="text-sm font-bold text-[var(--text-main)] tabular-nums">
            {formatCurrency(totalSpent)}
          </span>
        </div>
      </div>

      <div className="mt-2 overflow-x-auto border-t border-[var(--border-base)] pt-2.5">
        <table className="w-full text-left text-xs">
          <caption className="sr-only">Spending totals by transaction category</caption>
          <thead className="text-[var(--text-muted)]">
            <tr><th scope="col" className="pb-1.5 font-medium">Category</th><th scope="col" className="pb-1.5 text-right font-medium">Txs</th><th scope="col" className="pb-1.5 text-right font-medium">Total</th></tr>
          </thead>
          <tbody>
            {categories.slice(0, 5).map((category) => (
              <tr key={category.name} className="border-t border-[var(--border-base)]">
                <th scope="row" className="py-1.5 pr-2 font-medium text-[var(--text-main)] truncate max-w-[100px]"><span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />{category.name}</th>
                <td className="py-1.5 text-right text-[var(--text-muted)]">{category.count}</td>
                <td className="py-1.5 text-right font-medium text-[var(--text-main)] tabular-nums">{formatCurrency(category.value)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot><tr className="border-t border-[var(--border-base)]"><th scope="row" colSpan="2" className="pt-1.5 text-[var(--text-main)] font-semibold">Total</th><td className="pt-1.5 text-right font-bold text-[var(--text-main)] tabular-nums">{formatCurrency(totalSpent)}</td></tr></tfoot>
        </table>
      </div>
      </>
      )}
    </Card>
  );
};
