const localDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const transactionDateKey = (value) => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day] = value;
    if (![year, month, day].every(Number.isInteger)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  if (typeof value !== 'string' || !value.trim()) return null;
  const localDate = value.match(/^(\d{4}-\d{2}-\d{2})(?:T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?)?$/);
  if (localDate) return localDate[1];

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : localDateKey(parsed);
};

export const filterTransactionsByDateRange = (transactions, { startDate, endDate } = {}) => {
  if (!startDate && !endDate) return transactions;
  if (!startDate || !endDate || startDate > endDate) return [];
  return transactions.filter((transaction) => {
    const date = transactionDateKey(transaction.date);
    return date !== null && date >= startDate && date <= endDate;
  });
};

export const createDateRangePreset = (preset, now = new Date()) => {
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

  switch (preset) {
    case 'this-month':
      return { startDate: localDateKey(startOfMonth), endDate: localDateKey(endOfMonth) };
    case 'last-month':
      return {
        startDate: localDateKey(new Date(today.getFullYear(), today.getMonth() - 1, 1)),
        endDate: localDateKey(new Date(today.getFullYear(), today.getMonth(), 0)),
      };
    case 'last-30-days':
    case 'last-90-days': {
      const start = new Date(today);
      start.setDate(start.getDate() - (preset === 'last-30-days' ? 30 : 90));
      return { startDate: localDateKey(start), endDate: localDateKey(today) };
    }
    case 'this-year':
      return {
        startDate: localDateKey(new Date(today.getFullYear(), 0, 1)),
        endDate: localDateKey(new Date(today.getFullYear(), 11, 31)),
      };
    case 'all-time':
      return { startDate: '', endDate: '' };
    default:
      return { startDate: localDateKey(startOfMonth), endDate: localDateKey(endOfMonth) };
  }
};

