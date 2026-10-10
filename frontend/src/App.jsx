import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { FinancialProvider, useFinancial } from './context/FinancialContext';
import { MainLayout } from './components/layout/MainLayout';
import { Home } from './pages/Home';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Transactions } from './pages/Transactions';
import { AIAssistant } from './pages/AIAssistant';
import { Insights } from './pages/Insights';
import { Reports } from './pages/Reports';
import { Admin } from './pages/Admin';
import { Profile } from './pages/Profile';

const AppContent = () => {
  const { isAuthenticated, activeTab, currentView, profile } = useFinancial();

  const renderPage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'transactions':
        return <Transactions />;
      case 'ai-assistant':
        return <AIAssistant />;
      case 'insights':
      case 'security':
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
    if (currentView === 'home') {
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

    if (currentView === 'login' || !isAuthenticated) {
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
        <MainLayout>{renderPage()}</MainLayout>
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
      <FinancialProvider>
        <AppContent />
      </FinancialProvider>
    </ThemeProvider>
  );
}
