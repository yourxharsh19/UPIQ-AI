import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeFraudAlerts } from '../src/utils/fraudAlerts.js';

const response = {
  analysisStartDate: '2026-08-19',
  analysisEndDate: '2026-11-16',
  alertCount: 1,
  alerts: [{
    transactionId: '912345678901',
    date: '2026-11-15T12:30:00',
    amount: '50000.00',
    type: 'expense',
    category: 'Shopping',
    description: 'Store purchase',
    paymentMethod: 'UPI',
    riskLevel: 'LOW',
    reasons: [{ code: 'HIGH_AMOUNT', description: 'The amount met a review threshold.' }],
  }],
  disclaimer: 'A signal is not proof of fraud.',
};

test('accepts user-scoped fraud alert data while preserving string transaction IDs and INR decimals', () => {
  const normalized = normalizeFraudAlerts(response);
  assert.equal(normalized.alerts[0].transactionId, '912345678901');
  assert.equal(normalized.alerts[0].amount, '50000.00');
  assert.equal(normalized.alerts[0].riskLevel, 'LOW');
});

test('rejects inconsistent counts and malformed alert rows', () => {
  assert.equal(normalizeFraudAlerts({ ...response, alertCount: 2 }), null);
  assert.equal(normalizeFraudAlerts({ ...response, alerts: [{ ...response.alerts[0], amount: 'NaN' }] }), null);
  assert.equal(normalizeFraudAlerts({ ...response, alerts: [{ ...response.alerts[0], riskLevel: 'CONFIRMED' }] }), null);
  assert.equal(normalizeFraudAlerts({ ...response, alerts: [{ ...response.alerts[0], reasons: [] }] }), null);
});

test('accepts an empty review result', () => {
  const normalized = normalizeFraudAlerts({ ...response, alerts: [], alertCount: 0 });
  assert.deepEqual(normalized.alerts, []);
});
