import { supportedCurrencies } from './currencies';

export { supportedCurrencies };

export const testStandardUser = {
  id: "user-001",
  name: "User Account",
  email: "user@upiq.ai",
  accountType: "UPIQ Pro AI",
  role: "user",
  currency: "INR",
  memberSince: "2026",
  unreadAlertsCount: 0,
};

export const testAdminUser = {
  id: "admin-001",
  name: "System Administrator",
  email: "admin@upiq.ai",
  accountType: "UPIQ Super Admin",
  role: "admin",
  currency: "INR",
  memberSince: "2026",
  unreadAlertsCount: 0,
};

export const userProfile = testStandardUser;

export const kpiSummary = {
  totalBalance: 0,
  balanceChange: "0%",
  monthlyIncome: 0,
  incomeChange: "0%",
  monthlyExpense: 0,
  expenseChange: "0%",
  projectedSavings: 0,
  savingsChange: "0%",
};

export const categoryBreakdown = [];
export const incomeExpenseTrends = [];
export const mockTransactions = [];
export const fraudAlerts = [];
export const budgetForecasts = [];
export const investmentSuggestions = [];
export const monthlyReports = [];

export const adminMetrics = {
  activeUsers: 0,
  totalTransactionsProcessed: 0,
  systemUptime: "100%",
  securityThreatsBlocked: 0,
  systemLoad: "0%",
  mlAccuracy: "99.8%",
};
