import { addMoney, compareMoney, divideMoney, moneyRatioPercent, sumMoneyString, subtractMoney } from './money.js';

/**
 * Utility functions for transaction calculations and insights
 * All calculations are done on the frontend using existing transaction data
 */

/**
 * Filter transactions by date range
 */
export const filterByDateRange = (transactions, startDate, endDate) => {
  if (!startDate || !endDate) return transactions;
  
  return transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate >= startDate && transactionDate <= endDate;
  });
};

/**
 * Get transactions for a specific month
 */
export const getTransactionsForMonth = (transactions, year, month) => {
  return transactions.filter(t => {
    const date = new Date(t.date);
    return date.getFullYear() === year && date.getMonth() === month;
  });
};

/**
 * Calculate total income
 */
export const calculateTotalIncome = (transactions) => {
  return sumMoneyString(transactions.filter(t => t.type && t.type.toLowerCase() === 'income').map(t => t.amount));
};

/**
 * Calculate total expenses
 */
export const calculateTotalExpenses = (transactions) => {
  return sumMoneyString(transactions.filter(t => t.type && t.type.toLowerCase() === 'expense').map(t => t.amount));
};

/**
 * Calculate balance
 */
export const calculateBalance = (transactions) => {
  return subtractMoney(calculateTotalIncome(transactions), calculateTotalExpenses(transactions));
};

/**
 * Calculate savings rate percentage
 */
export const calculateSavingsRate = (transactions) => {
  const income = calculateTotalIncome(transactions);
  if (compareMoney(income, '0') === 0) return 0;
  const expenses = calculateTotalExpenses(transactions);
  return moneyRatioPercent(subtractMoney(income, expenses), income, 2);
};

/**
 * Get category-wise expense breakdown
 */
export const getCategoryExpenseBreakdown = (transactions) => {
  const expenses = transactions.filter(t => t.type && t.type.toLowerCase() === 'expense');
  
  const breakdown = expenses.reduce((acc, t) => {
    const category = t.category || 'Uncategorized';
    acc[category] = addMoney(acc[category] || '0', t.amount || '0');
    return acc;
  }, {});

  return Object.entries(breakdown)
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => compareMoney(b.amount, a.amount));
};

/**
 * Get top spending category
 */
export const getTopSpendingCategory = (transactions) => {
  const breakdown = getCategoryExpenseBreakdown(transactions);
  return breakdown.length > 0 ? breakdown[0] : null;
};

/**
 * Calculate spending concentration (percentage in top category)
 */
export const calculateSpendingConcentration = (transactions) => {
  const totalExpenses = calculateTotalExpenses(transactions);
  if (compareMoney(totalExpenses, '0') === 0) return 0;
  
  const topCategory = getTopSpendingCategory(transactions);
  if (!topCategory) return 0;
  
  return moneyRatioPercent(topCategory.amount, totalExpenses, 2);
};

/**
 * Compare current month vs previous month
 */
export const compareMonthOverMonth = (transactions) => {
  const now = new Date();
  const currentMonth = getTransactionsForMonth(transactions, now.getFullYear(), now.getMonth());
  const previousMonth = getTransactionsForMonth(
    transactions,
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  );

  const currentExpenses = calculateTotalExpenses(currentMonth);
  const previousExpenses = calculateTotalExpenses(previousMonth);

  if (compareMoney(previousExpenses, '0') === 0) {
    return compareMoney(currentExpenses, '0') > 0 ? { change: 100, direction: 'up' } : { change: 0, direction: 'neutral' };
  }

  const changeDirection = compareMoney(currentExpenses, previousExpenses);
  const change = Math.abs(moneyRatioPercent(subtractMoney(currentExpenses, previousExpenses), previousExpenses, 2));
  return {
    change,
    direction: changeDirection > 0 ? 'up' : changeDirection < 0 ? 'down' : 'neutral'
  };
};

/**
 * Get category-wise month-over-month comparison
 */
export const getCategoryMonthOverMonth = (transactions, categoryName) => {
  const now = new Date();
  const currentMonth = getTransactionsForMonth(transactions, now.getFullYear(), now.getMonth());
  const previousMonth = getTransactionsForMonth(
    transactions,
    now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear(),
    now.getMonth() === 0 ? 11 : now.getMonth() - 1
  );

  const currentAmount = currentMonth
    .filter(t => (t.category || 'Uncategorized') === categoryName && t.type?.toLowerCase() === 'expense')
    .map(t => t.amount);

  const previousAmount = previousMonth
    .filter(t => (t.category || 'Uncategorized') === categoryName && t.type?.toLowerCase() === 'expense')
    .map(t => t.amount);

  const currentTotal = sumMoneyString(currentAmount);
  const previousTotal = sumMoneyString(previousAmount);

  if (compareMoney(previousTotal, '0') === 0) {
    return compareMoney(currentTotal, '0') > 0 ? { change: 100, direction: 'up' } : { change: 0, direction: 'neutral' };
  }

  const changeDirection = compareMoney(currentTotal, previousTotal);
  const change = Math.abs(moneyRatioPercent(subtractMoney(currentTotal, previousTotal), previousTotal, 2));
  return {
    change: Math.abs(change),
    direction: changeDirection > 0 ? 'up' : changeDirection < 0 ? 'down' : 'neutral',
    currentAmount: currentTotal,
    previousAmount: previousTotal
  };
};

/**
 * Get income vs expense ratio
 */
export const getIncomeExpenseRatio = (transactions) => {
  const income = calculateTotalIncome(transactions);
  const expenses = calculateTotalExpenses(transactions);
  
  if (compareMoney(expenses, '0') === 0) return compareMoney(income, '0') > 0 ? Infinity : 0;
  return moneyRatioPercent(income, expenses, 4) / 100;
};

/**
 * Get overspending categories (categories exceeding 80% of total expenses)
 */
export const getOverspendingCategories = (transactions) => {
  const totalExpenses = calculateTotalExpenses(transactions);
  if (compareMoney(totalExpenses, '0') === 0) return [];
  
  const breakdown = getCategoryExpenseBreakdown(transactions);
  return breakdown.filter(cat => compareMoney(cat.amount, divideMoney(totalExpenses, 30, 100)) > 0);
};

import { addMoney, compareMoney, moneyRatioPercent, sumMoneyString, subtractMoney } from './money.js';
import { addMoney, compareMoney, divideMoney, moneyRatioPercent, sumMoneyString, subtractMoney } from './money.js';
