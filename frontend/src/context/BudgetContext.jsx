import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  readStoredBudgets,
  writeStoredBudgets,
  exportBudgetsToJson,
  parseImportedBudgetsJson,
} from '../utils/budgetStorage.js';
import { budgetMonth, budgetPayload, budgetsByCategory, normalizeBudgetRows } from '../utils/budgetApi.js';
import { parseMoneyMinorUnits, moneyFromMinorUnits } from '../utils/money.js';
import { BudgetService } from '../services/budget.service.js';
import { FinancialContext } from './FinancialContext.jsx';
import { getAuthSessionMode } from '../utils/authFlow.js';

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const financial = useContext(FinancialContext);
  const sessionMode = getAuthSessionMode();
  const userId = sessionMode === 'authenticated'
    ? (financial?.profile?.id || financial?.profile?.email || 'authenticated')
    : null;
  const sessionKey = `${sessionMode}:${userId || 'guest'}`;
  const month = budgetMonth();
  const [localBudgets, setLocalBudgets] = useState(() =>
    sessionMode === 'authenticated' || sessionMode === 'inconsistent' ? {} : readStoredBudgets(undefined, userId));
  const [budgetRecords, setBudgetRecords] = useState([]);
  const [loading, setLoading] = useState(sessionMode === 'authenticated');
  const [error, setError] = useState('');
  const activeSessionRef = useRef(sessionKey);

  const loadBudgets = useCallback(async () => {
    const requestSession = sessionKey;
    activeSessionRef.current = requestSession;
    if (sessionMode !== 'authenticated') {
      setBudgetRecords([]);
      setError(sessionMode === 'inconsistent' ? 'Resolve your session before managing account budgets.' : '');
      setLoading(false);
      return [];
    }
    setLoading(true);
    setError('');
    try {
      const response = await BudgetService.getBudgets(month);
      if (!response?.success || !Array.isArray(response.data)) throw new Error('Invalid budget response');
      const normalized = normalizeBudgetRows(response.data);
      if (activeSessionRef.current === requestSession) setBudgetRecords(normalized);
      return normalized;
    } catch {
      if (activeSessionRef.current === requestSession) {
        setBudgetRecords([]);
        setError('Account budgets could not be loaded. Please retry.');
      }
      throw new Error('Account budgets could not be loaded.');
    } finally {
      if (activeSessionRef.current === requestSession) setLoading(false);
    }
  }, [month, sessionKey, sessionMode]);

  useEffect(() => {
    activeSessionRef.current = sessionKey;
    if (sessionMode === 'authenticated') {
      setBudgetRecords([]);
      loadBudgets().catch(() => {});
      return;
    }
    setBudgetRecords([]);
    setLocalBudgets(sessionMode === 'inconsistent' ? {} : readStoredBudgets(undefined, userId));
    setLoading(false);
    setError(sessionMode === 'inconsistent' ? 'Resolve your session before managing account budgets.' : '');
  }, [loadBudgets, sessionKey, sessionMode, userId]);

  useEffect(() => {
    if (sessionMode !== 'authenticated' && sessionMode !== 'inconsistent') {
      writeStoredBudgets(localBudgets, undefined, userId);
    }
  }, [localBudgets, sessionMode, userId]);

  const budgets = useMemo(() => sessionMode === 'authenticated'
    ? budgetsByCategory(budgetRecords)
    : localBudgets, [budgetRecords, localBudgets, sessionMode]);

  const getBudget = useCallback((categoryName) => {
    if (!categoryName) return null;
    if (sessionMode === 'authenticated') {
      const row = budgetRecords.find((item) => item.category?.toLowerCase() === String(categoryName).trim().toLowerCase());
      return row?.amount || null;
    }
    return budgets[categoryName] || null;
  }, [budgetRecords, budgets, sessionMode]);

  const refreshBudgets = useCallback(async () => loadBudgets(), [loadBudgets]);

  const setBudget = useCallback(async (categoryName, amount) => {
    const minor = parseMoneyMinorUnits(amount);
    if (!categoryName?.trim() || minor == null || minor <= 0n) throw new Error('Enter a positive budget with at most two decimal places.');
    const normalizedAmount = moneyFromMinorUnits(minor);
    if (sessionMode === 'authenticated') {
      const row = budgetRecords.find((item) => item.category?.toLowerCase() === categoryName.trim().toLowerCase());
      const payload = budgetPayload(categoryName, normalizedAmount, month);
      if (row) await BudgetService.update(row.id, payload);
      else await BudgetService.create(payload);
      await refreshBudgets();
      return normalizedAmount;
    }
    if (sessionMode === 'inconsistent') throw new Error('Resolve your session before managing account budgets.');
    setLocalBudgets((previous) => ({ ...previous, [categoryName.trim()]: normalizedAmount }));
    return normalizedAmount;
  }, [budgetRecords, month, refreshBudgets, sessionMode]);

  const deleteBudget = useCallback(async (categoryName) => {
    if (sessionMode === 'authenticated') {
      const row = budgetRecords.find((item) => item.category?.toLowerCase() === String(categoryName).trim().toLowerCase());
      if (!row) return;
      await BudgetService.delete(row.id);
      await refreshBudgets();
      return;
    }
    if (sessionMode === 'inconsistent') throw new Error('Resolve your session before managing account budgets.');
    setLocalBudgets((previous) => {
      const updated = { ...previous };
      delete updated[categoryName];
      return updated;
    });
  }, [budgetRecords, refreshBudgets, sessionMode]);

  const getAllBudgets = useCallback(() => budgets, [budgets]);
  const totalBudgetRecord = useMemo(() => budgetRecords.find((record) => record.category == null) || null, [budgetRecords]);
  const getTotalBudget = useCallback(() => totalBudgetRecord?.amount || null, [totalBudgetRecord]);

  const setTotalBudget = useCallback(async (amount) => {
    const minor = parseMoneyMinorUnits(amount);
    if (minor == null || minor <= 0n) throw new Error('Enter a positive total budget with at most two decimal places.');
    if (sessionMode !== 'authenticated') throw new Error('A total account budget requires a backend-authenticated session.');
    const payload = budgetPayload(null, moneyFromMinorUnits(minor), month);
    if (totalBudgetRecord) await BudgetService.update(totalBudgetRecord.id, payload);
    else await BudgetService.create(payload);
    await refreshBudgets();
    return moneyFromMinorUnits(minor);
  }, [month, refreshBudgets, sessionMode, totalBudgetRecord]);

  const deleteTotalBudget = useCallback(async () => {
    if (sessionMode !== 'authenticated') throw new Error('A total account budget requires a backend-authenticated session.');
    if (!totalBudgetRecord) return;
    await BudgetService.delete(totalBudgetRecord.id);
    await refreshBudgets();
  }, [refreshBudgets, sessionMode, totalBudgetRecord]);

  const exportBudgets = useCallback(() => exportBudgetsToJson(budgets, userId), [budgets, userId]);

  const downloadBudgetsFile = useCallback(() => {
    const jsonString = exportBudgetsToJson(budgets, userId);
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeUserId = userId ? String(userId).replace(/[^a-zA-Z0-9_-]/g, '_') : 'guest';
      link.download = `upiq-budgets-${safeUserId}-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return jsonString;
  }, [budgets, userId]);

  const importBudgets = useCallback(async (jsonString) => {
    const imported = parseImportedBudgetsJson(jsonString);
    if (sessionMode === 'authenticated') {
      for (const [category, amount] of Object.entries(imported)) await setBudget(category, amount);
      return imported;
    }
    if (sessionMode === 'inconsistent') throw new Error('Resolve your session before importing budgets.');
    setLocalBudgets(imported);
    writeStoredBudgets(imported, undefined, userId);
    return imported;
  }, [sessionMode, setBudget, userId]);

  const value = {
    budgets,
    budgetRecords,
    budgetMonth: month,
    loading,
    error,
    sessionMode,
    isBackendMode: sessionMode === 'authenticated',
    setBudget,
    getBudget,
    deleteBudget,
    getTotalBudget,
    setTotalBudget,
    deleteTotalBudget,
    totalBudgetRecord,
    getAllBudgets,
    refreshBudgets,
    exportBudgets,
    downloadBudgetsFile,
    importBudgets,
    storageNote: sessionMode === 'authenticated' ? 'Budgets are saved to your account.' : 'Demo budgets are saved on this device only.',
    userId,
  };

  return <BudgetContext.Provider value={value}>{children}</BudgetContext.Provider>;
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) throw new Error('useBudget must be used within BudgetProvider');
  return context;
};
