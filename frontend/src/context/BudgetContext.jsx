import { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  readStoredBudgets,
  writeStoredBudgets,
  exportBudgetsToJson,
  parseImportedBudgetsJson,
} from '../utils/budgetStorage.js';
import { FinancialContext } from './FinancialContext.jsx';

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  const financial = useContext(FinancialContext);
  const userId = financial?.isAuthenticated
    ? (financial.profile?.id || financial.profile?.email || 'authenticated')
    : null;

  // Budgets stored in localStorage partitioned per user (frontend-only)
  const [budgets, setBudgets] = useState(() => readStoredBudgets(undefined, userId));
  const activeUserRef = useRef(userId);

  // Reload budgets whenever active user changes (login, logout, or user switch)
  useEffect(() => {
    activeUserRef.current = userId;
    setBudgets(readStoredBudgets(undefined, userId));
  }, [userId]);

  // Save to localStorage whenever budgets change for current user
  useEffect(() => {
    if (activeUserRef.current === userId) {
      writeStoredBudgets(budgets, undefined, userId);
    }
  }, [budgets, userId]);

  const setBudget = (categoryName, amount) => {
    setBudgets(prev => ({
      ...prev,
      [categoryName]: amount
    }));
  };

  const getBudget = (categoryName) => {
    return budgets[categoryName] || null;
  };

  const deleteBudget = (categoryName) => {
    setBudgets(prev => {
      const updated = { ...prev };
      delete updated[categoryName];
      return updated;
    });
  };

  const getAllBudgets = () => {
    return budgets;
  };

  const exportBudgets = () => {
    return exportBudgetsToJson(budgets, userId);
  };

  const downloadBudgetsFile = () => {
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
  };

  const importBudgets = (jsonString) => {
    const imported = parseImportedBudgetsJson(jsonString);
    setBudgets(imported);
    writeStoredBudgets(imported, undefined, userId);
    return imported;
  };

  const value = {
    budgets,
    setBudget,
    getBudget,
    deleteBudget,
    getAllBudgets,
    exportBudgets,
    downloadBudgetsFile,
    importBudgets,
    storageNote: 'Budgets are saved on this device only',
    userId,
  };

  return (
    <BudgetContext.Provider value={value}>
      {children}
    </BudgetContext.Provider>
  );
};

export const useBudget = () => {
  const context = useContext(BudgetContext);
  if (!context) {
    throw new Error('useBudget must be used within BudgetProvider');
  }
  return context;
};

