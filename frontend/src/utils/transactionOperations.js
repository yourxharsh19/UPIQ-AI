export const DELETE_ALL_CONFIRMATION = 'Permanently delete all of your transactions? This cannot be undone. Your account, budgets, and other financial records will remain.';

export const submitTransactionForm = async ({ save, close }) => {
  const saved = await save();
  if (saved === false) return false;
  close();
  return true;
};

export const buildTransactionUpdatePayload = (updatedFields = {}, existingDate) => {
  const payload = {
    amount: parseFloat(updatedFields.amount || 0),
    type: updatedFields.type || 'expense',
    category: updatedFields.category || 'Uncategorized',
    description: updatedFields.title || updatedFields.merchant || 'Updated Transaction',
    paymentMethod: updatedFields.mode || 'UPI',
  };
  const date = updatedFields.date || existingDate;
  if (date) payload.date = date;
  return payload;
};

export const persistTransactionChange = async ({ request, refreshTransactions, refreshDashboard, requireData = false }) => {
  const response = await request();
  if (response?.success === false || (requireData && (!response?.success || !response?.data))) {
    throw new Error(response?.message || 'The server did not confirm the transaction change.');
  }
  const refreshes = [refreshDashboard()];
  if (refreshTransactions) refreshes.push(refreshTransactions());
  await Promise.all(refreshes);
  return response;
};

export const deleteAllAndRefresh = async ({ deleteAll, refreshTransactions, refreshDashboard }) => {
  const response = await deleteAll();
  if (response?.success !== true) {
    throw new Error(response?.message || 'The server did not confirm transaction deletion.');
  }
  await Promise.all([refreshTransactions(), refreshDashboard()]);
  return response;
};

export const runAfterDeleteAllConfirmation = async ({ confirm, action }) => {
  if (!confirm(DELETE_ALL_CONFIRMATION)) return { cancelled: true };
  return { cancelled: false, result: await action() };
};
