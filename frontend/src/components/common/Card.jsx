import React from 'react';

export const Card = ({ children, className = '', glow = false, onClick, hover = true }) => {
  return (
    <div
      onClick={onClick}
      className={`rounded-2xl glass-panel p-5 transition-all duration-200 ease-out ${
        glow ? 'shadow-[0_16px_50px_-32px_rgba(99,102,241,0.65)] border-indigo-400/20' : ''
      } ${hover ? 'hover:-translate-y-1 hover:border-white/15 hover:shadow-[0_18px_48px_-34px_rgba(129,140,248,0.35)]' : ''} ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
