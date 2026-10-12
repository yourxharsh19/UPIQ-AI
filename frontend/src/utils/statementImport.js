const normalizeStatementDate = (value) => {
  if (Array.isArray(value) && value.length >= 3) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const parts = [year, month, day, hour, minute, second];
    if (parts.some((part) => !Number.isInteger(part))) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }

  if (typeof value !== 'string' || !value.trim()) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const localDateTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/.test(value);
  const parsed = new Date(value);
  if ((!dateOnly && !localDateTime) || Number.isNaN(parsed.getTime())) return null;
  return dateOnly ? `${value}T00:00:00` : value;
};

export const normalizeParsedTransactions = (transactions) => {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { transactions: [], rejectedCount: 0 };
  }

  const normalized = [];
  let rejectedCount = 0;

  transactions.forEach((transaction, index) => {
    const amount = transaction?.amount;
    const type = typeof transaction?.type === 'string' ? transaction.type.toLowerCase() : '';
    const description = typeof transaction?.description === 'string' ? transaction.description.trim() : '';
    const date = normalizeStatementDate(transaction?.date);

    if (!Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(type) || !description || !date) {
      rejectedCount += 1;
      return;
    }

    normalized.push({
      sourceRowIndex: Number.isInteger(transaction.sourceRowIndex) ? transaction.sourceRowIndex : index,
      id: `statement-row-${Number.isInteger(transaction.sourceRowIndex) ? transaction.sourceRowIndex : index}`,
      amount,
      type,
      category: typeof transaction.category === 'string' && transaction.category.trim()
        ? transaction.category.trim()
        : null,
      description,
      paymentMethod: typeof transaction.paymentMethod === 'string' && transaction.paymentMethod.trim()
        ? transaction.paymentMethod.trim()
        : null,
      date,
    });
  });

  return { transactions: normalized, rejectedCount };
};

