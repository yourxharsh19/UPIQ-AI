import React from 'react';
import { LayoutDashboard, Receipt, Bot, BrainCircuit, User, Tags, ShieldAlert } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useFinancial();

  const mobileNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'categories', label: 'Categories', icon: Tags },
    { id: 'ai-assistant', label: 'Assistant', icon: Bot, isAi: true },
    { id: 'insights', label: 'Budgets', icon: BrainCircuit },
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Upcoming', icon: ShieldAlert, upcoming: true },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg light:bg-white/95 light:border-slate-200 px-1 py-2 flex items-center justify-around overflow-x-auto">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            disabled={item.upcoming}
            aria-disabled={item.upcoming || undefined}
            aria-label={item.upcoming ? 'Security and fraud, upcoming' : item.label}
            aria-current={isActive ? 'page' : undefined}
            title={item.upcoming ? 'Security and fraud monitoring is upcoming' : undefined}
            className={`flex flex-shrink-0 flex-col items-center justify-center py-1 px-2 rounded-xl transition-all relative ${
              isActive
                ? item.isAi
                  ? 'text-purple-400 font-bold'
                  : 'text-indigo-400 font-bold'
                : 'text-slate-400'
            }`}
          >
            <div className="relative">
              <Icon className={`w-5 h-5 ${isActive ? 'scale-110' : ''}`} />
              {item.badge > 0 && (
                <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-rose-600 text-[9px] font-bold text-white flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </div>
            <span className="text-[9px] mt-1 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
