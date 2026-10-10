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
    'Food & Dining': { icon: Utensils, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    'Shopping': { icon: ShoppingBag, color: 'bg-pink-500/10 text-pink-400 border-pink-500/20' },
    'Bills & Utilities': { icon: Zap, color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
    'Transport & Fuel': { icon: Car, color: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
    'Entertainment': { icon: Film, color: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
    'Rent & Housing': { icon: Home, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' },
    'Salary': { icon: Briefcase, color: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' },
    'Investments': { icon: TrendingUp, color: 'bg-purple-500/15 text-purple-300 border-purple-500/30' },
    'Healthcare': { icon: Activity, color: 'bg-rose-500/10 text-rose-400 border-rose-500/20' },
  };

  const current = map[category] || { icon: ShoppingBag, color: 'bg-slate-800 text-slate-300 border-slate-700' };
  const Icon = current.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border ${current.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {category}
    </span>
  );
};
