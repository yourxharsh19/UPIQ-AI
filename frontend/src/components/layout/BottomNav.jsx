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
    { id: 'security', label: 'Coming soon', icon: ShieldAlert, upcoming: true },
  ];

  return (
    <nav aria-label="Main navigation" className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-[var(--bg-card)] border-t border-[var(--border-base)] px-1 py-1.5 flex items-center justify-around overflow-x-auto">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            disabled={item.upcoming}
            aria-disabled={item.upcoming || undefined}
            aria-label={item.upcoming ? 'Security and fraud monitoring, coming soon' : item.label}
            aria-current={isActive ? 'page' : undefined}
            title={item.upcoming ? 'Security and fraud monitoring is coming soon' : undefined}
            className={`flex flex-shrink-0 flex-col items-center justify-center py-1 px-2 rounded-lg transition-colors relative ${
              isActive
                ? 'text-blue-500 font-semibold'
                : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
            } ${item.upcoming ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Icon className="w-4 h-4" />
            <span className="text-[10px] mt-1 whitespace-nowrap">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
