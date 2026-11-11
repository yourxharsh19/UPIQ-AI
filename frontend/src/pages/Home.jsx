import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
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
  Menu,
  HelpCircle,
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

  // Active Navbar Modal: null | 'features' | 'security' | 'currency'
  const [activeModal, setActiveModal] = useState(null);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

  const featureCards = [
    {
      id: 'categorization',
      icon: Zap,
      title: 'Smart Transaction Categorization',
      desc: 'Deterministic merchant and description rules categorize transactions as they are added.',
      badge: 'Deterministic rules',
    },
    {
      id: 'forecasting',
      icon: BrainCircuit,
      title: 'Budget Tracking',
      desc: 'Set category budgets and compare them with recorded spending. Predictive forecasts are not currently available.',
      badge: 'Budget tools',
    },
    {
      id: 'parsing',
      icon: Receipt,
      title: 'Bank Statement PDF Import',
      desc: 'Import supported PDF statements into the transaction ledger and review the parsed entries.',
      badge: 'PDF import',
    },
    {
      id: 'reports',
      icon: FileText,
      title: 'Monthly Financial Reports',
      desc: 'Review monthly income, expenses, categories, and transaction details; download PDF or CSV reports.',
      badge: 'PDF / CSV',
    },
    {
      id: 'analytics',
      icon: TrendingUp,
      title: 'Interactive Recharts Analytics',
      desc: 'Visualize dynamic income vs. expense trends, category pie distributions, and savings velocity.',
      badge: 'Interactive Visuals',
    },
    {
      id: 'security-radar',
      icon: ShieldAlert,
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
    <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] flex flex-col justify-between transition-colors">
      {/* TOP HEADER NAVIGATION */}
      <header className="sticky top-0 z-40 w-full bg-[var(--bg-card)] border-b border-[var(--border-base)] transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between">
          {/* Logo & Brand */}
          <div
            onClick={() => setActiveModal(null)}
            className="flex items-center gap-2.5 cursor-pointer"
          >
            <img
              src="/upiq-logo.jpg"
              alt="UPIQ AI Logo"
              className="w-8 h-8 rounded-lg object-cover border border-[var(--border-base)]"
            />
            <div className="flex flex-col">
              <span className="font-bold text-base tracking-tight text-[var(--text-main)]">
                UPIQ
              </span>
              <span className="text-[10px] text-[var(--text-muted)] font-medium">
                Personal Finance Workspace
              </span>
            </div>
          </div>

          {/* NAVBAR OPTIONS */}
          <nav className="hidden md:flex items-center gap-1 p-1 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)]">
            <button
              onClick={() => setActiveModal('features')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModal === 'features'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Features
            </button>

            <button
              onClick={() => setActiveModal('security')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModal === 'security'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              Security
            </button>

            <button
              onClick={() => setActiveModal('currency')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeModal === 'currency'
                  ? 'bg-[var(--bg-card)] text-[var(--text-main)] shadow-xs font-semibold'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              INR Formatting
            </button>

            <button
              onClick={handleNeedHelpClick}
              className="px-3 py-1.5 rounded-md text-xs font-medium text-[var(--text-muted)] hover:text-[var(--text-main)] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
              <span>Need Help / AI</span>
            </button>
          </nav>

          {/* Right Action Bar */}
          <div className="flex items-center gap-2">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
              title="Toggle Color Theme"
              aria-label="Toggle Color Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-blue-600" />
              )}
            </button>

            {/* Login / App Launch Button */}
            {isAuthenticated ? (
              <button
                onClick={() => navigateToApp('dashboard')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => navigateToLogin('dashboard')}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="p-2 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors md:hidden cursor-pointer"
              aria-label="Toggle mobile menu"
            >
              {isMobileNavOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Dropdown */}
        {isMobileNavOpen && (
          <div className="md:hidden border-t border-[var(--border-base)] bg-[var(--bg-card)] px-4 py-3 space-y-1 animate-fade-in">
            <button
              onClick={() => {
                setActiveModal('features');
                setIsMobileNavOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
            >
              <span>Features</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() => {
                setActiveModal('security');
                setIsMobileNavOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
            >
              <span>Security</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() => {
                setActiveModal('currency');
                setIsMobileNavOpen(false);
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
            >
              <span>INR Formatting</span>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
            <button
              onClick={() => {
                setIsMobileNavOpen(false);
                handleNeedHelpClick();
              }}
              className="w-full text-left px-3 py-2 rounded-lg text-xs font-medium text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors flex items-center justify-between"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
                <span>Need Help / AI Assistant</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
            </button>
          </div>
        )}
      </header>

      {/* HERO SECTION */}
      <section className="my-auto py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto w-full text-center space-y-8 flex-1 flex flex-col justify-center">
        <div className="space-y-4 max-w-3xl mx-auto">
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[var(--border-base)] bg-[var(--bg-surface)] text-[var(--text-muted)] text-xs font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>UPIQ 2.0 — Personal Finance Dashboard</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl font-bold tracking-tight text-[var(--text-main)] leading-tight">
            Personal finance tools for your transaction ledger
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-2xl mx-auto leading-relaxed">
            Record and review transactions, import supported PDF statements, track category budgets, and use the Financial Assistant when its local Ollama service is configured.
          </p>

          {/* Action Button Row */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
            <button
              onClick={() => (isAuthenticated ? navigateToApp('dashboard') : navigateToLogin('dashboard'))}
              className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-medium text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <span>{isAuthenticated ? 'Open Financial Dashboard' : 'Sign In / Get Started'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={handleNeedHelpClick}
              className="px-5 py-2.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-card)] hover:bg-[var(--bg-surface)] text-[var(--text-main)] font-medium text-xs sm:text-sm shadow-xs flex items-center gap-2 transition-colors cursor-pointer"
            >
              <HelpCircle className="w-4 h-4 text-blue-500" />
              <span>Ask AI Assistant / Need Help</span>
            </button>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-xl border border-[var(--border-base)] bg-[var(--bg-card)] max-w-3xl mx-auto text-left shadow-xs">
          <div
            onClick={() => setActiveModal('features')}
            className="space-y-1 p-2.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
          >
            <p className="text-xs font-semibold text-blue-500 dark:text-blue-400">PDF Import</p>
            <p className="text-xs font-medium text-[var(--text-main)]">Statement Import</p>
            <p className="text-[11px] text-[var(--text-muted)]">Bank statement PDF import &rarr;</p>
          </div>
          <div
            onClick={() => setActiveModal('security')}
            className="space-y-1 p-2.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer md:border-l md:border-[var(--border-base)]"
          >
            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">JWT Security</p>
            <p className="text-xs font-medium text-[var(--text-main)]">API Authentication</p>
            <p className="text-[11px] text-[var(--text-muted)]">Signed tokens for protected requests &rarr;</p>
          </div>
          <div
            onClick={handleNeedHelpClick}
            className="space-y-1 p-2.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer md:border-l md:border-[var(--border-base)]"
          >
            <p className="text-xs font-semibold text-indigo-500 dark:text-indigo-400">Private AI</p>
            <p className="text-xs font-medium text-[var(--text-main)]">Ollama Integration</p>
            <p className="text-[11px] text-[var(--text-muted)]">Local service assistance &rarr;</p>
          </div>
          <div
            onClick={() => setActiveModal('currency')}
            className="space-y-1 p-2.5 rounded-lg hover:bg-[var(--bg-surface)] transition-colors cursor-pointer md:border-l md:border-[var(--border-base)]"
          >
            <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">Currency</p>
            <p className="text-xs font-medium text-[var(--text-main)]">Display Preference</p>
            <p className="text-[11px] text-[var(--text-muted)]">Ledger totals in INR &rarr;</p>
          </div>
        </div>
      </section>

      {/* NAVBAR OPTION MODALS */}
      <AnimatePresence>
        {activeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-3xl bg-[var(--bg-card)] border border-[var(--border-base)] rounded-xl p-6 shadow-xl relative max-h-[85vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setActiveModal(null)}
                className="absolute top-4 right-4 p-1.5 rounded-lg border border-[var(--border-base)] text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-[var(--bg-surface)] transition-colors cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>

              {/* MODAL CONTENT: FEATURES */}
              {activeModal === 'features' && (
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-main)]">Platform Capabilities</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Everything built into UPIQ for personal financial tracking.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {featureCards.map((feat) => {
                      const Icon = feat.icon;
                      return (
                        <div
                          key={feat.id}
                          className="p-3.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <div className="w-7 h-7 rounded-md flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-[var(--bg-card)] text-[var(--text-muted)] border border-[var(--border-base)]">
                              {feat.badge}
                            </span>
                          </div>
                          <h3 className="text-xs font-semibold text-[var(--text-main)]">{feat.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{feat.desc}</p>
                          <button
                            onClick={() => {
                              setActiveModal(null);
                              if (isAuthenticated) {
                                navigateToApp(feat.id === 'forecasting' ? 'insights' : feat.id);
                              } else {
                                navigateToLogin('dashboard');
                              }
                            }}
                            className="text-xs font-medium text-blue-500 hover:text-blue-600 dark:hover:text-blue-400 flex items-center gap-1 cursor-pointer pt-1"
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
                <div className="space-y-5">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--text-main)]">Authentication and AI Configuration</h2>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">Cryptographic token validation and localized model isolation.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {securityPillars.map((sec, idx) => {
                      const Icon = sec.icon;
                      return (
                        <div key={idx} className="p-3.5 rounded-lg border border-[var(--border-base)] bg-[var(--bg-surface)] space-y-2">
                          <div className="w-7 h-7 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                            <Icon className="w-3.5 h-3.5" />
                          </div>
                          <h3 className="text-xs font-semibold text-[var(--text-main)]">{sec.title}</h3>
                          <p className="text-xs text-[var(--text-muted)] leading-relaxed">{sec.desc}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="p-3.5 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-center justify-between gap-4">
                    <span className="text-xs text-[var(--text-muted)]">Administrator account required for system audits.</span>
                    <button
                      onClick={() => {
                        setActiveModal(null);
                        if (isAuthenticated) {
                          navigateToApp('admin');
                        } else {
                          navigateToLogin('admin');
                        }
                      }}
                      className="px-3.5 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium shrink-0 cursor-pointer"
                    >
                      {isAuthenticated ? 'Open Admin View' : 'Sign In as Admin'}
                    </button>
                  </div>
                </div>
              )}

              {/* MODAL CONTENT: GLOBAL CURRENCY */}
              {activeModal === 'currency' && (
                <div className="space-y-3">
                  <div className="inline-flex items-center gap-1.5 rounded-md border border-blue-500/20 bg-blue-500/10 px-2.5 py-0.5 text-xs font-medium text-blue-500">
                    <Globe className="h-3.5 w-3.5" /> Regional Formatting
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-main)]">Indian Rupee (INR)</h2>
                  <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                    UPIQ stores and displays transaction amounts in INR using Indian number formatting. Currency conversion is not currently supported.
                  </p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <footer className="w-full border-t border-[var(--border-base)] bg-[var(--bg-card)] py-4 px-4 sm:px-6 z-10 transition-colors">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between text-xs text-[var(--text-muted)] gap-3">
          <div className="flex items-center gap-2.5">
            <img src="/upiq-logo.jpg" alt="UPIQ AI Logo" className="w-5 h-5 rounded object-cover" />
            <span>© 2026 UPIQ Financial Workspace</span>
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => setActiveModal('features')} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
              Features
            </button>
            <span>•</span>
            <button onClick={() => setActiveModal('security')} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
              Security
            </button>
            <span>•</span>
            <button onClick={() => setActiveModal('currency')} className="hover:text-[var(--text-main)] transition-colors cursor-pointer">
              INR Formatting
            </button>
            <span>•</span>
            <button onClick={handleNeedHelpClick} className="hover:text-[var(--text-main)] transition-colors flex items-center gap-1 cursor-pointer">
              <HelpCircle className="w-3.5 h-3.5 text-blue-500" /> Need Help?
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
