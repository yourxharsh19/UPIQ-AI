import React from 'react';
import { ShieldAlert } from 'lucide-react';

/** Placeholder for a future security workflow; no fraud analysis is performed here. */
export const FraudAlertDrawer = () => (
  <section className="rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5" aria-labelledby="fraud-upcoming-title">
    <div className="flex items-center gap-3">
      <ShieldAlert className="w-5 h-5 text-amber-300" aria-hidden="true" />
      <div>
        <h2 id="fraud-upcoming-title" className="text-sm font-bold">Security and fraud monitoring — Upcoming</h2>
        <p className="mt-1 text-xs text-slate-400">UPIQ does not currently detect fraud, monitor threats, or freeze transactions.</p>
      </div>
    </div>
  </section>
);
