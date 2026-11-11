import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateStatementFile,
  MAX_FILE_SIZE_BYTES,
} from '../src/utils/fileValidation.js';

describe('fileValidation utility', () => {
  test('accepts valid CSV file with valid size', () => {
    const csvFile = {
      name: 'bank_statement_october.csv',
      size: 1024 * 50, // 50KB
      type: 'text/csv',
    };
    const result = validateStatementFile(csvFile);
    assert.equal(result.valid, true);
    assert.equal(result.fileType, 'csv');
    assert.equal(result.error, undefined);
  });

  test('accepts valid PDF file with valid size', () => {
    const pdfFile = {
      name: 'hdfc_statement.pdf',
      size: 1024 * 500, // 500KB
      type: 'application/pdf',
    };
    const result = validateStatementFile(pdfFile);
    assert.equal(result.valid, true);
    assert.equal(result.fileType, 'pdf');
    assert.equal(result.error, undefined);
  });

  test('accepts uppercase extensions like .CSV and .PDF', () => {
    const csvUpper = { name: 'TRANSACTIONS.CSV', size: 1024, type: 'text/csv' };
    const pdfUpper = { name: 'STATEMENT.PDF', size: 2048, type: 'application/pdf' };
    assert.equal(validateStatementFile(csvUpper).valid, true);
    assert.equal(validateStatementFile(pdfUpper).valid, true);
  });

  test('accepts valid .txt CSV statement file', () => {
    const txtFile = { name: 'statement.txt', size: 2048, type: 'text/plain' };
    const result = validateStatementFile(txtFile);
    assert.equal(result.valid, true);
    assert.equal(result.fileType, 'csv');
  });

  test('rejects empty file (0 bytes)', () => {
    const emptyFile = { name: 'empty_statement.csv', size: 0, type: 'text/csv' };
    const result = validateStatementFile(emptyFile);
    assert.equal(result.valid, false);
    assert.match(result.error, /empty \(0 bytes\)/i);
  });

  test('rejects files exceeding 10MB limit', () => {
    const oversizedFile = {
      name: 'large_statement.pdf',
      size: MAX_FILE_SIZE_BYTES + 1024, // >10MB
      type: 'application/pdf',
    };
    const result = validateStatementFile(oversizedFile);
    assert.equal(result.valid, false);
    assert.match(result.error, /exceeds the maximum allowed limit of 10 MB/i);
  });

  test('rejects unsupported extensions', () => {
    const unsupportedFiles = [
      { name: 'document.docx', size: 1024, type: 'application/msword' },
      { name: 'statement.xlsx', size: 1024, type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' },
      { name: 'photo.png', size: 1024, type: 'image/png' },
      { name: 'script.exe', size: 1024, type: 'application/x-msdownload' },
    ];

    for (const f of unsupportedFiles) {
      const result = validateStatementFile(f);
      assert.equal(result.valid, false);
      assert.match(result.error, /unsupported file type/i);
    }
  });

  test('rejects files without extension or dot', () => {
    const noExt = { name: 'statement_without_extension', size: 1024 };
    const result = validateStatementFile(noExt);
    assert.equal(result.valid, false);
    assert.match(result.error, /invalid file format/i);
  });

  test('rejects missing or null file', () => {
    assert.equal(validateStatementFile(null).valid, false);
    assert.equal(validateStatementFile(undefined).valid, false);
  });

  test('rejects mismatched image MIME type disguised as csv', () => {
    const spoofedFile = {
      name: 'malicious.csv',
      size: 1024,
      type: 'image/png',
    };
    const result = validateStatementFile(spoofedFile);
    assert.equal(result.valid, false);
    assert.match(result.error, /mime type.*not supported/i);
  });
});
