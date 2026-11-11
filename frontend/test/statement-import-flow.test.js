import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { getAuthSessionMode, isActiveDemoSession } from '../src/utils/authFlow.js';
import { getInitialAuthState } from '../src/utils/authUtils.js';
import {
  canImportStatementPreview,
  executeStatementImport,
  normalizeParsedTransactions,
  normalizeParsingResponse,
  parseCsvStatementText,
} from '../src/utils/statementImport.js';

const validTransaction = {
  sourceRowIndex: 0,
  amount: 25,
  type: 'expense',
  description: 'Coffee shop',
  date: '2026-09-12',
};

test('normalizes valid and rejected rows from the backend preview contract', () => {
  const rows = [
    { sourceRowIndex: 0, transaction: validTransaction, validationReasons: [] },
    {
      sourceRowIndex: 1,
      transaction: { ...validTransaction, date: null },
      validationReasons: ['MISSING_DATE'],
    },
  ];
  const preview = normalizeParsingResponse({ transactions: [validTransaction], rows });

  assert.equal(preview.transactions.length, 1);
  assert.equal(preview.transactions[0].sourceRowIndex, 0);
  assert.equal(preview.rejectedCount, 1);
  assert.deepEqual(preview.rejectedRows, [{ sourceRowIndex: 1, reasons: ['MISSING_DATE'] }]);
});

test('nested valid transactions inherit their parent source index for stable ids', () => {
  const parsed = normalizeParsingResponse({
    rows: [
      { sourceRowIndex: 12, transaction: { ...validTransaction, sourceRowIndex: undefined }, validationReasons: [] },
      { sourceRowIndex: 13, transaction: { ...validTransaction, date: null }, validationReasons: ['MISSING_DATE'] },
    ],
  });
  assert.equal(parsed.transactions[0].sourceRowIndex, 12);
  assert.equal(parsed.transactions[0].id, 'statement-row-12');
  assert.deepEqual(parsed.rejectedRows, [{ sourceRowIndex: 13, reasons: ['MISSING_DATE'] }]);
});

test('strict date validation rejects impossible dates and accepts leap days', () => {
  const parsed = normalizeParsedTransactions([
    { ...validTransaction, date: '2026-02-31' },
    { ...validTransaction, date: '2024-02-29' },
    { ...validTransaction, date: '2023-02-29' },
    { ...validTransaction, date: '2024-04-31T12:00:00' },
    { ...validTransaction, date: '2024-01-01T24:00:00' },
    { ...validTransaction, date: '2024-01-01T12:60:00' },
    { ...validTransaction, date: '2024-01-01T12:00:60' },
  ]);
  assert.equal(parsed.transactions.length, 1);
  assert.equal(parsed.transactions[0].date, '2024-02-29T00:00:00');
  assert.equal(parsed.rejectedCount, 6);
  assert.ok(parsed.rejectedRows.every((row) => row.reasons.includes('invalid_date')));
});

test('strict date validation rejects invalid array date components', () => {
  const parsed = normalizeParsedTransactions([
    { ...validTransaction, date: [2026, 2, 31, 0, 0, 0] },
    { ...validTransaction, date: [2024, 2, 29, 23, 59, 59] },
    { ...validTransaction, date: [2024, 2, 29, 24, 0, 0] },
    { ...validTransaction, date: [2024, 13, 1] },
    { ...validTransaction, date: [2024, 2, 29, 1, 2, 3, 4] },
  ]);
  assert.equal(parsed.transactions.length, 1);
  assert.equal(parsed.transactions[0].date, '2024-02-29T23:59:59');
  assert.equal(parsed.rejectedCount, 4);
});

test('CSV rows with missing or malformed amounts remain available for rejection accounting', () => {
  const csvRows = parseCsvStatementText(
    'date,description,amount,type\n2026-09-12,Missing amount,,expense\n2026-09-12,Bad amount,12x,expense\n2026-09-12,Valid amount,25,expense',
  );
  const result = normalizeParsedTransactions(csvRows);
  assert.equal(csvRows.length, 3);
  assert.equal(result.transactions.length, 1);
  assert.equal(result.rejectedCount, 2);
  assert.deepEqual(result.rejectedRows.map(({ sourceRowIndex, reasons }) => ({ sourceRowIndex, reasons })), [
    { sourceRowIndex: 0, reasons: ['missing_amount'] },
    { sourceRowIndex: 1, reasons: ['invalid_amount'] },
  ]);
});

