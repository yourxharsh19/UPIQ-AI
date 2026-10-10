import React, { useState } from 'react';
import {
  Bell,
  Mic,
  MicOff,
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
import { useVoiceInput } from '../../hooks/useVoiceInput';
import { Button } from '../common/Button';
import { BackendFeatureRoadmapModal } from '../common/BackendFeatureRoadmapModal';
import { Server, Sparkles } from 'lucide-react';

export const Header = ({ onOpenAddTxModal }) => {
  const [isRoadmapOpen, setIsRoadmapOpen] = useState(false);
  const {
    profile,
    fraudAlerts,
    setIsFraudDrawerOpen,
    triggerAiQuery,
    supportedCurrencies,
    selectedCurrencyCode,
    setSelectedCurrencyCode,
    setActiveTab,
    logout,
  } = useFinancial();

  const { isDark, toggleTheme } = useTheme();
  const [searchValue, setSearchValue] = useState('');
  const [showVoiceBanner, setShowVoiceBanner] = useState(false);

  const { isListening, transcript, startListening, stopListening } = useVoiceInput((finalText) => {
    triggerAiQuery(finalText);
    setShowVoiceBanner(false);
  });

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      triggerAiQuery(searchValue);
      setSearchValue('');
    }
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
      setShowVoiceBanner(false);
    } else {
      setShowVoiceBanner(true);
      startListening();
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

      {/* Voice Banner when active */}
      {showVoiceBanner && (
        <div className="absolute top-22 left-1/2 -translate-x-1/2 z-40 bg-indigo-950/95 border border-indigo-500/40 text-indigo-200 px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4 backdrop-blur-lg animate-bounce">
          <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
          <span className="text-sm font-medium">
            {isListening ? (transcript ? `"${transcript}"` : 'Listening to your voice...') : 'Processing command...'}
          </span>
          <button
            onClick={() => {
              stopListening();
              setShowVoiceBanner(false);
            }}
            className="text-xs text-indigo-400 underline hover:text-white"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Header Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto shrink-0">
        {/* Backend Status & Roadmap Trigger */}
        <button
          onClick={() => setIsRoadmapOpen(true)}
          className="hidden lg:flex items-center gap-1.5 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white hover:bg-indigo-500/20 transition-all duration-200"
          title="Backend Capabilities & Roadmap"
        >
          <Server className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
          <span>System Matrix</span>
        </button>

        {/* Global Currency Switcher */}
        <div className="relative flex items-center gap-1.5 px-2 py-2 sm:px-2.5 bg-white/[0.035] border border-white/[0.07] rounded-xl light:bg-slate-100 light:border-slate-300">
          <Globe className="w-3.5 h-3.5 text-emerald-400" />
          <select
            value={selectedCurrencyCode}
            onChange={(e) => setSelectedCurrencyCode(e.target.value)}
            className="bg-transparent text-xs font-bold text-slate-200 light:text-slate-900 focus:outline-none cursor-pointer"
            title="Switch Global Display Currency"
          aria-label="Switch display currency"
          >
            {supportedCurrencies.map((c) => (
              <option key={c.code} value={c.code} className="bg-slate-900 text-slate-100">
                {c.symbol} {c.code}
              </option>
            ))}
          </select>
        </div>

        {/* Voice Command Button */}
        <button
          onClick={handleVoiceToggle}
          className={`p-2.5 rounded-xl border transition-all duration-200 active:scale-95 ${
            isListening
              ? 'bg-rose-600 text-white border-rose-500 animate-pulse-ring'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 light:bg-slate-100 light:border-slate-300 light:text-slate-700'
          }`}
          title={isListening ? "Listening... click to stop" : "Voice Finance (Speak query)"}
          aria-label={isListening ? "Stop voice input" : "Start voice input"}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-indigo-400" />}
        </button>

        {/* Theme Switcher */}
        <button
          onClick={toggleTheme}
          className="p-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-slate-300 hover:text-white hover:border-white/15 light:bg-slate-100 light:border-slate-300 light:text-slate-700 transition-all duration-200 active:scale-95"
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
        </button>

        {/* Fraud Notification Bell */}
        <button
          onClick={() => setIsFraudDrawerOpen(true)}
          className="relative p-2.5 rounded-xl bg-white/[0.035] border border-white/[0.07] text-slate-300 hover:text-white hover:border-white/15 light:bg-slate-100 light:border-slate-300 light:text-slate-700 transition-all duration-200 active:scale-95"
          title="Suspicious Fraud Alerts Drawer"
          aria-label={`Open fraud alerts${fraudAlerts.length ? ` (${fraudAlerts.length})` : ''}`}
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {fraudAlerts.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-600 text-[10px] font-bold text-white ring-2 ring-slate-950 animate-pulse">
              {fraudAlerts.length}
            </span>
          )}
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
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-9 h-9 rounded-xl object-cover ring-2 ring-indigo-500/20 group-hover:ring-indigo-500 transition-all hover:scale-105"
          />
        </button>
      </div>

      <BackendFeatureRoadmapModal isOpen={isRoadmapOpen} onClose={() => setIsRoadmapOpen(false)} />
    </header>
  );
};
