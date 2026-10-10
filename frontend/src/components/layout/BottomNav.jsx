import React from 'react';
import { LayoutDashboard, Receipt, Bot, BrainCircuit, User } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const BottomNav = () => {
  const { activeTab, setActiveTab } = useFinancial();

  const mobileNavItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'transactions', label: 'Ledger', icon: Receipt },
    { id: 'ai-assistant', label: 'AI Voice', icon: Bot, isAi: true },
    { id: 'insights', label: 'Predict', icon: BrainCircuit },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-slate-950/95 border-t border-slate-800/80 backdrop-blur-lg light:bg-white/95 light:border-slate-200 px-2 py-2 flex items-center justify-around">
      {mobileNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`flex flex-col items-center justify-center py-1 px-3 rounded-xl transition-all relative ${
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
            <span className="text-[10px] mt-1">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
