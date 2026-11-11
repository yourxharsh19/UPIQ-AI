import { formatMonthLabel } from './monthlyReport.js';

export const LEGACY_REPORT_KEY = 'upiq_reports';

/**
 * Returns a user-scoped storage key for saved reports.
 *
 * @param {string|number|null} [userId]
 * @returns {string}
 */
export const getReportHistoryStorageKey = (userId) => {
  if (userId !== undefined && userId !== null && String(userId).trim() !== '') {
    return `upiq_report_history_user_${String(userId).trim()}`;
  }
  return 'upiq_report_history_guest';
};

/**
 * Reads persisted report previews for the active user.
 *
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {Array<object>}
 */
export const readStoredReports = (storage, userId) => {
  try {
    const s = storage ?? globalThis.localStorage;
    const userKey = getReportHistoryStorageKey(userId);
    let stored = s?.getItem(userKey);

    // One-time safe migration from legacy unpartitioned storage if user has no scoped history yet
    if (!stored && userId) {
      const legacy = s?.getItem(LEGACY_REPORT_KEY);
      if (legacy) {
        try {
          const parsed = JSON.parse(legacy);
          if (Array.isArray(parsed) && parsed.length > 0) {
            s?.setItem(userKey, legacy);
            stored = legacy;
          }
        } catch {
          // ignore corrupted legacy storage
        }
      }
    }

    if (!stored) return [];

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

/**
 * Writes report history array for the active user to localStorage.
 *
 * @param {Array<object>} reports
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {boolean}
 */
export const writeStoredReports = (reports, storage, userId) => {
  try {
    const s = storage ?? globalThis.localStorage;
    const userKey = getReportHistoryStorageKey(userId);
    const safeReports = Array.isArray(reports) ? reports : [];
    s?.setItem(userKey, JSON.stringify(safeReports));
    return true;
  } catch {
    return false;
  }
};

/**
 * Creates a structured snapshot of a monthly report suitable for persistent history.
 *
 * @param {object} monthlyReport
 * @param {string} [customTitle]
 * @returns {object|null}
 */
export const createReportSnapshot = (monthlyReport, customTitle = '') => {
  if (!monthlyReport || !monthlyReport.monthKey) return null;
  const monthKey = monthlyReport.monthKey;
  const id = `report_${monthKey}_${Date.now()}`;
  const label = formatMonthLabel(monthKey);
  const categories = Array.isArray(monthlyReport.categories) ? monthlyReport.categories : [];
  const topCategory = categories[0]?.category || 'General';

  return {
    id,
    monthKey,
    title: customTitle || `${label} Financial Report`,
    savedAt: new Date().toISOString(),
    totalIncome: Number(monthlyReport.totalIncome) || 0,
    totalExpense: Number(monthlyReport.totalExpense) || 0,
    netCashFlow: Number(monthlyReport.netCashFlow) || 0,
    transactionCount: Number(monthlyReport.transactionCount) || 0,
    averageExpense: Number(monthlyReport.averageExpense) || 0,
    categories,
    topCategory,
    transactions: Array.isArray(monthlyReport.transactions) ? monthlyReport.transactions.slice(0, 50) : [],
    note: 'Saved on this device only',
  };
};

/**
 * Adds a report snapshot to the user's history and writes to localStorage.
 *
 * @param {object} snapshot
 * @param {Array<object>} currentHistory
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {Array<object>} Updated report history array
 */
export const saveReportToHistory = (snapshot, currentHistory = [], storage, userId) => {
  if (!snapshot || !snapshot.id) return currentHistory;
  const filtered = currentHistory.filter((item) => item.id !== snapshot.id);
  const updated = [snapshot, ...filtered].slice(0, 50);
  writeStoredReports(updated, storage, userId);
  return updated;
};

/**
 * Deletes a report snapshot by ID from history and writes to localStorage.
 *
 * @param {string} reportId
 * @param {Array<object>} currentHistory
 * @param {Storage} [storage]
 * @param {string|number|null} [userId]
 * @returns {Array<object>} Updated report history array
 */
export const deleteReportFromHistory = (reportId, currentHistory = [], storage, userId) => {
  const updated = currentHistory.filter((item) => item.id !== reportId);
  writeStoredReports(updated, storage, userId);
  return updated;
};
