import { formatInrMoney, moneyFromMinorUnits, parseMoneyArithmeticMinorUnits } from './money.js';

export const toFinancialNumber = (value) => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatInrAmount = (amount, decimals = 2) => {
  return formatInrMoney(amount, decimals);
};

const canonicalMoney = (value) => {
  const minor = parseMoneyArithmeticMinorUnits(value);
  return minor == null ? '0.00' : moneyFromMinorUnits(minor);
};

export const mapDashboardSummary = (summary = {}) => ({
  totalBalance: canonicalMoney(summary.netBalance),
  monthlyIncome: canonicalMoney(summary.totalIncome),
  monthlyExpense: canonicalMoney(summary.totalExpense),
  savingsRate: toFinancialNumber(summary.savingsRate),
  transactionCount: toFinancialNumber(summary.incomeTransactionCount)
    + toFinancialNumber(summary.expenseTransactionCount),
});

export const mapCategorySpending = (categories = [], getCategoryColor) =>
  (Array.isArray(categories) ? categories : []).filter(Boolean).map((category, index) => {
    const name = category.category ?? category.categoryName ?? 'Uncategorized';
    return {
      id: `cat-${index}`,
      name: typeof name === 'string' && name.trim() ? name : 'Uncategorized',
      value: canonicalMoney(category.total ?? category.totalAmount),
      percentage: toFinancialNumber(category.percentageOfTotalExpense ?? category.percentage),
      count: toFinancialNumber(category.transactionCount),
      color: typeof getCategoryColor === 'function' ? getCategoryColor(name) : '#6B7280',
    };
  });

export const formatSavingsRate = (rate) => `${toFinancialNumber(rate).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}%`;
