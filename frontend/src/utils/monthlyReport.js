import { getTransactionCoverage, monthKeyForTransaction } from './transactionCoverage.js';

const monthKeyFor = monthKeyForTransaction;

const amountOf = (transaction) => {
  const value = Number(transaction?.amount);
  return Number.isFinite(value) ? value : 0;
};

const roundMoney = (amount) => Math.round((amount + Number.EPSILON) * 100) / 100;

export const getMonthlyReport = (transactions = [], monthKey) => {
  const monthlyTransactions = transactions.filter((transaction) => monthKeyFor(transaction.date) === monthKey
    && ['income', 'expense'].includes(String(transaction.type).toLowerCase()));
  const incomeTransactions = monthlyTransactions.filter((transaction) => String(transaction.type).toLowerCase() === 'income');
  const expenseTransactions = monthlyTransactions.filter((transaction) => String(transaction.type).toLowerCase() === 'expense');
  const totalIncome = roundMoney(incomeTransactions.reduce((sum, transaction) => sum + amountOf(transaction), 0));
  const totalExpense = roundMoney(expenseTransactions.reduce((sum, transaction) => sum + amountOf(transaction), 0));
  const categoryTotals = new Map();

  for (const transaction of expenseTransactions) {
    const category = transaction.category?.trim() || 'Uncategorized';
    categoryTotals.set(category, (categoryTotals.get(category) || 0) + amountOf(transaction));
  }

  const categories = [...categoryTotals.entries()]
    .map(([category, amount]) => ({
      category,
      amount: roundMoney(amount),
      percentage: totalExpense > 0 ? (amount / totalExpense) * 100 : 0,
    }))
    .sort((left, right) => right.amount - left.amount);

  const sortedExpenses = [...expenseTransactions].sort((left, right) => String(right.date).localeCompare(String(left.date)));
  const recentTransactions = [...monthlyTransactions].sort((left, right) => String(right.date).localeCompare(String(left.date)));

  return {
    monthKey,
    transactions: monthlyTransactions,
    totalIncome,
    totalExpense,
    netCashFlow: roundMoney(totalIncome - totalExpense),
    transactionCount: incomeTransactions.length + expenseTransactions.length,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
    averageExpense: expenseTransactions.length ? roundMoney(totalExpense / expenseTransactions.length) : 0,
    categories,
    largestExpenses: [...sortedExpenses].sort((left, right) => amountOf(right) - amountOf(left)).slice(0, 5),
    recentTransactions: recentTransactions.slice(0, 5),
  };
};

export const createMonthlyReportCsv = (report) => {
  const quote = (value) => {
    const text = String(value ?? '');
    const spreadsheetSafeText = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
    return `"${spreadsheetSafeText.replaceAll('"', '""')}"`;
  };
  const rows = [
    ['UPIQ Monthly Financial Report', report.monthKey],
    ['Metric', 'Amount (INR)'],
    ['Total income', report.totalIncome.toFixed(2)],
    ['Total expenses', report.totalExpense.toFixed(2)],
    ['Net cash flow', report.netCashFlow.toFixed(2)],
    ['Transaction count', report.transactionCount],
    ['Average expense', report.averageExpense.toFixed(2)],
    [],
    ['Expense category', 'Amount (INR)', 'Share of expenses (%)'],
    ...report.categories.map((category) => [category.category, category.amount.toFixed(2), category.percentage.toFixed(2)]),
    [],
    ['Date', 'Type', 'Description', 'Category', 'Amount (INR)', 'Payment method'],
    ...report.transactions.map((transaction) => [
      transaction.date,
      transaction.type,
      transaction.title || transaction.merchant || '',
      transaction.category || 'Uncategorized',
      amountOf(transaction).toFixed(2),
      transaction.mode || '',
    ]),
  ];
  return `\uFEFF${rows.map((row) => row.map(quote).join(',')).join('\r\n')}`;
};

export const getAvailableReportMonths = (transactions = [], currentMonth = new Date()) => {
  const currentKey = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
  const coverage = getTransactionCoverage(transactions);
  if (!coverage.earliestDate) return [];
  const earliestKey = coverage.earliestDate.slice(0, 7);
  const [startYear, startMonth] = earliestKey.split('-').map(Number);
  const endKey = coverage.latestDate.slice(0, 7) > currentKey ? coverage.latestDate.slice(0, 7) : currentKey;
  const [endYear, endMonth] = endKey.split('-').map(Number);
  const start = startYear * 12 + startMonth - 1;
  const end = endYear * 12 + endMonth - 1;
  const months = [];
  for (let current = end; current >= start; current -= 1) {
    const year = Math.floor(current / 12);
    const month = (current % 12) + 1;
    months.push(`${year}-${String(month).padStart(2, '0')}`);
  }
  return months;
};

export const formatMonthLabel = (monthKey) => {
  const [year, month] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric' }).format(new Date(year, month - 1, 1));
};