test('CSV amount parsing supports currency and valid grouped amounts, but rejects bad grouping', () => {
  const csvRows = parseCsvStatementText(
    'date,description,amount,type\n2026-09-12,Rupee amount,"₹1,200.50",expense\n2026-09-12,Grouped amount,"12,500",expense\n2026-09-12,Bad grouping,"1,2,00",expense\n2026-09-12,Non-finite,1e309,expense',
  );
  const result = normalizeParsedTransactions(csvRows);
  assert.deepEqual(result.transactions.map(({ amount }) => amount), [1200.5, 12500]);
  assert.deepEqual(result.rejectedRows.map(({ sourceRowIndex, reasons }) => ({ sourceRowIndex, reasons })), [
    { sourceRowIndex: 2, reasons: ['invalid_amount'] },
    { sourceRowIndex: 3, reasons: ['invalid_amount'] },
  ]);
});

test('CSV amount parsing accepts the shared currency prefixes and rejects embedded or repeated markers', () => {
  const csv = 'date,description,amount,type\n'
    + '2026-09-12,Rupee,"₹1,200.50",expense\n'
    + '2026-09-12,Dollar,"$1,200.50",expense\n'
    + '2026-09-12,INR,"INR 1,200.50",expense\n'
    + '2026-09-12,Rupees,"Rs. 1,200.50",expense\n'
    + '2026-09-12,Embedded,1₹2,expense\n'
    + '2026-09-12,Repeated,"₹₹1200",expense\n'
    + '2026-09-12,Embedded dollar,12$00,expense\n'
    + '2026-09-12,Unsupported,"€1200",expense';
  const result = normalizeParsedTransactions(parseCsvStatementText(csv));

  assert.deepEqual(result.transactions.map(({ amount }) => amount), [1200.5, 1200.5, 1200.5, 1200.5]);
  assert.deepEqual(result.rejectedRows.map(({ sourceRowIndex, reasons }) => ({ sourceRowIndex, reasons })), [
    { sourceRowIndex: 4, reasons: ['invalid_amount'] },
    { sourceRowIndex: 5, reasons: ['invalid_amount'] },
    { sourceRowIndex: 6, reasons: ['invalid_amount'] },
    { sourceRowIndex: 7, reasons: ['invalid_amount'] },
  ]);
});

test('CSV generic amount aliases match backend aliases and unrelated directional headers do not match', () => {
  const aliases = ['amount', 'amt', 'value', 'transaction_amount', 'total'];
  for (const alias of aliases) {
    const parsed = parseCsvStatementText(`date,description,${alias},type\n2026-09-12,Alias,125.50,expense`);
    const result = normalizeParsedTransactions(parsed);
    assert.equal(result.transactions[0]?.amount, 125.5, `expected ${alias} to be recognized`);
    assert.equal(result.rejectedCount, 0);
  }

  const csv = 'date,description,amount,credit_limit,debit_status,credit_score,type\n'
    + '2026-09-12,Generic fallback,75,,, ,expense';
  const result = normalizeParsedTransactions(parseCsvStatementText(csv));
  assert.equal(result.transactions.length, 1);
  assert.equal(result.transactions[0].amount, 75);
  assert.equal(result.transactions[0].type, 'expense');
});

test('local CSV parser matches backend debit and credit rules', () => {
  const csvRows = parseCsvStatementText(
    'date,description,debit,credit\n2026-09-12,Debit,25,\n2026-09-13,Credit,,50\n2026-09-14,Empty,,\n2026-09-15,Ambiguous,10,20\n2026-09-16,Malformed,12x,\n2026-09-17,Negative,-5,',
  );
  const result = normalizeParsedTransactions(csvRows);

  assert.deepEqual(result.transactions.map(({ amount, type }) => ({ amount, type })), [
    { amount: 25, type: 'expense' },
    { amount: 50, type: 'income' },
  ]);
  assert.deepEqual(result.rejectedRows.map(({ sourceRowIndex, reasons }) => ({ sourceRowIndex, reasons })), [
    { sourceRowIndex: 2, reasons: ['missing_amount'] },
    { sourceRowIndex: 3, reasons: ['invalid_amount'] },
    { sourceRowIndex: 4, reasons: ['invalid_amount'] },
    { sourceRowIndex: 5, reasons: ['non_positive_amount'] },
  ]);
});

