import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  ShieldCheck,
  Globe,
  ArrowRight,
  Bot,
  Zap,
  LockKeyhole,
  FileText,
  TrendingUp,
  BrainCircuit,
  LogIn,
  Sun,
  Moon,
  ChevronRight,
  Receipt,
  UserCheck,
  ShieldAlert,
  X,
} from 'lucide-react';
import { useFinancial } from '../context/FinancialContext';
import { useTheme } from '../context/ThemeContext';

export const Home = () => {
  const {
    isAuthenticated,
    navigateToLogin,
    navigateToApp,
    handleNeedHelpClick,
  } = useFinancial();

  const { theme, toggleTheme } = useTheme();

  // Active Navbar Modal: null | 'features' | 'security' | 'regional'
  const [activeModal, setActiveModal] = useState(null);

  const featureCards = [
    {
      id: 'categorization',
      icon: Zap,
      textColor: 'text-indigo-400',
      bgColor: 'bg-indigo-500/10 border-indigo-500/20',
      title: 'Smart Transaction Categorization',
      desc: 'Deterministic merchant and description rules categorize transactions as they are added.',
      badge: 'Deterministic rules',
    },
    {
      id: 'forecasting',
      icon: BrainCircuit,
      textColor: 'text-purple-400',
      bgColor: 'bg-purple-500/10 border-purple-500/20',
      title: 'Budget Tracking',
      desc: 'Set category budgets and compare them with recorded spending. Predictive forecasts are not currently available.',
      badge: 'Budget tools',
    },
    {
      id: 'parsing',
      icon: Receipt,
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
      title: 'Bank Statement PDF Import',
      desc: 'Import supported PDF statements into the transaction ledger and review the parsed entries.',
      badge: 'PDF import',
    },
    {
      id: 'reports',
      icon: FileText,
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
      title: 'Monthly Financial Reports',
      desc: 'Review monthly income, expenses, categories, and transaction details; download PDF or CSV reports.',
      badge: 'PDF / CSV',
    },
    {
      id: 'analytics',
      icon: TrendingUp,
      textColor: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
      title: 'Interactive Recharts Analytics',
      desc: 'Visualize dynamic income vs. expense trends, category pie distributions, and savings velocity.',
      badge: 'Interactive Visuals',
    },
    {
      id: 'security-radar',
      icon: ShieldAlert,
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
      title: 'Fraud Monitoring',
      desc: 'Backend-powered fraud monitoring and transaction blocking are not currently available.',
      badge: 'Not connected',
    },
  ];

  const securityPillars = [
    {
      icon: LockKeyhole,
      title: 'JWT Authentication',
      desc: 'The backend issues and validates signed JWTs for authenticated API requests.',
    },
    {
      icon: Bot,
      title: 'Local Ollama Integration',
      desc: 'The Financial Assistant can use a locally configured Ollama service. Availability depends on local setup.',
    },
    {
      icon: ShieldCheck,
      title: 'Transaction Management',
      desc: 'Manage transaction records through the application’s authenticated backend APIs.',
    },
    {
      icon: UserCheck,
      title: 'Role-Aware Admin View',
      desc: 'The frontend limits access to the Admin view by role. Live platform administration APIs are not connected.',
    },
  ];


  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between relative overflow-x-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glowing Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[20%] w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[140px] pointer-events-none" />

      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-2xl bg-slate-950/80 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveModal(null)}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/upiq-logo.jpg"
              alt="UPIQ AI Logo"
              className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40 shadow-lg shadow-indigo-600/30 group-hover:scale-105 transition-transform"
            />
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 bg-clip-text text-transparent">
                UPIQ AI<span className="text-indigo-400">.</span>
              </span>
                <span className="block text-[10px] text-slate-400 font-medium tracking-wide">
                Personal Finance Dashboard
              </span>
            </div>
          </div>

          {/* NAVBAR OPTIONS (Features, Security, Global Currency, Need Help) */}
          <nav className="flex items-center gap-1.5 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
            <button
              onClick={() => setActiveModal('features')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeModal === 'features'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Features
            </button>

            <button
              onClick={() => setActiveModal('security')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeModal === 'security'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              Security
            </button>

            <button
              onClick={() => setActiveModal('currency')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeModal === 'currency'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/50'
              }`}
            >
              INR Formatting
            </button>

            <button
              onClick={handleNeedHelpClick}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md shadow-purple-600/30 hover:opacity-90"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
              <span className="hidden sm:inline">Need Help / AI</span>
              <span className="sm:hidden">AI Help</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-3">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              title="Toggle Color Theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Login / App Launch Button */}
            {isAuthenticated ? (
              <button
                onClick={() => navigateToApp('dashboard')}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={() => navigateToLogin('dashboard')}
                className="px-4.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="relative my-auto py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full text-center space-y-10 z-10 flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-inner">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>UPIQ AI 2.0 — Personal Finance Dashboard</span>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight text-slate-100">
            Personal Finance Tools for{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Your Transaction Ledger
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Record and review transactions, import supported PDF statements, track category budgets, and use the Financial Assistant when its local Ollama service is configured.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => (isAuthenticated ? navigateToApp('dashboard') : navigateToLogin('dashboard'))}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 text-white font-bold text-sm shadow-xl shadow-indigo-600/35 flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <span>{isAuthenticated ? 'Open Financial Dashboard' : 'Sign In / Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleNeedHelpClick}
              className="px-6 py-3.5 rounded-2xl bg-slate-900/90 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-white font-bold text-sm shadow-lg flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-yellow-300" />
              <span>Ask AI Assistant / Need Help</span>
            </motion.button>
          </div>
        </motion.div>

        {/* Feature Counters Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 rounded-3xl glass-panel border border-slate-800/80 max-w-4xl mx-auto text-left">
          <div
            onClick={() => setActiveModal('features')}
            className="space-y-1 p-2 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-2xl font-black text-indigo-400">PDF</p>
            <p className="text-xs font-semibold text-slate-200">Statement Import</p>
            <p className="text-[11px] text-slate-500">Bank statement PDF import &rarr;</p>
          </div>
          <div
            onClick={() => setActiveModal('security')}
            className="space-y-1 p-2 border-l border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-2xl font-black text-emerald-400">JWT</p>
            <p className="text-xs font-semibold text-slate-200">API Authentication</p>
            <p className="text-[11px] text-slate-500">Backend-signed tokens for protected requests &rarr;</p>
          </div>
          <div
            onClick={handleNeedHelpClick}
            className="space-y-1 p-2 border-l border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-2xl font-black text-purple-400">Private AI</p>
            <p className="text-xs font-semibold text-slate-200">Ollama Integration</p>
            <p className="text-[11px] text-slate-500">Available when a local service is configured &rarr;</p>
          </div>
          <div
            onClick={() => setActiveModal('currency')}
            className="space-y-1 p-2 border-l border-slate-800 cursor-pointer hover:opacity-80 transition-opacity"
          >
            <p className="text-2xl font-black text-amber-400">Currency</p>
            <p className="text-xs font-semibold text-slate-200">Display Preference</p>
            <p className="text-[11px] text-slate-500">Financial totals currently display in INR &rarr;</p>
          </div>
        </div>
      </section>

      {/* NAVBAR OPTION MODALS & DRAWERS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-4xl bg-slate-900/95 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-5 right-5 p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* MODAL CONTENT: FEATURES */}
              {activeModal === 'features' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold">
                      <Zap className="w-3.5 h-3.5" /> Features Overview
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-100">Comprehensive Platform Capabilities</h2>
                    <p className="text-xs text-slate-400">Everything built into UPIQ AI for automated personal finance control.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {featureCards.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <div
                          key={feat.id}
                          className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2.5 relative"
                        >
                          <div className="flex items-center justify-between">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${feat.bgColor}`}>
                              <Icon className={`w-4 h-4 ${feat.textColor}`} />
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-950 text-slate-400 border border-slate-800">
                              {feat.badge}
                            </span>
                          </div>
                          <h3 className="text-sm font-bold text-slate-100">{feat.title}</h3>
                          <p className="text-xs text-slate-400 leading-normal">{feat.desc}</p>
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              isAuthenticated ? navigateToApp(feat.id === 'forecasting' ? 'insights' : feat.id) : navigateToLogin('dashboard');
                            }}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 cursor-pointer pt-1"
                          >
                            <span>{isAuthenticated ? 'Open Feature' : 'Sign In to Access'}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* MODAL CONTENT: SECURITY */}
              {activeModal === 'security' && (
                <div className="space-y-6">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                      <LockKeyhole className="w-3.5 h-3.5" /> Security & Privacy
                    </div>
                    <h2 className="text-2xl font-extrabold text-slate-100">Authentication and AI Configuration</h2>
                    <p className="text-xs text-slate-400">Localized model isolation & cryptographic token verification.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {securityPillars.map((sec, idx) => {
                      const Icon = sec.icon;
                      return (
                        <div key={idx} className="p-4 rounded-2xl glass-panel border border-slate-800 space-y-2">
                          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
                            <Icon className="w-4 h-4" />
                          </div>
                          <h3 className="text-sm font-bold text-slate-100">{sec.title}</h3>
                          <p className="text-xs text-slate-400 leading-relaxed">{sec.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-4 rounded-2xl bg-indigo-950/40 border border-indigo-500/30 flex items-center justify-between gap-4">
                    <span className="text-xs text-slate-300 font-medium">Administrator account required for system audits.</span>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        isAuthenticated ? navigateToApp('admin') : navigateToLogin('admin');
                      }}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 cursor-pointer"
                    >
                      {isAuthenticated ? 'Open Admin View' : 'Sign In as Admin'}
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL CONTENT: GLOBAL CURRENCY */}
              {activeModal === 'currency' && (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/10 px-3 py-1 text-xs font-bold text-cyan-400">
                    <Globe className="h-3.5 w-3.5" /> Regional Formatting
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-100">Indian Rupee (INR)</h2>
                  <p className="text-sm text-slate-400">UPIQ stores and displays transaction amounts in INR using Indian number formatting. Currency conversion is not currently supported.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="w-full border-t border-slate-900 bg-slate-950 py-6 px-4 sm:px-6 lg:px-8 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3">
          <div className="flex items-center gap-3">
            <img src="/upiq-logo.jpg" alt="UPIQ AI Logo" className="w-7 h-7 rounded-lg object-cover" />
            <span className="font-bold text-slate-400">© 2026 UPIQ Financial OS</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={() => setActiveModal('features')} className="hover:text-white transition-colors cursor-pointer">
              Features
            </button>
            <span>•</span>
            <button onClick={() => setActiveModal('security')} className="hover:text-white transition-colors cursor-pointer">
              Security
            </button>
            <span>•</span>
            <button onClick={() => setActiveModal('currency')} className="hover:text-white transition-colors cursor-pointer">
              INR Formatting
            </button>
            <span>•</span>
            <button onClick={handleNeedHelpClick} className="hover:text-purple-300 transition-colors flex items-center gap-1 cursor-pointer">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" /> Need Help?
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
