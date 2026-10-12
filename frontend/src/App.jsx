import React, { lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { BudgetProvider } from './context/BudgetContext';
import { MainLayout } from './components/layout/MainLayout';
import { LazyPageErrorBoundary } from './components/common/LazyPageErrorBoundary.js';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import Register from './pages/Register';
import { resolveAppTab } from './utils/appNavigation.js';
import { resolveAuthView } from './utils/registrationFlow.js';

const Dashboard = lazy(() => import('./pages/Dashboard').then((module) => ({ default: module.Dashboard })));
const Transactions = lazy(() => import('./pages/Transactions').then((module) => ({ default: module.Transactions })));
const Categories = lazy(() => import('./pages/Categories'));
const AIAssistant = lazy(() => import('./pages/AIAssistant').then((module) => ({ default: module.AIAssistant })));
const Insights = lazy(() => import('./pages/Insights').then((module) => ({ default: module.Insights })));
const Reports = lazy(() => import('./pages/Reports').then((module) => ({ default: module.Reports })));
const Admin = lazy(() => import('./pages/Admin').then((module) => ({ default: module.Admin })));
const Profile = lazy(() => import('./pages/Profile').then((module) => ({ default: module.Profile })));

const AppContent = () => {
  const { isAuthenticated, activeTab, currentView, profile } = useFinancial();

  const renderPage = () => {
    switch (resolveAppTab(activeTab)) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'categories':
        return <Categories />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'insights':
      case 'insights-tab':
        return <Insights />;
      case 'reports':
        return <Reports />;
      case 'admin':
        return profile?.role === 'admin' ? <Admin /> : <Dashboard />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard />;
    }
  };

  const renderView = () => {
    const authView = resolveAuthView(currentView, isAuthenticated);
    if (authView === 'home') {
      return (
        <motion.div
          key="home-screen-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-screen"
        >
          <Home />
        </motion.div>
      );
    }

    if (authView === 'register') return <Register />;

    if (authView === 'login') {
      return (
        <motion.div
          key="login-screen-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full min-h-screen"
        >
          <Login />
        </motion.div>
      );
    }

    return (
      <motion.div
        key="authenticated-dashboard-view"
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-h-screen"
      >
        <MainLayout>
          <LazyPageErrorBoundary>
            <Suspense fallback={<div className="p-6 text-sm text-[var(--text-muted)]" role="status">Loading view…</div>}>
              {renderPage()}
            </Suspense>
          </LazyPageErrorBoundary>
        </MainLayout>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] transition-colors duration-300 overflow-hidden">
      <AnimatePresence mode="wait">
        {renderView()}
      </AnimatePresence>
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <BudgetProvider>
        <FinancialProvider>
          <AppContent />
        </FinancialProvider>
      </BudgetProvider>
    </ThemeProvider>
  );
}
