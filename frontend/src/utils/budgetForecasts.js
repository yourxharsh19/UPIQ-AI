import { toFinancialNumber } from './financialDisplay.js';
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
      const budget = toFinancialNumber(rawBudget);
      if (budget <= 0) return null;

      const spent = currentMonthTransactions
        .filter((transaction) => (transaction.category || 'Uncategorized').toLowerCase() === category.toLowerCase())
        .reduce((total, transaction) => total + toFinancialNumber(transaction.amount), 0);

      return {
        category,
        budget,
        spent,
        predicted: elapsedDays > 0 ? (spent / elapsedDays) * daysInMonth : spent,
        color: getCategoryColor(category).value,
      };
    })
    .filter(Boolean);
};

export const formatBudgetUsage = (spent, budget) => {
  const safeBudget = toFinancialNumber(budget);
  if (safeBudget <= 0) return 'Set category budgets to see usage';
  return `${((toFinancialNumber(spent) / safeBudget) * 100).toFixed(1)}% of total cap`;
};
