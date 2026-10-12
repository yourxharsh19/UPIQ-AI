const localDateKey = (value) => {
  if (typeof value !== 'string' && !(value instanceof Date)) return null;
  const text = value instanceof Date ? value.toISOString().slice(0, 10) : value;
  const match = String(text).match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  const parsed = new Date(Number(year), Number(month) - 1, Number(day));
  if (parsed.getFullYear() !== Number(year) || parsed.getMonth() !== Number(month) - 1 || parsed.getDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
};

export const getTransactionCoverage = (transactions = []) => {
  const dates = transactions.map((transaction) => localDateKey(transaction?.date)).filter(Boolean).sort();
  return {
    earliestDate: dates[0] || null,
    latestDate: dates.at(-1) || null,
    defaultMonth: dates.length ? dates.at(-1).slice(0, 7) : null,
  };
};

export const hasTransactionsInMonth = (transactions = [], monthKey) => Boolean(monthKey)
  && transactions.some((transaction) => localDateKey(transaction?.date)?.startsWith(`${monthKey}-`));

export const monthKeyForTransaction = (value) => localDateKey(value)?.slice(0, 7) || null;
