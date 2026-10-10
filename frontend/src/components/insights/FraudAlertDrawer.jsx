import React from 'react';
import { X, ShieldAlert, CheckCircle, Lock, MapPin } from 'lucide-react';
import { useFinancial } from '../../context/FinancialContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export const FraudAlertDrawer = () => {
  const { isFraudDrawerOpen, setIsFraudDrawerOpen, fraudAlerts, resolveFraudAlert, formatCurrency } = useFinancial();

  if (!isFraudDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-sm animate-fade-in">
      <div
        className="absolute inset-y-0 right-0 max-w-full flex pl-10"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl light:bg-white light:border-slate-200 flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 light:border-slate-200 flex items-center justify-between bg-slate-950/50 light:bg-slate-50">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                <ShieldAlert className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100 light:text-slate-900">
                  Suspicious Activity Center
                </h3>
                <p className="text-xs text-slate-400">
                  {fraudAlerts.length} high-priority AI risk flags requiring review
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsFraudDrawerOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800/60"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Alert list */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {fraudAlerts.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-semibold text-slate-200 light:text-slate-800">
                  All Accounts Safe & Clear
                </h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  No unverified transactions or anomalous spending detected by UPIQ Guardian AI.
                </p>
              </div>
            ) : (
              fraudAlerts.map((alert) => (
                <div
                  key={alert.id}
                  className="rounded-2xl border border-rose-500/30 bg-rose-950/20 p-5 space-y-3 relative overflow-hidden"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Badge variant="fraud" size="sm">
                        Risk Score: {alert.riskScore}%
                      </Badge>
                      <h4 className="text-sm font-bold text-slate-100 mt-2 light:text-slate-900">
                        {alert.title}
                      </h4>
                      <p className="text-xs text-slate-400">{alert.merchant}</p>
                    </div>
                    <span className="text-base font-extrabold text-rose-400">
                      -{formatCurrency(alert.amount)}
                    </span>
                  </div>

                  <div className="text-xs text-rose-300/90 bg-rose-950/40 p-3 rounded-xl border border-rose-500/20 space-y-1">
                    <p className="font-medium">{alert.reason}</p>
                    {alert.location && (
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2">
                        <MapPin className="w-3.5 h-3.5 text-rose-400" />
                        <span>{alert.location}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-rose-500/10">
                    <Button
                      onClick={() => resolveFraudAlert(alert.id, 'dismissed')}
                      variant="secondary"
                      size="sm"
                      className="flex-1"
                    >
                      Dismiss (Safe)
                    </Button>
                    <Button
                      onClick={() => resolveFraudAlert(alert.id, 'flagged')}
                      variant="rose"
                      size="sm"
                      icon={Lock}
                      className="flex-1"
                    >
                      Freeze & Dispute
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer banner */}
          <div className="p-4 border-t border-slate-800 bg-slate-950/80 light:bg-slate-50 text-center">
            <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Protected by 256-bit AI Anomaly Detection Engine
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
