const STORAGE_KEY = 'upiq_budgets';

export const readStoredBudgets = (storage) => {
  try {
    const stored = (storage ?? globalThis.localStorage)?.getItem(STORAGE_KEY);
    if (!stored) return {};

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

export const writeStoredBudgets = (budgets, storage) => {
  try {
    (storage ?? globalThis.localStorage)?.setItem(STORAGE_KEY, JSON.stringify(budgets));
    return true;
  } catch {
    return false;
  }
};
