import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getInitialAuthState } from '../utils/authUtils';
import { activateDemoSession, applySessionExpiration, authenticateWithBackend, clearAuthSession } from '../utils/authFlow.js';
import { AuthService } from '../services/auth.service';
import { TransactionService } from '../services/transaction.service';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { formatInrAmount, mapCategorySpending, mapDashboardSummary, toFinancialNumber } from '../utils/financialDisplay';
import { deleteAllAndRefresh, persistTransactionChange } from '../utils/transactionOperations';
import { mapAuthenticatedProfile } from '../utils/authProfile.js';
import { navigateToRegistration } from '../utils/registrationFlow.js';
import {
  userProfile as initialProfile,
  testStandardUser,
  testAdminUser,
  kpiSummary as initialKpi,
  categoryBreakdown as initialCategories,
  incomeExpenseTrends as initialTrends,
  mockTransactions as initialTransactions,
  fraudAlerts as initialFraudAlerts,
  budgetForecasts as initialBudgets,
  investmentSuggestions as initialInvestments,
  monthlyReports as initialReports,
  adminMetrics as initialAdminMetrics,
  supportedCurrencies,
} from '../data/initialState';

const FinancialContext = createContext();



export const FinancialProvider = ({ children }) => {
  // Helper to safely load initial state from localStorage or fallback
  const getInitialState = (key, fallback) => {
    try {
      const saved = localStorage.getItem(`upiq_${key}`);
      if (saved) {
        // Clear legacy cached demo profiles if they contain old mock name
        if (key === 'profile' && saved.toLowerCase().includes('varsha')) {
          localStorage.removeItem('upiq_profile');
          return fallback;
        }
        return JSON.parse(saved);
      }
      return fallback;
    } catch {
      return fallback;
    }
  };

  const [isAuthenticated, setIsAuthenticated] = useState(getInitialAuthState);
  const [profile, setProfile] = useState(() => getInitialState('profile', initialProfile));
  const [selectedCurrencyCode, setSelectedCurrencyCode] = useState(() => {
    return 'INR';
  });

  const [kpi, setKpi] = useState(initialKpi);
  const [categories, setCategories] = useState(initialCategories);
  const [trends, setTrends] = useState(initialTrends);
  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState('');
  const [hasTransactionData, setHasTransactionData] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts);

  // Local storage persisted budget forecast state
  const [budgets, setBudgets] = useState(() => {
    const savedBudgets = getInitialState('budgetForecasts', initialBudgets);
    return Array.isArray(savedBudgets) ? savedBudgets : initialBudgets;
  });
  const [investments, setInvestments] = useState(initialInvestments);
  const [reports, setReports] = useState(initialReports);
  const [adminMetrics, setAdminMetrics] = useState(initialAdminMetrics);
  const [loading, setLoading] = useState(false);

  // View routing states: 'home' | 'login' | 'app'
  const [currentView, setCurrentView] = useState(() => {
    const isAuth = getInitialAuthState();
    return isAuth ? 'app' : 'home';
  });
  const [postLoginRedirect, setPostLoginRedirect] = useState('dashboard');

  // UI interaction states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFraudDrawerOpen, setIsFraudDrawerOpen] = useState(false);
  const [aiPromptQuery, setAiPromptQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  const handlingExpiryRef = useRef(false);
  const profileHydrationStartedRef = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || localStorage.getItem('upiq_demo') === 'true' || profileHydrationStartedRef.current) return;
    profileHydrationStartedRef.current = true;
    AuthService.getMe().then((response) => {
      const account = response?.data;
      if (!response?.success || !account) return;
      setProfile((previous) => {
        const authenticatedProfile = mapAuthenticatedProfile(account, previous);
        try { localStorage.setItem('upiq_profile', JSON.stringify(authenticatedProfile)); } catch {}
        return authenticatedProfile;
      });
    }).catch(() => {
      // A restored session remains available if profile lookup is temporarily offline.
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const handleSessionExpired = () => {
      profileHydrationStartedRef.current = false;
      applySessionExpiration({
        storage: localStorage,
        handledRef: handlingExpiryRef,
        setIsAuthenticated,
        setCurrentView,
        setProfile,
        initialProfile,
        addToast,
      });
    };
    if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
      window.addEventListener('upiq:session-expired', handleSessionExpired);
      return () => window.removeEventListener('upiq:session-expired', handleSessionExpired);
    }
  }, []);

  // Toast helper
  const addToast = (title, message, type = 'info') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, title, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Mapper helper: convert backend transaction response DTO to frontend format
  const mapBackendTxToFrontend = useCallback((tx) => {
    return {
      id: tx.id || `tx-${Date.now()}`,
      title: tx.description || tx.category || 'Transaction',
      amount: toFinancialNumber(tx.amount),
      type: tx.type || 'expense',
      category: tx.category || 'Uncategorized',
      mode: tx.paymentMethod || 'UPI',
      date: tx.date || new Date().toISOString(),
      status: 'Completed',
      merchant: tx.description || tx.category || 'Local',
      raw: tx,
    };
  }, []);

  // Fetch real transaction ledger from backend
  const refreshTransactions = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      setTransactionsError('');
      return;
    }
    try {
      setTransactionsError('');
      setLoading(true);
      const res = await TransactionService.getAll();
      const rawList = res?.data || res;
      if (Array.isArray(rawList)) {
        const mapped = rawList.map(mapBackendTxToFrontend);
        setTransactions(mapped);
      }
    } catch (err) {
      setTransactionsError('Transactions could not be loaded. Check your connection and retry.');
      console.error('Failed to load backend transactions:', err);
    } finally {
      setLoading(false);
    }
  }, [mapBackendTxToFrontend]);

  // Fetch real financial dashboard calculation summary from backend
  const refreshDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await FinancialDashboardService.getDashboardSummary();
      const dashData = res?.data || res;
      if (dashData) {
        setHasTransactionData(dashData.hasTransactionData ?? false);
        if (dashData.currentMonthSummary) {
          setKpi((previous) => ({ ...previous, ...mapDashboardSummary(dashData.currentMonthSummary) }));
        }
        if (Array.isArray(dashData.categorySpending)) {
          const mappedCats = mapCategorySpending(dashData.categorySpending, getCategoryColor);
          setCategories(mappedCats);
        }
      }
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
    }
  }, []);

  // Sync state from backend when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      refreshTransactions();
      refreshDashboard();
    } else {
      setTransactions(initialTransactions);
      setTransactionsError('');
      setKpi(initialKpi);
      setCategories(initialCategories);
    }
  }, [isAuthenticated, refreshTransactions, refreshDashboard]);

  // Helper to color category chips dynamically
  function getCategoryColor(name) {
    const lower = (name || '').toLowerCase();
    if (lower.includes('food')) return '#F59E0B';
    if (lower.includes('shop')) return '#EC4899';
    if (lower.includes('trans') || lower.includes('fuel')) return '#3B82F6';
    if (lower.includes('bill') || lower.includes('util')) return '#10B981';
    if (lower.includes('enter')) return '#8B5CF6';
    if (lower.includes('sal')) return '#10B981';
    return '#6B7280';
  }

  // Ensure non-admin users cannot remain on admin tab
  useEffect(() => {
    if (activeTab === 'admin' && profile?.role !== 'admin') {
      setActiveTab('dashboard');
    }
  }, [profile, activeTab]);

  const changeActiveTab = (tab) => {
    if (tab === 'admin' && profile?.role !== 'admin') {
      addToast('Access Restricted', 'Admin View is restricted to Administrator accounts', 'warning');
      setActiveTab('dashboard');
      return;
    }
    setActiveTab(tab);
    setCurrentView('app');
  };

  // View Navigation Helpers
  const navigateToHome = () => setCurrentView('home');
  const navigateToLogin = (targetTab = 'dashboard') => {
    setPostLoginRedirect(targetTab);
    setCurrentView('login');
  };
  const navigateToRegister = () => navigateToRegistration(setCurrentView);
  const navigateToApp = (tab) => {
    if (tab) setActiveTab(tab);
    setCurrentView('app');
  };

  const handleNeedHelpClick = () => {
    if (isAuthenticated) {
      setActiveTab('ai-assistant');
      setCurrentView('app');
    } else {
      setPostLoginRedirect('ai-assistant');
      setCurrentView('login');
      addToast('Sign In Required', 'Please sign in to launch the AI Financial Assistant session', 'info');
    }
  };

  // Sync state to localStorage whenever changed
  const updateCurrency = (code) => {
    setSelectedCurrencyCode(code);
    setProfile((prev) => {
      const updated = { ...prev, currency: code };
      try { localStorage.setItem('upiq_profile', JSON.stringify(updated)); } catch {}
      return updated;
    });
    try { localStorage.setItem('upiq_currency', JSON.stringify(code)); } catch {}
  };

  // Active currency object
  const currentCurrency =
    supportedCurrencies.find((c) => c.code === selectedCurrencyCode) || supportedCurrencies[1] || supportedCurrencies[0];

  // Global Currency Formatting Helper
  const formatCurrency = (amount, decimals = 2) => formatInrAmount(amount, decimals);

  // Predict Category helper
  const predictCategory = (title) => {
    const lower = (title || '').toLowerCase();
    if (lower.includes('uber') || lower.includes('fuel') || lower.includes('shell') || lower.includes('metro') || lower.includes('cab')) {
      return 'Transport & Fuel';
    }
    if (lower.includes('food') || lower.includes('coffee') || lower.includes('starbucks') || lower.includes('restaurant') || lower.includes('dine') || lower.includes('swiggy') || lower.includes('zomato')) {
      return 'Food & Dining';
    }
    if (lower.includes('amazon') || lower.includes('store') || lower.includes('buy') || lower.includes('shop') || lower.includes('apparel')) {
      return 'Shopping';
    }
    if (lower.includes('power') || lower.includes('electric') || lower.includes('water') || lower.includes('internet') || lower.includes('bill')) {
      return 'Bills & Utilities';
    }
    if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('cinema') || lower.includes('movie')) {
      return 'Entertainment';
    }
    if (lower.includes('salary') || lower.includes('payout') || lower.includes('payroll')) {
      return 'Salary';
    }
    return 'Food & Dining';
  };

  // Auth operations
  const login = async (email, password, currencyCode, userName, role, isDemo = false) => {
    const isAdmin = isDemo && ((email && email.toLowerCase().includes('admin')) || role === 'admin');
    const basePreset = isAdmin ? testAdminUser : testStandardUser;
    const targetCurrency = currencyCode || selectedCurrencyCode || basePreset.currency || 'INR';
    setSelectedCurrencyCode(targetCurrency);

    const derivedName = isDemo && userName && userName.trim()
      ? userName
      : isDemo && email && email.includes('@')
      ? email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1)
      : 'User Account';

    const updatedProfile = {
      ...basePreset,
      email: email || basePreset.email,
      name: derivedName,
      currency: targetCurrency,
      role: isAdmin ? 'admin' : 'user',
      accountType: isAdmin ? 'Demo Administrator' : 'Personal Account',
    };

    // Explicit Demo Flow
    if (isDemo) {
      const result = activateDemoSession({
        storage: localStorage,
        profile: updatedProfile,
        currency: targetCurrency,
      });
      if (!result.success) return result;

      handlingExpiryRef.current = false;
      profileHydrationStartedRef.current = true;
      setProfile(updatedProfile);
      setIsAuthenticated(true);
      const destinationTab = postLoginRedirect || (isAdmin ? 'admin' : 'dashboard');
      setActiveTab(destinationTab);
      setCurrentView('app');
      setPostLoginRedirect('dashboard');

      addToast('Demo Mode Activated', `Exploring as ${updatedProfile.name}`, 'info');
      return result;
    }

    // Backend-Authenticated Flow
    const result = await authenticateWithBackend({
      authService: AuthService,
      email,
      password,
      profile: updatedProfile,
      currency: targetCurrency,
      storage: localStorage,
    });
    if (!result.success) return result;

    let authenticatedProfile = { ...updatedProfile, role: 'user' };
    try {
      const response = await AuthService.getMe();
      profileHydrationStartedRef.current = true;
      const account = response?.data;
      if (response?.success && account) {
        authenticatedProfile = mapAuthenticatedProfile(account, authenticatedProfile);
      }
    } catch {
      // Login remains valid if profile lookup is unavailable; never infer admin from email.
    }
    try { localStorage.setItem('upiq_profile', JSON.stringify(authenticatedProfile)); } catch {}

    handlingExpiryRef.current = false;
    setProfile(authenticatedProfile);
    setIsAuthenticated(true);
    const destinationTab = postLoginRedirect || (authenticatedProfile.role === 'admin' ? 'admin' : 'dashboard');
    setActiveTab(destinationTab);
    setCurrentView('app');
    setPostLoginRedirect('dashboard');

    addToast('Welcome to UPIQ AI', `Logged in as ${authenticatedProfile.name}`, 'success');
    return result;
  };

  const loginWithGoogle = async () => {
    addToast('Google Sign-In Unavailable', 'Google OAuth is not implemented on the backend.', 'warning');
  };

  const logout = () => {
    handlingExpiryRef.current = true;
    profileHydrationStartedRef.current = false;
    setIsAuthenticated(false);
    setActiveTab('dashboard');
    setCurrentView('home');
    clearAuthSession(localStorage, { clearProfile: true });
    setProfile(initialProfile);
    addToast('Logged Out', 'You have been signed out of UPIQ AI session', 'info');
  };

  const updateProfile = (updatedFields) => {
    setProfile((prev) => {
      const newProf = { ...prev, ...updatedFields };
      if (updatedFields.currency) {
        setSelectedCurrencyCode(updatedFields.currency);
        try { localStorage.setItem('upiq_currency', JSON.stringify(updatedFields.currency)); } catch {}
      }
      try { localStorage.setItem('upiq_profile', JSON.stringify(newProf)); } catch {}
      return newProf;
    });
    addToast('Profile Saved', 'Personal information updated successfully', 'success');
  };

  // Transaction Operations (Connected to Backend)
  const addTransaction = async (newTx) => {
    const category = newTx.category || predictCategory(newTx.title);
    const amt = parseFloat(newTx.amount);
    const txPayload = {
      amount: amt,
      type: newTx.type || 'expense',
      category: category,
      description: newTx.title || newTx.merchant || 'Transaction',
      paymentMethod: newTx.mode || 'UPI',
      date: newTx.date || new Date().toISOString(),
    };

    const token = localStorage.getItem('token');
    let createdTx = null;

    if (token) {
      try {
        const res = await persistTransactionChange({
          request: () => TransactionService.create(txPayload),
          refreshDashboard,
          requireData: true,
        });
        createdTx = mapBackendTxToFrontend(res.data);
      } catch (err) {
        console.error('Failed to create transaction on backend:', err);
        addToast('Transaction Not Saved', 'The server could not save this transaction. Please retry.', 'danger');
        return false;
      }
    }

    if (!createdTx) {
      createdTx = {
        id: `tx-${Date.now()}`,
        title: txPayload.description,
        amount: amt,
        type: txPayload.type,
        category: category,
        mode: txPayload.paymentMethod,
        date: txPayload.date,
        status: 'Completed',
        merchant: txPayload.description,
      };
    }

    setTransactions((prev) => [createdTx, ...prev]);
    if (!token) refreshDashboard();
    addToast('Transaction Added', `Recorded "${createdTx.title}" (${formatCurrency(createdTx.amount)})`, 'success');
    return true;
  };

  const updateTransaction = async (id, updatedFields) => {
    const token = localStorage.getItem('token');
    if (token && id && !id.toString().startsWith('tx-')) {
      try {
        const txPayload = {
          amount: parseFloat(updatedFields.amount || 0),
          type: updatedFields.type || 'expense',
          category: updatedFields.category || 'Uncategorized',
          description: updatedFields.title || updatedFields.merchant || 'Updated Transaction',
          paymentMethod: updatedFields.mode || 'UPI',
          date: updatedFields.date || new Date().toISOString(),
        };
        await persistTransactionChange({
          request: () => TransactionService.update(id, txPayload),
          refreshTransactions,
          refreshDashboard,
        });
      } catch (err) {
        console.error('Failed to update transaction:', err);
        addToast('Transaction Not Updated', 'The server could not save these changes. Please retry.', 'danger');
        return false;
      }
    } else {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
    }
    addToast('Transaction Updated', 'Changes saved successfully', 'info');
    return true;
  };

  const deleteTransaction = async (id) => {
    const token = localStorage.getItem('token');
    if (token && id && !id.toString().startsWith('tx-')) {
      try {
        await persistTransactionChange({
          request: () => TransactionService.delete(id),
          refreshTransactions,
          refreshDashboard,
        });
      } catch (err) {
        console.error('Failed to delete transaction on backend:', err);
        addToast('Transaction Not Deleted', 'The server could not delete this transaction. Please retry.', 'danger');
        return false;
      }
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    addToast('Transaction Deleted', 'Transaction removed from ledger', 'warning');
    return true;
  };

  const deleteAllTransactions = async () => {
    const token = localStorage.getItem('token');
    const hadTransactions = transactions.length > 0;
    if (token) {
      await deleteAllAndRefresh({
        deleteAll: () => TransactionService.deleteAll(),
        refreshTransactions,
        refreshDashboard,
      });
    }
    setTransactions([]);
    setKpi(initialKpi);
    setCategories([]);
    setHasTransactionData(false);
    addToast(
      hadTransactions ? 'Transactions Deleted' : 'No Transactions to Delete',
      hadTransactions
        ? 'Your ledger and transaction-derived dashboard totals have been refreshed. Budgets and account data remain.'
        : 'Your transaction list was already empty. No account or budget data was changed.',
      hadTransactions ? 'warning' : 'info',
    );
  };

  // Fraud Alert Operations (Coming Soon)
  const resolveFraudAlert = (id, action) => {
    setFraudAlerts((prev) => prev.filter((a) => a.id !== id));
    setProfile((prev) => ({ ...prev, unreadAlertsCount: Math.max(0, prev.unreadAlertsCount - 1) }));
    if (action === 'flagged') {
      addToast('Fraud Flagged', 'Anomaly recorded and submitted to security log', 'danger');
    } else {
      addToast('Alert Dismissed', 'Transaction verified by user', 'success');
    }
  };

  const triggerAiQuery = (query) => {
    setAiPromptQuery(query);
    setActiveTab('ai-assistant');
    setCurrentView('app');
  };

  return (
    <FinancialContext.Provider
      value={{
        isAuthenticated,
        login,
        loginWithGoogle,
        logout,
        profile,
        updateProfile,
        supportedCurrencies,
        selectedCurrencyCode,
        setSelectedCurrencyCode: updateCurrency,
        updateCurrency,
        currentCurrency,
        formatCurrency,
        kpi,
        categories,
        trends,
        transactions,
        transactionsError,
        hasTransactionData,
        fraudAlerts,
        budgets,
        setBudgets,
        investments,
        reports,
        adminMetrics,
        activeTab,
        setActiveTab: changeActiveTab,
        currentView,
        setCurrentView,
        navigateToHome,
        navigateToLogin,
        navigateToRegister,
        navigateToApp,
        handleNeedHelpClick,
        postLoginRedirect,
        isFraudDrawerOpen,
        setIsFraudDrawerOpen,
        aiPromptQuery,
        setAiPromptQuery,
        triggerAiQuery,
        toasts,
        addToast,
        removeToast,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteAllTransactions,
        refreshTransactions,
        refreshDashboard,
        resolveFraudAlert,
        predictCategory,
        loading,
      }}
    >
      {children}
    </FinancialContext.Provider>
  );
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancial must be used within FinancialProvider');
  return context;
};

