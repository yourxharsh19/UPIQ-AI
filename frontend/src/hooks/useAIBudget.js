import { useMemo } from 'react';
import { useFinancial } from '../context/FinancialContext';
import { useBudget } from '../context/BudgetContext';
import { buildLocalBudgetForecasts } from '../utils/budgetForecasts.js';
import { compareMoney, moneyRatioPercent, subtractMoney, sumMoneyString } from '../utils/money.js';

export const useAIBudget = () => {
  const { kpi, transactions } = useFinancial();
  const { budgets, budgetRecords, isBackendMode } = useBudget();

  const metrics = useMemo(() => {
    const totalRecord = isBackendMode ? budgetRecords.find((record) => record.category == null) : null;
    const forecasts = isBackendMode
      ? budgetRecords.filter((record) => record.category).map((record) => ({
        category: record.category,
        budget: record.amount,
        spent: record.spent,
        predicted: record.projectedSpend,
        remaining: record.remaining,
        overBudget: record.overBudget,
        percentageConsumed: record.percentageConsumed,
      }))
      : buildLocalBudgetForecasts(budgets, transactions);
    const totalBudgeted = totalRecord?.amount || sumMoneyString(forecasts.map((forecast) => forecast.budget));
    const totalSpent = totalRecord?.spent || sumMoneyString(forecasts.map((forecast) => forecast.spent));
    const totalPredicted = totalRecord?.projectedSpend || sumMoneyString(forecasts.map((forecast) => forecast.predicted));

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
  }, [budgetRecords, budgets, isBackendMode, kpi, transactions]);

  return metrics;
};
