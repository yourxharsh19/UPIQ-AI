import { addMoney, compareMoney, divideMoney, moneyRatioPercent, sumMoneyString, subtractMoney } from './money.js';
import { getCategoryColor } from './categoryUtils.js';

export const buildLocalBudgetForecasts = (budgetMap, transactions, now = new Date()) => {
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const elapsedDays = now.getDate();
  const currentMonthTransactions = transactions.filter((transaction) => {
    const date = new Date(transaction.date);
    return Number.isFinite(date.getTime())
      && date.getFullYear() === now.getFullYear()
      && date.getMonth() === now.getMonth()
      && transaction.type?.toLowerCase() === 'expense';
  });

  return Object.entries(budgetMap || {})
    .map(([category, rawBudget]) => {
      const budget = String(rawBudget ?? '0');
      if (compareMoney(budget, '0') <= 0) return null;

      const spent = currentMonthTransactions
        .filter((transaction) => (transaction.category || 'Uncategorized').toLowerCase() === category.toLowerCase())
        .map((transaction) => transaction.amount);
      const spentTotal = sumMoneyString(spent);

      return {
        category,
        budget,
        spent: spentTotal,
        predicted: elapsedDays > 0 ? divideMoney(spentTotal, daysInMonth, elapsedDays) : spentTotal,
        color: getCategoryColor(category).value,
      };
    })
    .filter(Boolean);
};

export const formatBudgetUsage = (spent, budget) => {
  if (compareMoney(budget, '0') <= 0) return 'Set category budgets to see usage';
  return `${moneyRatioPercent(spent, budget, 1).toFixed(1)}% of total cap`;
};

export const getBudgetProgress = (spent, budget) => {
  const comparison = compareMoney(spent, budget);
  return {
    percentage: moneyRatioPercent(spent, budget, 2),
    isOverBudget: comparison > 0,
    difference: comparison > 0 ? subtractMoney(spent, budget) : subtractMoney(budget, spent),
  };
};