test('missing CSV descriptions remain empty for missing_description classification', () => {
  const rows = parseCsvStatementText('date,description,amount,type\n2026-09-12,,25,expense');
  assert.equal(rows[0].description, '');
  const result = normalizeParsedTransactions(rows);
  assert.equal(result.rejectedCount, 1);
  assert.deepEqual(result.rejectedRows[0].reasons, ['missing_description']);
});

test('statement import preview button has one disabled condition including empty-preview guard', () => {
  const componentSource = readFileSync(new URL('../src/components/transactions/StatementUploadModal.jsx', import.meta.url), 'utf8');
  const buttonStart = componentSource.indexOf('onClick={handleImportAll}');
  const buttonEnd = componentSource.indexOf('>', buttonStart);
  const importButtonProps = componentSource.slice(buttonStart, buttonEnd);
  assert.equal((importButtonProps.match(/disabled=/g) || []).length, 1);
  assert.match(importButtonProps, /disabled=\{!canImportStatementPreview\(statementData, isImporting\)\}/);
});

test('session mode distinguishes demo-only, token-only, and neither', () => {
  const makeStorage = (entries = {}) => {
    const values = new Map(Object.entries(entries));
    return {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, String(value)),
      removeItem: (key) => values.delete(key),
      entries: () => Object.fromEntries(values),
    };
  };
  const demo = makeStorage({ upiq_demo: 'true', upiq_auth: '"demo"' });
  const authenticated = makeStorage({ token: 'jwt-token', upiq_auth: 'true' });
  const guest = makeStorage();

  assert.equal(getAuthSessionMode(demo), 'demo');
  assert.equal(isActiveDemoSession(demo), true);
  assert.equal(getAuthSessionMode(authenticated), 'authenticated');
  assert.equal(isActiveDemoSession(authenticated), false);
  assert.equal(getAuthSessionMode(guest), 'unauthenticated');
  assert.equal(isActiveDemoSession(guest), false);
});

test('contradictory demo and token state blocks startup classification without deleting credentials', () => {
  const values = new Map([
    ['upiq_demo', 'true'],
    ['upiq_auth', '"demo"'],
    ['token', 'existing-token'],
  ]);
  const storage = {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key),
  };

  assert.equal(getAuthSessionMode(storage), 'inconsistent');
  assert.equal(isActiveDemoSession(storage), false);
  assert.equal(getInitialAuthState(storage), false);
  assert.equal(storage.getItem('upiq_demo'), 'true');
  assert.equal(storage.getItem('token'), 'existing-token');
});

test('local CSV preview handles comma, escaped quotes, CRLF, and multiline descriptions without splitting rows', () => {
  const csv = 'date,description,amount,type\r\n'
    + '2026-09-12,"Coffee, corner ""Local""",25,expense\r\n'
    + '2026-09-13,"Transfer note\r\ncontinued on next line",50,income\r\n'
    + '2026-09-14,Ordinary row,75,expense';
  const parsed = parseCsvStatementText(csv);
  const normalized = normalizeParsedTransactions(parsed);

  assert.equal(parsed.length, 3);
  assert.deepEqual(parsed.map(({ sourceRowIndex }) => sourceRowIndex), [0, 1, 2]);
  assert.equal(parsed[0].description, 'Coffee, corner "Local"');
  assert.equal(parsed[1].description, 'Transfer note\r\ncontinued on next line');
  assert.deepEqual(normalized.transactions.map(({ sourceRowIndex }) => sourceRowIndex), [0, 1, 2]);
});

test('accepts a server-confirmed import and preserves every backend count', async () => {
  const data = { importedCount: 2, duplicateCount: 3, rejectedCount: 4, failedCount: 1 };
  const result = await executeStatementImport({
    sessionMode: 'authenticated',
    previewSessionMode: 'authenticated',
    file: new Blob(['statement']),
    importOnServer: async () => ({ success: true, data }),
    importLocally: () => assert.fail('Authenticated imports must not use local storage.'),
  });

  assert.deepEqual(result, { ...data, localOnly: false });
});

