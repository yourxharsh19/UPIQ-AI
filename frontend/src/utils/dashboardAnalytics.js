import { monthKeyForTransaction } from './transactionCoverage.js';
import { toFinancialNumber } from './financialDisplay.js';

const COLORS = ['#6366f1', '#10b981', '#f43f5e', '#f59e0b', '#06b6d4', '#a855f7', '#64748b'];

export const getMonthlyCashFlow = (transactions = [], monthCount = 6) => {
  const valid = transactions.flatMap((transaction) => {
    const month = monthKeyForTransaction(transaction.date);
    const type = String(transaction.type || '').toLowerCase();
    if (!month || !['income', 'expense'].includes(type)) return [];
    return [{ month, type, amount: toFinancialNumber(transaction.amount) }];
  });
  if (!valid.length) return [];

  const latestMonth = valid.map((item) => item.month).sort().at(-1);
  const [latestYear, latestMonthNumber] = latestMonth.split('-').map(Number);
  const anchor = new Date(latestYear, latestMonthNumber - 1, 1);
  const first = new Date(anchor.getFullYear(), anchor.getMonth() - Math.max(1, monthCount) + 1, 1);
  const totals = new Map();
  valid.forEach(({ month, type, amount }) => {
    const current = totals.get(month) || { income: 0, expense: 0 };
    current[type] += amount;
    totals.set(month, current);
  });

  return Array.from({ length: Math.max(1, monthCount) }, (_, index) => {
    const date = new Date(first.getFullYear(), first.getMonth() + index, 1);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const values = totals.get(key) || { income: 0, expense: 0 };
    return {
      period: date.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
      income: values.income,
      expense: values.expense,
      savings: values.income - values.expense,
    };
  });
};

export const getTransactionCategorySpending = (transactions = []) => {
  const totals = new Map();
  const latestMonth = transactions
    .map((transaction) => monthKeyForTransaction(transaction.date))
    .filter(Boolean)
    .sort()
    .at(-1);
  transactions.forEach((transaction) => {
    if (String(transaction.type || '').toLowerCase() !== 'expense') return;
    if (latestMonth && monthKeyForTransaction(transaction.date) !== latestMonth) return;
    const name = typeof transaction.category === 'string' && transaction.category.trim()
      ? transaction.category.trim()
      : 'Uncategorized';
    const current = totals.get(name) || { amount: 0, count: 0 };
    current.amount += toFinancialNumber(transaction.amount);
    current.count += 1;
    totals.set(name, current);
  });
  const total = [...totals.values()].reduce((sum, category) => sum + category.amount, 0);
  return [...totals.entries()]
    .map(([name, category], index) => ({
      name,
      value: category.amount,
      count: category.count,
      percentage: total ? Number(((category.amount / total) * 100).toFixed(1)) : 0,
      color: COLORS[index % COLORS.length],
    }))
    .sort((left, right) => right.value - left.value);
};
