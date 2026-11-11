import React, { useState } from 'react';
import {
  LayoutDashboard,
  Receipt,
  Bot,
  Tags,
  BrainCircuit,
  ShieldAlert,
  FileText,
  ShieldCheck,
  User,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { activeTab, setActiveTab, profile } = useFinancial();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions', label: 'Transactions', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'ai-assistant', label: 'AI Assistant', icon: Bot, isAi: true },
    { id: 'insights', label: 'Local Budgets & Estimates', icon: BrainCircuit },
    { id: 'security', label: 'Security & Fraud', icon: ShieldAlert, upcoming: true },
    { id: 'reports', label: 'Monthly Reports', icon: FileText },
    { id: 'profile', label: 'User Profile', icon: User },
    ...(profile?.role === 'admin' ? [{ id: 'admin', label: 'Admin View', icon: ShieldCheck }] : []),
  ];

  return (
    <aside
      className={`hidden md:flex flex-col h-screen sticky top-0 bg-[#0c142c] border-r border-white/[0.08] light:bg-white light:border-slate-200 transition-all duration-200 z-30 flex-shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-white/[0.07] light:border-slate-200">
        <div className="flex items-center gap-3 overflow-hidden">
          <img
            src="/upiq-logo.jpg"
            alt="UPIQ AI Logo"
            className="w-8 h-8 rounded-lg object-cover border border-white/10 flex-shrink-0"
          />
          {!collapsed && (
            <div className="flex flex-col min-w-0">
              <span className="font-bold text-sm tracking-tight text-slate-100 light:text-slate-900 leading-none">
                UPIQ
              </span>
              <span className="text-[10px] text-slate-400 font-medium tracking-normal mt-0.5">
                Financial Workspace
              </span>
            </div>
          )}
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] light:hover:bg-slate-100 light:text-slate-500 transition-colors"
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              disabled={item.upcoming}
              aria-disabled={item.upcoming || undefined}
              aria-label={`${item.label}${item.upcoming ? ', coming soon' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg font-medium text-xs transition-colors group relative ${
                isActive
                  ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 light:bg-blue-50 light:text-blue-700 light:border-blue-200 font-semibold'
                  : `text-slate-400 hover:text-slate-200 hover:bg-white/[0.04] light:text-slate-600 light:hover:bg-slate-100 light:hover:text-slate-900 ${
                      item.upcoming ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                    }`
              }`}
              title={item.upcoming ? `${item.label} — Coming soon` : collapsed ? item.label : undefined}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  isActive
                    ? 'text-blue-400 light:text-blue-700'
                    : 'text-slate-400 light:text-slate-500 group-hover:text-slate-200 light:group-hover:text-slate-800'
                }`}
              />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.upcoming && (
                <span className="ml-auto text-[10px] font-medium text-amber-400/90 light:text-amber-700 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                  Coming soon
                </span>
              )}
              {collapsed && item.upcoming && (
                <span aria-hidden="true" className="absolute top-1 right-1 text-[8px] font-bold text-amber-400">
                  SOON
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User profile footer */}
      {!collapsed && (
        <div className="p-3 border-t border-white/[0.07] light:border-slate-200">
          <button
            onClick={() => setActiveTab('profile')}
            className="w-full p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] light:bg-slate-50 light:border-slate-200 light:hover:bg-slate-100 flex items-center gap-3 transition-colors text-left cursor-pointer"
            title="Click to Edit User Profile"
          >
            <span
              aria-hidden="true"
              className="w-8 h-8 rounded-md bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-xs font-semibold text-blue-400 light:bg-blue-100 light:text-blue-700"
            >
              {(profile.name || '?').trim().charAt(0).toUpperCase()}
            </span>
            <div className="flex flex-col min-w-0 flex-1">
              <span className="text-xs font-medium text-slate-200 light:text-slate-900 truncate">
                {profile.name}
              </span>
              <span className="text-[11px] text-slate-400 light:text-slate-500 truncate">
                {profile.accountType}
              </span>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
};
