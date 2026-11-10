import { useMemo } from "react";
import { AlertCircle, TrendingUp, Target, PieChart } from "lucide-react";
import {
  getTopSpendingCategory,
  calculateSpendingConcentration,
  getCategoryMonthOverMonth,
  getOverspendingCategories,
  getIncomeExpenseRatio
} from "../../utils/transactionUtils";
import clsx from "clsx";

const InsightCards = ({ transactions }) => {
  const topCategory = useMemo(() => getTopSpendingCategory(transactions), [transactions]);
  const concentration = useMemo(() => calculateSpendingConcentration(transactions), [transactions]);
  const overspendingCategories = useMemo(() => getOverspendingCategories(transactions), [transactions]);
  const incomeExpenseRatio = useMemo(() => getIncomeExpenseRatio(transactions), [transactions]);

  const insights = [];

  // Top spending category insight
  if (topCategory) {
    const categoryMom = getCategoryMonthOverMonth(transactions, topCategory.name);
    insights.push({
      type: "spending",
      icon: PieChart,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-50",
      title: `${topCategory.name} is your highest expense`,
      description: categoryMom.direction === 'up'
        ? `Spending ↑ ${categoryMom.change.toFixed(1)}% vs last month`
        : categoryMom.direction === 'down'
          ? `Spending ↓ ${categoryMom.change.toFixed(1)}% vs last month`
          : "Spending unchanged vs last month",
      value: `₹${topCategory.amount.toLocaleString('en-IN')}`,
      severity: "info"
    });
  }

  // Spending concentration insight
  if (concentration > 40) {
    insights.push({
      type: "concentration",
      icon: Target,
      iconColor: "text-orange-500",
      bgColor: "bg-orange-50",
      title: "High spending concentration",
      description: `${concentration.toFixed(1)}% of expenses in one category`,
      value: topCategory?.name || "N/A",
      severity: "warning"
    });
  }

  // Overspending insight
  if (overspendingCategories.length > 0) {
    insights.push({
      type: "overspending",
      icon: AlertCircle,
      iconColor: "text-red-500",
      bgColor: "bg-red-50",
      title: `Overspending in ${overspendingCategories.length} categor${overspendingCategories.length > 1 ? 'ies' : 'y'}`,
      description: overspendingCategories.map(c => c.name).join(", "),
      value: `${overspendingCategories.length}`,
      severity: "error"
    });
  }

  // Income/Expense ratio insight
  if (incomeExpenseRatio > 0 && incomeExpenseRatio < 1.2) {
    insights.push({
      type: "ratio",
      icon: TrendingUp,
      iconColor: "text-yellow-500",
      bgColor: "bg-yellow-50",
      title: "Expenses are high relative to income",
      description: `Income/Expense ratio: ${incomeExpenseRatio.toFixed(2)}`,
      value: `${(incomeExpenseRatio * 100).toFixed(0)}%`,
      severity: "warning"
    });
  }

  // If no insights, show a positive one
  if (insights.length === 0 && transactions.length > 0) {
    insights.push({
      type: "positive",
      icon: TrendingUp,
      iconColor: "text-green-500",
      bgColor: "bg-green-50",
      title: "Your finances look balanced",
      description: "Keep tracking your expenses to maintain good financial health",
      value: "✓",
      severity: "success"
    });
  }

  if (insights.length === 0) {
    return null;
  }

  return (
    <div className="mb-12">
      <h2 className="text-lg font-bold text-[var(--text-main)] mb-6 flex items-center gap-2 tracking-tight">
        <Target size={18} className="text-primary-600" />
        Financial Insights
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          const severityColors = {
            error: "border-l-rose-500 text-rose-600 dark:text-rose-400",
            warning: "border-l-amber-500 text-amber-600 dark:text-amber-400",
            success: "border-l-emerald-500 text-emerald-600 dark:text-emerald-400",
            info: "border-l-blue-500 text-blue-600 dark:text-blue-400",
          };

          return (
            <div
              key={index}
              className={clsx(
                "bg-[var(--bg-card)] rounded-xl p-5 border border-[var(--border-base)] border-l-4 shadow-sm transition-colors duration-150",
                severityColors[insight.severity] || "border-l-blue-500"
              )}
            >
              <div className="flex items-start gap-4">
                <div className={clsx(
                  "p-2 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-base)] shrink-0",
                  insight.iconColor
                )}>
                  <Icon size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-sm text-[var(--text-main)] mb-1 tracking-tight">{insight.title}</h3>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">{insight.description}</p>
                  {insight.value && (
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-[var(--bg-surface)] border border-[var(--border-base)] text-[var(--text-main)]">
                        {insight.value}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default InsightCards;

