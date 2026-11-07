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

export const normalizeParsedTransactions = (transactions, rows = null) => {
  const hasRowValidation = Array.isArray(rows)
    && rows.length > 0
    && rows.every((row) => Array.isArray(row?.validationReasons));
  if (hasRowValidation) {
    const validRows = rows.filter((row) => row?.validationReasons?.length === 0 && row?.transaction)
      .map((row) => row.transaction);
    const rejectedRows = rows.filter((row) => row?.validationReasons?.length > 0).map((row) => ({
      sourceRowIndex: row.sourceRowIndex,
      reasons: row.validationReasons,
    }));
    const normalized = normalizeParsedTransactions(validRows);
    return {
      transactions: normalized.transactions,
      rejectedCount: rejectedRows.length + normalized.rejectedCount,
      rejectedRows: [...rejectedRows, ...normalized.rejectedRows],
    };
  }
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return { transactions: [], rejectedCount: 0, rejectedRows: [] };
  }

  const normalized = [];
  let rejectedCount = 0;
  const rejectedRows = [];

  transactions.forEach((transaction, index) => {
    const amount = transaction?.amount;
    const type = typeof transaction?.type === 'string' ? transaction.type.toLowerCase() : '';
    const description = typeof transaction?.description === 'string' ? transaction.description.trim() : '';
    const rawDate = transaction?.date;
    const date = normalizeStatementDate(rawDate);

    if (!Number.isFinite(amount) || amount <= 0 || !['income', 'expense'].includes(type) || !description || !date) {
      rejectedCount += 1;
      rejectedRows.push({
        sourceRowIndex: Number.isInteger(transaction?.sourceRowIndex) ? transaction.sourceRowIndex : index,
        reasons: [
          !date ? (rawDate == null || (typeof rawDate === 'string' && !rawDate.trim()) ? 'missing_date' : 'invalid_date') : null,
          amount == null ? 'missing_amount' : !Number.isFinite(amount) ? 'invalid_amount' : amount <= 0 ? 'non_positive_amount' : null,
          !description ? 'missing_description' : null,
          !['income', 'expense'].includes(type) ? 'invalid_transaction_type' : null,
        ].filter(Boolean),
      });
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

  return { transactions: normalized, rejectedCount, rejectedRows };
};

