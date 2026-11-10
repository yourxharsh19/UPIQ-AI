import React from 'react';

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
    sm: 'px-2.5 py-1.5 text-xs font-medium rounded-lg gap-1.5',
    md: 'px-3.5 py-2 text-xs font-medium rounded-lg gap-2',
    lg: 'px-4.5 py-2.5 text-sm font-medium rounded-lg gap-2',
  };

  const variantClasses = {
    primary:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-500/20 shadow-xs transition-colors',
    secondary:
      'bg-[var(--bg-surface)] hover:bg-[var(--bg-card)] active:bg-[var(--border-base)] text-[var(--text-main)] border border-[var(--border-base)] shadow-xs transition-colors',
    emerald:
      'bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white border border-emerald-500/20 shadow-xs transition-colors',
    rose:
      'bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white border border-rose-500/20 shadow-xs transition-colors',
    ghost:
      'bg-transparent hover:bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors',
    ai:
      'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white border border-blue-500/20 shadow-xs transition-colors',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {Icon && <Icon className="w-3.5 h-3.5 shrink-0" />}
      {children}
    </button>
  );
};
