import { Target, AlertCircle, CheckCircle2 } from "lucide-react";
import { useBudget } from "../../context/BudgetContext";
import { buildLocalBudgetForecasts } from "../../utils/budgetForecasts.js";
import { getCategoryDisplayProps } from "../../utils/categoryUtils";
import clsx from "clsx";

const BudgetProgress = ({ transactions }) => {
  const { getAllBudgets } = useBudget();
  const budgets = getAllBudgets();
  const budgetedCategories = buildLocalBudgetForecasts(budgets, transactions);

  if (budgetedCategories.length === 0) {
    return (
      <div className="bg-[var(--bg-card)] p-6 rounded-2xl border border-[var(--border-base)] shadow-premium">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-[var(--text-main)] mb-1">Budget Tracking</h3>
          <p className="text-sm text-[var(--text-muted)]">Set budgets for categories to track your spending</p>
        </div>
        <div className="text-center py-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--bg-surface)]"><Target size={28} className="text-[var(--text-muted)]" /></div>
          <p className="text-[var(--text-main)] font-semibold mb-2">No budgets set yet</p>
          <p className="text-sm text-[var(--text-muted)]">Go to Categories to set monthly budgets</p>
        </div>
      </div>
    );
  }

  const getBudgetStatus = (spent, budget) => {
    const percentage = (spent / budget) * 100;
    if (percentage < 80) {
      return { color: 'green', icon: CheckCircle2, label: 'On Track' };
    } else if (percentage < 100) {
      return { color: 'yellow', icon: AlertCircle, label: 'Warning' };
    } else {
      return { color: 'red', icon: AlertCircle, label: 'Over Budget' };
    }
  };

  return (
    <div className="bg-[var(--bg-card)] p-8 rounded-2xl border border-[var(--border-base)] shadow-premium hover:shadow-premium-hover transition-all duration-300">
      <div className="mb-8">
        <h3 className="text-lg font-bold text-[var(--text-main)] mb-1 tracking-tight">Budget Tracking</h3>
        <p className="text-sm text-[var(--text-muted)]">Monitor your spending against monthly budgets</p>
      </div>

      <div className="space-y-8">
        {budgetedCategories.map((forecast) => {
          const categoryName = forecast.category;
          const budget = forecast.budget;
          const spent = forecast.spent;
          const percentage = Math.min((spent / budget) * 100, 100);
          const status = getBudgetStatus(spent, budget);
          const displayProps = getCategoryDisplayProps({ name: categoryName });
          const StatusIcon = status.icon;

          const statusColors = {
            green: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
            yellow: "text-amber-500 bg-amber-500/10 border-amber-500/20",
            red: "text-rose-500 bg-rose-500/10 border-rose-500/20",
          };

          const barColors = {
            green: "bg-emerald-500",
            yellow: "bg-amber-500",
            red: "bg-rose-500",
          };

          return (
            <div key={categoryName} className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{displayProps.icon}</span>
                  <span className="font-bold text-[var(--text-main)] tracking-tight">{categoryName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[var(--text-main)]">
                    ₹{spent.toLocaleString('en-IN')} <span className="text-[var(--text-muted)] font-medium">/ ₹{budget.toLocaleString('en-IN')}</span>
                  </span>
                  <div className={clsx(
                    "flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border",
                    statusColors[status.color]
                  )}>
                    <StatusIcon size={10} />
                    {status.label}
                  </div>
                </div>
              </div>

              <div className="w-full bg-[var(--bg-surface)] rounded-full h-2 overflow-hidden border border-[var(--border-base)]">
                <div
                  className={clsx(
                    "h-full rounded-full transition-all duration-1000 ease-out",
                    barColors[status.color]
                  )}
                  style={{ width: `${percentage}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] font-medium">
                <span className="text-[var(--text-muted)]">{percentage.toFixed(0)}% of budget used</span>
                {spent > budget ? (
                  <span className="text-rose-500 font-bold">
                    Over by ₹{(spent - budget).toLocaleString('en-IN')}
                  </span>
                ) : (
                  <span className="text-emerald-500 font-bold">
                    ₹{(budget - spent).toLocaleString('en-IN')} left
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BudgetProgress;

