const normalizeStatementDate = (value) => {
  if (Array.isArray(value) && value.length >= 3 && value.length <= 6) {
    const [year, month, day, hour = 0, minute = 0, second = 0] = value;
    const parts = [year, month, day, hour, minute, second];
    if (parts.some((part) => !Number.isInteger(part))) return null;
    if (!isValidDateTime(year, month, day, hour, minute, second)) return null;
    return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
  }

  if (typeof value !== 'string' || !value.trim()) return null;
  const dateOnly = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const localDateTime = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(\.\d+)?)?$/.exec(value);
  if (dateOnly) {
    const [, year, month, day] = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (!isValidDateTime(Number(year), Number(month), Number(day), 0, 0, 0)) return null;
  } else {
    if (!localDateTime) return null;
    const [, year, month, day, hour, minute, second = '0'] = localDateTime;
    if (!isValidDateTime(Number(year), Number(month), Number(day), Number(hour), Number(minute), Number(second))) return null;
  }
  return dateOnly ? `${value}T00:00:00` : value;
};

const isValidDateTime = (year, month, day, hour, minute, second) => {
  if (year < 1 || month < 1 || month > 12 || hour < 0 || hour > 23
    || minute < 0 || minute > 59 || second < 0 || second > 59) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const daysPerMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day >= 1 && day <= daysPerMonth[month - 1];
};

const CSV_AMOUNT_HEADERS = new Set(['amount', 'amt', 'value', 'transactionamount', 'total']);
const CSV_DEBIT_HEADERS = new Set([
  'debit', 'debitamount', 'debitamt', 'debitamountinr', 'withdraw', 'withdrawal',
  'withdrawals', 'withdrawalamount', 'withdrawalamt', 'withdrawn', 'withdrawnamount', 'dr', 'dramount',
]);
const CSV_CREDIT_HEADERS = new Set([
  'credit', 'creditamount', 'creditamt', 'creditamountinr', 'deposit', 'deposits',
  'depositamount', 'depositamt', 'deposited', 'cr', 'cramount',
]);
const CURRENCY_PREFIX_PATTERN = /^(?:₹|\$|INR|RS\.?)/i;
const CURRENCY_MARKER_PATTERN = /(?:₹|\$|INR|RS\.?)/i;
const VALID_CSV_AMOUNT_PATTERN = /^[+-]?(?:(?:\d+|\d{1,3}(?:,\d{3})+|\d{1,2}(?:,\d{2})*,\d{3})(?:\.\d*)?|\.\d+)$/;

