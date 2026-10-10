import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

export const Badge = ({ children, variant = 'info', size = 'sm', icon: CustomIcon, className = '' }) => {
  const variantStyles = {
    income: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-400 border-emerald-500/30 light:from-emerald-50 light:to-teal-50 light:text-emerald-700',
    expense: 'bg-gradient-to-r from-rose-500/15 to-pink-500/15 text-rose-400 border-rose-500/30 light:from-rose-50 light:to-pink-50 light:text-rose-700',
    fraud: 'bg-gradient-to-r from-rose-600/25 to-red-600/25 text-rose-300 border-rose-500/40 animate-pulse light:bg-rose-100 light:text-rose-800',
    anomaly: 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border-amber-500/30 light:bg-amber-50 light:text-amber-800',
    ai: 'bg-gradient-to-r from-purple-600/20 to-pink-600/20 text-purple-200 border-purple-400/30 light:from-purple-100 light:to-pink-100 light:text-purple-800',
    success: 'bg-gradient-to-r from-emerald-500/15 to-teal-500/15 text-emerald-400 border-emerald-500/30',
    warning: 'bg-gradient-to-r from-amber-500/15 to-yellow-500/15 text-amber-400 border-amber-500/30',
    info: 'bg-gradient-to-r from-indigo-500/15 to-violet-500/15 text-indigo-300 border-indigo-500/30',
    neutral: 'bg-slate-800/80 text-slate-300 border-slate-700 light:bg-slate-100 light:text-slate-700',
  };

  const sizeStyles = {
    sm: 'px-2.5 py-0.5 text-xs font-medium rounded-md gap-1',
    md: 'px-3 py-1 text-xs font-semibold rounded-lg gap-1.5',
  };

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-3.5 h-3.5" />;
    if (variant === 'income') return <TrendingUp className="w-3.5 h-3.5" />;
    if (variant === 'expense') return <TrendingDown className="w-3.5 h-3.5" />;
    if (variant === 'fraud') return <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />;
    if (variant === 'anomaly') return <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />;
    if (variant === 'ai') return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    if (variant === 'success') return <CheckCircle2 className="w-3.5 h-3.5" />;
    return null;
  };

  return (
    <span
      className={`inline-flex items-center border ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
    >
      {getIcon()}
      {children}
    </span>
  );
};
