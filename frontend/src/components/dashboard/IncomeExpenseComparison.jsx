import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { calculateTotalIncome, calculateTotalExpenses } from '../../utils/transactionUtils';

const IncomeExpenseComparison = ({ transactions }) => {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);

  const data = [
    {
      name: 'Income',
      amount: income,
      type: 'income'
    },
    {
      name: 'Expenses',
      amount: expenses,
      type: 'expense'
    }
  ];

  if (income === 0 && expenses === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-xl border border-[var(--border-base)] shadow-sm min-h-80 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--bg-surface)] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[var(--border-base)]">
            <BarChart size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-main)] font-semibold text-sm">No financial data available</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Start tracking your income and expenses</p>
        </div>
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      return (
        <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-base)] shadow-md">
          <p className="font-semibold text-[var(--text-main)] text-xs">{data.payload.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            ₹{data.value.toLocaleString('en-IN')}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-w-0 bg-[var(--bg-card)] p-5 sm:p-6 rounded-xl border border-[var(--border-base)] shadow-sm">
      <div className="mb-5 sm:mb-6">
        <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 tracking-tight">Income vs Expenses</h3>
        <p className="text-xs text-[var(--text-muted)]">Compare cash flow for the selected period</p>
      </div>

      <div className="h-60 min-w-0 sm:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-base)" opacity={0.5} />
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 12, fontWeight: 500 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-muted)', fontSize: 10, fontWeight: 500 }}
              tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--bg-surface)', opacity: 0.4 }} />
            <Bar dataKey="amount" radius={[8, 8, 8, 8]} barSize={40}>
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.type === 'income' ? '#10b981' : '#ef4444'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10">
          <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wider mb-1">Total Income</p>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{income.toLocaleString('en-IN')}</p>
        </div>
        <div className="bg-rose-500/5 p-4 rounded-xl border border-rose-500/10">
          <p className="text-xs text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider mb-1">Total Expenses</p>
          <p className="text-2xl font-black text-rose-600 dark:text-rose-400">₹{expenses.toLocaleString('en-IN')}</p>
        </div>
      </div>
    </div>
  );
};

export default IncomeExpenseComparison;

