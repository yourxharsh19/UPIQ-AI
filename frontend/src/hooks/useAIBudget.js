import { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../context/BudgetContext';
import { buildLocalBudgetForecasts } from '../utils/budgetForecasts.js';
import { compareMoney, moneyRatioPercent, subtractMoney, sumMoneyString } from '../utils/money.js';

export const useAIBudget = () => {
  const { kpi, transactions } = useFinancial();
  const { budgets } = useBudget();

  const metrics = useMemo(() => {
    const forecasts = buildLocalBudgetForecasts(budgets, transactions);
    const totalBudgeted = sumMoneyString(forecasts.map((forecast) => forecast.budget));
    const totalSpent = sumMoneyString(forecasts.map((forecast) => forecast.spent));
    const totalPredicted = sumMoneyString(forecasts.map((forecast) => forecast.predicted));

    const overBudgetCount = forecasts.filter((forecast) => compareMoney(forecast.spent, forecast.budget) > 0).length;
    const warningCount = forecasts.filter((forecast) => compareMoney(forecast.spent, forecast.budget) <= 0
      && moneyRatioPercent(forecast.spent, forecast.budget, 1) >= 85).length;

    const remaining = subtractMoney(kpi.totalBalance, totalBudgeted);
    const idleCash = compareMoney(remaining, '0') > 0 ? remaining : '0.00';

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