test('accepts a confirmed zero-import result when all backend counts are valid', async () => {
  const result = await executeStatementImport({
    sessionMode: 'authenticated',
    previewSessionMode: 'authenticated',
    importOnServer: async () => ({
      success: true,
      data: { importedCount: 0, duplicateCount: 0, rejectedCount: 2, failedCount: 0 },
    }),
  });
  assert.equal(result.importedCount, 0);
  assert.equal(result.rejectedCount, 2);
});

test('rejects import results with missing or malformed backend counts', async () => {
  const malformedResponses = [
    { success: true, data: { importedCount: 0, duplicateCount: 0, rejectedCount: 0 } },
    { success: true, data: { importedCount: '1', duplicateCount: 0, rejectedCount: 0, failedCount: 0 } },
    { success: true, data: { importedCount: -1, duplicateCount: 0, rejectedCount: 0, failedCount: 0 } },
    { success: true, data: null },
  ];
  for (const response of malformedResponses) {
    await assert.rejects(executeStatementImport({
      sessionMode: 'authenticated',
      previewSessionMode: 'authenticated',
      importOnServer: async () => response,
    }), /invalid statement import result/i);
  }
});

test('backend rejection does not fall back to local transaction state', async () => {
  let localImportCalls = 0;
  await assert.rejects(executeStatementImport({
    sessionMode: 'authenticated',
    previewSessionMode: 'authenticated',
    importOnServer: async () => ({ success: false, message: 'Rejected by server' }),
    importLocally: () => { localImportCalls += 1; },
  }), /Rejected by server/);
  assert.equal(localImportCalls, 0);
});

test('network or server failures do not add authenticated transactions locally', async () => {
  let localImportCalls = 0;
  await assert.rejects(executeStatementImport({
    sessionMode: 'authenticated',
    previewSessionMode: 'authenticated',
    importOnServer: async () => { throw new Error('Network unavailable'); },
    importLocally: () => { localImportCalls += 1; },
  }), /Network unavailable/);
  assert.equal(localImportCalls, 0);
});

test('demo imports are explicitly local and return local counts', async () => {
  let serverCalls = 0;
  const result = await executeStatementImport({
    sessionMode: 'demo',
    previewSessionMode: 'demo',
    transactions: [validTransaction],
    rejectedCount: 2,
    importOnServer: async () => { serverCalls += 1; },
    importLocally: async (transactions) => transactions.length,
  });

  assert.deepEqual(result, {
    importedCount: 1,
    duplicateCount: 0,
    rejectedCount: 2,
    failedCount: 0,
    localOnly: true,
  });
  assert.equal(serverCalls, 0);
});

test('stops import when session mode differs from preview mode', async () => {
  for (const [previewSessionMode, sessionMode] of [['demo', 'authenticated'], ['authenticated', 'demo']]) {
    let serverCalls = 0;
    let localCalls = 0;
    await assert.rejects(executeStatementImport({
      sessionMode,
      previewSessionMode,
      importOnServer: async () => { serverCalls += 1; },
      importLocally: async () => { localCalls += 1; },
    }), /session mode changed.*reselect/i);
    assert.equal(serverCalls, 0);
    assert.equal(localCalls, 0);
  }
});

test('contradictory and unauthenticated session modes cannot import either locally or on the server', async () => {
  for (const sessionMode of ['inconsistent', 'unauthenticated']) {
    let serverCalls = 0;
    let localCalls = 0;
    await assert.rejects(executeStatementImport({
      sessionMode,
      previewSessionMode: sessionMode,
      importOnServer: async () => { serverCalls += 1; },
      importLocally: async () => { localCalls += 1; },
    }), /session/i);
    assert.equal(serverCalls, 0);
    assert.equal(localCalls, 0);
  }
});

test('empty or importing previews cannot be imported', () => {
  assert.equal(canImportStatementPreview({ transactions: [] }), false);
  assert.equal(canImportStatementPreview({ transactions: null }), false);
  assert.equal(canImportStatementPreview({ transactions: [validTransaction] }), true);
  assert.equal(canImportStatementPreview({ transactions: [validTransaction] }, true), false);
});

test('local CSV fallback does not invent today as a malformed row date', () => {
  const rows = parseCsvStatementText('date,description,amount,type\nnot-a-date,Coffee,25,expense');
  const result = normalizeParsedTransactions(rows);

  assert.equal(result.transactions.length, 0);
  assert.equal(result.rejectedCount, 1);
  assert.deepEqual(result.rejectedRows[0].reasons, ['invalid_date']);
});
