import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { getCategoryExpenseBreakdown } from '../../utils/transactionUtils';
import { getCategoryColor, getCategoryIcon } from '../../utils/categoryUtils';

const CategoryBreakdown = ({ transactions }) => {
  const breakdown = getCategoryExpenseBreakdown(transactions);

  if (breakdown.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-6 sm:p-8 rounded-xl border border-[var(--border-base)] shadow-sm min-h-80 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-[var(--bg-surface)] rounded-xl flex items-center justify-center mx-auto mb-3 border border-[var(--border-base)]">
            <PieChart size={24} className="text-[var(--text-muted)]" />
          </div>
          <p className="text-[var(--text-main)] font-semibold text-sm">No expense data available</p>
          <p className="text-xs text-[var(--text-muted)] mt-1">Upload a PDF to see category breakdown</p>
        </div>
      </div>
    );
  }

  const data = breakdown.map((item) => {
    const colorInfo = getCategoryColor(item.name);
    return {
      name: item.name,
      value: item.amount,
      color: colorInfo.value
    };
  });

  const total = breakdown.reduce((sum, item) => sum + item.amount, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0];
      const percentage = ((data.value / total) * 100).toFixed(1);
      return (
        <div className="bg-[var(--bg-card)] p-2.5 rounded-lg border border-[var(--border-base)] shadow-md">
          <p className="font-semibold text-[var(--text-main)] text-xs">{data.name}</p>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            ₹{data.value.toLocaleString('en-IN')} ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-xl border border-[var(--border-base)] shadow-sm min-w-0">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 tracking-tight">Category Breakdown</h3>
        <p className="text-xs text-[var(--text-muted)]">Expense distribution by category</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 xl:gap-8 items-center">
        <div className="h-64 sm:h-72 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={90}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="space-y-5">
          {breakdown.slice(0, 6).map((item, index) => {
            const percentage = ((item.amount / total) * 100).toFixed(1);
            const colorInfo = getCategoryColor(item.name);
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: colorInfo.value }}
                    />
                    <span className="text-lg leading-none" aria-hidden="true">{getCategoryIcon(item.name)}</span>
                    <span className="text-sm font-medium text-[var(--text-main)] truncate">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-bold text-[var(--text-main)]">
                      ₹{item.amount.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] font-bold text-[var(--text-muted)] ml-2 uppercase tracking-wider">{percentage}%</span>
                  </div>
                </div>
                <div className="w-full bg-[var(--bg-surface)] rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700 ease-out"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: colorInfo.value
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CategoryBreakdown;