const parseCsvAmount = (rawAmount) => {
  if (rawAmount == null || !rawAmount.trim()) return null;
  let value = rawAmount.trim();
  let sign = '';
  if (value.startsWith('+') || value.startsWith('-')) {
    sign = value[0];
    value = value.slice(1).trimStart();
  }

  const currencyPrefix = CURRENCY_PREFIX_PATTERN.exec(value);
  if (currencyPrefix) value = value.slice(currencyPrefix[0].length).trimStart();
  if (value.startsWith('+') || value.startsWith('-')) {
    if (sign) return Number.NaN;
    sign = value[0];
    value = value.slice(1).trimStart();
  }
  if (CURRENCY_MARKER_PATTERN.test(value)) return Number.NaN;

  const normalized = `${sign}${value}`;
  if (!VALID_CSV_AMOUNT_PATTERN.test(normalized)) return Number.NaN;
  const parsed = Number(normalized.replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : Number.NaN;
};

export const normalizeParsedTransactions = (transactions, rows = null) => {
  const hasRowValidation = Array.isArray(rows)
    && rows.length > 0
    && rows.every((row) => Array.isArray(row?.validationReasons));
  if (hasRowValidation) {
    const validRows = rows.filter((row) => row?.validationReasons?.length === 0 && row?.transaction)
      .map((row) => Number.isInteger(row.transaction.sourceRowIndex) || !Number.isInteger(row.sourceRowIndex)
        ? row.transaction
        : { ...row.transaction, sourceRowIndex: row.sourceRowIndex });
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

export const normalizeParsingResponse = (parsedResponse) => normalizeParsedTransactions(
  parsedResponse?.transactions,
  parsedResponse?.rows,
);

export const executeStatementImport = async ({
  sessionMode,
  previewSessionMode,
  file,
  transactions = [],
  rejectedCount = 0,
  importOnServer,
  importLocally,
}) => {
  if (sessionMode === 'inconsistent' || sessionMode === 'unauthenticated') {
    throw new Error('Your session needs to be resolved or reauthenticated before importing.');
  }
  if (!['demo', 'authenticated'].includes(sessionMode)) {
    throw new Error('A valid session is required before importing.');
  }
  if (previewSessionMode !== sessionMode) {
    throw new Error('Your session mode changed. Reselect the statement file before importing.');
  }

  if (sessionMode === 'demo') {
    if (typeof importLocally !== 'function') {
      throw new Error('Local demo import is unavailable.');
    }
    const importedCount = await importLocally(transactions);
    return {
      importedCount,
      duplicateCount: 0,
      rejectedCount,
      failedCount: 0,
      localOnly: true,
    };
  }

  if (typeof importOnServer !== 'function') {
    throw new Error('The server import service is unavailable.');
  }
  const response = await importOnServer(file);
  if (response?.success !== true) {
    throw new Error(response?.message || 'The server did not confirm statement import.');
  }
  const counts = ['importedCount', 'duplicateCount', 'rejectedCount', 'failedCount'];
  const hasValidCounts = counts.every((count) => Number.isInteger(response?.data?.[count]) && response.data[count] >= 0);
  if (!response?.data || typeof response.data !== 'object' || Array.isArray(response.data) || !hasValidCounts) {
    throw new Error('The server returned an invalid statement import result.');
  }
  return { ...response.data, localOnly: false };
};

export const canImportStatementPreview = (statementData, isImporting = false) =>
  !isImporting && Array.isArray(statementData?.transactions) && statementData.transactions.length > 0;

const splitCsvRecords = (csvText) => {
  const records = [];
  let record = '';
  let inQuotes = false;

  for (let index = 0; index < csvText.length; index++) {
    const character = csvText[index];
    if (character === '"') {
      record += character;
      if (inQuotes && csvText[index + 1] === '"') {
        record += csvText[index + 1];
        index++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((character === '\r' || character === '\n') && !inQuotes) {
      if (record.trim()) records.push(record.trim());
      record = '';
      if (character === '\r' && csvText[index + 1] === '\n') index++;
    } else {
      record += character;
    }
  }

  if (inQuotes) throw new Error('The CSV contains an unterminated quoted field.');
  if (record.trim()) records.push(record.trim());
  return records;
};

/**
 * Client-side CSV statement parser used when the backend parser is offline or in demo mode.
 * Parses headers for date, description, amount/debit/credit, type, category, mode.
 */
export const parseCsvStatementText = (csvText) => {
  if (!csvText || typeof csvText !== 'string') return [];
  const records = splitCsvRecords(csvText);
  if (records.length < 2) return [];

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

  const headers = parseRow(records[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  const rows = [];

  const dateIdx = headers.findIndex((h) => h.includes('date'));
  const descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('narr') || h.includes('partic') || h.includes('title') || h.includes('merchant'));
  const amountIdx = headers.findIndex((h) => CSV_AMOUNT_HEADERS.has(h));
  const debitIdx = headers.findIndex((h) => CSV_DEBIT_HEADERS.has(h));
  const creditIdx = headers.findIndex((h) => CSV_CREDIT_HEADERS.has(h));
  const typeIdx = headers.findIndex((h) => h === 'type');
  const catIdx = headers.findIndex((h) => h.includes('cat'));
  const modeIdx = headers.findIndex((h) => h.includes('mode') || h.includes('method') || h.includes('channel'));

  for (let i = 1; i < records.length; i++) {
    const cols = parseRow(records[i]);
    if (!cols.length) continue;

    const rawDate = dateIdx >= 0 ? cols[dateIdx] : '';
    const description = descIdx >= 0 ? cols[descIdx] : '';
    const category = catIdx >= 0 ? cols[catIdx] : 'Uncategorized';
    const mode = modeIdx >= 0 ? cols[modeIdx] : 'UPI';
    let type = typeIdx >= 0 ? cols[typeIdx]?.toLowerCase() : '';
    let amount = null;

    if (amountIdx >= 0) {
      amount = parseCsvAmount(cols[amountIdx]);
    }

    const debitAmount = debitIdx >= 0 ? parseCsvAmount(cols[debitIdx]) : null;
    const creditAmount = creditIdx >= 0 ? parseCsvAmount(cols[creditIdx]) : null;
    const hasInvalidDirectionalAmount = [debitAmount, creditAmount].some((value) => value !== null && !Number.isFinite(value));
    const hasNegativeDirectionalAmount = [debitAmount, creditAmount].some((value) => value !== null && value < 0);
    if (hasInvalidDirectionalAmount) {
      amount = Number.NaN;
    } else if (hasNegativeDirectionalAmount) {
      amount = [debitAmount, creditAmount].find((value) => value !== null && value < 0);
    } else if (debitAmount > 0 && creditAmount > 0) {
      amount = Number.NaN;
    } else if (debitAmount > 0) {
      amount = debitAmount;
      type = 'expense';
    } else if (creditAmount > 0) {
      amount = creditAmount;
      type = 'income';
    } else if (debitAmount !== null || creditAmount !== null) {
      amount = debitAmount !== null ? debitAmount : creditAmount;
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
    }

    rows.push({
      sourceRowIndex: i - 1,
      amount,
      type: type.toLowerCase() === 'income' ? 'income' : 'expense',
      description,
      category: category || 'Uncategorized',
      paymentMethod: mode || 'UPI',
      date: normalizedDate,
    });
  }

  return rows;
};


