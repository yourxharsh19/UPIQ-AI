export const toFinancialNumber = (value) => {
  const amount = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(amount) ? amount : 0;
};

export const formatInrAmount = (amount, decimals = 2) => {
  const safeAmount = toFinancialNumber(amount);
  return `₹${safeAmount.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
};

export const mapDashboardSummary = (summary = {}) => ({
  totalBalance: toFinancialNumber(summary.netBalance),
  monthlyIncome: toFinancialNumber(summary.totalIncome),
  monthlyExpense: toFinancialNumber(summary.totalExpense),
  savingsRate: toFinancialNumber(summary.savingsRate),
  transactionCount: toFinancialNumber(summary.incomeTransactionCount)
    + toFinancialNumber(summary.expenseTransactionCount),
});

export const mapCategorySpending = (categories = [], getCategoryColor) => categories.map((category, index) => ({
  id: `cat-${index}`,
  name: category.categoryName,
  value: toFinancialNumber(category.totalAmount),
  percentage: toFinancialNumber(category.percentage),
  count: toFinancialNumber(category.transactionCount),
  color: getCategoryColor(category.categoryName),
}));

export const formatSavingsRate = (rate) => `${toFinancialNumber(rate).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}%`;
