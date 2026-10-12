import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { normalizeParsedTransactions } from '../src/utils/statementImport.js';
import api from '../src/services/api.js';
import { PDFService } from '../src/services/pdf.service.js';

describe('statement import mapping', () => {
  test('maps real parser fields without inventing defaults', () => {
    const result = normalizeParsedTransactions([{
      amount: 125.5,
      sourceRowIndex: 4,
      type: 'EXPENSE',
      description: 'Paid to Grocery Shop',
      date: [2026, 9, 12, 10, 30, 0],
    }]);

    assert.equal(result.rejectedCount, 0);
    assert.deepEqual(result.transactions[0], {
      sourceRowIndex: 4,
      id: 'statement-row-4',
      amount: 125.5,
      type: 'expense',
      category: null,
      description: 'Paid to Grocery Shop',
      paymentMethod: null,
      date: '2026-09-12T10:30:00',
    });
  });

  test('preserves parser row positions across invalid preview rows and keeps identical-looking rows distinct', () => {
    const result = normalizeParsedTransactions([
      { amount: 2, type: 'expense', description: 'Same merchant', date: '2026-09-12', sourceRowIndex: 7 },
      { amount: 0, type: 'expense', description: 'Invalid row', date: '2026-09-12', sourceRowIndex: 8 },
      { amount: 2, type: 'expense', description: 'Same merchant', date: '2026-09-12', sourceRowIndex: 9 },
    ]);
    assert.equal(result.rejectedCount, 1);
    assert.deepEqual(result.transactions.map(({ sourceRowIndex }) => sourceRowIndex), [7, 9]);
    assert.notEqual(result.transactions[0].id, result.transactions[1].id);
  });

  test('rejects empty parser output without creating a placeholder row', () => {
    assert.deepEqual(normalizeParsedTransactions([]), { transactions: [], rejectedCount: 0 });
    assert.deepEqual(normalizeParsedTransactions(null), { transactions: [], rejectedCount: 0 });
  });

  test('rejects invalid amount, type, description, or missing/invalid date', () => {
    const result = normalizeParsedTransactions([
      { amount: 0, type: 'expense', description: 'Zero', date: '2026-09-12T10:30:00' },
      { amount: 1, type: 'transfer', description: 'Unknown type', date: '2026-09-12T10:30:00' },
      { amount: 1, type: 'income', description: 'Missing date' },
      { amount: 1, type: 'expense', description: 'Invalid date', date: 'not-a-date' },
      { amount: 1, type: 'expense', description: 'Unsupported zoned date', date: '2026-09-12T10:30:00Z' },
      { amount: 1, type: 'expense', description: '   ', date: '2026-09-12T10:30:00' },
    ]);

    assert.equal(result.transactions.length, 0);
    assert.equal(result.rejectedCount, 6);
  });

  test('normalizes a date-only parser value to the start of that same date', () => {
    const result = normalizeParsedTransactions([{
      amount: 1,
      type: 'expense',
      description: 'Dated entry',
      date: '2026-09-12',
    }]);
    assert.equal(result.transactions[0].date, '2026-09-12T00:00:00');
  });

  test('PDFService sends the selected file in the backend multipart field named file', async () => {
    const originalAdapter = api.defaults.adapter;
    let uploadedForm;
    api.defaults.adapter = async (config) => {
      uploadedForm = config.data;
      return {
        data: { success: true, data: { transactions: [] } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const result = await PDFService.upload(new Blob(['synthetic test statement']));
      assert.ok(uploadedForm instanceof FormData);
      assert.ok(uploadedForm.get('file') instanceof Blob);
      assert.equal(result.success, true);
    } finally {
      api.defaults.adapter = originalAdapter;
    }
  });

  test('PDFService imports the original file through the idempotent import endpoint', async () => {
    const originalAdapter = api.defaults.adapter;
    let requestConfig;
    api.defaults.adapter = async (config) => {
      requestConfig = config;
      return {
        data: { success: true, data: { importedCount: 1, duplicateCount: 2, rejectedCount: 0, failedCount: 0 } },
        status: 200,
        statusText: 'OK',
        headers: {},
        config,
      };
    };

    try {
      const file = new Blob(['original statement']);
      const result = await PDFService.importStatement(file);
      assert.equal(requestConfig.url, '/pdf/import');
      assert.ok(requestConfig.data.get('file') instanceof Blob);
      assert.equal(result.data.duplicateCount, 2);
    } finally {
      api.defaults.adapter = originalAdapter;
    }
  });
});
