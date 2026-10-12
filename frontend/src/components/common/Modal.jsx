import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export const Modal = ({ isOpen, onClose, title, children, maxWidth = 'max-w-xl' }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} max-h-[calc(100dvh-2rem)] flex flex-col bg-slate-900 border border-slate-800 light:bg-white light:border-slate-200 rounded-2xl shadow-2xl overflow-hidden transform transition-all duration-300 scale-100`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex shrink-0 items-center justify-between px-6 py-4 border-b border-slate-800/80 light:border-slate-200">
          <h3 className="text-lg font-semibold text-slate-100 light:text-slate-900">{title}</h3>
          <button
            onClick={onClose}
            type="button"
            aria-label="Close dialog"
            className="rounded-lg border border-slate-700 bg-slate-800 p-2 text-slate-100 transition-colors hover:border-rose-500/50 hover:bg-rose-600 light:border-slate-300 light:bg-slate-100 light:text-slate-800 light:hover:bg-rose-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  );
};
