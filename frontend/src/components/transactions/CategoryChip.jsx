import React from 'react';
import {
  ShoppingBag,
  Utensils,
  Zap,
  Car,
  Film,
  Home,
  Briefcase,
  TrendingUp,
  Activity,
} from 'lucide-react';

export const CategoryChip = ({ category }) => {
  const map = {
    'Food & Dining': { icon: Utensils, color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' },
    'Shopping': { icon: ShoppingBag, color: 'bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20' },
    'Bills & Utilities': { icon: Zap, color: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20' },
    'Transport & Fuel': { icon: Car, color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' },
    'Entertainment': { icon: Film, color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20' },
    'Rent & Housing': { icon: Home, color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' },
    'Salary': { icon: Briefcase, color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 border-emerald-500/30' },
    'Investments': { icon: TrendingUp, color: 'bg-purple-500/15 text-purple-600 dark:text-purple-300 border-purple-500/30' },
    'Healthcare': { icon: Activity, color: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20' },
  };

  const current = map[category] || { icon: ShoppingBag, color: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700' };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium border ${current.color}`}>
      <Icon className="w-3 h-3" />
      {category}
    </span>
  );
};
