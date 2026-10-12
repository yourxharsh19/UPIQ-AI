import test from 'node:test';
import assert from 'node:assert/strict';
import api from '../src/services/api.js';
import { FinancialDashboardService } from '../src/services/financial-dashboard.service.js';

test('PDF report requests the selected month and initiates a named file download', async () => {
  let request;
  let clicked = false;
  let filename = '';
  const originalGet = api.get;
  api.get = async (path, config) => {
    request = { path, config };
    return {
      data: new Blob(['%PDF'], { type: 'application/pdf' }),
      headers: { 'content-disposition': 'attachment; filename="UPIQ-Monthly-Report-2026-10.pdf"' },
    };
  };
  globalThis.window = {
    URL: { createObjectURL: () => 'blob:test', revokeObjectURL: () => {} },
    setTimeout: () => {},
  };
  globalThis.document = {
    body: { appendChild: () => {} },
    createElement: () => ({
      set href(value) { this.url = value; },
      set download(value) { filename = value; },
      click: () => { clicked = true; },
      remove: () => {},
    }),
  };

  try {
    assert.equal(await FinancialDashboardService.downloadPdfReport('2026-10'), true);
    assert.equal(request.path, '/financial/report');
    assert.deepEqual(request.config.params, { month: '2026-10' });
    assert.equal(request.config.responseType, 'blob');
    assert.equal(filename, 'UPIQ-Monthly-Report-2026-10.pdf');
    assert.equal(clicked, true);
  } finally {
    api.get = originalGet;
  }
});
