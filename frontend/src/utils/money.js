const MAX_MINOR_UNITS = 9999999999999999999n;

const parseMinorUnits = (value, enforceTransactionLimit) => {
  if (typeof value === 'number' && !Number.isFinite(value)) return null;
  const text = String(value ?? '').trim();
  const match = text.match(/^([+-]?)(\d+)(?:\.(\d{1,2}))?$/);
  if (!match || match[2].length > 64) return null;
  const whole = BigInt(match[2]);
  const fraction = BigInt((match[3] || '').padEnd(2, '0'));
  const minor = whole * 100n + fraction;
  if (enforceTransactionLimit && minor > MAX_MINOR_UNITS) return null;
  return match[1] === '-' ? -minor : minor;
};

/** Parses a single transaction amount and enforces the NUMERIC(19,2) bound. */
export const parseMoneyMinorUnits = (value) => parseMinorUnits(value, true);

/** Parses aggregate money values, which may exceed the per-transaction storage bound. */
export const parseMoneyArithmeticMinorUnits = (value) => parseMinorUnits(value, false);

export const moneyFromMinorUnits = (minorUnits) => {
  const negative = minorUnits < 0n;
  const absolute = negative ? -minorUnits : minorUnits;
  return `${negative ? '-' : ''}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`;
};

export const addMoney = (...values) => moneyFromMinorUnits(values.reduce((sum, value) => sum + (parseMoneyArithmeticMinorUnits(value) ?? 0n), 0n));
export const subtractMoney = (left, right) => moneyFromMinorUnits((parseMoneyArithmeticMinorUnits(left) ?? 0n) - (parseMoneyArithmeticMinorUnits(right) ?? 0n));
export const sumMoney = (values) => values.reduce((sum, value) => sum + (parseMoneyArithmeticMinorUnits(value) ?? 0n), 0n);
export const sumMoneyString = (values) => moneyFromMinorUnits(sumMoney(values));
export const divideMoney = (value, numerator, denominator) => {
  const amount = parseMoneyArithmeticMinorUnits(value) ?? 0n;
  if (!denominator) return '0.00';
  const product = amount * BigInt(numerator);
  const divisor = BigInt(denominator);
  const half = divisor > 0n ? divisor / 2n : -divisor / 2n;
  return moneyFromMinorUnits((product + (product >= 0n ? half : -half)) / divisor);
};
export const compareMoney = (left, right) => {
  const a = parseMoneyArithmeticMinorUnits(left) ?? 0n;
  const b = parseMoneyArithmeticMinorUnits(right) ?? 0n;
  return a < b ? -1 : a > b ? 1 : 0;
};

export const moneyRatioPercent = (part, whole, decimals = 1) => {
  const numerator = parseMoneyArithmeticMinorUnits(part) ?? 0n;
  const denominator = parseMoneyArithmeticMinorUnits(whole) ?? 0n;
  if (denominator === 0n) return 0;
  const scale = 10n ** BigInt(decimals);
  const rounded = (numerator * 100n * scale + (denominator > 0n ? denominator / 2n : -denominator / 2n)) / denominator;
  return Number(rounded) / Number(scale);
};

export const moneyToNumber = (value) => {
  const minor = parseMoneyArithmeticMinorUnits(value);
  return minor == null ? 0 : Number(minor) / 100;
};

export const formatInrMoney = (value, decimals = 2) => {
  const minor = parseMoneyArithmeticMinorUnits(value);
  if (minor == null) return `₹${(0).toLocaleString('en-IN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`;
  const negative = minor < 0n;
  const absolute = negative ? -minor : minor;
  const majorText = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(absolute / 100n);
  const fraction = String(absolute % 100n).padStart(2, '0').slice(0, decimals).padEnd(decimals, '0');
  return `${negative ? '-' : ''}₹${majorText}${decimals ? `.${fraction}` : ''}`;
};
