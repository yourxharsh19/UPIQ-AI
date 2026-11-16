export const budgetMonth = (date = new Date()) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

export const normalizeBudgetRows = (rows) => (Array.isArray(rows) ? rows : [])
  .filter((row) => row && /^\d+$/.test(String(row.id)) && typeof row.amount === 'string')
  .map((row) => ({
    ...row,
    id: String(row.id),
    amount: row.amount,
    spent: typeof row.spent === 'string' ? row.spent : '0.00',
    remaining: typeof row.remaining === 'string' ? row.remaining : row.amount,
    projectedSpend: typeof row.projectedSpend === 'string' ? row.projectedSpend : (row.spent || '0.00'),
    category: typeof row.category === 'string' && row.category.trim() ? row.category.trim() : null,
  }));

export const budgetsByCategory = (rows) => Object.fromEntries(
  normalizeBudgetRows(rows)
    .filter((row) => row.category)
    .map((row) => [row.category, row.amount]),
);

export const budgetPayload = (category, amount, month) => ({
  category: typeof category === 'string' && category.trim() ? category.trim() : null,
  amount: String(amount),
  month,
});
