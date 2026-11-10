import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { getInitialAuthState } from '../utils/authUtils';
import { activateDemoSession, applySessionExpiration, authenticateWithBackend, clearAuthSession } from '../utils/authFlow.js';
import { AuthService } from '../services/auth.service';
import { TransactionService } from '../services/transaction.service';
import { FinancialDashboardService } from '../services/financial-dashboard.service';
import { formatInrAmount, mapCategorySpending, mapDashboardSummary, toFinancialNumber } from '../utils/financialDisplay';
import { deleteAllAndRefresh, persistTransactionChange } from '../utils/transactionOperations';
import { getMonthlyReport } from '../utils/monthlyReport.js';
import { getTransactionCoverage } from '../utils/transactionCoverage.js';
import { mapAuthenticatedProfile } from '../utils/authProfile.js';
import { navigateToRegistration } from '../utils/registrationFlow.js';
import { readStoredReports, createReportSnapshot, saveReportToHistory, deleteReportFromHistory } from '../utils/reportHistoryStorage.js';
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
  adminMetrics as initialAdminMetrics,
  supportedCurrencies,
} from '../data/initialState';

export const FinancialContext = createContext();

export const DEFAULT_DEMO_TRANSACTIONS = [
  { id: 'tx-demo-1', title: 'Salary Credit - TechCorp', amount: 85000, type: 'income', category: 'Salary', mode: 'Bank Transfer', date: '2026-11-01T10:00:00.000Z', status: 'Completed', merchant: 'TechCorp India' },
  { id: 'tx-demo-2', title: 'Apartment Monthly Rent', amount: 22000, type: 'expense', category: 'Rent', mode: 'UPI', date: '2026-11-02T11:30:00.000Z', status: 'Completed', merchant: 'House Owner' },
  { id: 'tx-demo-3', title: 'Nature Basket Groceries', amount: 4850, type: 'expense', category: 'Groceries', mode: 'UPI', date: '2026-11-04T16:15:00.000Z', status: 'Completed', merchant: 'Nature Basket' },
  { id: 'tx-demo-4', title: 'Swiggy Gourmet Order', amount: 1250, type: 'expense', category: 'Food & Dining', mode: 'UPI', date: '2026-11-06T20:45:00.000Z', status: 'Completed', merchant: 'Swiggy' },
  { id: 'tx-demo-5', title: 'Electricity & Water Bill', amount: 3400, type: 'expense', category: 'Bills & Utilities', mode: 'NetBanking', date: '2026-11-07T09:20:00.000Z', status: 'Completed', merchant: 'State Electricity Board' },
  { id: 'tx-demo-6', title: 'Uber Daily Commute', amount: 980, type: 'expense', category: 'Transport', mode: 'UPI', date: '2026-11-08T18:00:00.000Z', status: 'Completed', merchant: 'Uber India' },
  { id: 'tx-demo-7', title: 'Freelance Design Consulting', amount: 25000, type: 'income', category: 'Salary', mode: 'UPI', date: '2026-11-09T14:30:00.000Z', status: 'Completed', merchant: 'Design Studio' },
  { id: 'tx-demo-8', title: 'Electronics & Accessories', amount: 6200, type: 'expense', category: 'Shopping', mode: 'Credit Card', date: '2026-11-10T15:00:00.000Z', status: 'Completed', merchant: 'Amazon India' },
  { id: 'tx-demo-9', title: 'Salary Credit - TechCorp', amount: 85000, type: 'income', category: 'Salary', mode: 'Bank Transfer', date: '2026-10-01T10:00:00.000Z', status: 'Completed', merchant: 'TechCorp India' },
  { id: 'tx-demo-10', title: 'Apartment Monthly Rent', amount: 22000, type: 'expense', category: 'Rent', mode: 'UPI', date: '2026-10-02T11:30:00.000Z', status: 'Completed', merchant: 'House Owner' },
  { id: 'tx-demo-11', title: 'Supermarket Groceries', amount: 5200, type: 'expense', category: 'Groceries', mode: 'UPI', date: '2026-10-05T17:00:00.000Z', status: 'Completed', merchant: 'Supermarket' },
  { id: 'tx-demo-12', title: 'Dining & Restaurants', amount: 3100, type: 'expense', category: 'Food & Dining', mode: 'UPI', date: '2026-10-12T21:00:00.000Z', status: 'Completed', merchant: 'Zomato' },
];



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
  const [trends] = useState(initialTrends);
  const [transactions, setTransactions] = useState([]);
  const [transactionsError, setTransactionsError] = useState('');
  const [hasTransactionData, setHasTransactionData] = useState(false);
  const [fraudAlerts, setFraudAlerts] = useState(initialFraudAlerts);

  // Local storage persisted budget forecast state
  const [budgets, setBudgets] = useState(() => {
    const savedBudgets = getInitialState('budgetForecasts', initialBudgets);
    return Array.isArray(savedBudgets) ? savedBudgets : initialBudgets;
  });
  const [investments] = useState(initialInvestments);
  const activeUserId = isAuthenticated ? (profile?.id || profile?.email || 'authenticated') : null;
  const [reportHistory, setReportHistory] = useState(() => readStoredReports(undefined, activeUserId));
  const activeUserReportRef = useRef(activeUserId);

  useEffect(() => {
    activeUserReportRef.current = activeUserId;
    setReportHistory(readStoredReports(undefined, activeUserId));
  }, [activeUserId]);

  const [adminMetrics] = useState(initialAdminMetrics);
  const [loading, setLoading] = useState(false);

  // View routing states: 'home' | 'login' | 'app'
  const [currentView, setCurrentView] = useState(() => {
    const isAuth = getInitialAuthState();
    if (typeof window !== 'undefined' && window.location) {
      const path = (window.location.pathname || '').toLowerCase();
      const hash = (window.location.hash || '').toLowerCase();
      if (path === '/register' || hash === '#register') return 'register';
      if (path === '/login' || hash === '#login') return 'login';
      const protectedPaths = ['/dashboard', '/transactions', '/categories', '/ai-assistant', '/insights', '/reports', '/admin', '/profile', '/upload', '/chat'];
      if (!isAuth && protectedPaths.some((p) => path.startsWith(p) || hash.startsWith('#' + p.slice(1)))) {
        return 'login';
      }
    }
    return isAuth ? 'app' : 'home';
  });
  const [postLoginRedirect, setPostLoginRedirect] = useState(() => {
    if (typeof window !== 'undefined' && window.location) {
      const rawPath = (window.location.pathname || '').replace(/^\//, '').toLowerCase();
      const rawHash = (window.location.hash || '').replace(/^#/, '').toLowerCase();
      const candidate = rawPath || rawHash;
      const validTabs = ['dashboard', 'transactions', 'categories', 'ai-assistant', 'insights', 'reports', 'admin', 'profile'];
      if (validTabs.includes(candidate)) return candidate;
    }
    return 'dashboard';
  });

  // UI interaction states
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isFraudDrawerOpen, setIsFraudDrawerOpen] = useState(false);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);
  const [aiPromptQuery, setAiPromptQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  const openStatementModal = useCallback(() => setIsStatementModalOpen(true), []);
  const closeStatementModal = useCallback(() => setIsStatementModalOpen(false), []);

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
    const handleSessionExpired = (event) => {
      profileHydrationStartedRef.current = false;
      applySessionExpiration({
        storage: localStorage,
        handledRef: handlingExpiryRef,
        setIsAuthenticated,
        setCurrentView,
        setProfile,
        initialProfile,
        addToast,
        message: event?.detail?.message,
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

  const saveReportPreview = useCallback((reportData, customTitle) => {
    const snapshot = createReportSnapshot(reportData, customTitle);
    if (!snapshot) return null;
    const updated = saveReportToHistory(snapshot, reportHistory, undefined, activeUserId);
    setReportHistory(updated);
    addToast('Report Saved', `Saved preview for "${snapshot.title}" on this device.`, 'success');
    return snapshot;
  }, [activeUserId, reportHistory]);

  const deleteReportPreview = useCallback((reportId) => {
    const updated = deleteReportFromHistory(reportId, reportHistory, undefined, activeUserId);
    setReportHistory(updated);
    addToast('Report Deleted', 'Report preview removed from this device.', 'info');
  }, [activeUserId, reportHistory]);

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
    const isDemo = typeof localStorage !== 'undefined' && localStorage.getItem('upiq_demo') === 'true';

    if (!token) {
      if (isDemo) {
        const stored = typeof localStorage !== 'undefined' ? localStorage.getItem('upiq_demo_transactions') : null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed) && parsed.length > 0) {
              setTransactions(parsed);
              setTransactionsError('');
              return;
            }
          } catch {}
        }
        setTransactions((prev) => (Array.isArray(prev) && prev.length > 0 ? prev : DEFAULT_DEMO_TRANSACTIONS));
      }
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
      console.warn('Failed to load backend transactions', { status: err.response?.status || null, code: err.code || null });
    } finally {
      setLoading(false);
    }
  }, [mapBackendTxToFrontend]);

  const importClientTransactions = useCallback((rows) => {
    if (!Array.isArray(rows) || rows.length === 0) return 0;
    const mapped = rows.map((r) => mapBackendTxToFrontend({
      id: r.id || `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      description: r.description || r.title || 'Transaction',
      amount: r.amount,
      type: r.type,
      category: r.category || 'Uncategorized',
      paymentMethod: r.paymentMethod || r.mode || 'UPI',
      date: r.date,
    }));
    setTransactions((prev) => {
      const combined = [...mapped, ...prev];
      try {
        localStorage.setItem('upiq_demo_transactions', JSON.stringify(combined));
      } catch {}
      return combined;
    });
    addToast('Statement Imported', `Imported ${mapped.length} transaction${mapped.length === 1 ? '' : 's'} into ledger.`, 'success');
    return mapped.length;
  }, [mapBackendTxToFrontend]);

  const transactionsRef = useRef(transactions);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  // Fetch real financial dashboard calculation summary from backend (or compute in demo mode)
  const refreshDashboard = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      const currentList = transactionsRef.current || [];
      const coverage = getTransactionCoverage(currentList);
      const targetMonth = coverage.defaultMonth;
      if (targetMonth && currentList.length > 0) {
        const report = getMonthlyReport(currentList, targetMonth);
        setHasTransactionData(true);
        setKpi((previous) => ({
          ...previous,
          totalBalance: report.netCashFlow,
          monthlyIncome: report.totalIncome,
          monthlyExpense: report.totalExpense,
          savingsRate: report.totalIncome > 0
            ? Math.round((report.netCashFlow / report.totalIncome) * 10000) / 100
            : 0,
          transactionCount: report.transactionCount,
        }));
      } else {
        setHasTransactionData(false);
        setKpi((previous) => ({ ...previous, ...mapDashboardSummary({}) }));
        setCategories([]);
      }
      return;
    }

    try {
      const res = await FinancialDashboardService.getDashboardSummary();
      const dashData = res?.data || res;
      if (dashData) {
        const hasData = Boolean(dashData.hasTransactionData);
        setHasTransactionData(hasData);
        if (hasData && dashData.currentMonthSummary) {
          const mapped = mapDashboardSummary(dashData.currentMonthSummary);
          let expenseChange = '0%';
          if (dashData.monthlyExpenseComparison?.percentageDifference != null) {
            const diff = Number(dashData.monthlyExpenseComparison.percentageDifference);
            if (Number.isFinite(diff)) {
              expenseChange = `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`;
            }
          }
          setKpi((previous) => ({
            ...previous,
            ...mapped,
            expenseChange,
          }));
        } else {
          setKpi((previous) => ({
            ...previous,
            ...mapDashboardSummary({}),
            expenseChange: '0%',
          }));
        }

        if (hasData && Array.isArray(dashData.categorySpending)) {
          const mappedCats = mapCategorySpending(dashData.categorySpending, getCategoryColor);
          setCategories(mappedCats);
        } else {
          setCategories([]);
        }
      }
    } catch (err) {
      console.warn('Failed to fetch dashboard summary', { status: err.response?.status || null, code: err.code || null });
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
    if (!isAuthenticated) {
      setPostLoginRedirect(tab);
      setCurrentView('login');
      addToast('Sign In Required', 'Please log in to access this page.', 'info');
      return;
    }
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
  const navigateToApp = (tab = 'dashboard') => {
    if (!isAuthenticated) {
      setPostLoginRedirect(tab);
      setCurrentView('login');
      addToast('Sign In Required', 'Please log in to access this page.', 'info');
      return;
    }
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
          refreshTransactions,
          refreshDashboard,
          requireData: true,
        });
        createdTx = mapBackendTxToFrontend(res.data);
      } catch (err) {
        console.warn('Failed to create transaction on backend', { status: err.response?.status || null, code: err.code || null });
        addToast('Transaction Not Saved', 'The server could not save this transaction. Please retry.', 'danger');
        return false;
      }
    } else {
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
      setTransactions((prev) => [createdTx, ...prev]);
      refreshDashboard();
    }

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
        console.warn('Failed to update transaction', { status: err.response?.status || null, code: err.code || null });
        addToast('Transaction Not Updated', 'The server could not save these changes. Please retry.', 'danger');
        return false;
      }
    } else {
      setTransactions((prev) => prev.map((t) => (t.id === id ? { ...t, ...updatedFields } : t)));
      refreshDashboard();
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
        console.warn('Failed to delete transaction on backend', { status: err.response?.status || null, code: err.code || null });
        addToast('Transaction Not Deleted', 'The server could not delete this transaction. Please retry.', 'danger');
        return false;
      }
    } else {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      refreshDashboard();
    }
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
    } else {
      setTransactions([]);
      setKpi(initialKpi);
      setCategories([]);
      setHasTransactionData(false);
    }
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
        reports: reportHistory,
        reportHistory,
        saveReportPreview,
        deleteReportPreview,
        reportStorageNote: 'Saved on this device only',
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
        isStatementModalOpen,
        setIsStatementModalOpen,
        openStatementModal,
        closeStatementModal,
        importClientTransactions,
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

