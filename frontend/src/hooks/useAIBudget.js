import { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../context/BudgetContext';
import { buildLocalBudgetForecasts } from '../utils/budgetForecasts.js';

export const useAIBudget = () => {
  const { kpi, transactions } = useFinancial();
  const { budgets } = useBudget();

  const metrics = useMemo(() => {
    const forecasts = buildLocalBudgetForecasts(budgets, transactions);
    const totalBudgeted = forecasts.reduce((acc, forecast) => acc + forecast.budget, 0);
    const totalSpent = forecasts.reduce((acc, forecast) => acc + forecast.spent, 0);
    const totalPredicted = forecasts.reduce((acc, forecast) => acc + forecast.predicted, 0);

    const overBudgetCount = forecasts.filter((forecast) => forecast.spent > forecast.budget).length;
    const warningCount = forecasts.filter((forecast) => forecast.spent / forecast.budget >= 0.85
      && forecast.spent <= forecast.budget).length;

    const idleCash = Math.max(0, kpi.totalBalance - totalBudgeted);

    return {
      totalBudgeted,
      totalSpent,
      totalPredicted,
      overBudgetCount,
      warningCount,
      idleCash,
      budgets: forecasts,
    };
  }, [budgets, kpi, transactions]);

  return metrics;
};
