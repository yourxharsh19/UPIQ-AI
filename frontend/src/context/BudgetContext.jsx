import { createContext, useContext, useState, useEffect } from 'react';
import { readStoredBudgets, writeStoredBudgets } from '../utils/budgetStorage.js';

const BudgetContext = createContext(null);

export const BudgetProvider = ({ children }) => {
  // Budgets stored in localStorage (frontend-only)
  const [budgets, setBudgets] = useState(readStoredBudgets);

  // Save to localStorage whenever budgets change
  useEffect(() => {
    writeStoredBudgets(budgets);
  }, [budgets]);

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

  const value = {
    budgets,
    setBudget,
    getBudget,
    deleteBudget,
    getAllBudgets
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

