import React from 'react';
import { AlertTriangle, CheckCircle, Info, ShieldAlert, X } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';

export const ToastContainer = () => {
  const { toasts, removeToast } = useFinancial();

  if (!toasts.length) return null;

  const icons = {
    success: <CheckCircle className="w-5 h-5 text-emerald-400" />,
    danger: <ShieldAlert className="w-5 h-5 text-rose-400" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-400" />,
    info: <Info className="w-5 h-5 text-indigo-400" />,
  };

  const borders = {
    success: 'border-emerald-500/30 bg-slate-900/95',
    danger: 'border-rose-500/30 bg-slate-900/95',
    warning: 'border-amber-500/30 bg-slate-900/95',
    info: 'border-indigo-500/30 bg-slate-900/95',
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border glass-panel-glow shadow-2xl transform transition-all duration-300 animate-slide-up ${
            borders[toast.type] || borders.info
          }`}
        >
          <div className="flex-shrink-0 mt-0.5">{icons[toast.type] || icons.info}</div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-100">{toast.title}</h4>
            <p className="text-xs text-slate-300 mt-0.5">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-slate-400 hover:text-slate-200 p-1 rounded-md"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
