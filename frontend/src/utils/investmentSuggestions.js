const amountPattern = /^-?\d+(?:\.\d{1,2})?$/;
const statuses = new Set(['NO_DATA', 'POSITIVE_SURPLUS', 'NO_SURPLUS']);

export function normalizeInvestmentSuggestions(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || typeof value.month !== 'string' || !/^\d{4}-\d{2}$/.test(value.month)
    || typeof value.income !== 'string' || !amountPattern.test(value.income)
    || typeof value.expenses !== 'string' || !amountPattern.test(value.expenses)
    || typeof value.monthlySurplus !== 'string' || !amountPattern.test(value.monthlySurplus)
    || !statuses.has(value.cashFlowStatus)
    || !Array.isArray(value.suggestions) || typeof value.explanation !== 'string'
    || typeof value.aiGenerated !== 'boolean' || typeof value.disclaimer !== 'string') return null;
  if (value.savingsRatePercentage != null
    && (typeof value.savingsRatePercentage !== 'string' || !amountPattern.test(value.savingsRatePercentage))) return null;
  const suggestions = value.suggestions.filter((item) => item && typeof item.code === 'string'
    && typeof item.title === 'string' && typeof item.description === 'string');
  if (suggestions.length !== value.suggestions.length) return null;
  return { ...value, suggestions };
}
