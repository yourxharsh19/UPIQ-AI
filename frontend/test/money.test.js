import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addMoney,
  formatInrMoney,
  parseMoneyArithmeticMinorUnits,
  parseMoneyMinorUnits,
  sumMoneyString,
} from '../src/utils/money.js';

test('minor-unit arithmetic preserves decimal additions exactly', () => {
  assert.equal(addMoney('0.10', '0.20'), '0.30');
  assert.equal(sumMoneyString(['1234.56', '0.10', '0.20']), '1234.86');
});

test('money parser enforces two fractional digits and NUMERIC(19,2) range', () => {
  assert.equal(parseMoneyMinorUnits('99999999999999999.99'), 9999999999999999999n);
  assert.equal(parseMoneyMinorUnits('100000000000000000.00'), null);
  assert.equal(parseMoneyMinorUnits('1.001'), null);
  assert.equal(parseMoneyMinorUnits(Number.POSITIVE_INFINITY), null);
});

test('INR formatting groups large decimal strings without floating-point conversion', () => {
  assert.equal(formatInrMoney('99999999999999999.99'), '₹99,99,99,99,99,99,99,999.99');
});

test('aggregate arithmetic supports totals larger than one transaction storage limit', () => {
  assert.equal(parseMoneyArithmeticMinorUnits('199999999999999999.98'), 19999999999999999998n);
  assert.equal(sumMoneyString(['99999999999999999.99', '99999999999999999.99']), '199999999999999999.98');
  assert.equal(formatInrMoney('199999999999999999.98'), '₹1,99,99,99,99,99,99,99,999.98');
});
