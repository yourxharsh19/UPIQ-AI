import React from 'react';

export const Card = ({ children, className = '', glow = false, onClick, hover = false }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl border border-[var(--border-card)] bg-[var(--bg-card)] p-5 transition-all duration-150 ${
        glow ? 'border-blue-500/30' : ''
      } ${
        hover ? 'hover:border-slate-400 dark:hover:border-slate-700' : ''
      } ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
