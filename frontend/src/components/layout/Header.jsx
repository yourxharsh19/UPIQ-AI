import React, { useState } from 'react';
import {
  Bell,
  Plus,
  Search,
  Moon,
  Sun,
  Globe,
  LogOut,
  Command,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { BackendFeatureRoadmapModal } from '../common/BackendFeatureRoadmapModal';
import { Server } from 'lucide-react';

export const Header = ({ onOpenAddTxModal }) => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const {
    profile,
    triggerAiQuery,
    currentCurrency,
    setActiveTab,
    logout,
  } = useFinancial();

  const { isDark, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      triggerAiQuery(searchValue);
      setSearchValue('');
    }
  };

  return (
    <header className="sticky top-0 z-20 min-h-20 bg-[#090a0f]/75 backdrop-blur-2xl border-b border-white/[0.06] light:bg-white/75 light:border-slate-200 px-4 md:px-7 flex items-center justify-between transition-colors">
      {/* Quick Search Bar */}
      <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-md hidden sm:flex items-center">
        <Search className="absolute left-3.5 w-4 h-4 text-slate-400" />
        <input
          type="text"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder="Ask UPIQ or search transactions... (e.g. 'Dining expenses')"
          className="w-full pl-10 pr-12 py-2.5 bg-slate-900/70 border border-slate-800 light:bg-slate-100 light:border-slate-300 rounded-xl text-sm text-slate-200 light:text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
        />
        <div className="absolute right-3 flex items-center gap-1 text-[10px] text-slate-500 font-medium px-1.5 py-0.5 rounded border border-slate-800 light:border-slate-300">
          <Command className="w-3 h-3" /> K
        </div>
      </form>

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        {/* Backend Status & Roadmap Trigger */}
        <button
          onClick={() => setIsRoadmapOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-all duration-200"
          title="Backend Capabilities & Roadmap"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>Feature Roadmap</span>
        </button>

        {/* Global Currency Switcher */}
        <div className="relative flex items-center gap-1.5 px-2 py-2 sm:px-2.5 bg-white/[0.035] border border-white/[0.07] rounded-xl light:bg-slate-100 light:border-slate-300">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-bold text-slate-200 light:text-slate-900" aria-label="Financial display currency">{currentCurrency.symbol} {currentCurrency.code}</span>
        </div>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-slate-300 hover:text-white hover:border-white/15 light:bg-slate-100 light:border-slate-300 light:text-slate-700 transition-all duration-200 active:scale-95"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        <button
          type="button"
          disabled
          aria-disabled="true"
          aria-label="Security and fraud monitoring, upcoming"
          className="flex items-center gap-1.5 px-2.5 py-2 rounded-xl border border-amber-500/20 bg-amber-500/5 text-[10px] font-semibold text-amber-300 cursor-not-allowed opacity-80"
          title="Security and fraud monitoring is upcoming"
        >
          <Bell className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Security: Upcoming</span>
        </button>

        {/* Quick Add Transaction Trigger */}
        <Button onClick={onOpenAddTxModal} variant="emerald" size="md" icon={Plus}>
          <span className="hidden sm:inline">Transaction</span>
        </Button>

        {/* Logout Action */}
        <button
          onClick={logout}
          className="hidden sm:block p-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-slate-400 hover:text-rose-400 hover:border-rose-500/30 transition-all duration-200 active:scale-95"
          title="Logout of UPIQ AI"
          aria-label="Log out"
        >
          <LogOut className="w-4 h-4" />
        </button>

        {/* User Avatar */}
        <button
          onClick={() => setActiveTab('profile')}
          className="hidden sm:flex items-center gap-2 pl-1 border-l border-white/[0.08] light:border-slate-200 cursor-pointer group"
          title="User Profile & Settings"
          aria-label={`Open profile for ${profile.name}`}
        >
          <span aria-hidden="true" className="grid h-9 w-9 place-items-center rounded-xl bg-indigo-600 text-sm font-bold text-white ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all hover:scale-105">
            {(profile.name || '?').trim().charAt(0).toUpperCase()}
          </span>
        </button>
      </div>

      <BackendFeatureRoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </header>
  );
};
