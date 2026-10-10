import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Bot,
  BrainCircuit,
  TrendingUp,
  ShieldAlert,
  FileText,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTab, setActiveTab, fraudAlerts, profile } = useFinancial();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, isAi: true },
    { id: 'insights', label: 'Budgets & Predictions', icon: BrainCircuit },
    { id: 'security', label: 'Security & Fraud', icon: ShieldAlert, badge: fraudAlerts.length },
    { id: 'reports', label: 'Monthly Reports', icon: FileText },
    { id: 'profile', label: 'User Profile', icon: User },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Admin View', icon: ShieldCheck }] : []),
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#090a0f]/80 border-r border-white/[0.07] backdrop-blur-2xl light:bg-white/80 light:border-slate-200 transition-all duration-300 z-30 flex-shrink-0 select-none ${
        collapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-[84px] px-5 border-b border-white/[0.06] light:border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/upiq-logo.jpg"
            alt="UPIQ AI Logo"
            className="w-10 h-10 rounded-xl object-cover ring-2 ring-indigo-500/40 flex-shrink-0 shadow-lg shadow-indigo-500/30 hover:scale-105 transition-transform"
          />
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-200 to-indigo-300 light:from-slate-900 light:to-indigo-700 bg-clip-text text-transparent">
                UPIQ AI
              </span>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
                Fintech Operating System
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] light:hover:bg-slate-100 transition-all duration-200"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all duration-200 group relative ${
                isActive
                  ? item.isAi
                    ? 'bg-gradient-to-r from-indigo-600/90 via-purple-600/90 to-pink-600/90 text-white shadow-lg shadow-purple-600/25 border border-purple-400/30'
                    : 'bg-gradient-to-r from-indigo-600/25 via-purple-600/20 to-indigo-600/10 text-indigo-300 border border-indigo-500/35 shadow-md shadow-indigo-500/10 light:bg-indigo-50 light:text-indigo-600'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 light:hover:bg-slate-100 light:text-slate-600'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                  isActive
                    ? item.isAi
                      ? 'text-white'
                      : 'text-indigo-400 light:text-indigo-600'
                    : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
              {collapsed && item.badge > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-slate-950 animate-ping" />
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      {!collapsed && (
        <button
          onClick={() => setActiveTab('profile')}
          className="p-4 border border-white/[0.06] m-3 rounded-2xl bg-white/[0.025] hover:bg-white/[0.055] hover:border-white/10 light:bg-slate-50 light:border-slate-200 flex items-center gap-3 transition-all duration-200 text-left cursor-pointer group"
          title="Click to Edit User Profile"
        >
          <img
            src={profile.avatar}
            alt={profile.name}
            className="w-10 h-10 rounded-full object-cover ring-2 ring-indigo-500/30 group-hover:ring-indigo-400"
          />
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-xs font-semibold text-slate-200 group-hover:text-indigo-300 light:text-slate-900 truncate">
              {profile.name}
            </span>
            <span className="text-[10px] text-emerald-400 font-medium truncate">
              {profile.accountType}
            </span>
          </div>
        </button>
      )}
    </aside>
  );
};
