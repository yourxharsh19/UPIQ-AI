import React from 'react';
import { Sparkles } from 'lucide-react';

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  disabled = false,
  className = '',
  type = 'button',
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-medium rounded-lg gap-1.5',
    md: 'px-4 py-2.5 text-sm font-medium rounded-xl gap-2',
    lg: 'px-6 py-3.5 text-base font-semibold rounded-xl gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 active:scale-95 border border-indigo-400/20',
    secondary:
      'bg-gradient-to-r from-slate-900/90 via-slate-800/90 to-slate-900/90 hover:from-slate-800 hover:to-slate-700 text-slate-200 border border-white/10 light:from-slate-100 light:to-slate-200 light:text-slate-800 light:hover:from-slate-200 light:hover:to-slate-300 active:scale-95',
    emerald:
      'bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-500 hover:to-cyan-500 text-white shadow-lg shadow-emerald-600/30 active:scale-95 border border-emerald-400/20',
    rose:
      'bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white shadow-lg shadow-rose-600/30 active:scale-95 border border-rose-400/20',
    ghost:
      'bg-transparent hover:bg-slate-800/50 text-slate-400 hover:text-slate-200 light:hover:bg-slate-200 light:hover:text-slate-800',
    ai:
      'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white shadow-lg shadow-purple-500/35 active:scale-95 border border-white/20',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center transition-all duration-200 ease-out hover:-translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 disabled:opacity-50 disabled:pointer-events-none ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {variant === 'ai' && !Icon && <Sparkles className="w-4 h-4 animate-pulse" />}
      {Icon && <Icon className="w-4 h-4" />}
      {children}
    </button>
  );
};
