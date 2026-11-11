import { ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { getCategoryDisplayProps } from "../../utils/categoryUtils";
import clsx from "clsx";

const RecentActivity = ({ transactions }) => {
  const recentTransactions = transactions
    .slice()
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);

  if (recentTransactions.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-6 rounded-xl border border-[var(--border-base)] shadow-sm">
        <h3 className="text-base font-semibold text-[var(--text-main)] mb-4 tracking-tight">Recent Activity</h3>
        <div className="text-center py-8">
          <p className="text-xs text-[var(--text-muted)]">No recent transactions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--bg-card)] p-5 sm:p-6 rounded-xl border border-[var(--border-base)] shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-semibold text-[var(--text-main)] mb-1 tracking-tight">Recent Activity</h3>
        <p className="text-xs text-[var(--text-muted)]">Your latest transactions</p>
      </div>

      <div className="space-y-2.5">
        {recentTransactions.map((transaction) => {
          const isIncome = transaction.type?.toLowerCase() === 'income';
          const category = transaction.category || 'Uncategorized';

          return (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-3 rounded-lg border border-[var(--border-base)] hover:bg-[var(--bg-surface)] transition-colors duration-150"
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={clsx(
                  "p-1.5 rounded-md border shrink-0",
                  isIncome ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" : "bg-rose-500/10 border-rose-500/20 text-rose-500"
                )}>
                  {isIncome ? (
                    <ArrowUpCircle size={18} />
                  ) : (
                    <ArrowDownCircle size={18} />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[var(--text-main)] truncate tracking-tight text-xs sm:text-sm">
                    {transaction.description || 'Transaction'}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 mt-0.5">
                    {(() => {
                      const categoryDisplay = getCategoryDisplayProps({ name: category });
                      return (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-[var(--text-muted)] px-2 py-0.5 rounded bg-[var(--bg-surface)] border border-[var(--border-base)]">
                          <span>{categoryDisplay.icon}</span>
                          {category}
                        </span>
                      );
                    })()}
                    <span className="text-[9px] sm:text-[10px] font-medium text-[var(--text-muted)] opacity-60">
                      {new Date(transaction.date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-right ml-3 sm:ml-4 shrink-0">
                <p className={clsx(
                  "text-base sm:text-lg font-bold tracking-tight",
                  isIncome ? 'text-emerald-500' : 'text-rose-500'
                )}>
                  {isIncome ? '+' : '-'}₹{transaction.amount.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentActivity;

