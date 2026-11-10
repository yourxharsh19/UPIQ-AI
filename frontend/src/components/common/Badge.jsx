import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';

export const Badge = ({ children, variant = 'info', size = 'sm', icon: CustomIcon, className = '' }) => {
  const variantStyles = {
    income: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    expense: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    fraud: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30',
    anomaly: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    ai: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    success: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    warning: 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
    info: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
    neutral: 'bg-[var(--bg-surface)] text-[var(--text-muted)] border-[var(--border-base)]',
  };

  const sizeStyles = {
    sm: 'px-2 py-0.5 text-[11px] font-medium rounded-md gap-1',
    md: 'px-2.5 py-1 text-xs font-medium rounded-md gap-1.5',
  };

  const getIcon = () => {
    if (CustomIcon) return <CustomIcon className="w-3 h-3" />;
    if (variant === 'income') return <TrendingUp className="w-3 h-3" />;
    if (variant === 'expense') return <TrendingDown className="w-3 h-3" />;
    if (variant === 'fraud') return <ShieldAlert className="w-3 h-3 text-rose-500" />;
    if (variant === 'anomaly') return <AlertTriangle className="w-3 h-3 text-amber-500" />;
    if (variant === 'ai') return <Sparkles className="w-3 h-3 text-blue-500" />;
    if (variant === 'success') return <CheckCircle2 className="w-3 h-3" />;
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
