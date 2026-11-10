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

/**
 * Client-side CSV statement parser used when the backend parser is offline or in demo mode.
 * Parses headers for date, description, amount/debit/credit, type, category, mode.
 */
export const parseCsvStatementText = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];
  const lines = csvText.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length < 2) return [];

  const parseRow = (line) => {
    const values = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    return values;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows = [];

  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('narr') || h.includes('partic') || h.includes('title') || h.includes('merchant'));
  const amountIdx = headers.findIndex((h) => h === 'amount' || h.includes('amt'));
  const debitIdx = headers.findIndex((h) => h.includes('debit') || h.includes('withdraw'));
  const creditIdx = headers.findIndex((h) => h.includes('credit') || h.includes('deposit'));
  const typeIdx = headers.findIndex((h) => h === 'type');
  const catIdx = headers.findIndex((h) => h.includes('cat'));
  const modeIdx = headers.findIndex((h) => h.includes('mode') || h.includes('method') || h.includes('channel'));

  for (let i = 1; i < lines.length; i++) {
    const cols = parseRow(lines[i]);
    if (!cols.length) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : '';
    const description = descIdx >= 0 ? cols[descIdx] : `Transaction #${i}`;
    const category = catIdx >= 0 ? cols[catIdx] : 'Uncategorized';
    const mode = modeIdx >= 0 ? cols[modeIdx] : 'UPI';
    let type = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : '';
    let amount = 0;

    if (amountIdx >= 0) {
      const cleaned = (cols[amountIdx] || '').replace(/[^0-9.-]/g, '');
      amount = Math.abs(parseFloat(cleaned) || 0);
    }

    if (debitIdx >= 0 && cols[debitIdx]) {
      const cleaned = cols[debitIdx].replace(/[^0-9.-]/g, '');
      const val = parseFloat(cleaned);
      if (val > 0) {
        amount = val;
        type = 'expense';
      }
    }

    if (creditIdx >= 0 && cols[creditIdx]) {
      const cleaned = cols[creditIdx].replace(/[^0-9.-]/g, '');
      const val = parseFloat(cleaned);
      if (val > 0) {
        amount = val;
        type = 'income';
      }
    }

    if (!type) {
      type = 'expense';
    }

    let normalizedDate = rawDate;
    if (/^\d{2}[-/]\d{2}[-/]\d{4}$/.test(rawDate)) {
      const [d, m, y] = rawDate.split(/[-/]/);
      normalizedDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    } else if (/^\d{4}[-/]\d{2}[-/]\d{2}$/.test(rawDate)) {
      normalizedDate = rawDate.replace(/\//g, '-');
    } else {
      try {
        const parsed = new Date(rawDate);
        if (!isNaN(parsed.getTime())) {
          normalizedDate = parsed.toISOString().slice(0, 10);
        } else {
          normalizedDate = new Date().toISOString().slice(0, 10);
        }
      } catch {
        normalizedDate = new Date().toISOString().slice(0, 10);
      }
    }

    if (amount > 0) {
      rows.push({
        sourceRowIndex: i,
        id: `csv-tx-${i}-${Date.now()}`,
        amount,
        type: type.toLowerCase() === 'income' ? 'income' : 'expense',
        description: description || 'Bank Transaction',
        category: category || 'Uncategorized',
        paymentMethod: mode || 'UPI',
        date: normalizedDate,
      });
    }
  }

  return rows;
};


