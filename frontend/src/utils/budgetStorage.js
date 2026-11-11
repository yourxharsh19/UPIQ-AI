export const LEGACY_STORAGE_KEY = 'upiq_budgets';

/**
 * Returns a user-scoped storage key for budget persistence.
 * Keys by user ID (or email fallback) to isolate budgets between different users.
 *
 * @param {string|number|null} [userId]
 * @returns {string}
 */
export const getBudgetStorageKey = (userId) => {
  if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
    return `upiq_budgets_user_${String(userId).trim()}`;
  }
  return 'upiq_budgets_guest';
};

/**
 * Reads stored budgets for the active user with a one-time safe migration
 * from legacy global storage.
 *
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {Record<string, number>}
 */
export const readStoredBudgets = (storage, userId) => {
  try {
    const s = storage ?? globalThis.localStorage;
    const userKey = getBudgetStorageKey(userId);
    let stored = s?.getItem(userKey);

    // One-time safe migration from legacy unpartitioned storage if user has no scoped budgets yet
    if (!stored && userId) {
      const legacy = s?.getItem(LEGACY_STORAGE_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (parsed && typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length > 0) {
            s?.setItem(userKey, legacy);
            stored = legacy;
          }
        } catch {
          // ignore corrupted legacy storage
        }
      }
    }

    if (!stored) return {};

    const parsed = JSON.parse(stored);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

/**
 * Writes stored budgets for the active user to localStorage.
 *
 * @param {Record<string, number>} budgets
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {boolean}
 */
export const writeStoredBudgets = (budgets, storage, userId) => {
  try {
    const s = storage ?? globalThis.localStorage;
    const userKey = getBudgetStorageKey(userId);
    s?.setItem(userKey, JSON.stringify(budgets));
    return true;
  } catch {
    return false;
  }
};

/**
 * Exports category budgets as a formatted JSON string for cross-device portability.
 *
 * @param {Record<string, number>} budgets
 * @param {string|number} [userId]
 * @returns {string}
 */
export const exportBudgetsToJson = (budgets, userId) => {
  const payload = {
    appName: 'UPIQ AI',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    user: userId ? String(userId) : 'guest',
    budgets: budgets || {},
    note: 'Budgets are saved on this device only',
  };
  return JSON.stringify(payload, null, 2);
};

/**
 * Validates and parses an imported JSON budget payload.
 * Accepts both full export payloads `{ budgets: { ... } }` and flat `{ [category]: amount }` maps.
 *
 * @param {string} jsonString
 * @returns {Record<string, number>}
 */
export const parseImportedBudgetsJson = (jsonString) => {
  if (!jsonString || typeof jsonString !== 'string') {
    throw new Error('Please select a valid budget JSON file.');
  }

  let parsed;
  try {
    parsed = JSON.parse(jsonString);
  } catch {
    throw new Error('Invalid JSON format. Please ensure the file contains valid JSON.');
  }

  const rawBudgets = parsed?.budgets && typeof parsed.budgets === 'object' && !Array.isArray(parsed.budgets)
    ? parsed.budgets
    : (parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : null);

  if (!rawBudgets || typeof rawBudgets !== 'object') {
    throw new Error('No valid budgets object found in the imported file.');
  }

  const sanitized = {};
  const metadataKeys = ['appName', 'schemaVersion', 'version', 'exportedAt', 'user', 'note'];

  for (const [key, value] of Object.entries(rawBudgets)) {
    if (typeof key !== 'string' || !key.trim()) continue;
    if (metadataKeys.includes(key)) continue;

    const num = Number(value);
    if (Number.isFinite(num) && num >= 0) {
      sanitized[key.trim()] = Math.round((num + Number.EPSILON) * 100) / 100;
    }
  }

  if (Object.keys(sanitized).length === 0) {
    throw new Error('No valid category budget entries found in the file.');
  }

  return sanitized;
};
